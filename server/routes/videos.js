// server/routes/videos.js - BUNNY.NET
const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const { authenticateToken } = require('./auth');

// Configuration Bunny.net
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_HOSTNAME = process.env.BUNNY_HOSTNAME;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;
const BUNNY_CDN_URL = `https://${process.env.BUNNY_CDN_HOSTNAME}`;

// Configuration Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 6 * 1024 * 1024 * 1024, // 6 GB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers vidéo sont acceptés'), false);
    }
  }
});

// Route pour uploader une vidéo
router.post('/upload', authenticateToken, upload.single('video'), async (req, res) => {
  const pool = req.app.get('pool');
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier vidéo fourni' });
    }

    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }

    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);
    console.log(`📤 Upload en cours vers Bunny.net... (${fileSizeMB} MB)`);

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = req.file.originalname.split('.').pop();
    const filename = `video-${timestamp}-${randomStr}.${ext}`;
    const bunnyPath = `/videos/${filename}`;

    const uploadUrl = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}${bunnyPath}`;
    
    const uploadResponse = await axios.put(uploadUrl, req.file.buffer, {
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 600000,
    });

    if (uploadResponse.status !== 201 && uploadResponse.status !== 200) {
      throw new Error('Erreur lors de l\'upload vers Bunny.net');
    }

    console.log('✅ Upload Bunny.net réussi:', filename);

    const videoUrl = `${BUNNY_CDN_URL}${bunnyPath}`;

    const videoResult = await pool.query(
      `INSERT INTO videos (user_id, title, description, cloudinary_id, cloudinary_url, file_size, filename)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title, description || null, filename, videoUrl, req.file.size, filename]
    );

    const video = videoResult.rows[0];

    res.status(201).json({
      message: 'Vidéo uploadée avec succès',
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        url: video.cloudinary_url,
        createdAt: video.created_at
      }
    });

  } catch (error) {
    console.error('❌ Erreur upload Bunny.net:', error.message);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/', async (req, res) => {
  const pool = req.app.get('pool');
  try {
    const result = await pool.query(
      `SELECT v.*, u.username FROM videos v JOIN users u ON v.user_id = u.id ORDER BY v.created_at DESC`
    );
    const videos = result.rows.map(row => ({
      id: row.id, title: row.title, description: row.description,
      url: row.cloudinary_url, thumbnail: row.thumbnail_url,
      duration: parseFloat(row.duration) || 0, fileSize: row.file_size,
      author: row.username, createdAt: row.created_at
    }));
    res.json(videos);
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.get('/:id', async (req, res) => {
  const pool = req.app.get('pool');
  try {
    const result = await pool.query(
      `SELECT v.*, u.username FROM videos v JOIN users u ON v.user_id = u.id WHERE v.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vidéo non trouvée' });
    const row = result.rows[0];
    res.json({
      id: row.id, title: row.title, description: row.description, url: row.cloudinary_url,
      thumbnail: row.thumbnail_url, duration: parseFloat(row.duration) || 0,
      fileSize: row.file_size, author: row.username, userId: row.user_id, createdAt: row.created_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  const pool = req.app.get('pool');
  try {
    const result = await pool.query('SELECT filename, user_id FROM videos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vidéo non trouvée' });
    const video = result.rows[0];
    if (video.user_id !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (video.filename) {
      const deleteUrl = `https://${BUNNY_HOSTNAME}/${BUNNY_STORAGE_ZONE}/videos/${video.filename}`;
      try {
        await axios.delete(deleteUrl, { headers: { 'AccessKey': BUNNY_API_KEY } });
      } catch (err) { console.warn('⚠️ Erreur suppression Bunny:', err.message); }
    }
    await pool.query('DELETE FROM videos WHERE id = $1', [req.params.id]);
    res.json({ message: 'Vidéo supprimée' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

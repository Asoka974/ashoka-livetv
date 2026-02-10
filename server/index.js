require("dotenv").config();

const path = require("path");
const express = require("express");
const http = require("http");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const pool = require("./db");
const { authRouter, authenticateToken } = require("./routes/auth");
const videosRouter = require("./routes/videos");

const app = express();
const server = http.createServer(app);

// Augmenter les timeouts pour les gros uploads
server.timeout = 30 * 60 * 1000; // 30 minutes
server.keepAliveTimeout = 30 * 60 * 1000;
server.headersTimeout = 30 * 60 * 1000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.set("pool", pool);

// Routes API
app.use("/api/auth", authRouter);
app.use("/api/videos", videosRouter);

// API: Récupérer les stamps
app.get("/api/stamps", async (req, res) => {
  try {
    const videoId = req.query.videoId || "sample";
    const result = await pool.query(
      "SELECT * FROM stamps WHERE video_id = $1 ORDER BY time ASC",
      [videoId]
    );
    const stamps = result.rows.map((row) => ({
      id: row.id,
      videoId: row.video_id,
      time: parseFloat(row.time),
      text: row.text,
      author: row.author,
      createdAt: row.created_at,
    }));
    res.json(stamps);
  } catch (error) {
    console.error("❌ Error fetching stamps:", error);
    res.status(500).json({ error: "Failed to fetch stamps" });
  }
});

// Route spéciale pour le streaming vidéo
app.get("/videos/:filename", (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, "public/videos", filename);

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video not found");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// WebSocket
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("new-stamp", async (payload) => {
    try {
      const { videoId, time, text, author } = payload;
      if (!text || !text.trim()) {
        socket.emit("stamp-error", { message: "Comment text is required" });
        return;
      }
      const result = await pool.query(
        "INSERT INTO stamps (video_id, time, text, author) VALUES ($1, $2, $3, $4) RETURNING *",
        [videoId, time, text, author]
      );
      const newStamp = result.rows[0];
      const stamp = {
        id: newStamp.id,
        videoId: newStamp.video_id,
        time: parseFloat(newStamp.time),
        text: newStamp.text,
        author: newStamp.author,
        createdAt: newStamp.created_at,
      };
      console.log("📝 New stamp created:", stamp.id);
      io.emit("stamp-created", stamp);
    } catch (error) {
      console.error("❌ Error creating stamp:", error);
      socket.emit("stamp-error", { message: "Failed to create stamp" });
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Servir le frontend React (après toutes les routes API)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📺 Videos served from: ${path.join(__dirname, "public/videos")}`);
  console.log(`🔐 Auth routes available at /api/auth`);
  console.log(`🎬 Video routes available at /api/videos`);
  console.log(`☁️  Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    pool.end(() => {
      console.log("Database pool closed");
    });
  });
});

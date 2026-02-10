#!/bin/bash
cd ../client
npm install
npm run build
mkdir -p ../server/public
cp -r dist/* ../server/public/

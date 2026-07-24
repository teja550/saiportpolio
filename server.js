// ==============================================================================
// LOCAL DEVELOPMENT SERVER: http://localhost:3000
// Serves static portfolio files & handles POST /api/contact for local testing
// Run with: node server.js  or  npm start
// ==============================================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/contact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  // CORS Headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle /api/contact Endpoint
  if (req.url === '/api/contact' || req.url.startsWith('/api/contact')) {
    let bodyStr = '';
    req.on('data', chunk => {
      bodyStr += chunk.toString();
    });

    req.on('end', async () => {
      try {
        req.body = bodyStr ? JSON.parse(bodyStr) : {};
      } catch (err) {
        req.body = {};
      }

      // Mock Vercel response helper methods
      res.status = function (statusCode) {
        res.statusCode = statusCode;
        return res;
      };
      res.json = function (data) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        return res;
      };

      try {
        await handler(req, res);
      } catch (err) {
        console.error('Local handler error:', err);
        res.status(500).json({ success: false, error: err.message });
      }
    });
    return;
  }

  // Serve Static Files
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for unknown routes
      filePath = path.join(__dirname, 'index.html');
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`Portfolio Local Server running at: http://localhost:${PORT}`);
  console.log(`Testing Contact API at: http://localhost:${PORT}/api/contact`);
  console.log(`==================================================\n`);
});

/**
 * Roy Review System™ — Static file server
 * Serves the site for local development or Node-based hosting (Heroku, Railway, etc.)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = http.createServer((req, res) => {
  // Normalize URL and prevent path traversal (e.g. /../../../etc/passwd)
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  let filePath = path.join(PUBLIC_DIR, path.normalize(urlPath));

  // Ensure resolved path stays inside PUBLIC_DIR
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(PUBLIC_DIR))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  if (!ext) filePath += '.html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    const headers = {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    };
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache';
    } else {
      headers['Cache-Control'] = 'public, max-age=60';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Roy Review System™ running at http://localhost:${PORT}`);
});

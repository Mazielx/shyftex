const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const ROOT = __dirname;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const filePath = path.join(ROOT, url === '/' ? 'app.html' : url);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(5000, '0.0.0.0', () => {
  console.log('SHYFTEX running at http://localhost:5000');
});

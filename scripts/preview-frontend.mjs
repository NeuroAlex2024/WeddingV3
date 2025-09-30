import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const indexFile = path.join(projectRoot, 'index.html');
const port = Number.parseInt(process.env.PREVIEW_PORT ?? process.env.PORT ?? '4173', 10);

function guessContentType(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

async function sendFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    res.setHeader('Content-Type', guessContentType(filePath));
    res.statusCode = 200;
    res.end(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.statusCode = 404;
      res.end('Not found');
    } else {
      res.statusCode = 500;
      res.end('Internal server error');
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url ?? '/';
  if (url === '/' || url === '/index.html') {
    await sendFile(res, indexFile);
    return;
  }

  if (url.startsWith('/public/')) {
    const assetPath = path.join(publicDir, url.replace('/public/', ''));
    await sendFile(res, assetPath);
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

server.listen(port, () => {
  console.log(`[preview] Serving index.html with public assets on http://localhost:${port}`);
});

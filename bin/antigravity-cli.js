#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const http = require('http');

console.log("Pixel Agents: Antigravity Integration CLI");
console.log("-----------------------------------------");
console.log("Starting standalone Pixel Agents UI server for Antigravity...");

const uiPath = path.resolve(__dirname, '../dist/webview');
const port = process.env.PORT || 8080;

if (!fs.existsSync(uiPath)) {
    console.error(`UI assets not found at ${uiPath}. Please build the webview-ui first.`);
    console.error(`Run: cd webview-ui && npm run build`);
    process.exit(1);
}

// In a full integration, this would use Express/Fastify to serve static assets 
// and establish a WebSocket connection with the Antigravity agent process.
const server = http.createServer((req, res) => {
    // Simple static file serving stub
    if (req.url === '/') {
        const htmlPath = path.join(uiPath, 'index.html');
        if (fs.existsSync(htmlPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fs.readFileSync(htmlPath));
        } else {
            res.writeHead(404);
            res.end('index.html not found');
        }
    } else {
        // Basic static asset resolution for js/css/images
        if (req.url.startsWith('/assets/')) {
            const filePath = path.join(uiPath, req.url);
            if (fs.existsSync(filePath)) {
                // Lazy content type guessing
                const ext = path.extname(req.url);
                let contentType = 'text/plain';
                if (ext === '.js') contentType = 'application/javascript';
                if (ext === '.css') contentType = 'text/css';
                if (ext === '.png') contentType = 'image/png';
                if (ext === '.ttf') contentType = 'font/ttf';

                res.writeHead(200, { 'Content-Type': contentType });
                res.end(fs.readFileSync(filePath));
                return;
            }
        }
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(port, () => {
    console.log(`UI Server running at http://localhost:${port}`);
    console.log(`Waiting for native Antigravity event stream...`);
});

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

const clients = [];

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
    } else if (req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        clients.push(res);
        req.on('close', () => {
            const idx = clients.indexOf(res);
            if (idx >= 0) clients.splice(idx, 1);
        });
    } else if (req.url === '/test-mock') {
        // Broadcast a sequence of mock events for testing
        const sendMsg = (msg) => {
            clients.forEach(c => c.write(`data: ${JSON.stringify(msg)}\n\n`));
        };
        sendMsg({ type: 'agentCreated', id: 42, folderName: 'antigravity-tests' });
        setTimeout(() => sendMsg({ type: 'agentStatus', id: 42, status: 'active' }), 500);
        setTimeout(() => sendMsg({ type: 'agentToolStart', id: 42, toolId: 'tool-view', status: 'view_file' }), 1000);
        setTimeout(() => sendMsg({ type: 'agentToolDone', id: 42, toolId: 'tool-view' }), 4000);
        setTimeout(() => sendMsg({ type: 'agentToolStart', id: 42, toolId: 'tool-typing', status: 'write_to_file' }), 4500);
        res.writeHead(200);
        res.end('Mock events sequence triggered!');
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

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

// Cache to handle tab refreshes cleanly without losing state
const agentStateCache = {
    agents: [],
    statuses: {},
    seats: {},
    folderNames: {}
};
let currentLayout = null; // Will be loaded from disk if exists

// Load layout from disk on startup
const layoutPath = path.join(process.cwd(), 'pixel-layout.json');
if (fs.existsSync(layoutPath)) {
    try {
        currentLayout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));
        console.log("Loaded custom pixel-layout.json");
    } catch (e) {
        console.error("Failed to load pixel-layout.json", e);
    }
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
    } else if (req.url === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        clients.push(res);
        req.on('close', () => {
            const idx = clients.indexOf(res);
            if (idx >= 0) clients.splice(idx, 1);
        });

        // 1. Initial State Sync: Folders
        res.write(`data: ${JSON.stringify({ type: 'workspaceFolders', folders: [{ name: 'Antigravity Workspace', path: process.cwd() }] })}\n\n`);

        // 2. Initial State Sync: Layout
        res.write(`data: ${JSON.stringify({ type: 'layoutLoaded', layout: currentLayout })}\n\n`);

        // 3. Initial State Sync: Agents
        if (agentStateCache.agents.length > 0) {
            res.write(`data: ${JSON.stringify({ type: 'existingAgents', agents: agentStateCache.agents, agentMeta: agentStateCache.seats, folderNames: agentStateCache.folderNames })}\n\n`);
            for (const id of agentStateCache.agents) {
                if (agentStateCache.statuses[id]) {
                    res.write(`data: ${JSON.stringify({ type: 'agentStatus', id, status: agentStateCache.statuses[id] })}\n\n`);
                }
            }
        }

    } else if (req.url === '/api/event' && req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
    } else if (req.url === '/api/event' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);

                // Track caching values for tab-refresh synchronization
                if (payload.type === 'agentCreated') {
                    if (!agentStateCache.agents.includes(payload.id)) {
                        agentStateCache.agents.push(payload.id);
                    }
                    if (payload.folderName) {
                        agentStateCache.folderNames[payload.id] = payload.folderName;
                    }
                } else if (payload.type === 'agentStatus') {
                    agentStateCache.statuses[payload.id] = payload.status;
                } else if (payload.type === 'agentClosed') {
                    agentStateCache.agents = agentStateCache.agents.filter(a => a !== payload.id);
                    delete agentStateCache.statuses[payload.id];
                }

                clients.forEach(c => c.write(`data: ${JSON.stringify(payload)}\n\n`));
                // Handle pre-flight CORS / Success
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'invalid JSON' }));
            }
        });
    } else if (req.url === '/api/extension-message' && req.method === 'POST') {
        // UI saving back to the fake VSCode extension host
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const msg = JSON.parse(body);
                if (msg.type === 'saveLayout') {
                    fs.writeFileSync(layoutPath, JSON.stringify(msg.layout, null, 2));
                    currentLayout = msg.layout;
                } else if (msg.type === 'saveAgentSeats') {
                    agentStateCache.seats = msg.seats;
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success' }));
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'invalid JSON' }));
            }
        });
    } else if (req.url === '/test-mock') {
        // Broadcast a sequence of mock events for testing
        const sendMsg = (msg) => {
            // Also save to cache so tab refresh maintains the mock state
            if (msg.type === 'agentCreated') agentStateCache.agents.push(msg.id);
            if (msg.type === 'agentStatus') agentStateCache.statuses[msg.id] = msg.status;
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

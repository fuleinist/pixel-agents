# Antigravity Integration Guide

This document outlines how to run and test the **Pixel Agents** UI as a standalone application outside of VSCode, specifically designed for integration with the **Antigravity** agentic framework (or any other custom AI agent pipeline).

## Overview
By default, Pixel Agents runs as a VSCode extension and relies on the `acquireVsCodeApi()` messaging pipeline to receive state updates. To support native execution in browser environments (like local dashboards or standalone servers), we have introduced a **Standalone CLI Server**.

This server hosts the built React webview and exposes a Server-Sent Events (SSE) bridge to pipe pipeline events (like agent creation, tool usage, and statuses) securely into the frontend.

---

## 1. Setup and Building
Before running the standalone server, you must compile the React webview UI so the local HTTP server has static assets to serve.

```bash
# Navigate to the UI folder
cd webview-ui

# Install dependencies if you haven't already
npm install

# Build the production UI assets (outputs to /dist/webview)
npm run build
```

---

## 2. Running the Local Server
From the root of the project, you can launch the standalone integration server using the provided npm script:

```bash
# From the project root
npm run pixel-agents-antigravity
```
*Alternatively, you can run `npx pixel-agents-antigravity` or `node bin/antigravity-cli.js.*

This will start an HTTP server at `http://localhost:8080`.
Open your browser and navigate to this URL. You should see the Pixel Art Office environment render completely!

---

## 3. Testing with Mock Events
To quickly verify that the UI is securely catching events through the SSE stream without needing an actual AI agent running, a mock sequence endpoint is provided.

1. Ensure the UI is open in a tab at `http://localhost:8080`.
2. Open a **new tab** and navigate to: `http://localhost:8080/test-mock`
3. Switch back to your UI tab immediately. 

You should see an agent character spawn into the office and automatically transition through active, tool-usage (viewing and typing), and completed states.

---

## 4. Connecting Real Agents via Webhooks
If you are developing the backend AI agent (e.g., in Antigravity's core Python/Go loops) or just want to manually test specific actions, you can issue `POST` requests to the local server's `/api/event` webhook.

The server expects a JSON body matching the internal React state reducers.

### Example Payloads

**1. Creating an Agent**
```json
{
  "type": "agentCreated",
  "id": 1,
  "folderName": "Backend Infrastructure"
}
```

**2. Changing Agent Status (e.g., active, waiting)**
```json
{
  "type": "agentStatus",
  "id": 1,
  "status": "active"
}
```

**3. Starting a Tool Action (e.g., writing codebase, searching)**
```json
{
  "type": "agentToolStart",
  "id": 1,
  "toolId": "unique-task-string",
  "status": "write_to_file"
}
```

**4. Completing a Tool Action**
```json
{
  "type": "agentToolDone",
  "id": 1,
  "toolId": "unique-task-string"
}
```

### Sending Events via Terminal
Here are examples of how to pipe commands manually using standard terminal tools while your local server is running:

**Using PowerShell:**
```powershell
$uri = "http://localhost:8080/api/event"
$headers = @{"Content-Type" = "application/json"}

# 1. Wake the Agent up
Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{"type":"agentStatus","id":1,"status":"active"}'

# 2. Tell the Agent to write code (it will sit at the desk)
Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{"type":"agentToolStart","id":1,"toolId":"write-task","status":"write_to_file"}'

# 3. Complete the task
Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body '{"type":"agentToolDone","id":1,"toolId":"write-task"}'
```

**Using cURL (Bash/Zsh):**
```bash
# 1. Wake the Agent up
curl -X POST http://localhost:8080/api/event \
     -H "Content-Type: application/json" \
     -d '{"type":"agentStatus","id":1,"status":"active"}'

# 2. Tell the Agent to write code
curl -X POST http://localhost:8080/api/event \
     -H "Content-Type: application/json" \
     -d '{"type":"agentToolStart","id":1,"toolId":"write-task","status":"write_to_file"}'
```

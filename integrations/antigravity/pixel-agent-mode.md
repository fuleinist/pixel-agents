---
description: Enter Pixel Agent testing mode to automatically stream tool events to the standalone UI.
---
# Pixel Agent E2E Testing Workflow

When you activate this workflow, you enter **Pixel Agent Mode**. You must now actively stream your pipeline events to the local Pixel Agents UI server running at `http://localhost:8080/api/event`.

Follow these instructions strictly for the remainder of this task (or until the user tells you to stop Pixel Agent Mode):

1. **Agent Startup**: Immediately upon starting your work for the user, use the `run_command` tool to send an agent startup payload:
   ```powershell
   // turbo
   Invoke-RestMethod -Uri "http://localhost:8080/api/event" -Method Post -ContentType "application/json" -Body '{"type":"agentCreated","id":777,"folderName":"Antigravity Task"}'
   Invoke-RestMethod -Uri "http://localhost:8080/api/event" -Method Post -ContentType "application/json" -Body '{"type":"agentStatus","id":777,"status":"active"}'
   ```

2. **Before Every Tool Action**: Whenever you execute a tool (like `write_to_file`, `view_file`, or `run_command`), **BEFORE** running the primary tool, you MUST run a parallel or sequential `run_command` to notify the UI:
   ```powershell
   // turbo
   Invoke-RestMethod -Uri "http://localhost:8080/api/event" -Method Post -ContentType "application/json" -Body '{"type":"agentToolStart","id":777,"toolId":"<tool_name>-<random_number>","status":"<tool_name>"}'
   ```
   *Replace `<tool_name>` with the name of the tool you are using (e.g., `write_to_file`).*
   *Replace `<random_number>` with a unique number identifying this task step.*

3. **After Every Tool Action**: After your tool execution completes, immediately notify the UI that the tool finished:
   ```powershell
   // turbo
   Invoke-RestMethod -Uri "http://localhost:8080/api/event" -Method Post -ContentType "application/json" -Body '{"type":"agentToolDone","id":777,"toolId":"<tool_name>-<random_number>"}'
   ```
   *Ensure the `<tool_name>-<random_number>` exactly matches the one used in step 2.*

4. **Completion**: When you have fully completed the user's ultimate request, set your status back to waiting:
   ```powershell
   // turbo
   Invoke-RestMethod -Uri "http://localhost:8080/api/event" -Method Post -ContentType "application/json" -Body '{"type":"agentStatus","id":777,"status":"waiting"}'
   ```

By rigorously injecting these `run_command` hooks before and after your normal LLM tool calls, you simulate a deep system integration with Antigravity, verifying the Pixel Agent UI reacts to an end-to-end task realistically.

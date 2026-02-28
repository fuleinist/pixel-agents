#!/bin/bash
# setup-workflow.sh
# Installs the pixel-agent-mode.md workflow into the current user's Antigravity data directory.

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SOURCE_FILE="$SCRIPT_DIR/pixel-agent-mode.md"
ANTIGRAVITY_DIR="$HOME/.gemini/antigravity/global_workflows"

mkdir -p "$ANTIGRAVITY_DIR"

if [ -f "$SOURCE_FILE" ]; then
    cp "$SOURCE_FILE" "$ANTIGRAVITY_DIR/"
    echo "Successfully installed pixel-agent-mode workflow to $ANTIGRAVITY_DIR/pixel-agent-mode.md"
    echo "You can now use /pixel-agent-mode in Antigravity to trigger live testing mode!"
else
    echo "Error: Could not find pixel-agent-mode.md at $SOURCE_FILE"
    exit 1
fi

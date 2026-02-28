# setup-workflow.ps1
# Installs the pixel-agent-mode.md workflow into the current user's Antigravity data directory.

$sourceFile = Join-Path $PSScriptRoot "pixel-agent-mode.md"
$antigravityDir = Join-Path $HOME ".gemini/antigravity/global_workflows"

if (-Not (Test-Path $antigravityDir)) {
    Write-Host "Creating Antigravity global_workflows directory..."
    New-Item -ItemType Directory -Force -Path $antigravityDir | Out-Null
}

$destinationFile = Join-Path $antigravityDir "pixel-agent-mode.md"

Copy-Item -Path $sourceFile -Destination $destinationFile -Force

Write-Host "Successfully installed pixel-agent-mode workflow to $destinationFile"
Write-Host "You can now use /pixel-agent-mode in Antigravity to trigger live testing mode!"

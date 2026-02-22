#!/bin/bash

# setup_mac.sh - Dynamic setup for JH Kim's Office (macOS)
# This script automatically detects paths and configures the LaunchAgent.

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLIST_NAME="com.jhkim.office.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
NODE_PATH=$(which node)

if [ -z "$NODE_PATH" ]; then
    echo "Error: Node.js is not installed or not in your PATH."
    exit 1
fi

echo "Setting up JH Kim's Office on macOS..."
echo "Project Directory: $PROJECT_DIR"
echo "Node Binary: $NODE_PATH"

# Create/Update the .plist with dynamic paths
cat <<EOF > "$PLIST_NAME"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.jhkim.office</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$PROJECT_DIR/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$PROJECT_DIR/server.log</string>
    <key>StandardErrorPath</key>
    <string>$PROJECT_DIR/server.error.log</string>
</dict>
</plist>
EOF

echo "Generated $PLIST_NAME"

# Copy to LaunchAgents directory
cp "$PLIST_NAME" "$PLIST_DEST"
echo "Installed to $PLIST_DEST"

# Load/Reload the service
launchctl unload "$PLIST_DEST" 2>/dev/null
launchctl load "$PLIST_DEST"

echo "Success! The server is now running in the background."
echo "You can access your dashboard at http://localhost:1111"

# Clean up local temporary plist 
rm "$PLIST_NAME"

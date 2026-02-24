#!/bin/bash

# setup_mac.sh - Dynamic setup for My Starting Page (macOS)
# This script automatically detects paths and configures the LaunchAgent.

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLIST_NAME="com.jhkim.office.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
NODE_PATH=$(which node)

if [ -z "$NODE_PATH" ]; then
    echo ""
    echo "============================================"
    echo "  Node.js가 설치되어 있지 않습니다."
    echo "  Node.js is not installed on this system."
    echo "============================================"
    echo ""
    echo "Node.js 공식 사이트에서 LTS 버전을 설치해주세요."
    echo "Please install the LTS version from the official website."
    echo ""
    echo "설치 페이지를 브라우저로 엽니다..."
    echo "Opening the download page in your browser..."
    echo ""
    open "https://nodejs.org/ko/download/prebuilt-installer" 2>/dev/null || echo "https://nodejs.org/ko/download/prebuilt-installer 에 접속해주세요."
    echo "설치 완료 후 이 스크립트를 다시 실행해주세요."
    echo "After installation, please run this script again."
    exit 1
fi

echo "Setting up My Starting Page on macOS..."
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

# Clean up local temporary plist
rm "$PLIST_NAME"

# Verify server is running (up to 10 seconds)
echo ""
echo "서버 시작을 확인하고 있습니다..."
echo "Verifying server..."
RETRY=0
while [ $RETRY -lt 10 ]; do
    sleep 1
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:1111 2>/dev/null | grep -q "200"; then
        echo ""
        echo "============================================"
        echo "  Setup Complete!"
        echo "  설정이 완료되었습니다!"
        echo "============================================"
        echo ""
        echo "http://localhost:1111 에 접속하세요."
        echo "컴퓨터를 재시작해도 서버가 자동으로 실행됩니다."
        exit 0
    fi
    RETRY=$((RETRY + 1))
done

echo ""
echo "============================================"
echo "  서버가 시작되지 않았습니다."
echo "  The server failed to start."
echo "============================================"
echo ""
echo "문제 해결 방법:"
echo ""
echo "1. 아래 명령어를 직접 실행하여 오류 메시지를 확인하세요:"
echo "   node server.js"
echo ""
echo "2. Node.js 설치 직후라면 터미널을 닫고 다시 열어 시도해주세요."
echo ""
echo "3. 에러 로그를 확인하세요:"
echo "   cat $PROJECT_DIR/server.error.log"

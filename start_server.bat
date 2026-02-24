@echo off
echo ============================================
echo   My Starting Page - Manual Server Start
echo ============================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js가 설치되어 있지 않습니다.
    echo [ERROR] Node.js is not installed.
    echo.
    echo https://nodejs.org/ko/download/prebuilt-installer 에서 설치해주세요.
    echo.
    pause
    exit /b
)

echo Node.js version:
node -v
echo.
echo Starting server... (이 창을 닫으면 서버가 종료됩니다)
echo Press Ctrl+C to stop the server.
echo.
node server.js
echo.
echo [INFO] 서버가 종료되었습니다. 위 메시지에서 오류 원인을 확인하세요.
echo [INFO] The server has stopped. Check the messages above for errors.
echo.
pause

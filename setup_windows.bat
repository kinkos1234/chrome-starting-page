@echo off
set "SCRIPT_PATH=%~dp0run_server_background.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo Setting up JH Kim's Office for Windows...
echo Core files: index.html, style.css, script.js, server.js
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b
)

if not exist "%SCRIPT_PATH%" (
    echo Error: run_server_background.vbs not found in this folder.
    pause
    exit /b
)

echo Creating/Updating startup shortcut...
:: This PowerShell command creates or overwrites the existing shortcut with current paths
powershell "$s=(New-Object -COM WScript.Shell).CreateShortcut('%STARTUP_FOLDER%\JH_Kim_Office.lnk');$s.TargetPath='%SCRIPT_PATH%';$s.WorkingDirectory='%~dp0';$s.Save()"

echo Starting the server...
:: Check if port 1111 is already in use
netstat -ano | findstr :1111 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] Port 1111 is already in use. Server might already be running.
) else (
    echo [INFO] Starting server in the background via VBS...
    wscript.exe "%SCRIPT_PATH%"
)

echo.
echo Success! The server is now running and configured to start automatically.
echo.
echo You can access it at http://localhost:1111
echo.
pause

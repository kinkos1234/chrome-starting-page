@echo off
set "SCRIPT_PATH=%~dp0run_server_background.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

echo Setting up My Starting Page for Windows...
echo Core files: index.html, style.css, script.js, server.js
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ============================================
    echo   Node.js가 설치되어 있지 않습니다.
    echo   Node.js is not installed on this system.
    echo ============================================
    echo.
    echo Node.js 공식 사이트에서 LTS 버전을 설치해주세요.
    echo Please install the LTS version from the official website.
    echo.
    echo 설치 페이지를 브라우저로 엽니다...
    echo Opening the download page in your browser...
    echo.
    start https://nodejs.org/ko/download/prebuilt-installer
    echo 설치 완료 후 이 파일을 다시 더블클릭해주세요.
    echo After installation, please double-click this file again.
    echo.
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
    goto :verify
)

echo [INFO] Starting server in the background via VBS...
wscript.exe "%SCRIPT_PATH%"

:verify
echo.
echo Verifying server...
echo 서버 시작을 확인하고 있습니다...
:: Wait for the server to start (up to 10 seconds)
set RETRY=0
:check_loop
if %RETRY% geq 10 goto :verify_fail
timeout /t 1 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:1111' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 goto :verify_ok
set /a RETRY+=1
goto :check_loop

:verify_ok
echo.
echo ============================================
echo   Setup Complete!
echo   설정이 완료되었습니다!
echo ============================================
echo.
echo http://localhost:1111 에 접속하세요.
echo 컴퓨터를 재시작해도 서버가 자동으로 실행됩니다.
echo.
pause
exit /b

:verify_fail
echo.
echo ============================================
echo   서버가 시작되지 않았습니다.
echo   The server failed to start.
echo ============================================
echo.
echo 문제 해결 방법:
echo.
echo 1. 아래 명령어를 직접 실행하여 오류 메시지를 확인하세요:
echo    이 폴더에서 start_server.bat을 더블클릭하세요.
echo.
echo 2. Node.js 설치 직후라면 PC를 재부팅한 후 다시 시도해주세요.
echo.
echo 3. 백신 프로그램이 차단하고 있을 수 있습니다.
echo    Windows Defender 등에서 이 폴더를 예외로 추가해보세요.
echo.
pause

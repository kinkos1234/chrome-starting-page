Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strScriptPath = FSO.GetParentFolderName(WScript.ScriptFullName)

' Ensure current directory is correct
WshShell.CurrentDirectory = strScriptPath

' Run node server.js (0 = Hidden, False = Don't wait)
WshShell.Run "cmd /c node server.js > server.log 2> server.error.log", 0, False

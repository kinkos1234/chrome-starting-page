Set WshShell = CreateObject("WScript.Shell")
' Get the directory where the script is located
strScriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
' Run node server.js in that directory, hidden (0)
WshShell.CurrentDirectory = strScriptPath
WshShell.Run "node server.js", 0, False

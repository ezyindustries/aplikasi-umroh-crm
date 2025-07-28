Set objShell = CreateObject("WScript.Shell")
objShell.CurrentDirectory = objShell.CurrentDirectory & "\backend"
objShell.Run "cmd /k npm start", 1, False
WScript.Echo "Backend server started in background!"
WScript.Echo "Check window titled 'npm' for server logs"
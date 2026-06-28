@echo off
cd /d C:\citizen_witness\Citizen-Witness
:loop
echo %date% %time% starting server>> server-watch.log
"C:\Program Files\nodejs\node.exe" node_modules\tsx\dist\cli.mjs server\index.ts >> server-watch.out.log 2>> server-watch.err.log
echo %date% %time% server exited code=%ERRORLEVEL%; restarting in 2s>> server-watch.log
timeout /t 2 /nobreak > nul
goto loop

@echo off

cd /D %~dp0

rem using "& exit" to eliminate the "Terminate batch job (Y/N)?" annoyance
node . %* & exit

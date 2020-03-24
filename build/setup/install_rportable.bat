@echo off

REM TODO: change to set permanently

SET RTOOLS_EXE_PATH=%SystemDrive%\Rtools\bin

echo %PATH% > %USERPROFILE%\PATH-backup.txt
echo.%PATH% | findstr /C:"%RTOOLS_EXE_PATH%" 1>nul
IF ERRORLEVEL 1 (
	SET "PATH=%RTOOLS_EXE_PATH%;%PATH%"
)

REM echo %PATH%

EXIT 0
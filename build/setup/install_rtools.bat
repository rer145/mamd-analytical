@echo off

SET RTOOLS_DEFAULT_PATH=%SystemDrive%\Rtools
SET RTOOLS_EXE_PATH=%SystemDrive%\Rtools\bin
SET RTOOLS_PATH=%USERPROFILE%\Downloads\Rtools35.exe

REM echo %RTOOLS_DEFAULT_PATH%
REM echo %RTOOLS_EXE_PATH%
REM echo %RTOOLS_PATH%

IF NOT EXIST %RTOOLS_DEFAULT_PATH% (
	bitsadmin /transfer "DownloadRtools" https://cran.r-project.org/bin/windows/Rtools/Rtools35.exe %RTOOLS_PATH%
	
	IF %ERRORLEVEL% NEQ 0 (
		EXIT /B 1
	) ELSE (
		IF EXIST %RTOOLS_PATH% (
			%RTOOLS_PATH% /VERYSILENT /DIR=%RTOOLS_DEFAULT_PATH%

			IF %ERRORLEVEL% NEQ 0 (
				EXIT %ERRORLEVEL%
			) ELSE (
				EXIT 0
			)
		) ELSE (
			EXIT /B 1
		)
	)
) ELSE (
	EXIT 0
)
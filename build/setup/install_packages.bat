@echo off

setlocal ENABLEDELAYEDEXPANSION

:: Full setup of R packages for Windows
:: Arguments - paths must be surrounded by double quotes
::   %1 Path to Rscript.exe
::     (DEV=./build/R-Portable/R-Portable-Win/bin/Rscript.exe)
::     (PROD=process.resourcesPath/R-Portable/bin/Rscript.exe)
::   %3 Path to package installation folder
::     (app.getPath("userData")/packages | store.get("packages_path")
::   %4 Path to package installation and verification scripts
::     (DEV=./build/scripts)
::     (PROD=process.resourcesPath/scripts)

:: Example
:: install.bat "D:\work\hefner\mamd-analytical\build\R-Portable\R-Portable-Win\bin\Rscript.exe" "D:\work\hefner\mamd-analytical\build\R-Portable\Rtools35.exe" "D:\work\hefner\mamd-analytical\build\packages" "C:\Users\ronri\AppData\Roaming\MaMD Analytical\packages" "D:\work\hefner\mamd-analytical\build\scripts" "D:\work\hefner\mamd-analytical\build\R-Portable\R-Portable-Win\bin\R.exe" 


:: Other Requirements
:: Path to package source files (%3)
::   Path must contain *.tar.gz files for each package to install
::   Files must be R package SOURCE files, not binary
:: Path to package installation and verification scripts (%5)
::   Two R files must be present:  install.R and verify.R
::   These files will install and verify the R package installations required for MaMD Analytical


REM SET i=0
REM FOR %%a IN (%*) DO (
REM 	SET /a i+=1
REM 	echo   Arg !i! is %%a
REM 	rem echo   Parsed Arg !i! is %%a=:+! !%
REM )


SET RTOOLS_EXE_PATH=%SystemDrive%\Rtools\bin
echo.%PATH% | findstr /C:"%RTOOLS_EXE_PATH%" 1>nul
IF ERRORLEVEL 1 (
	SET "PATH=%RTOOLS_EXE_PATH%;%PATH%"
)


SET RSCRIPT_PATH=%~1

REM set ARG_PARSE=%~1
REM REM set ARG_PARSE=%ARG_PARSE:+= %
REM IF "%ARG_PARSE%" == "" (
REM 	EXIT /B 11
REM ) ELSE (
REM 	IF EXIST %ARG_PARSE% (
REM 		SET RSCRIPT_PATH=%ARG_PARSE%
REM 	) ELSE (
REM 		EXIT /B 12
REM 	)
REM )

SET PKG_INSTALL_PATH=%~2

REM set ARG_PARSE=%~2
REM REM set ARG_PARSE=%ARG_PARSE:+= %
REM IF "%ARG_PARSE%" == "" (
REM 	EXIT /B 21
REM ) ELSE (
REM 	IF EXIST %ARG_PARSE% (
REM 		SET PKG_INSTALL_PATH=%ARG_PARSE%
REM 	) ELSE (
REM 		EXIT /B 22
REM 	)
REM )


SET SCRIPTS_PATH=%~3
SET SCRIPTS_INSTALL_PATH="%SCRIPTS_PATH%\install.R"
SET SCRIPTS_VERIFY_PATH="%SCRIPTS_PATH%\verify.R"

REM set ARG_PARSE=%~3
REM REM set ARG_PARSE=%ARG_PARSE:+= %
REM IF "%ARG_PARSE%" == "" (
REM 	EXIT /B 31
REM ) ELSE (
REM 	IF EXIST %ARG_PARSE% (
REM 		SET SCRIPTS_PATH=%ARG_PARSE%
REM 		REM SET SCRIPTS_INSTALL_PATH=!SCRIPTS_PATH:"=!\install.R
REM 		REM SET SCRIPTS_VERIFY_PATH=!SCRIPTS_PATH:"=!\verify.R
REM 		SET SCRIPTS_INSTALL_PATH="%SCRIPTS_PATH%\install.R"
REM 		SET SCRIPTS_VERIFY_PATH="%SCRIPTS_PATH%\verify.R"
		
REM 		REM echo install : !SCRIPTS_INSTALL_PATH!
REM 		REM echo verify : !SCRIPTS_VERIFY_PATH!
		
REM 		IF NOT EXIST !SCRIPTS_INSTALL_PATH! (
REM 			EXIT /B 32
REM 		)
REM 		IF NOT EXIST !SCRIPTS_VERIFY_PATH! (
REM 			EXIT /B 33
REM 		)
REM 	) ELSE (
REM 		EXIT /B 34
REM 	)
REM )




REM Install packages locally
"%RSCRIPT_PATH%" %SCRIPTS_INSTALL_PATH% "%PKG_INSTALL_PATH%"
IF %ERRORLEVEL% NEQ 0 (
	EXIT %ERRORLEVEL%
)

REM Verify package installs
REM %RSCRIPT_PATH% %SCRIPTS_VERIFY_PATH% %PKG_SOURCE_PATH% %PKG_INSTALL_PATH%
REM IF %ERRORLEVEL% NEQ 0 (
REM 	EXIT %ERRORLEVEL%
REM )

endlocal

EXIT 0
@echo off

setlocal ENABLEDELAYEDEXPANSION

:: Full setup of R packages for Windows
:: Arguments - paths must be surrounded by double quotes
::   %1 Path to Rscript.exe
::     (DEV=./build/R-Portable/R-Portable-Win/bin/Rscript.exe)
::     (PROD=process.resourcesPath/R-Portable/bin/Rscript.exe)
::   %2 Path to RtoolsXX.exe installer - IGNORED FOR NOW
::     (DEV=./build/RtoolsXX.exe)
::     (PROD=process.resourcesPath/RtoolsXX.exe)
::   %3 Path to package source files
::     (DEV=./build/packages)
::     (PROD=process.resourcesPath/packages)
::   %4 Path to package installation folder
::     (app.getPath("userData")/packages | store.get("packages_path")
::   %5 Path to package installation and verification scripts
::     (DEV=./build/scripts)
::     (PROD=process.resourcesPath/scripts)

:: Example
:: install.bat "D:\work\hefner\mamd-analytical\build\R-Portable\R-Portable-Win\bin\Rscript.exe" "D:\work\hefner\mamd-analytical\build\R-Portable\Rtools35.exe" "D:\work\hefner\mamd-analytical\build\packages" "C:\Users\ronri\AppData\Roaming\MaMD Analytical\packages" "D:\work\hefner\mamd-analytical\build\scripts"


:: Other Requirements
:: Path to package source files (%3)
::   Path must contain *.tar.gz files for each package to install
::   Files must be R package SOURCE files, not binary
:: Path to package installation and verification scripts (%5)
::   Two R files must be present:  install.R and verify.R
::   These files will install and verify the R package installations required for MaMD Analytical


echo.
echo Beginning installation and setup of Rtools and R packages required for MaMD Analytical
echo.


echo.
echo Debugging Arguments
echo ----------------------------------------------------------------
SET i=0
FOR %%a IN (%*) DO (
	SET /a i+=1
	echo   Arg !i! is %%a
	rem echo   Parsed Arg !i! is %%a=:+! !%
)
echo.

SET RTOOLS_DEFAULT_PATH=C:\Rtools
SET RTOOLS_EXE_PATH=C:\Rtools\bin

SET RSCRIPT_PATH=%~1

REM echo checking exist
REM IF EXIST %RSCRIPT_PATH% (echo i haz it) ELSE (echo nopez)
REM echo done

set ARG_PARSE=%1
set ARG_PARSE=%ARG_PARSE:+= %
IF [%ARG_PARSE%]==[] (
	GOTO err_arg_rscript_path
) ELSE (
	IF EXIST %ARG_PARSE% (
		SET RSCRIPT_PATH=%ARG_PARSE%
	) ELSE (
		GOTO err_rscript_notfound
	)
)
rem IF [%2]==[] (
rem 	GOTO err_arg_rtools_path
rem ) ELSE (
rem 	IF EXIST %2 (
rem 		SET RTOOLS_PATH=%2
rem 	) ELSE (
rem 		GOTO err_rtools_notfound
rem 	)
rem )
SET RTOOLS_PATH=%USERPROFILE%\Downloads\Rtools35.exe

set ARG_PARSE=%3
set ARG_PARSE=%ARG_PARSE:+= %
IF [%ARG_PARSE%]==[] (
	GOTO err_arg_package_path
) ELSE (
	IF EXIST %ARG_PARSE% (
		SET PKG_SOURCE_PATH=%ARG_PARSE%
	) ELSE (
		GOTO err_pkg_src_notfound
	)
)

set ARG_PARSE=%4
set ARG_PARSE=%ARG_PARSE:+= %
IF [%ARG_PARSE%]==[] (
	GOTO err_arg_install_path
) ELSE (
	echo haz value
	IF EXIST %ARG_PARSE% (
		SET PKG_INSTALL_PATH=%ARG_PARSE%
	) ELSE (
		GOTO err_pkg_dest_notfound
	)
)

set ARG_PARSE=%5
set ARG_PARSE=%ARG_PARSE:+= %
IF [%ARG_PARSE%]==[] (
	GOTO err_arg_scripts_path
) ELSE (
	IF EXIST %ARG_PARSE% (
		SET SCRIPTS_PATH=%ARG_PARSE%
		SET SCRIPTS_INSTALL_PATH=!SCRIPTS_PATH:"=!\install.R
		SET SCRIPTS_VERIFY_PATH=!SCRIPTS_PATH:"=!\verify.R
		
		rem echo install : !SCRIPTS_INSTALL_PATH!
		rem echo verify : !SCRIPTS_VERIFY_PATH!
		
		IF NOT EXIST !SCRIPTS_INSTALL_PATH! (
			GOTO err_scripts_install_notfound
		)
		IF NOT EXIST !SCRIPTS_VERIFY_PATH! (
			GOTO err_scripts_verify_notfound
		)
	) ELSE (
		GOTO err_scripts_notfound
	)
)



echo.
echo Current Installation and Setup Variables
echo ----------------------------------------------------------------
echo   Rscript Path: %RSCRIPT_PATH%
echo   Rtools Path: %RTOOLS_PATH%
echo   Package Src Path: %PKG_SOURCE_PATH%
echo   Package Install Path: %PKG_INSTALL_PATH%
echo   Scripts Path: %SCRIPTS_PATH%
echo     Install: %SCRIPTS_INSTALL_PATH%
echo     Verify: %SCRIPTS_VERIFY_PATH%
echo.



echo.
echo Installing Rtools (if necessary)
echo ----------------------------------------------------------------
IF NOT EXIST %RTOOLS_DEFAULT_PATH% (
	bitsadmin /transfer "DownloadRtools" https://cran.r-project.org/bin/windows/Rtools/Rtools35.exe %RTOOLS_PATH%
	
	IF %ERRORLEVEL% NEQ 0 (
		GOTO err_download_rtools
	) ELSE (
		IF EXIST %RTOOLS_PATH% (
			%RTOOLS_PATH% /VERYSILENT /DIR=%RTOOLS_DEFAULT_PATH%

			IF %ERRORLEVEL% NEQ 0 (
				GOTO err_rtools_install
			) ELSE (
				echo   Installation was successful!
			)
		) ELSE (
			GOTO err_download_rtools
		)
	)
) ELSE (
	echo   Already installed.
)
echo.



echo.
echo Checking/Setting temporary PATH variables
echo ---------------------------------------------------------------
echo   Backing up PATH variables to: %USERPROFILE%\PATH-backup.txt
echo %PATH% > %USERPROFILE%\PATH-backup.txt
echo   Checking if Rtools path is set
echo.%PATH% | findstr /C:"%RTOOLS_EXE_PATH%" 1>nul
IF ERRORLEVEL 1 (
	echo     Rtools path not in PATH, adding now
	SET "PATH=%RTOOLS_EXE_PATH%;%PATH%"
) ELSE (
	echo     Rtools path already in PATH
)
:: echo %PATH%
echo.



echo.
echo Installing R packages from source
echo ---------------------------------------------------------------
echo.
%RSCRIPT_PATH% %SCRIPTS_INSTALL_PATH% %PKG_SOURCE_PATH% %PKG_INSTALL_PATH%
rem Check for errors and report?
echo.


echo.
echo Verifying R packages installation
echo ---------------------------------------------------------------
echo.
%RSCRIPT_PATH% %SCRIPTS_VERIFY_PATH% %PKG_SOURCE_PATH% %PKG_INSTALL_PATH%
rem Check for errors and report?
echo.



echo.
echo Installation and Setup has completed
echo.
GOTO eof



:err_arg_rscript_path
echo ERROR: Argument 1 is missing -- Full path to Rscript.exe
GOTO eof

:err_rscript_notfound
echo ERROR: Path for Rscript.exe does not exist on file system (%1)
GOTO eof

:err_arg_rtools_path
echo ERROR: Argument 2 is missing -- Full path Rtools installation file
GOTO eof

:err_rtools_notfound
echo ERROR: Path for Rtools executable does not exist on file system (%2)
GOTO eof

:err_arg_package_path
echo ERROR: Argument 3 is missing -- Full path to package source files
GOTO eof

:err_pkg_src_notfound
echo ERROR: Path for R package source files does not exist on file system (%3)
GOTO eof

:err_arg_install_path
echo ERROR: Argument 4 is missing -- Full path to package installation directory
GOTO eof

:err_pkg_dest_notfound
echo ERROR: Path for R package installation directory does not exist on file system (%4)
GOTO eof

:err_arg_scripts_path
echo ERROR: Argument 5 is missing -- Full path to R package install and verification scripts (%5)
GOTO eof

:err_scripts_path_notfound
echo ERROR: Path for R scripts directory does not exist on file system (%5)
GOTO eof

:err_scripts_install_notfound
echo ERROR: Installation R script file does not exist on file system (%SCRIPTS_INSTALL_PATH%)
GOTO eof

:err_scripts_verify_notfound
echo ERROR: Verification R script file does not exist on file system (%SCRIPTS_VERIFY_PATH%)
GOTO eof

:err_download_rtools
echo ERROR: There was an error attempting to download Rtools (%ERRORLEVEL%)
GOTO eof

:err_rtools_install
echo ERROR: There was an error attempting to install Rtools (%ERRORLEVEL%)
GOTO eof



endlocal

:eof

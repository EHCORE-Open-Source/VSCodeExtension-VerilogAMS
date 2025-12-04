@echo off
REM Batch file for creating VSIX package on Windows

REM User variable setting
set outputFolder=vsix

REM If the output folder doesn't exist, create the output folder
if not exist "%outputFolder%" (
    mkdir "%outputFolder%"
)

REM Compile and package a VSIX extension file
vsce package --out "%outputFolder%"

REM Check if the command was successful
if %errorlevel% equ 0 (
    echo VSIX package created successfully in %outputFolder% folder
) else (
    echo Failed to create VSIX package
    exit /b 1
)
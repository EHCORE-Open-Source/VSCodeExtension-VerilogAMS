@echo off

@REM User variable setting
set outputFolder=vsix

@REM If the output folder don't exist, create the output folder
if not exist %outputFolder%\ (
  mkdir %outputFolder%
)

@REM Compile and package a VSIX extension file
vsce package --out %outputFolder%
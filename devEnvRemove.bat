@echo off
npm uninstall -g typescript ts-node yo generator-code eslint @vscode/vsce
rd /s /q node_modules
rd /s /q out
rd /s /q vsix

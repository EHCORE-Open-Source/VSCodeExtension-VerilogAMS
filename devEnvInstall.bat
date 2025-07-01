@echo off
call npm install -g npm typescript ts-node yo generator-code eslint @vscode/vsce
call npm install @types/node @types/vscode@1.88.0
call npm install --save-dev vscode
call npm audit fix --force
call npm uninstall @types/mocha
rd /s /q node_modules\@types\mocha

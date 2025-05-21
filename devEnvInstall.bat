@echo off
npm install -g npm typescript ts-node yo generator-code eslint @vscode/vsce
npm install @types/node @types/vscode@1.88.0
npm install --save-dev vscode
npm audit fix --force
npm uninstall @types/mocha
rd /s /q node_modules\@types\mocha

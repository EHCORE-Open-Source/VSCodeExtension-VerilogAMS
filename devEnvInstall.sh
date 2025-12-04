#!/bin/bash
# Development environment installation script for Linux/macOS

echo "Installing global packages..."
npm install -g npm typescript ts-node yo generator-code eslint @vscode/vsce

if [ $? -ne 0 ]; then
    echo "Failed to install global packages"
    exit 1
fi

echo "Installing local type definitions..."
npm install @types/node @types/vscode@1.88.0

if [ $? -ne 0 ]; then
    echo "Failed to install type definitions"
    exit 1
fi

echo "Installing vscode as dev dependency..."
npm install --save-dev vscode

if [ $? -ne 0 ]; then
    echo "Failed to install vscode dev dependency"
    exit 1
fi

echo "Running npm audit fix..."
npm audit fix --force

echo "Uninstalling @types/mocha..."
npm uninstall @types/mocha

echo "Removing @types/mocha directory..."
if [ -d "node_modules/@types/mocha" ]; then
    rm -rf node_modules/@types/mocha
    echo "@types/mocha directory removed"
else
    echo "@types/mocha directory not found, skipping..."
fi

echo "Development environment installation completed successfully!"

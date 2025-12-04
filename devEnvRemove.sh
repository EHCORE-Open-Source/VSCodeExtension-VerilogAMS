#!/bin/bash
# Development environment removal script for Linux/macOS

echo "Uninstalling global packages..."
npm uninstall -g typescript ts-node yo generator-code eslint @vscode/vsce

if [ $? -ne 0 ]; then
    echo "Warning: Failed to uninstall some global packages"
fi

echo "Removing node_modules directory..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "node_modules directory removed"
else
    echo "node_modules directory not found, skipping..."
fi

echo "Removing out directory..."
if [ -d "out" ]; then
    rm -rf out
    echo "out directory removed"
else
    echo "out directory not found, skipping..."
fi

echo "Removing vsix directory..."
if [ -d "vsix" ]; then
    rm -rf vsix
    echo "vsix directory removed"
else
    echo "vsix directory not found, skipping..."
fi

echo "Development environment removal completed successfully!"

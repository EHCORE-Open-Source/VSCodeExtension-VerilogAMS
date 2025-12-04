#!/bin/bash
# Shell script for creating VSIX package on Linux/macOS

# User variable setting
outputFolder="vsix"

# If the output folder doesn't exist, create the output folder
if [ ! -d "$outputFolder" ]; then
    mkdir -p "$outputFolder"
fi

# Compile and package a VSIX extension file
echo "Creating VSIX package..."
vsce package --out "$outputFolder"

# Check if the command was successful
if [ $? -eq 0 ]; then
    echo "VSIX package created successfully in $outputFolder folder"
else
    echo "Failed to create VSIX package"
    exit 1
fi
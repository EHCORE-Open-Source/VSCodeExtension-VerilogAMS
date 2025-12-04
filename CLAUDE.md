# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VSCode extension (version 0.0.3) that provides language support for Verilog-A (`.va`), Verilog-AMS (`.vams`), and Verilog-A with Jinja2 templates (`.va.jinja2`, `.va.j2`) files, including syntax highlighting and document symbol navigation. The extension is published as `verilogams-support-package` by `ephoton0210-taiwan`.

This project is licensed under GNU General Public License v3.0 (GPL-3.0-only).

## Development Commands

### Initial Setup
Run the development environment setup script:
```bash
./devEnvInstall.bat
```
This installs required global packages (typescript, ts-node, yo, generator-code, eslint, @vscode/vsce) and project dependencies.

### Building and Compilation
- `npm run compile` - Compile TypeScript sources to JavaScript (output: `./out/`)
- `npm run watch` - Compile in watch mode for active development
- `npm run lint` - Run ESLint on TypeScript sources

### Testing
- `npm test` - Run tests (automatically runs compile and lint first)

### Packaging
- `./makeVSIX.bat` or `vsce package --out vsix` - Package the extension as a VSIX file for distribution

### Cleanup
- `./devEnvRemove.bat` - Remove global packages and clean build artifacts (`node_modules/`, `out/`, `vsix/`)

### Debugging
Use the "Run Extension" launch configuration in VSCode (F5) which:
- Runs the default build task first
- Opens a new Extension Development Host window
- Loads the extension from the workspace folder
- Default test workspace: `D:\git\vaLib`

## Architecture

### Extension Entry Point
[src/extension.ts](src/extension.ts) contains the main extension logic:
- Activation registers a `DocumentSymbolProvider` for `verilog-a` language
- The provider parses Verilog-A source files to extract structural information

### Document Symbol Provider
The symbol provider (`DocumentSymbolProvider` class) implements VSCode's outline/navigation feature:

1. **Text Organization** (`organize` function):
   - Strips single-line (`//`) and multi-line (`/* */`) comments
   - Extracts module blocks between `module` and `endmodule` keywords
   - Preserves line ranges for navigation

2. **Parsing** (`parseVerilogA` function):
   - Detects top-level constructs: `` `define`` macros, `` `include`` directives, and modules
   - Creates appropriate symbol kinds (Constant, File, Module)

3. **Module Parsing** (`parseVerilogA_module` function):
   - Extracts port declarations (`input`, `output`, `inout`) with their electrical types (`voltage`, `current`, `electrical`)
   - Parses parameters with types (`real`, `integer`) and default values
   - Identifies local variables (`real`, `integer`, `string`) with optional vector notation
   - Symbol hierarchy: Module → Ports (Interface) → Parameters (Field) → Variables (Variable)

### Language Definitions
- **Language configurations**:
  - [verilog-a.language-configuration.json](verilog-a.language-configuration.json) - Brackets, comments, auto-closing pairs for `.va` files
  - [verilog-ams.language-configuration.json](verilog-ams.language-configuration.json) - Configuration for `.vams` files
  - [verilog-a.jinja2.language-configuration.json](verilog-a.jinja2.language-configuration.json) - Configuration for `.va.jinja2` and `.va.j2` template files

- **TextMate Grammars** (in `syntaxes/`):
  - [verilog-a.tmLanguage.json](syntaxes/verilog-a.tmLanguage.json) - Syntax highlighting for Verilog-A (scope: `source.verilog.analog`)
  - [verilog-ams.tmLanguage.json](syntaxes/verilog-ams.tmLanguage.json) - Syntax highlighting for Verilog-AMS (scope: `source.verilog.analog.mixedsignal`)
  - [verilog.analog/basic.tmLanguage.json](syntaxes/verilog.analog/basic.tmLanguage.json) - Base analog grammar (scope: `source.verilog.analog.basic`)
  - [verilog-a.jinja2.tmLanguage.json](syntaxes/verilog-a.jinja2.tmLanguage.json) - Composite grammar for Jinja2 templates with Verilog-A (scope: `source.verilog.analog.jinja2`)

### Extension Contributions
Defined in [package.json](package.json):
- Three language IDs:
  - `verilog-ams` (.vams extension)
  - `verilog-a` (.va extension)
  - `verilog-a-jinja2` (.va.jinja2, .va.j2 extensions) - for Jinja2 templates
- Four grammar scopes for hierarchical syntax highlighting
- VSCode engine compatibility: `^1.43.0`

### Jinja2 Template Support
The extension supports Verilog-A files with embedded Jinja2 template syntax:
- **Jinja2 blocks**: `{% if %} ... {% endif %}`, `{% for %} ... {% endfor %}`
- **Jinja2 variables**: `{{ variable_name }}`
- **Jinja2 comments**: `{# comment #}`
- VerilogA syntax is preserved and highlighted outside Jinja2 constructs
- Use `.va.jinja2` or `.va.j2` extensions for automatic language detection

**Handling Extension Conflicts**: If you have other Jinja2 extensions installed (e.g., `samuelcolvin.jinjahtml`), they may also register `.j2` files. To ensure `.va.j2` files are correctly recognized:
1. The workspace settings in [.vscode/settings.json](.vscode/settings.json) explicitly maps both `.va.jinja2` and `.va.j2` to this extension
2. The `filenamePatterns` in package.json prioritize the more specific `*.va.j2` pattern
3. When both extensions are present, the workspace settings take precedence

## Known Issues

- Limited support for `generate` syntax constructs

## Project Structure Notes

- TypeScript compiled with strict mode, targeting ES2022
- Output directory: `out/`
- Sample files in `sample/` directory for testing
- VSIX packages output to `vsix/` directory

# Verilog-AMS Extension for Visual Studio Code

A comprehensive Visual Studio Code extension providing language support for Verilog-A and Verilog-AMS hardware description languages, with additional support for Jinja2 template syntax.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Version](https://img.shields.io/badge/version-0.0.3-green.svg)](https://github.com/EHCORE-Open-Source/vscode_verilog-ams)

## Features

### Syntax Highlighting
- **Verilog-A** (`.va` files): Full syntax highlighting for Verilog-A analog behavioral models
- **Verilog-AMS** (`.vams` files): Mixed-signal design support with analog and digital constructs
- **Jinja2 Templates** (`.va.jinja2` files): Parametric Verilog-A models with Jinja2 template syntax
  - Template blocks: `{% if %}`, `{% for %}`, `{% macro %}`
  - Template variables: `{{ variable_name }}`
  - Template comments: `{# comment #}`

### Document Symbol Navigation
- Module definitions and hierarchy
- Port declarations with direction and electrical type
- Parameter definitions with default values
- Variable declarations with type information
- Quick navigation via VSCode Outline view (Ctrl+Shift+O)

### Language Features
- Auto-closing pairs for brackets, quotes, and Jinja2 delimiters
- Comment toggling support (line and block comments)
- Proper bracket matching and folding

## Supported File Extensions

| Extension | Language | Description |
|-----------|----------|-------------|
| `.va` | Verilog-A | Analog behavioral models |
| `.vams` | Verilog-AMS | Mixed-signal designs |
| `.va.jinja2` | Verilog-A + Jinja2 | Parametric template models |

## Installation

### From VSIX Package
1. Download the latest `.vsix` file from the [releases page](https://github.com/EHCORE-Open-Source/vscode_verilog-ams/releases)
2. Open VSCode
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette
4. Type "Extensions: Install from VSIX..." and select the downloaded file

### From Source
```bash
git clone https://github.com/EHCORE-Open-Source/vscode_verilog-ams.git
cd vscode_verilog-ams
npm install
npm run compile
code --install-extension .
```

## Usage Examples

### Basic Verilog-A Module
```verilog
`include "disciplines.vams"

module resistor(p, n);
    inout p, n;
    electrical p, n;

    parameter real R = 1k from (0:inf);

    analog begin
        V(p, n) <+ R * I(p, n);
    end
endmodule
```

### Jinja2 Template Example
```jinja
{# Parametric resistor with temperature coefficient #}
`include "disciplines.vams"

module {{ module_name }}(p, n);
    inout p, n;
    electrical p, n;

    parameter real R = {{ resistance }} from (0:inf);
    {% if has_temp_coeff %}
    parameter real TC1 = {{ tc1 }};
    parameter real TC2 = {{ tc2 }};
    {% endif %}

    analog begin
        {% if has_temp_coeff %}
        V(p, n) <+ R * (1 + TC1*$temperature + TC2*$temperature*$temperature) * I(p, n);
        {% else %}
        V(p, n) <+ R * I(p, n);
        {% endif %}
    end
endmodule
```

## Configuration

### Handling Extension Conflicts

If you have other Jinja2 extensions installed (e.g., `samuelcolvin.jinjahtml`), add this to your workspace settings (`.vscode/settings.json`):

```json
{
    "files.associations": {
        "*.va.jinja2": "verilog-a-jinja2"
    }
}
```

## Requirements

- Visual Studio Code version 1.43.0 or higher

## Known Issues

- Limited support for `generate` syntax constructs
- Document symbols are only available for Verilog-A files (`.va`), not yet implemented for Verilog-AMS (`.vams`)

## Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/EHCORE-Open-Source/vscode_verilog-ams.git
cd vscode_verilog-ams

# Install dependencies
./devEnvInstall.bat  # Windows
# or manually: npm install -g typescript eslint @vscode/vsce && npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Package as VSIX
./makeVSIX.bat  # Windows
# or manually: vsce package --out vsix
```

### Running Tests
```bash
npm test
```

### Debugging
Press `F5` in VSCode to launch the Extension Development Host for testing.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE.md](LICENSE.md) file for details.

Copyright (C) 2024 EHCORE Open Source Community

## Changelog

### 0.0.3 (Current)
- Added Jinja2 template support for `.va.jinja2` files
- Improved syntax highlighting with composite grammar
- Added file association conflict resolution
- Updated LICENSE with explicit GPL-3.0 notice
- Comprehensive README rewrite

### 0.0.2
- Reconstructed Verilog-A syntax highlighting
- Improved TextMate grammar definitions

### 0.0.1
- Initial release
- Basic Verilog-A and Verilog-AMS syntax highlighting
- Document symbol provider for Verilog-A

## Resources

- [Verilog-AMS Language Reference](https://www.accellera.org/downloads/standards/v-ams)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [TextMate Grammar Guide](https://macromates.com/manual/en/language_grammars)

## Support

- **Issues**: [GitHub Issues](https://github.com/EHCORE-Open-Source/vscode_verilog-ams/issues)
- **Repository**: [GitHub Repository](https://github.com/EHCORE-Open-Source/vscode_verilog-ams)

---

**Enjoy coding with Verilog-A and Verilog-AMS!** 🚀

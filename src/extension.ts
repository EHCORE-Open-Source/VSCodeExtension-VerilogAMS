import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {
    
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({language: "verilog-a" }, new DocumentSymbolProvider()));
}

interface ITextBlock {
    line: LineObj[];
}

interface IModulePort {
    interface: PortObj;
    type: PortObj;
}

class ModulePortObj implements IModulePort {
    public interface: PortObj = new PortObj();
    public type: PortObj = new PortObj();
}

class ModuleParameterObj {
    public type: LineObj = new LineObj();
}

class PortObj {
    public context: string = '';
    public vector: string = '';
    public range: vscode.Range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
    constructor( context?: string, range?: vscode.Range){
        if (context) this.context = context;
        if (range) this.range = range;
    }
}

class TextBlockObj implements ITextBlock {
    public line: LineObj[] = [];
}

class LineObj {
    public context: string = '';
    public range: vscode.Range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
    constructor( context?: string, range?: vscode.Range){
        if (context) this.context = context;
        if (range) this.range = range;
    }
}

class ParameterObj {
    public type: string = '';
    public defaultValue: any = undefined;
    public range: vscode.Range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
    constructor( type?: string, range?: vscode.Range, defaultValue?: any ){
        if (type) this.type = type;
        if (range) this.range = range;
        if (defaultValue) this.defaultValue = defaultValue;
    }
}

class VariableObj {
    public type: string = '';
    public vector: string = ''
    public range: vscode.Range = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0));
    constructor( type?: string, range?: vscode.Range ){
        if (type) this.type = type;
        if (range) this.range = range;
    }
}

function organize(document: vscode.TextDocument) {
    var textBlocks = new Array<TextBlockObj>();
    var tmpTextBlock = new TextBlockObj();
    var annotationStatus = -1;
    var matchSingle = true;
    var matchMultiple = true;
    var textBlockStatus = false;


    const regexMultiAnnotationStart = /\s*\/\*/;
    const regexMultiAnnotationEnd = /\*\/\s*/;
    const regexAnnotation = /\s*\/\//;
    const regexModuleStart = /^module\s+/;
    const regexModuleEnd = /^endmodule/;

    for (var i = 0; i < document.lineCount; i++) {
        var line = document.lineAt(i).text;
        var lineRange = document.lineAt(i).range;

        // Remove annotation context
        if (annotationStatus < 0) {
            const matchesSingle = regexAnnotation.exec(line);
            const matchesMultiple = regexMultiAnnotationStart.exec(line);
    
            // Determine which annotation status to comply with
            matchSingle = true;
            matchMultiple = true;
            if (matchesSingle && matchesMultiple) {
                if (matchesSingle.index > matchesMultiple.index) matchSingle = false;
                else matchMultiple = false;
            }
    
            // Remove annotation content
            if (matchesSingle && matchSingle) {
                if (matchesSingle.index > 0) {
                    line = line.substring(0, matchesSingle.index);
                } else {
                    line = '';
                }
            } else if (matchesMultiple && matchMultiple) {
                annotationStatus = i;
                if (matchesMultiple.index > 0) {
                    line = line.substring(0, matchesMultiple.index);
                } else {
                    line = '';
                }
            }
        } else {
            const matchesMultiple = regexMultiAnnotationEnd.exec(line);
            if (matchesMultiple) {
                annotationStatus = -1;
                line = line.substring(matchesMultiple.index + matchesMultiple.length + 1);
            }
        }

        // Keep non-annotated content
        if (annotationStatus < 0 || annotationStatus == i) {
            // Remove extra whitespace characters
            line = line.trim();

            // Determine whether to add to the temporary block.
            if (!textBlockStatus) {
                const matchesModuleStart = regexModuleStart.exec(line);
                if (matchesModuleStart) textBlockStatus = true;
            } else {
                const matchesModuleEnd = regexModuleEnd.exec(line);
                if (matchesModuleEnd) {
                    textBlockStatus = false;
                }
            }

            if (line.length > 0) {
                if (textBlockStatus) {
                    tmpTextBlock.line.push(new LineObj(line, lineRange));
                }
                else {
                    tmpTextBlock.line.push(new LineObj(line, lineRange));
                    textBlocks.push(tmpTextBlock);
                    tmpTextBlock = new TextBlockObj();
                }
            }
        }
    }
    return textBlocks;
}

class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {   
    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> {
        return new Promise((resolve) => {
            const textBlocks = organize(document);
            resolve(parseVerilogA(textBlocks));
        });
    }    
}

function parseVerilogA(textBlocks: Array<TextBlockObj>) {
    let symbols: vscode.DocumentSymbol[] = [];

    var matches: RegExpExecArray | null;
    const regexDefine = /^`define\s+([^\s]*)/;
    const regexInclude = /^`include\s+\"([^\s]*)\"/;
    const regexModule = /^module\s+([^\s(]*)/;

    textBlocks.forEach(textBlock => {
        matches = regexDefine.exec(textBlock.line[0].context);
        if (matches) {
            let symbol = new vscode.DocumentSymbol(
                matches[1], 
                'define',
                vscode.SymbolKind.Constant,
                textBlock.line[0].range,
                textBlock.line[0].range
            );
            symbols.push(symbol);
            return;
        }

        matches = regexInclude.exec(textBlock.line[0].context);
        if (matches) {
            let symbol = new vscode.DocumentSymbol(
                matches[1], 
                'include',
                vscode.SymbolKind.File,
                textBlock.line[0].range,
                textBlock.line[0].range
            );
            symbols.push(symbol);
            return;
        }

        matches = regexModule.exec(textBlock.line[0].context);
        if (matches) {
            let symbol = new vscode.DocumentSymbol(
                matches[1], 
                'module',
                vscode.SymbolKind.Module,
                textBlock.line[0].range,
                textBlock.line[0].range
            );

            // Add the children in the symbol
            parseVerilogA_module(textBlock.line, symbol);
            symbols.push(symbol);
            return;
        }
        
    });

    return symbols;
}

function parseVerilogA_module(textBlock: LineObj[], symbol: vscode.DocumentSymbol) {
    var portSet: Set<string> = new Set<string>();
    var portProperty: { [key: string]: ModulePortObj; } = {};

    var parameterSet: Set<string> = new Set<string>();
    var parameterProperty: { [key: string]: ParameterObj; } = {};

    var variableSet: Set<string> = new Set<string>();
    var variableProperty: { [key: string]: VariableObj; } = {};

    const regexInterface: RegExp = /^(inout|input|output)\s*(\[[^\]]*\])?\s*/;
    const regexInterfaceType: RegExp = /^(voltage|current|electrical)\s*(\[[^\]]*\])?\s*/;
    const regexParameter: RegExp = /^parameter\s*(real|integer)\s*/;
    const regexVariable: RegExp = /^(real|integer|string)\s*/;
    const regexToken: RegExp = /^([^,;]*)[,;]/;
    const regexTokenVector: RegExp = /^([^,;\[]*)\s*(\[[^\]]*\])?[,;]/;
    var matches: RegExpExecArray|null;
    var lineContext: string;
    
    textBlock.forEach(line => {
        // Parse the interface
        matches = regexInterface.exec(line.context);
        if (matches) {
            lineContext = line.context.substring(matches[0].length);
            var portDirection = matches[1];
            var portVector = matches[2];
            do {
                matches = regexToken.exec(lineContext);
                if (matches) {
                    lineContext = lineContext.substring(matches[0].length);
                    var portName = matches[1].trim();

                    // Add the item into the dictionary
                    portSet.add(portName);
                    if (portProperty[portName] == undefined) {
                        portProperty[portName] = new ModulePortObj();
                    }
                    portProperty[portName].interface = new PortObj(portDirection, line.range);
                    if (portVector != undefined) portProperty[portName].interface.vector = portVector;
                }
            } while(matches);
        }

        // Parse the interface type
        matches = regexInterfaceType.exec(line.context);
        if (matches) {
            lineContext = line.context.substring(matches[0].length);
            var portElectricity = matches[1];
            var portVector = matches[2];
            do {
                matches = regexToken.exec(lineContext);
                if (matches) {
                    lineContext = lineContext.substring(matches[0].length);
                    var portName = matches[1].trim();

                    // Add the item into the dictionary
                    portSet.add(portName);
                    if (portProperty[portName] == undefined) {
                        portProperty[portName] = new ModulePortObj();
                    }
                    portProperty[portName].type = new PortObj(portElectricity, line.range);
                    if (portVector != undefined) portProperty[portName].type.vector = portVector;
                }
            } while(matches);
        }

        // Parse the parameter
        matches = regexParameter.exec(line.context);
        if (matches) {
            lineContext = line.context.substring(matches[0].length);
            var parameterType = matches[1];
            do {
                matches = regexToken.exec(lineContext);
                if (matches) {
                    lineContext = lineContext.substring(matches[0].length);
                    var paramName = matches[1].trim();

                    // Add the item into the dictionary
                    parameterSet.add(paramName);
                    if (parameterProperty[paramName] == undefined) {
                        parameterProperty[paramName] = new ParameterObj(parameterType, line.range);
                    }
                }
            } while(matches);
        }

        // Parse the variables
        matches = regexVariable.exec(line.context);
        if (matches) {
            lineContext = line.context.substring(matches[0].length);
            var variableType = matches[1];
            do {
                matches = regexTokenVector.exec(lineContext);
                if (matches) {
                    lineContext = lineContext.substring(matches[0].length);
                    var paramName = matches[1].trim();
                    var paramVector = matches[2];

                    // Add the item into the dictionary
                    variableSet.add(paramName);
                    if (variableProperty[paramName] == undefined) {
                        variableProperty[paramName] = new VariableObj(variableType, line.range);
                    }
                    if (paramVector != undefined) {
                        variableProperty[paramName].vector = paramVector;
                    }
                }
            } while(matches);
        }
    });

    // Create the port outline
    portSet.forEach(portName => {
        let nextSymbol = new vscode.DocumentSymbol(
            portName, 
            portProperty[portName].interface.context,
            vscode.SymbolKind.Interface,
            portProperty[portName].interface.range,
            portProperty[portName].interface.range
        );

        // // Add the type property
        // if (portProperty[portName].type != undefined) {
        //     nextSymbol.children.push(new vscode.DocumentSymbol(
        //         portProperty[portName].type.context, 
        //         '',
        //         vscode.SymbolKind.Function,
        //         portProperty[portName].type.range,
        //         portProperty[portName].type.range
        //     ));
        // }

        // Add the vector property
        if (portProperty[portName].interface.vector != '') {
            nextSymbol.children.push(new vscode.DocumentSymbol(
                portProperty[portName].interface.vector, 
                '',
                vscode.SymbolKind.Class,
                portProperty[portName].interface.range,
                portProperty[portName].interface.range
            ));
        }

        symbol.children.push(nextSymbol);
    });

    // Create the parameter outline
    parameterSet.forEach(parameterName => {
        let nextSymbol = new vscode.DocumentSymbol(
            parameterName, 
            parameterProperty[parameterName].type,
            vscode.SymbolKind.Field,
            parameterProperty[parameterName].range,
            parameterProperty[parameterName].range
        );
        symbol.children.push(nextSymbol);
    });

    // Create the variable outline
    variableSet.forEach(variableName => {
        let nextSymbol = new vscode.DocumentSymbol(
            variableName, 
            variableProperty[variableName].type,
            vscode.SymbolKind.Variable,
            variableProperty[variableName].range,
            variableProperty[variableName].range
        );
        symbol.children.push(nextSymbol);
    });
}

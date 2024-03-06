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
    interface: LineObj;
    type: LineObj;
    vector: LineObj;
}

class ModulePortObj implements IModulePort {
    public interface: LineObj = new LineObj();
    public type: LineObj = new LineObj();
    public vector: LineObj = new LineObj();
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
        return new Promise((resolve, reject) => {
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
    var portName: string;

    const regexInterface: RegExp = /^((inout|input|output)\s*(\[[^\]]*\])?)\s*/;
    const regexToken: RegExp = /^([^,;]*)[,;]/;
    var matches: RegExpExecArray|null;
    var lineContext: string;
    var typeInterface: string;
    var typeVector: string;
    
    textBlock.forEach(line => {
        matches = regexInterface.exec(line.context);
        if (matches) {
            lineContext = line.context.substring(matches[0].length);
            typeInterface = matches[2];
            typeVector = matches[3];
            do {
                matches = regexToken.exec(lineContext);
                if (matches) {
                    // console.log(matches[0]);
                    lineContext = lineContext.substring(matches[0].length);
                    portName = matches[1].trim();

                    // Add the item into the dictionary
                    portSet.add(portName);
                    if (portProperty[portName] == undefined) {
                        portProperty[portName] = new ModulePortObj();
                        portProperty[portName].interface = new LineObj(typeInterface, line.range);
                        if (typeVector != undefined) {
                            portProperty[portName].vector = new LineObj(typeVector, line.range);
                        }
                    }

                    // if (!portList.get(portName)) {
                    //     portList.set(portName, new ModulePortObj)
                    // }
                    // let nextSymbol = new vscode.DocumentSymbol(
                    //     matches[1].trim(), 
                    //     typeInterface,
                    //     vscode.SymbolKind.Interface,
                    //     line.range,
                    //     line.range
                    // );
                    // symbol.children.push(nextSymbol);
                }
            } while(matches);
            matches = regexToken.exec(lineContext);
            if (matches) {
                console.log(matches[0]);
            }
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
        
        if (portProperty[portName].type.context != '') {
            nextSymbol.children.push(new vscode.DocumentSymbol(
                portProperty[portName].type.context, 
                '',
                vscode.SymbolKind.TypeParameter,
                portProperty[portName].type.range,
                portProperty[portName].type.range
            ));
        }

        if (portProperty[portName].vector.context != '') {
            nextSymbol.children.push(new vscode.DocumentSymbol(
                portProperty[portName].vector.context,
                'BUS',
                vscode.SymbolKind.Class,
                portProperty[portName].vector.range,
                portProperty[portName].vector.range
            ));
        }

        symbol.children.push(nextSymbol);
    });
}

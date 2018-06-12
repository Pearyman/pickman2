'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const app_1 = require("./app");
const library_1 = require("./library");
function activate(context) {
    let library = new library_1.default(context);
    let app = new app_1.App();
    app.setConfig();
    let docs = new app_1.ElementDocsContentProvider();
    let completionItemProvider = new app_1.ElementCompletionItemProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider(app_1.SCHEME, docs);
    let completion = vscode.languages.registerCompletionItemProvider(['pug', 'jade', 'vue', 'html'], completionItemProvider, '', ' ', ':', '<', '"', "'", '/', '@', '(');
    let vueLanguageConfig = vscode.languages.setLanguageConfiguration('vue', { wordPattern: app.WORD_REG });
    let pugLanguageConfig = vscode.languages.setLanguageConfiguration('pug', { wordPattern: app.WORD_REG });
    let jadeLanguageConfig = vscode.languages.setLanguageConfiguration('jade', { wordPattern: app.WORD_REG });
    let disposable = vscode.commands.registerCommand('element-helper.searchUnderCursor', () => {
        if (context.workspaceState.get('element-helper.loading', false)) {
            vscode.window.showInformationMessage('Document is initializing, please wait a minute depend on your network.');
            return;
        }
        switch (vscode.window.activeTextEditor.document.languageId) {
            case 'pug':
            case 'jade':
            case 'vue':
            case 'html':
                break;
            default:
                return;
        }
        const selection = app.getSeletedText();
        let items = library.queryAll().map(item => {
            return {
                label: item.tag,
                detail: item.name,
                path: item.path,
                description: item.type
            };
        });
        if (items.length < 1) {
            vscode.window.showInformationMessage('Initializing。。。, please try again.');
            return;
        }
        let find = items.filter(item => item.label === selection);
        if (find.length) {
            app.openDocs({ keyword: find[0].path }, find[0].label);
            return;
        }
        // cant set default value for this method? angry.
        const a = vscode.window.showQuickPick(items).then(selected => {
            selected && app.openDocs({ keyword: selected.path }, selected.label);
        });
    });
    context.subscriptions.push(app, disposable, registration, completion, vueLanguageConfig, pugLanguageConfig, jadeLanguageConfig);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
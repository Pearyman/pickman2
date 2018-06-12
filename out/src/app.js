"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const resource_1 = require("./resource");
const TAGS = require("element-helper-json/element-tags.json");
const ATTRS = require("element-helper-json/element-attributes.json");
const prettyHTML = require('pretty');
const Path = require('path');
const fs = require('fs');
exports.SCHEME = 'element-helper';
;
;
function encodeDocsUri(query) {
    return vscode_1.Uri.parse(`${exports.SCHEME}://search?${JSON.stringify(query)}`);
}
exports.encodeDocsUri = encodeDocsUri;
function decodeDocsUri(uri) {
    return JSON.parse(uri.query);
}
exports.decodeDocsUri = decodeDocsUri;
class App {
    constructor() {
        this.WORD_REG = /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/gi;
    }
    getSeletedText() {
        let editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let selection = editor.selection;
        if (selection.isEmpty) {
            let text = [];
            let range = editor.document.getWordRangeAtPosition(selection.start, this.WORD_REG);
            return editor.document.getText(range);
        }
        else {
            return editor.document.getText(selection);
        }
    }
    setConfig() {
        // https://github.com/Microsoft/vscode/issues/24464
        const config = vscode_1.workspace.getConfiguration('editor');
        const quickSuggestions = config.get('quickSuggestions');
        if (!quickSuggestions["strings"]) {
            config.update("quickSuggestions", { "strings": true }, true);
        }
    }
    openHtml(uri, title) {
        return vscode_1.commands.executeCommand('vscode.previewHtml', uri, vscode_1.ViewColumn.Two, title)
            .then((success) => {
        }, (reason) => {
            vscode_1.window.showErrorMessage(reason);
        });
    }
    openDocs(query, title = 'Element-helper', editor = vscode_1.window.activeTextEditor) {
        this.openHtml(encodeDocsUri(query), title);
    }
    dispose() {
        this._disposable.dispose();
    }
}
exports.App = App;
const HTML_CONTENT = (query) => {
    const filename = Path.join(__dirname, '..', '..', 'package.json');
    const data = fs.readFileSync(filename, 'utf8');
    const content = JSON.parse(data);
    const versions = content.contributes.configuration.properties['element-helper.version']['enum'];
    const lastVersion = versions[versions.length - 1];
    const config = vscode_1.workspace.getConfiguration('element-helper');
    const language = config.get('language');
    const version = config.get('version');
    let versionText = `${version}/`;
    // if (version === lastVersion) {
    //   versionText = '';
    // }
    let opts = ['<select class="docs-version">'];
    let selected = '';
    versions.forEach(item => {
        selected = item === version ? ' selected="selected"' : '';
        // if language is spanish, verison < 2.0 no documents
        if (language === 'es' && item < '2.0') {
        }
        else {
            opts.push(`<option${selected} value ="${item}">${item}</option>`);
        }
    });
    opts.push('</select>');
    const html = opts.join('');
    const path = query.keyword;
    const style = fs.readFileSync(Path.join(resource_1.default.RESOURCE_PATH, 'style.css'), 'utf-8');
    const componentPath = `${versionText}main.html#/${language}/component/${path}`;
    const href = resource_1.default.ELEMENT_HOME_URL + componentPath.replace('main.html', 'index.html');
    const iframeSrc = 'file://' + Path.join(resource_1.default.ELEMENT_PATH, componentPath).split(Path.sep).join('/');
    const notice = ({
        'zh-CN': `版本：${html}，在线示例请在浏览器中<a href="${href}">查看</a>`,
        'en-US': `Version: ${html}, view online examples in <a href="${href}">browser</a>`,
        'es': `Versión: ${html}, ejemplo en línea en la <a href="${href}">vista</a> del navegador`
    })[language];
    return `
    <style type="text/css">${style}</style>
    <body class="element-helper-docs-container">
    <div class="element-helper-move-mask"></div>
    <div class="element-helper-loading-mask">
      <div class="element-helper-loading-spinner">
        <svg viewBox="25 25 50 50" class="circular">
          <circle cx="50" cy="50" r="20" fill="none" class="path"></circle>
        </svg>
      </div>
    </div>
    <div class="docs-notice">${notice}</div>
    <iframe id="docs-frame" src="${iframeSrc}"></iframe>
    <script>
      var iframe = document.querySelector('#docs-frame');
      var link = document.querySelector('.docs-notice a');
      window.addEventListener('message', (e) => {
        e.data.loaded && (document.querySelector('.element-helper-loading-mask').style.display = 'none');
        if(e.data.hash) {
          var pathArr = link.href.split('#');
          pathArr.pop();
          pathArr.push(e.data.hash);
          link.href = pathArr.join('#');
          var srcArr = iframe.src.split('#');
          srcArr.pop();
          srcArr.push(e.data.hash);
          iframe.src = srcArr.join('#');
        }
      }, false);
      document.querySelector('.docs-version').addEventListener('change', function() {
        var version = this.options[this.selectedIndex].value;
        var originalSrc = iframe.src;
        var arr = originalSrc.split(new RegExp('/?[0-9.]*/main.html'));
        iframe.src = arr.join('/' + version + '/main.html');
        link.href = link.href.replace(new RegExp('/?[0-9.]*/index.html'), '/' + version + '/index.html');
      }, false);
    </script>
    </body>`;
};
class ElementDocsContentProvider {
    constructor() {
        this._onDidChange = new vscode_1.EventEmitter();
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    provideTextDocumentContent(uri, token) {
        return HTML_CONTENT(decodeDocsUri(uri));
    }
}
exports.ElementDocsContentProvider = ElementDocsContentProvider;
class ElementCompletionItemProvider {
    constructor() {
        this.tagReg = /<([\w-]+)\s+/g;
        this.attrReg = /(?:\(|\s*)(\w+)=['"][^'"]*/;
        this.tagStartReg = /<([\w-]*)$/;
        this.pugTagStartReg = /^\s*[\w-]*$/;
    }
    getPreTag() {
        let line = this._position.line;
        let tag;
        let txt = this.getTextBeforePosition(this._position);
        while (this._position.line - line < 10 && line >= 0) {
            if (line !== this._position.line) {
                txt = this._document.lineAt(line).text;
            }
            tag = this.matchTag(this.tagReg, txt, line);
            if (tag === 'break')
                return;
            if (tag)
                return tag;
            line--;
        }
        return;
    }
    getPreAttr() {
        let txt = this.getTextBeforePosition(this._position).replace(/"[^'"]*(\s*)[^'"]*$/, '');
        let end = this._position.character;
        let start = txt.lastIndexOf(' ', end) + 1;
        let parsedTxt = this._document.getText(new vscode_1.Range(this._position.line, start, this._position.line, end));
        return this.matchAttr(this.attrReg, parsedTxt);
    }
    matchAttr(reg, txt) {
        let match;
        match = reg.exec(txt);
        return !/"[^"]*"/.test(txt) && match && match[1];
    }
    matchTag(reg, txt, line) {
        let match;
        let arr = [];
        if (/<\/?[-\w]+[^<>]*>[\s\w]*<?\s*[\w-]*$/.test(txt) || (this._position.line === line && (/^\s*[^<]+\s*>[^<\/>]*$/.test(txt) || /[^<>]*<$/.test(txt[txt.length - 1])))) {
            return 'break';
        }
        while ((match = reg.exec(txt))) {
            arr.push({
                text: match[1],
                offset: this._document.offsetAt(new vscode_1.Position(line, match.index))
            });
        }
        return arr.pop();
    }
    getTextBeforePosition(position) {
        var start = new vscode_1.Position(position.line, 0);
        var range = new vscode_1.Range(start, position);
        return this._document.getText(range);
    }
    getTagSuggestion() {
        let suggestions = [];
        let id = 100;
        for (let tag in TAGS) {
            suggestions.push(this.buildTagSuggestion(tag, TAGS[tag], id));
            id++;
        }
        return suggestions;
    }
    getAttrValueSuggestion(tag, attr) {
        let suggestions = [];
        const values = this.getAttrValues(tag, attr);
        values.forEach(value => {
            suggestions.push({
                label: value,
                kind: vscode_1.CompletionItemKind.Value
            });
        });
        return suggestions;
    }
    getAttrSuggestion(tag) {
        let suggestions = [];
        let tagAttrs = this.getTagAttrs(tag);
        let preText = this.getTextBeforePosition(this._position);
        let prefix = preText.replace(/['"]([^'"]*)['"]$/, '').split(/\s|\(+/).pop();
        // method attribute
        const method = prefix[0] === '@';
        // bind attribute
        const bind = prefix[0] === ':';
        prefix = prefix.replace(/[:@]/, '');
        if (/[^@:a-zA-z\s]/.test(prefix[0])) {
            return suggestions;
        }
        tagAttrs.forEach(attr => {
            const attrItem = this.getAttrItem(tag, attr);
            if (attrItem && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
                const sug = this.buildAttrSuggestion({ attr, tag, bind, method }, attrItem);
                sug && suggestions.push(sug);
            }
        });
        for (let attr in ATTRS) {
            const attrItem = this.getAttrItem(tag, attr);
            if (attrItem && attrItem.global && (!prefix.trim() || this.firstCharsEqual(attr, prefix))) {
                const sug = this.buildAttrSuggestion({ attr, tag: null, bind, method }, attrItem);
                sug && suggestions.push(sug);
            }
        }
        return suggestions;
    }
    buildTagSuggestion(tag, tagVal, id) {
        const snippets = [];
        let index = 0;
        let that = this;
        function build(tag, { subtags, defaults }, snippets) {
            let attrs = '';
            defaults && defaults.forEach((item, i) => {
                attrs += ` ${item}=${that.quotes}$${index + i + 1}${that.quotes}`;
            });
            snippets.push(`${index > 0 ? '<' : ''}${tag}${attrs}>`);
            index++;
            subtags && subtags.forEach(item => build(item, TAGS[item], snippets));
            snippets.push(`</${tag}>`);
        }
        ;
        build(tag, tagVal, snippets);
        return {
            label: tag,
            sortText: `0${id}${tag}`,
            insertText: new vscode_1.SnippetString(prettyHTML('<' + snippets.join(''), { indent_size: this.size }).substr(1)),
            kind: vscode_1.CompletionItemKind.Snippet,
            detail: `element-ui ${tagVal.version ? `(version: ${tagVal.version})` : ''}`,
            documentation: tagVal.description
        };
    }
    buildAttrSuggestion({ attr, tag, bind, method }, { description, type, version }) {
        if ((method && type === "method") || (bind && type !== "method") || (!method && !bind)) {
            return {
                label: attr,
                insertText: (type && (type === 'flag')) ? `${attr} ` : new vscode_1.SnippetString(`${attr}=${this.quotes}$1${this.quotes}$0`),
                kind: (type && (type === 'method')) ? vscode_1.CompletionItemKind.Method : vscode_1.CompletionItemKind.Property,
                detail: tag ? `<${tag}> ${version ? `(version: ${version})` : ''}` : `element-ui ${version ? `(version: ${version})` : ''}`,
                documentation: description
            };
        }
        else {
            return;
        }
    }
    getAttrValues(tag, attr) {
        let attrItem = this.getAttrItem(tag, attr);
        let options = attrItem && attrItem.options;
        if (!options && attrItem) {
            if (attrItem.type === 'boolean') {
                options = ['true', 'false'];
            }
            else if (attrItem.type === 'icon') {
                options = ATTRS['icons'];
            }
            else if (attrItem.type === 'shortcut-icon') {
                options = [];
                ATTRS['icons'].forEach(icon => {
                    options.push(icon.replace(/^el-icon-/, ''));
                });
            }
        }
        return options || [];
    }
    getTagAttrs(tag) {
        return (TAGS[tag] && TAGS[tag].attributes) || [];
    }
    getAttrItem(tag, attr) {
        return ATTRS[`${tag}/${attr}`] || ATTRS[attr];
    }
    isAttrValueStart(tag, attr) {
        return tag && attr;
    }
    isAttrStart(tag) {
        return tag;
    }
    isTagStart() {
        let txt = this.getTextBeforePosition(this._position);
        return this.isPug() ? this.pugTagStartReg.test(txt) : this.tagStartReg.test(txt);
    }
    firstCharsEqual(str1, str2) {
        if (str2 && str1) {
            return str1[0].toLowerCase() === str2[0].toLowerCase();
        }
        return false;
    }
    // tentative plan for vue file
    notInTemplate() {
        let line = this._position.line;
        while (line) {
            if (/^\s*<script.*>\s*$/.test(this._document.lineAt(line).text)) {
                return true;
            }
            line--;
        }
        return false;
    }
    provideCompletionItems(document, position, token) {
        this._document = document;
        this._position = position;
        const config = vscode_1.workspace.getConfiguration('element-helper');
        this.size = config.get('indent-size');
        const normalQuotes = config.get('quotes') === 'double' ? '"' : "'";
        const pugQuotes = config.get('pug-quotes') === 'double' ? '"' : "'";
        this.quotes = this.isPug() ? pugQuotes : normalQuotes;
        let tag = this.isPug() ? this.getPugTag() : this.getPreTag();
        let attr = this.getPreAttr();
        if (this.isAttrValueStart(tag, attr)) {
            return this.getAttrValueSuggestion(tag.text, attr);
        }
        else if (this.isAttrStart(tag)) {
            return this.getAttrSuggestion(tag.text);
        }
        else if (this.isTagStart()) {
            switch (document.languageId) {
                case 'jade':
                case 'pug':
                    return this.getPugTagSuggestion();
                case 'vue':
                    if (this.isPug()) {
                        return this.getPugTagSuggestion();
                    }
                    return this.notInTemplate() ? [] : this.getTagSuggestion();
                case 'html':
                    // todo
                    return this.getTagSuggestion();
            }
        }
        else {
            return [];
        }
    }
    isPug() {
        if (['pug', 'jade'].includes(this._document.languageId)) {
            return true;
        }
        else {
            var range = new vscode_1.Range(new vscode_1.Position(0, 0), this._position);
            let txt = this._document.getText(range);
            return /<template[^>]*\s+lang=['"](jade|pug)['"].*/.test(txt);
        }
    }
    getPugTagSuggestion() {
        let suggestions = [];
        for (let tag in TAGS) {
            suggestions.push(this.buildPugTagSuggestion(tag, TAGS[tag]));
        }
        return suggestions;
    }
    buildPugTagSuggestion(tag, tagVal) {
        const snippets = [];
        let index = 0;
        let that = this;
        function build(tag, { subtags, defaults }, snippets) {
            let attrs = [];
            defaults && defaults.forEach((item, i) => {
                attrs.push(`${item}=${that.quotes}$${index + i + 1}${that.quotes}`);
            });
            snippets.push(`${' '.repeat(index * that.size)}${tag}(${attrs.join(' ')})`);
            index++;
            subtags && subtags.forEach(item => build(item, TAGS[item], snippets));
        }
        ;
        build(tag, tagVal, snippets);
        return {
            label: tag,
            insertText: new vscode_1.SnippetString(snippets.join('\n')),
            kind: vscode_1.CompletionItemKind.Snippet,
            detail: 'element-ui',
            documentation: tagVal.description
        };
    }
    getPugTag() {
        let line = this._position.line;
        let tag;
        let txt = '';
        while (this._position.line - line < 10 && line >= 0) {
            txt = this._document.lineAt(line).text;
            let match = /^\s*([\w-]+)[.#-\w]*\(/.exec(txt);
            if (match) {
                return {
                    text: match[1],
                    offset: this._document.offsetAt(new vscode_1.Position(line, match.index))
                };
            }
            line--;
        }
        return;
    }
}
exports.ElementCompletionItemProvider = ElementCompletionItemProvider;
//# sourceMappingURL=app.js.map
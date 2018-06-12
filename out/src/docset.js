'use babel';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require('path');
const resource_1 = require("./resource");
const vscode_1 = require("vscode");
class DocSet {
    constructor(item) {
        this.id_ = item.type;
        this.indexPath = this.id_ + '/index.json';
        this.index_ = null;
        this.language_ = vscode_1.workspace.getConfiguration('element-helper').get('language');
        this.getMemu();
    }
    getMemu() {
        resource_1.default.get(Path.join(resource_1.default.RESOURCE_PATH, this.indexPath))
            .then((result) => {
            this.index_ = JSON.parse(result);
            for (var i = 0; i < this.index_.entries.length; ++i) {
                this.index_.entries[i].id = this.id_;
            }
        });
    }
    getTitle(path) {
        for (let i = 0; i < this.index_.entries.length; ++i) {
            if (this.index_.entries[i].path == path) {
                return this.language_ === 'zh-CN' ? this.index_.entries[i].name : this.index_.entries[i].name.split(' ').shift();
            }
        }
        return '';
    }
    queryAll() {
        return !this.index_ ? [] : this.index_.entries;
    }
}
exports.default = DocSet;
//# sourceMappingURL=docset.js.map
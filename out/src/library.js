'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const Path = require('path');
const os = require('os');
const docset_1 = require("./docset");
const resource_1 = require("./resource");
const shelljs_1 = require("shelljs");
const vscode_1 = require("vscode");
class Library {
    constructor(context) {
        this.catalog = null;
        this.context = context;
        this.fetchRepo();
        this.cmd = '';
        setInterval(() => { this.fetchAllVersion(this.repos); }, Library.REFRESH_PERIOD_MS_);
    }
    // id: type
    get(id) {
        return this.catalog[id];
    }
    queryAll() {
        let ret = [];
        for (const id in this.catalog) {
            ret = ret.concat(this.catalog[id].queryAll());
        }
        return ret;
    }
    fetchRepo() {
        return resource_1.default.get(Path.join(resource_1.default.RESOURCE_PATH, resource_1.default.RESOURCE_REPO))
            .then((result) => {
            this.repos = JSON.parse(result);
            this.buildCatalog(this.repos);
            this.fetchAllVersion(this.repos);
        }).catch(error => {
            console.log('fetchRepo error: ', error);
        });
    }
    fetchAllVersion(repos) {
        shelljs_1.cd(`${resource_1.default.RESOURCE_PATH}/..`);
        shelljs_1.exec('npm update element-helper-json --save', { async: true });
        for (let i = 0; i < repos.length; ++i) {
            let repo = repos[i];
            this.fetchVersion(repo);
        }
    }
    setVersionSchema(versions) {
        const config = vscode_1.workspace.getConfiguration('element-helper');
        const filename = Path.join(__dirname, '..', '..', 'package.json');
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                console.error('ReadFail');
                return;
            }
            ;
            const content = JSON.parse(data);
            content.contributes.configuration.properties['element-helper.version']['enum'] = versions;
            config.update('version', versions[versions.length - 1], true);
            fs.writeFileSync(filename, JSON.stringify(content, null, 2));
        });
    }
    fetchVersion(repo) {
        resource_1.default.get(Path.join(resource_1.default.ELEMENT_PATH, 'versions.json')).then((local) => {
            resource_1.default.getFromUrl(resource_1.default.ELEMENT_VERSION_URL)
                .then((online) => {
                const oldVersions = this.getValues(JSON.parse(local));
                const newVersions = this.getValues(JSON.parse(online));
                if (!this.isSame(JSON.parse(local), JSON.parse(online))) {
                    shelljs_1.cd(`${resource_1.default.RESOURCE_PATH}/..`);
                    shelljs_1.exec('npm update element-gh-pages --save', (error, stdout, stderr) => {
                        if (error) {
                            return;
                        }
                        const versionsStr = fs.readFileSync(Path.join(resource_1.default.ELEMENT_PATH, 'versions.json'), 'utf8');
                        if (!this.isSame(JSON.parse(local), JSON.parse(versionsStr))) {
                            this.setVersionSchema(newVersions);
                            vscode_1.window.showInformationMessage(`${repo.name} version updated to lasted version`);
                        }
                        resource_1.default.updateResource();
                    });
                }
                else {
                    if (!fs.existsSync(Path.join(resource_1.default.ELEMENT_PATH, 'main.html'))) {
                        resource_1.default.updateResource();
                    }
                }
            });
        });
    }
    isSame(local, online) {
        for (let key in online) {
            if (!local[key]) {
                return false;
            }
        }
        return true;
    }
    setLoading(value) {
        this.context.workspaceState.update('element-helper.loading', value);
    }
    getValues(obj) {
        let values = [];
        for (let key in obj) {
            values.push(obj[key]);
        }
        return values;
    }
    buildCatalog(repos) {
        const catalog = {};
        for (let i = 0; i < repos.length; ++i) {
            const repo = repos[i];
            catalog[repo.type] = new docset_1.default(repo);
        }
        this.catalog = catalog;
    }
}
Library.REFRESH_PERIOD_MS_ = 2 * 60 * 60 * 1000;
Library.DEFAULT_DOCSETS = new Set([
    'element'
]);
exports.default = Library;
//# sourceMappingURL=library.js.map
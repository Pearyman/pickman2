'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = require("shelljs");
const fs = require('fs');
const Path = require('path');
const cheerio = require("cheerio");
const http = require('http');
class Resource {
    static get(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err)
                    reject('ReadFail');
                resolve(data);
            });
        });
    }
    static getFromUrl(url, filename) {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                const { statusCode } = res;
                let error;
                if (statusCode !== 200) {
                    error = new Error(`Request failure, status code: ${statusCode}`);
                }
                if (error) {
                    res.resume();
                    return reject(error.message);
                }
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => resolve(rawData));
            }).on('error', (e) => {
                reject(`error: ${e.message}`);
            });
        }).then(result => {
            if (filename) {
                shelljs_1.mkdir('-p', Path.dirname(filename));
                fs.writeFileSync(filename, result);
            }
            return result;
        }).catch(error => Promise.reject(error));
    }
    static fixResource(file, vs) {
        const htmlPath = Path.join(Resource.ELEMENT_PATH, file);
        Resource.get(htmlPath)
            .then((content) => {
            const matched = [];
            content = content.replace(Resource.URL_REG, (match, one, two, three) => {
                const name = Path.basename(three);
                const url = `http:${three}`;
                Resource.getFromUrl(url, Path.join(Path.dirname(htmlPath), name)).catch(error => {
                    // one more again
                    Resource.getFromUrl(url, Path.join(Path.dirname(htmlPath), name));
                });
                return `${one}${two}${name}${two}`;
            });
            let $ = cheerio.load(content);
            const jqScript = $(`<script type="text/javascript" src="${Path.join(Resource.RESOURCE_PATH, '../node_modules/jquery/dist/jquery.min.js')}"></script>`);
            const fixScript = $(`<script type="text/javascript" src="${Path.join(Resource.RESOURCE_PATH, 'element', `fix${vs}.js`)}"></script>`);
            const style = $(`<link href="${Path.join(Resource.RESOURCE_PATH, 'element', 'style.css')}" rel="stylesheet">`);
            $('body').append(jqScript).append(fixScript);
            $('head').append(style);
            const indexPath = Path.join(Resource.ELEMENT_PATH, file);
            const dir = Path.dirname(indexPath);
            fs.writeFileSync(Path.join(dir, 'main.html'), $.html());
            return content;
        });
    }
    static updateResource() {
        fs.readdir(Resource.ELEMENT_PATH, (err, files) => {
            if (err) {
                return;
            }
            for (let i = 0; i < files.length; ++i) {
                const status = fs.lstatSync(Path.join(Resource.ELEMENT_PATH, files[i]));
                if (status.isFile() && /index.html$/.test(files[i])) { // index.html entry
                    Resource.fixResource(files[i], 2);
                }
                else if (status.isDirectory() && /^\d+\./.test(files[i])) { // version directory
                    Resource.fixResource(Path.join(files[i], 'index.html'), files[i].split('.')[0] || 1);
                }
                else {
                    continue;
                }
            }
        });
    }
}
// resources local path
Resource.RESOURCE_PATH = Path.join(__dirname, '..', '..', 'resources');
Resource.ELEMENT_PATH = Path.join(__dirname, '..', '..', 'node_modules', 'element-gh-pages');
Resource.URL_REG = /((?:src|href)\s*=\s*)(['"])(\/\/[^'"]*)\2/g;
Resource.ELEMENT_VERSION_URL = 'http://element.eleme.io/versions.json';
Resource.ELEMENT_HOME_URL = 'http://element.eleme.io/';
Resource.RESOURCE_REPO = 'repos.json';
exports.default = Resource;
//# sourceMappingURL=resource.js.map
# VSCode-Element-Helper

> VSCode-Element-Helper is a VS Code extension for Element-UI. If you use ATOM editor, please go to [ATOM version](https://github.com/ElemeFE/element-helper)

Element-UI is a great library. More and more projects use it. So, For helping developer write more efficient by Element-UI, VSCode-Element-Helper is born.

## Feature

* Document

* Autocomplete

	support vue, html and jade/pug language

* Snippets


## Document

### Usage

1 - Move cursor to Element-UI tag or select it

2 - Press default hot key `ctrl + cmd + z`(windows: `ctrl + win + z`) or 
    Press ⇧⌘P to bring up the Command Palette and then input `element-helper.search`

3 - Show document view If complete matching,
    or you should select tag you want to search

4 - Enter and trigger document browser

![document](https://user-images.githubusercontent.com/1659577/27990775-4b7db888-6494-11e7-9b27-3ec7fa5f99b7.gif)

### Version, Quotes, Indentation size and Language Switching

1 - Enter `Preferences` -> `setting` or shortcut `cmd` + `,`

2 - Modify language, version or indentation size
```javascript
  "element-helper.language": "zh-CN",
  "element-helper.version": "1.3",
  "element-helper.indent-size": 2,
  "element-helper.quotes": "double",    // html vue qoutes
  "element-helper.pug-quotes": "single" // jade/pug quotes
```

### Auto Update Mechanism

Document is off-line and auto synchronize with Element-UI official site.

### Keymap

Default hot key is  `ctrl + cmd + z`( windows: `ctrl + win + z`). If it has conflicted with other software's hot key. You can customize it. see [keybindings](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-editor)


## Autocomplete

![autocomplete](https://user-images.githubusercontent.com/1659577/27990774-4b7b3662-6494-11e7-83a4-9e6ed3ef698a.gif)

* Distinguish and auto complete property and method for every Element-UI tag

* Prompt value when value is some special type like Boolean or ICON.


## Snippets

![snippets](https://user-images.githubusercontent.com/1659577/27990776-4b9386f4-6494-11e7-9c08-596a13afd706.gif)

Support snippets list:

* `msg`

  ```
  this.$message({
    message: '',
    type: ''
  })
  ```

* `alert`

  ```
  this.$alert('', '', {
    confirmButtonText: '',
    callback: () => {}
  });
  ```

* `confirm`

  ```
  this.$confirm('', '', {
    confirmButtonText: '',
    cancelButtonText: '',
    type: ''
  }).then(() => {})
    .catch(() => {});
  ```

* `prompt`

  ```
  this.$prompt('', '', {
    confirmButtonText: '',
    cancelButtonText: '',
    inputPattern: //,
    inputErrorMessage: ''
  }).then(({ value }) => {})
    .catch(() => {});
  ```

* `msgb`

  ```
  this.$msgbox({
    title: '',
    message: '',
    showCancelButton: '',
    confirmButtonText: '',
    cancelButtonText: '',
    beforeClose: (action, instance, done) => {}
  }).then(action => {});
  ```

* `notify`

  ```
  this.$notify({
    title: '',
    message: ''
  });
  ```

## Contribution

Your pull request will make VSCode-Element-Helper better.

## LICENSE

MIT

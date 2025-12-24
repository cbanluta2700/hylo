# VS Code settings.json Comprehensive Reference Guide

A complete reference for all available configurations in VS Code's `settings.json` file, organized by logical categories with detailed specifications.

---

## Table of Contents

1. [Settings Fundamentals](#settings-fundamentals)
2. [Editor Behavior and Appearance](#editor-behavior-and-appearance)
3. [Language-specific Settings](#language-specific-settings)
4. [Extension Configurations](#extension-configurations)
5. [Workspace and File Management](#workspace-and-file-management)
6. [Debugging and Testing](#debugging-and-testing)
7. [Version Control Integration](#version-control-integration)
8. [Terminal Customization](#terminal-customization)
9. [Accessibility Options](#accessibility-options)
10. [Special Considerations](#special-considerations)

---

## Settings Fundamentals

### Settings Precedence

VS Code settings follow a hierarchical precedence system (highest to lowest priority):

1. **Workspace Folder Settings** (`.vscode/settings.json` in workspace folder)
2. **Workspace Settings** (`.code-workspace` file)
3. **Remote Settings** (when connected to remote)
4. **User Settings** (`settings.json` in user data directory)
5. **Default Settings** (built-in VS Code defaults)

### Settings File Locations

| Platform | User Settings Path |
|----------|-------------------|
| **Windows** | `%APPDATA%\Code\User\settings.json` |
| **macOS** | `$HOME/Library/Application Support/Code/User/settings.json` |
| **Linux** | `$HOME/.config/Code/User/settings.json` |

### Platform-Specific Overrides

```json
{
  "editor.fontSize": 14,
  "[windows]": {
    "editor.fontSize": 12
  },
  "[linux]": {
    "editor.fontSize": 14
  },
  "[macos]": {
    "editor.fontSize": 13
  }
}
```

---

## Editor Behavior and Appearance

### Core Editor Settings

#### `editor.fontSize`

| Property | Value |
|----------|-------|
| **Type** | `number` |
| **Default** | `14` |
| **Min/Max** | `6` / `100` |
| **Description** | Controls the font size in pixels for the editor |
| **Affects** | Editor text rendering, minimap scaling |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Recommended Values:**
- Standard displays: `14`
- High DPI displays: `12-13`
- Accessibility needs: `16-20`

**Performance Note:** Larger font sizes may slightly increase memory usage for rendering.

```json
{
  "editor.fontSize": 14
}
```

---

#### `editor.fontFamily`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"Consolas, 'Courier New', monospace"` (Windows) |
| **Description** | Controls the font family for the editor |
| **Dependencies** | Font must be installed on system |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Popular Programming Fonts:**
- `"Fira Code"` - Supports ligatures
- `"JetBrains Mono"` - Excellent readability
- `"Cascadia Code"` - Microsoft's coding font
- `"Source Code Pro"` - Adobe's monospace font

**Platform-Specific Defaults:**
```json
{
  "[windows]": {
    "editor.fontFamily": "Consolas, 'Courier New', monospace"
  },
  "[macos]": {
    "editor.fontFamily": "Menlo, Monaco, 'Courier New', monospace"
  },
  "[linux]": {
    "editor.fontFamily": "'Droid Sans Mono', 'monospace', monospace"
  }
}
```

---

#### `editor.fontLigatures`

| Property | Value |
|----------|-------|
| **Type** | `boolean` or `string` |
| **Default** | `false` |
| **Description** | Enables/disables font ligatures |
| **Dependencies** | Requires ligature-supporting font (e.g., Fira Code) |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Valid Values:**
- `false` - Disable ligatures
- `true` - Enable default ligatures
- `"'calt', 'liga'"` - Enable specific OpenType features

```json
{
  "editor.fontFamily": "Fira Code",
  "editor.fontLigatures": true
}
```

---

#### `editor.tabSize`

| Property | Value |
|----------|-------|
| **Type** | `number` |
| **Default** | `4` |
| **Description** | The number of spaces a tab is equal to |
| **Related Settings** | `editor.insertSpaces`, `editor.detectIndentation` |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Common Configurations by Language:**
```json
{
  "[javascript]": { "editor.tabSize": 2 },
  "[typescript]": { "editor.tabSize": 2 },
  "[python]": { "editor.tabSize": 4 },
  "[go]": { "editor.tabSize": 4 }
}
```

---

#### `editor.insertSpaces`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Insert spaces when pressing Tab |
| **Related Settings** | `editor.tabSize`, `editor.detectIndentation` |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Common Pitfall:** When `editor.detectIndentation` is `true`, this setting may be overridden based on file content.

```json
{
  "editor.insertSpaces": true,
  "editor.detectIndentation": false
}
```

---

#### `editor.wordWrap`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"off"` |
| **Valid Values** | `"off"`, `"on"`, `"wordWrapColumn"`, `"bounded"` |
| **Description** | Controls how lines should wrap |
| **Related Settings** | `editor.wordWrapColumn` |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Value Descriptions:**
- `"off"` - Lines will never wrap
- `"on"` - Lines wrap at viewport width
- `"wordWrapColumn"` - Lines wrap at `editor.wordWrapColumn`
- `"bounded"` - Lines wrap at minimum of viewport and `editor.wordWrapColumn`

```json
{
  "editor.wordWrap": "on",
  "editor.wordWrapColumn": 120
}
```

---

#### `editor.minimap.enabled`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Controls whether the minimap is shown |
| **Performance Impact** | Disabling can improve performance on large files |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Related Minimap Settings:**
```json
{
  "editor.minimap.enabled": true,
  "editor.minimap.maxColumn": 120,
  "editor.minimap.renderCharacters": true,
  "editor.minimap.scale": 1,
  "editor.minimap.side": "right",
  "editor.minimap.showSlider": "mouseover"
}
```

---

#### `editor.cursorStyle`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"line"` |
| **Valid Values** | `"line"`, `"block"`, `"underline"`, `"line-thin"`, `"block-outline"`, `"underline-thin"` |
| **Description** | Controls the cursor style |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

```json
{
  "editor.cursorStyle": "line",
  "editor.cursorBlinking": "blink",
  "editor.cursorWidth": 2
}
```

---

#### `editor.cursorBlinking`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"blink"` |
| **Valid Values** | `"blink"`, `"smooth"`, `"phase"`, `"expand"`, `"solid"` |
| **Description** | Controls the cursor animation style |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

---

#### `editor.lineNumbers`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"on"` |
| **Valid Values** | `"off"`, `"on"`, `"relative"`, `"interval"` |
| **Description** | Controls the display of line numbers |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Use Cases:**
- `"relative"` - Useful for Vim users
- `"interval"` - Shows line numbers every 10 lines

```json
{
  "editor.lineNumbers": "on"
}
```

---

#### `editor.renderWhitespace`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"selection"` |
| **Valid Values** | `"none"`, `"boundary"`, `"selection"`, `"trailing"`, `"all"` |
| **Description** | Controls how whitespace characters are rendered |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

**Recommended:** `"boundary"` or `"trailing"` for catching whitespace issues.

```json
{
  "editor.renderWhitespace": "boundary"
}
```

---

#### `editor.formatOnSave`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Format a file on save |
| **Dependencies** | Requires a formatter for the file type |
| **Related Settings** | `editor.formatOnSaveMode`, `editor.defaultFormatter` |
| **Documentation** | [VS Code Formatting](https://code.visualstudio.com/docs/editor/codebasics#_formatting) |

**Common Pitfall:** May conflict with other save actions. Use `editor.codeActionsOnSave` for more control.

```json
{
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file",
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

#### `editor.formatOnPaste`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Format pasted content |
| **Dependencies** | Requires a formatter for the file type |
| **Documentation** | [VS Code Formatting](https://code.visualstudio.com/docs/editor/codebasics#_formatting) |

---

#### `editor.formatOnType`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Format the line after typing |
| **Dependencies** | Requires formatter support for on-type formatting |
| **Documentation** | [VS Code Formatting](https://code.visualstudio.com/docs/editor/codebasics#_formatting) |

---

#### `editor.defaultFormatter`

| Property | Value |
|----------|-------|
| **Type** | `string` or `null` |
| **Default** | `null` |
| **Description** | Default formatter for files |
| **Value Format** | `"publisher.extensionId"` |
| **Documentation** | [VS Code Formatting](https://code.visualstudio.com/docs/editor/codebasics#_formatting) |

**Popular Formatters:**
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  },
  "[go]": {
    "editor.defaultFormatter": "golang.go"
  },
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  }
}
```

---

#### `editor.codeActionsOnSave`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | `{}` |
| **Description** | Code actions to run on save |
| **Min Version** | VS Code 1.44+ |
| **Documentation** | [VS Code Code Actions](https://code.visualstudio.com/docs/editor/refactoring#_code-actions-on-save) |

**Common Code Actions:**
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit",
    "source.addMissingImports": "explicit"
  }
}
```

**Valid Values for Each Action:**
- `"explicit"` - Run only when explicitly requested
- `"always"` - Always run on save
- `"never"` - Never run
- `true` / `false` - Legacy boolean values (deprecated)

---

#### `editor.autoSave`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"off"` |
| **Valid Values** | `"off"`, `"afterDelay"`, `"onFocusChange"`, `"onWindowChange"` |
| **Description** | Controls auto save of editors |
| **Related Settings** | `files.autoSaveDelay` |
| **Documentation** | [VS Code Auto Save](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save) |

```json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

---

#### `editor.suggestSelection`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"first"` |
| **Valid Values** | `"first"`, `"recentlyUsed"`, `"recentlyUsedByPrefix"` |
| **Description** | Controls how suggestions are pre-selected |
| **Documentation** | [VS Code IntelliSense](https://code.visualstudio.com/docs/editor/intellisense) |

---

#### `editor.quickSuggestions`

| Property | Value |
|----------|-------|
| **Type** | `object` or `boolean` |
| **Default** | `{"other": "on", "comments": "off", "strings": "off"}` |
| **Description** | Controls typing-triggered suggestions |
| **Documentation** | [VS Code IntelliSense](https://code.visualstudio.com/docs/editor/intellisense) |

```json
{
  "editor.quickSuggestions": {
    "other": "on",
    "comments": "off",
    "strings": "on"
  }
}
```

---

#### `editor.snippetSuggestions`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"inline"` |
| **Valid Values** | `"top"`, `"bottom"`, `"inline"`, `"none"` |
| **Description** | Controls snippet suggestion position |
| **Documentation** | [VS Code Snippets](https://code.visualstudio.com/docs/editor/userdefinedsnippets) |

---

#### `editor.inlineSuggest.enabled`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Enable inline suggestions (GitHub Copilot, etc.) |
| **Min Version** | VS Code 1.57+ |
| **Documentation** | [VS Code IntelliSense](https://code.visualstudio.com/docs/editor/intellisense) |

```json
{
  "editor.inlineSuggest.enabled": true,
  "editor.inlineSuggest.showToolbar": "onHover"
}
```

---

#### `editor.bracketPairColorization.enabled`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Enable bracket pair colorization |
| **Min Version** | VS Code 1.60+ (native) |
| **Documentation** | [VS Code Editor Settings](https://code.visualstudio.com/docs/getstarted/settings) |

```json
{
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active"
}
```

---

#### `editor.stickyScroll.enabled`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Shows nested current scopes during scroll |
| **Min Version** | VS Code 1.70+ |
| **Performance Impact** | May impact performance on very large files |
| **Documentation** | [VS Code Sticky Scroll](https://code.visualstudio.com/docs/getstarted/settings) |

```json
{
  "editor.stickyScroll.enabled": true,
  "editor.stickyScroll.maxLineCount": 5
}
```

---

### Theme and Color Settings

#### `workbench.colorTheme`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"Default Dark Modern"` |
| **Description** | Specifies the color theme |
| **Documentation** | [VS Code Themes](https://code.visualstudio.com/docs/getstarted/themes) |

**Popular Themes:**
- `"One Dark Pro"`
- `"Dracula"`
- `"GitHub Dark"`
- `"Monokai Pro"`
- `"Nord"`

```json
{
  "workbench.colorTheme": "One Dark Pro"
}
```

---

#### `workbench.iconTheme`

| Property | Value |
|----------|-------|
| **Type** | `string` or `null` |
| **Default** | `"vs-seti"` |
| **Description** | Specifies the file icon theme |
| **Documentation** | [VS Code Themes](https://code.visualstudio.com/docs/getstarted/themes) |

**Popular Icon Themes:**
- `"material-icon-theme"`
- `"vscode-icons"`
- `"file-icons"`

```json
{
  "workbench.iconTheme": "material-icon-theme"
}
```

---

#### `workbench.colorCustomizations`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | `{}` |
| **Description** | Override colors for current theme |
| **Documentation** | [VS Code Theme Color Reference](https://code.visualstudio.com/api/references/theme-color) |

```json
{
  "workbench.colorCustomizations": {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "activityBar.background": "#252526",
    "sideBar.background": "#252526",
    "statusBar.background": "#007acc",
    "[One Dark Pro]": {
      "editor.background": "#21252b"
    }
  }
}
```

---

#### `editor.tokenColorCustomizations`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | `{}` |
| **Description** | Override syntax colors for current theme |
| **Documentation** | [VS Code Syntax Highlighting](https://code.visualstudio.com/docs/getstarted/themes#_customizing-a-color-theme) |

```json
{
  "editor.tokenColorCustomizations": {
    "comments": "#6A9955",
    "keywords": "#569cd6",
    "strings": "#ce9178",
    "textMateRules": [
      {
        "scope": "comment",
        "settings": {
          "fontStyle": "italic"
        }
      }
    ]
  }
}
```

---

## Language-specific Settings

### Language Identifier Format

Language-specific settings use the format `[languageId]`:

```json
{
  "[javascript]": {
    "editor.tabSize": 2,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.tabSize": 2,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.tabSize": 4,
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

### Common Language Identifiers

| Language | Identifier |
|----------|------------|
| JavaScript | `javascript` |
| TypeScript | `typescript` |
| JSX | `javascriptreact` |
| TSX | `typescriptreact` |
| Python | `python` |
| Go | `go` |
| Rust | `rust` |
| C++ | `cpp` |
| C# | `csharp` |
| Java | `java` |
| HTML | `html` |
| CSS | `css` |
| SCSS | `scss` |
| JSON | `json` |
| JSONC | `jsonc` |
| Markdown | `markdown` |
| YAML | `yaml` |
| Shell Script | `shellscript` |

### TypeScript/JavaScript Settings

#### `typescript.preferences.importModuleSpecifier`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"shortest"` |
| **Valid Values** | `"shortest"`, `"relative"`, `"non-relative"`, `"project-relative"` |
| **Description** | Preferred path style for auto imports |
| **Documentation** | [VS Code TypeScript](https://code.visualstudio.com/docs/typescript/typescript-compiling) |

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.preferences.importModuleSpecifier": "relative"
}
```

---

#### `typescript.updateImportsOnFileMove.enabled`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"prompt"` |
| **Valid Values** | `"prompt"`, `"always"`, `"never"` |
| **Description** | Update imports when files are moved |
| **Documentation** | [VS Code TypeScript](https://code.visualstudio.com/docs/typescript/typescript-compiling) |

```json
{
  "typescript.updateImportsOnFileMove.enabled": "always",
  "javascript.updateImportsOnFileMove.enabled": "always"
}
```

---

#### `typescript.suggest.autoImports`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Enable auto import suggestions |
| **Documentation** | [VS Code TypeScript](https://code.visualstudio.com/docs/typescript/typescript-compiling) |

---

#### `typescript.inlayHints.parameterNames.enabled`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"none"` |
| **Valid Values** | `"none"`, `"literals"`, `"all"` |
| **Description** | Enable inlay hints for parameter names |
| **Min Version** | VS Code 1.60+ |
| **Documentation** | [VS Code Inlay Hints](https://code.visualstudio.com/docs/editor/editingevolved#_inlay-hints) |

```json
{
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.parameterTypes.enabled": true,
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.propertyDeclarationTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true
}
```

---

### Python Settings

#### `python.defaultInterpreterPath`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"python"` |
| **Description** | Path to the default Python interpreter |
| **Dependencies** | Python extension (`ms-python.python`) |
| **Documentation** | [VS Code Python](https://code.visualstudio.com/docs/python/environments) |

```json
{
  "python.defaultInterpreterPath": "/usr/bin/python3"
}
```

---

#### `python.analysis.typeCheckingMode`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"off"` |
| **Valid Values** | `"off"`, `"basic"`, `"standard"`, `"strict"` |
| **Description** | Type checking level for Pylance |
| **Dependencies** | Pylance extension (`ms-python.vscode-pylance`) |
| **Documentation** | [Pylance Settings](https://code.visualstudio.com/docs/python/settings-reference) |

```json
{
  "python.analysis.typeCheckingMode": "basic"
}
```

---

#### `python.formatting.provider`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"none"` |
| **Valid Values** | `"none"`, `"autopep8"`, `"black"`, `"yapf"` |
| **Description** | Python formatting provider (deprecated in favor of extensions) |
| **Note** | Use `editor.defaultFormatter` with formatter extensions instead |
| **Documentation** | [VS Code Python Formatting](https://code.visualstudio.com/docs/python/formatting) |

**Modern Approach:**
```json
{
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true
  }
}
```

---

### Go Settings

#### `go.useLanguageServer`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Use gopls language server |
| **Dependencies** | Go extension (`golang.go`) |
| **Documentation** | [VS Code Go](https://code.visualstudio.com/docs/languages/go) |

---

#### `go.formatTool`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"goimports"` |
| **Valid Values** | `"gofmt"`, `"goimports"`, `"goformat"`, `"gofumpt"` |
| **Description** | Go formatting tool |
| **Dependencies** | Go extension (`golang.go`) |
| **Documentation** | [VS Code Go](https://code.visualstudio.com/docs/languages/go) |

```json
{
  "go.formatTool": "goimports",
  "go.lintTool": "golangci-lint",
  "[go]": {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": "always"
    }
  }
}
```

---

## Extension Configurations

### ESLint Extension

**Extension ID:** `dbaeumer.vscode-eslint`

#### `eslint.enable`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Enable ESLint |
| **Documentation** | [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) |

---

#### `eslint.validate`

| Property | Value |
|----------|-------|
| **Type** | `array` |
| **Default** | `["javascript", "javascriptreact"]` |
| **Description** | Languages to validate with ESLint |
| **Documentation** | [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) |

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.workingDirectories": [{ "mode": "auto" }]
}
```

---

#### `eslint.codeActionsOnSave.rules`

| Property | Value |
|----------|-------|
| **Type** | `array` |
| **Default** | `null` |
| **Description** | Specific ESLint rules to fix on save |
| **Min Version** | ESLint extension 2.2.0+ |
| **Documentation** | [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) |

```json
{
  "eslint.codeActionsOnSave.rules": [
    "!@typescript-eslint/no-unused-vars"
  ]
}
```

---

### Prettier Extension

**Extension ID:** `esbenp.prettier-vscode`

#### `prettier.singleQuote`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Use single quotes instead of double quotes |
| **Note** | Overridden by project `.prettierrc` |
| **Documentation** | [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) |

---

#### `prettier.tabWidth`

| Property | Value |
|----------|-------|
| **Type** | `number` |
| **Default** | `2` |
| **Description** | Number of spaces per indentation level |
| **Note** | Overridden by project `.prettierrc` |
| **Documentation** | [Prettier Extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) |

```json
{
  "prettier.singleQuote": true,
  "prettier.tabWidth": 2,
  "prettier.semi": true,
  "prettier.trailingComma": "es5",
  "prettier.printWidth": 100
}
```

---

### GitHub Copilot

**Extension ID:** `github.copilot`

#### `github.copilot.enable`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | `{"*": true}` |
| **Description** | Enable/disable Copilot for specific languages |
| **Documentation** | [GitHub Copilot](https://docs.github.com/en/copilot) |

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": false,
    "plaintext": false,
    "markdown": true
  }
}
```

---

#### `github.copilot.advanced`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | `{}` |
| **Description** | Advanced Copilot settings |
| **Documentation** | [GitHub Copilot](https://docs.github.com/en/copilot) |

```json
{
  "github.copilot.advanced": {
    "inlineSuggestCount": 3,
    "listCount": 10
  }
}
```

---

## Workspace and File Management

### File Associations

#### `files.associations`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | `{}` |
| **Description** | Associate file extensions with languages |
| **Documentation** | [VS Code File Associations](https://code.visualstudio.com/docs/languages/overview#_adding-a-file-extension-to-a-language) |

```json
{
  "files.associations": {
    "*.env.*": "dotenv",
    "*.mdx": "markdown",
    ".prettierrc": "json",
    "*.tsx": "typescriptreact",
    "Dockerfile.*": "dockerfile"
  }
}
```

---

#### `files.exclude`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | Common patterns like `node_modules` |
| **Description** | Glob patterns for files to exclude from explorer |
| **Documentation** | [VS Code File Exclude](https://code.visualstudio.com/docs/getstarted/settings#_default-settings) |

```json
{
  "files.exclude": {
    "**/.git": true,
    "**/.svn": true,
    "**/.hg": true,
    "**/CVS": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/__pycache__": true,
    "**/*.pyc": true
  }
}
```

---

#### `search.exclude`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | Inherits from `files.exclude` plus additional patterns |
| **Description** | Glob patterns for files to exclude from search |
| **Related Settings** | `files.exclude` |
| **Documentation** | [VS Code Search](https://code.visualstudio.com/docs/editor/codebasics#_search-across-files) |

```json
{
  "search.exclude": {
    "**/node_modules": true,
    "**/bower_components": true,
    "**/dist": true,
    "**/*.min.js": true,
    "**/*.map": true,
    "**/coverage": true
  }
}
```

---

#### `files.watcherExclude`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | Common large directories |
| **Description** | Glob patterns for files to exclude from file watching |
| **Performance Impact** | Reduces file system overhead |
| **Documentation** | [VS Code Settings](https://code.visualstudio.com/docs/getstarted/settings) |

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/build/**": true
  }
}
```

---

### File Encoding

#### `files.encoding`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"utf8"` |
| **Valid Values** | `"utf8"`, `"utf8bom"`, `"utf16le"`, `"utf16be"`, etc. |
| **Description** | Default character set encoding |
| **Documentation** | [VS Code File Encoding](https://code.visualstudio.com/docs/editor/codebasics#_file-encoding-support) |

---

#### `files.autoGuessEncoding`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Automatically detect file encoding |
| **Documentation** | [VS Code File Encoding](https://code.visualstudio.com/docs/editor/codebasics#_file-encoding-support) |

```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": true
}
```

---

### End of Line

#### `files.eol`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"auto"` |
| **Valid Values** | `"\n"` (LF), `"\r\n"` (CRLF), `"auto"` |
| **Description** | Default end of line character |
| **Documentation** | [VS Code Settings](https://code.visualstudio.com/docs/getstarted/settings) |

```json
{
  "files.eol": "\n"
}
```

---

### Auto Save

#### `files.autoSave`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"off"` |
| **Valid Values** | `"off"`, `"afterDelay"`, `"onFocusChange"`, `"onWindowChange"` |
| **Description** | Controls auto save of editors |
| **Related Settings** | `files.autoSaveDelay` |
| **Documentation** | [VS Code Auto Save](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save) |

```json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000
}
```

---

### Hot Exit

#### `files.hotExit`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"onExit"` |
| **Valid Values** | `"off"`, `"onExit"`, `"onExitAndWindowClose"` |
| **Description** | Controls whether unsaved files are restored after restart |
| **Documentation** | [VS Code Settings](https://code.visualstudio.com/docs/getstarted/settings) |

```json
{
  "files.hotExit": "onExitAndWindowClose"
}
```

---

### Trim Trailing Whitespace

#### `files.trimTrailingWhitespace`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Trim trailing whitespace when saving |
| **Documentation** | [VS Code Settings](https://code.visualstudio.com/docs/getstarted/settings) |

```json
{
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true
}
```

---

## Debugging and Testing

### Debug Console

#### `debug.console.fontSize`

| Property | Value |
|----------|-------|
| **Type** | `number` |
| **Default** | `14` |
| **Description** | Controls the font size in the debug console |
| **Documentation** | [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging) |

---

#### `debug.console.fontFamily`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | Inherits from editor |
| **Description** | Controls the font family in the debug console |
| **Documentation** | [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging) |

```json
{
  "debug.console.fontSize": 14,
  "debug.console.fontFamily": "Fira Code"
}
```

---

#### `debug.inlineValues`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"auto"` |
| **Valid Values** | `"on"`, `"off"`, `"auto"` |
| **Description** | Show variable values inline during debugging |
| **Documentation** | [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging) |

```json
{
  "debug.inlineValues": "on"
}
```

---

#### `debug.openDebug`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"openOnDebugBreak"` |
| **Valid Values** | `"neverOpen"`, `"openOnSessionStart"`, `"openOnFirstSessionStart"`, `"openOnDebugBreak"` |
| **Description** | Controls when the debug view opens |
| **Documentation** | [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging) |

---

#### `debug.toolBarLocation`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"floating"` |
| **Valid Values** | `"floating"`, `"docked"`, `"hidden"` |
| **Description** | Controls the location of the debug toolbar |
| **Documentation** | [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging) |

```json
{
  "debug.toolBarLocation": "docked",
  "debug.showBreakpointsInOverviewRuler": true
}
```

---

### Testing

#### `testing.automaticallyOpenPeekView`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"failureVisible"` |
| **Valid Values** | `"failureAnywhere"`, `"failureVisible"`, `"never"` |
| **Description** | Controls when the testing peek view opens |
| **Documentation** | [VS Code Testing](https://code.visualstudio.com/docs/editor/testing) |

---

#### `testing.defaultGutterClickAction`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"run"` |
| **Valid Values** | `"run"`, `"debug"`, `"contextMenu"` |
| **Description** | Default action when clicking on test gutter icon |
| **Documentation** | [VS Code Testing](https://code.visualstudio.com/docs/editor/testing) |

```json
{
  "testing.automaticallyOpenPeekView": "never",
  "testing.defaultGutterClickAction": "run",
  "testing.openTesting": "openOnTestFailure"
}
```

---

## Version Control Integration

### Git Settings

#### `git.enabled`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Enable Git integration |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

---

#### `git.autofetch`

| Property | Value |
|----------|-------|
| **Type** | `boolean` or `string` |
| **Default** | `false` |
| **Valid Values** | `true`, `false`, `"all"` |
| **Description** | Automatically fetch from remotes |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

```json
{
  "git.autofetch": true,
  "git.autofetchPeriod": 180
}
```

---

#### `git.confirmSync`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Confirm before synchronizing git repositories |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

---

#### `git.enableSmartCommit`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Commit all changes when there are no staged changes |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

```json
{
  "git.enableSmartCommit": true,
  "git.confirmSync": false
}
```

---

#### `git.defaultCloneDirectory`

| Property | Value |
|----------|-------|
| **Type** | `string` or `null` |
| **Default** | `null` |
| **Description** | Default directory for git clone |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

```json
{
  "git.defaultCloneDirectory": "~/Projects"
}
```

---

#### `git.ignoreLegacyWarning`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Ignore legacy Git warning |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

---

#### `git.path`

| Property | Value |
|----------|-------|
| **Type** | `string` or `null` |
| **Default** | `null` |
| **Description** | Path to the git executable |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

```json
{
  "git.path": "/usr/local/bin/git"
}
```

---

#### `git.decorations.enabled`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Show Git decorations in the explorer |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

---

#### `git.inputValidation`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"warn"` |
| **Valid Values** | `"always"`, `"warn"`, `"off"` |
| **Description** | Commit message validation level |
| **Documentation** | [VS Code Git](https://code.visualstudio.com/docs/sourcecontrol/overview) |

```json
{
  "git.inputValidation": "warn",
  "git.inputValidationLength": 72,
  "git.inputValidationSubjectLength": 50
}
```

---

### Diff Editor

#### `diffEditor.ignoreTrimWhitespace`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Ignore trailing whitespace in diffs |
| **Documentation** | [VS Code Diff Editor](https://code.visualstudio.com/docs/editor/versioncontrol#_viewing-diffs) |

---

#### `diffEditor.renderSideBySide`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Render diffs side by side |
| **Documentation** | [VS Code Diff Editor](https://code.visualstudio.com/docs/editor/versioncontrol#_viewing-diffs) |

```json
{
  "diffEditor.ignoreTrimWhitespace": false,
  "diffEditor.renderSideBySide": true,
  "diffEditor.wordWrap": "on"
}
```

---

## Terminal Customization

### Terminal Shell

#### `terminal.integrated.defaultProfile.*`

| Property | Value |
|----------|-------|
| **Type** | `string` or `null` |
| **Default** | System default |
| **Description** | Default terminal profile |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/basics) |

**Platform-Specific:**
```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.defaultProfile.osx": "zsh"
}
```

---

#### `terminal.integrated.profiles.*`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | Detected profiles |
| **Description** | Terminal profile configurations |
| **Documentation** | [VS Code Terminal Profiles](https://code.visualstudio.com/docs/terminal/profiles) |

```json
{
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    },
    "Git Bash": {
      "source": "Git Bash"
    },
    "Command Prompt": {
      "path": [
        "${env:windir}\\System32\\cmd.exe"
      ],
      "args": [],
      "icon": "terminal-cmd"
    }
  },
  "terminal.integrated.profiles.linux": {
    "bash": {
      "path": "bash",
      "icon": "terminal-bash"
    },
    "zsh": {
      "path": "zsh"
    }
  }
}
```

---

### Terminal Appearance

#### `terminal.integrated.fontSize`

| Property | Value |
|----------|-------|
| **Type** | `number` |
| **Default** | `14` |
| **Description** | Terminal font size |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/appearance) |

---

#### `terminal.integrated.fontFamily`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | Inherits from editor |
| **Description** | Terminal font family |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/appearance) |

```json
{
  "terminal.integrated.fontSize": 14,
  "terminal.integrated.fontFamily": "MesloLGS NF",
  "terminal.integrated.lineHeight": 1.2
}
```

---

#### `terminal.integrated.cursorStyle`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"block"` |
| **Valid Values** | `"block"`, `"underline"`, `"line"` |
| **Description** | Terminal cursor style |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/appearance) |

---

#### `terminal.integrated.cursorBlinking`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Terminal cursor blinking |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/appearance) |

```json
{
  "terminal.integrated.cursorStyle": "line",
  "terminal.integrated.cursorBlinking": true
}
```

---

### Terminal Behavior

#### `terminal.integrated.scrollback`

| Property | Value |
|----------|-------|
| **Type** | `number` |
| **Default** | `1000` |
| **Description** | Maximum scrollback lines |
| **Performance Impact** | Higher values use more memory |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/basics) |

```json
{
  "terminal.integrated.scrollback": 10000
}
```

---

#### `terminal.integrated.copyOnSelection`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Copy selected text to clipboard |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/basics) |

---

#### `terminal.integrated.enableMultiLinePasteWarning`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"auto"` |
| **Valid Values** | `"auto"`, `"always"`, `"never"` |
| **Description** | Warn when pasting multiple lines |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/basics) |

```json
{
  "terminal.integrated.copyOnSelection": true,
  "terminal.integrated.enableMultiLinePasteWarning": "never"
}
```

---

#### `terminal.integrated.env.*`

| Property | Value |
|----------|-------|
| **Type** | `object` |
| **Default** | `{}` |
| **Description** | Environment variables for terminal |
| **Documentation** | [VS Code Terminal](https://code.visualstudio.com/docs/terminal/profiles#_terminal-profilesdefault) |

```json
{
  "terminal.integrated.env.linux": {
    "NODE_ENV": "development"
  },
  "terminal.integrated.env.osx": {
    "NODE_ENV": "development"
  },
  "terminal.integrated.env.windows": {
    "NODE_ENV": "development"
  }
}
```

---

## Accessibility Options

### Screen Reader

#### `editor.accessibilitySupport`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"auto"` |
| **Valid Values** | `"auto"`, `"on"`, `"off"` |
| **Description** | Screen reader optimization |
| **Documentation** | [VS Code Accessibility](https://code.visualstudio.com/docs/editor/accessibility) |

```json
{
  "editor.accessibilitySupport": "on"
}
```

---

#### `editor.accessibilityPageSize`

| Property | Value |
|----------|-------|
| **Type** | `number` |
| **Default** | `10` |
| **Description** | Lines read by screen reader at once |
| **Documentation** | [VS Code Accessibility](https://code.visualstudio.com/docs/editor/accessibility) |

---

### High Contrast

#### `window.autoDetectHighContrast`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Auto-detect OS high contrast mode |
| **Documentation** | [VS Code Accessibility](https://code.visualstudio.com/docs/editor/accessibility) |

---

### Keyboard Navigation

#### `workbench.enableExperiments`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `true` |
| **Description** | Enable experimental features |
| **Documentation** | [VS Code Settings](https://code.visualstudio.com/docs/getstarted/settings) |

---

#### `editor.tabFocusMode`

| Property | Value |
|----------|-------|
| **Type** | `boolean` |
| **Default** | `false` |
| **Description** | Tab key moves focus instead of inserting tab |
| **Documentation** | [VS Code Accessibility](https://code.visualstudio.com/docs/editor/accessibility) |

```json
{
  "editor.tabFocusMode": false
}
```

---

### Audio Cues

#### `audioCues.lineHasBreakpoint`

| Property | Value |
|----------|-------|
| **Type** | `string` |
| **Default** | `"on"` |
| **Valid Values** | `"on"`, `"off"`, `"auto"` |
| **Description** | Play audio cue for breakpoints |
| **Min Version** | VS Code 1.74+ |
| **Documentation** | [VS Code Accessibility](https://code.visualstudio.com/docs/editor/accessibility) |

```json
{
  "audioCues.lineHasBreakpoint": "on",
  "audioCues.lineHasError": "on",
  "audioCues.lineHasWarning": "off",
  "audioCues.onDebugBreak": "on"
}
```

---

## Special Considerations

### Multi-root Workspace Configurations

Multi-root workspaces use a `.code-workspace` file with settings that apply to all folders:

```json
{
  "folders": [
    { "path": "frontend" },
    { "path": "backend" },
    { "path": "shared" }
  ],
  "settings": {
    "editor.formatOnSave": true,
    "typescript.preferences.importModuleSpecifier": "relative"
  }
}
```

**Per-Folder Settings:**
Each folder can have its own `.vscode/settings.json` that overrides workspace settings.

---

### Platform-Specific Overrides

Use platform identifiers to apply settings conditionally:

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.defaultProfile.osx": "zsh",
  
  "[windows]": {
    "files.eol": "\r\n"
  },
  "[linux]": {
    "files.eol": "\n"
  },
  "[macos]": {
    "files.eol": "\n"
  }
}
```

---

### Settings Requiring Extension Dependencies

Many settings require specific extensions to function:

| Setting Prefix | Required Extension |
|----------------|-------------------|
| `python.*` | `ms-python.python` |
| `go.*` | `golang.go` |
| `eslint.*` | `dbaeumer.vscode-eslint` |
| `prettier.*` | `esbenp.prettier-vscode` |
| `github.copilot.*` | `github.copilot` |
| `rust-analyzer.*` | `rust-lang.rust-analyzer` |
| `docker.*` | `ms-azuretools.vscode-docker` |

---

### Recommended Settings for This Project (Hylo Travel AI)

Based on the project's technology stack (React 18.3.1 + TypeScript 5.5.3 + Vite + Tailwind CSS):

```json
{
  // Editor Settings
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  "editor.stickyScroll.enabled": true,
  
  // TypeScript/JavaScript
  "[typescript]": {
    "editor.tabSize": 2,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.tabSize": 2,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascript]": {
    "editor.tabSize": 2,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.tabSize": 2,
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  
  // TypeScript Configuration
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.inlayHints.parameterNames.enabled": "literals",
  "typescript.suggest.autoImports": true,
  
  // File Management
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.eol": "\n",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  
  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/coverage": true
  },
  
  // Tailwind CSS
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ],
  
  // ESLint
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  
  // Git
  "git.autofetch": true,
  "git.confirmSync": false,
  "git.enableSmartCommit": true
}
```

---

## Official Documentation Links

- [VS Code Settings Reference](https://code.visualstudio.com/docs/getstarted/settings)
- [VS Code Default Settings](https://code.visualstudio.com/docs/getstarted/settings#_default-settings)
- [Language-Specific Settings](https://code.visualstudio.com/docs/getstarted/settings#_language-specific-editor-settings)
- [Settings Sync](https://code.visualstudio.com/docs/editor/settings-sync)
- [Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings#_workspace-settings)
- [Theme Color Reference](https://code.visualstudio.com/api/references/theme-color)
- [VS Code Keyboard Shortcuts](https://code.visualstudio.com/docs/getstarted/keybindings)

---

## Version History

| VS Code Version | Notable Settings Added |
|-----------------|----------------------|
| 1.74+ | Audio cues, accessibility improvements |
| 1.70+ | `editor.stickyScroll.enabled` |
| 1.60+ | Native bracket pair colorization, inlay hints |
| 1.57+ | Inline suggestions (`editor.inlineSuggest.*`) |
| 1.44+ | `editor.codeActionsOnSave` object format |

---

*Last updated: December 2024*
*Applies to: VS Code 1.85+ and compatible versions*

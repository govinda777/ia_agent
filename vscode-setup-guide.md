# Guia de Configuração VSCode - ia_agent

## 📁 Arquivos para Criar Manualmente

Crie os seguintes arquivos na pasta `.vscode/` do seu projeto:

### 1. `.vscode/settings.json`

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit"
    }
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[yaml]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "eslint.workingDirectories": ["."],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "prettier.configPath": ".prettierrc",
  "prettier.ignorePath": ".prettierignore",
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/coverage": true,
    "**/.cache": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.next/**": true
  }
}
```

### 2. `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-eslint"
  ]
}
```

### 3. `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "env": {
        "NODE_OPTIONS": "--inspect"
      }
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Debug Environment Scripts",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/scripts/env-validate.mjs",
      "console": "integratedTerminal",
      "env": {
        "NODE_OPTIONS": "--no-warnings"
      }
    }
  ]
}
```

### 4. `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Validate Environment",
      "type": "shell",
      "command": "npm",
      "args": ["run", "env:validate"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Start Docker Services",
      "type": "shell",
      "command": "npm",
      "args": ["run", "docker:dev"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Setup Environment",
      "type": "shell",
      "command": "npm",
      "args": ["run", "env:setup"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    }
  ]
}
```

## 📋 Passos para Configurar

### 1. Criar a Pasta
```bash
# Na raiz do projeto
mkdir .vscode
```

### 2. Criar os Arquivos
```bash
# Windows (PowerShell)
New-Item -Path ".vscode\settings.json" -ItemType File -Value '{"typescript.tsdk": "node_modules/typescript/lib"}'
New-Item -Path ".vscode\extensions.json" -ItemType File -Value '{"recommendations": ["dbaeumer.vscode-eslint"]}'
New-Item -Path ".vscode\launch.json" -ItemType File -Value '{"version": "0.2.0"}'
New-Item -Path ".vscode\tasks.json" -ItemType File -Value '{"version": "2.0.0"}'

# Ou manualmente:
# 1. Abra o VSCode
# 2. Crie a pasta .vscode
# 3. Crie cada arquivo com o conteúdo acima
```

### 3. Instalar Extensões Recomendadas
Após criar os arquivos, o VSCode irá sugerir as extensões automaticamente. Instale todas as recomendadas:

- **ESLint** - Validação de código
- **Prettier** - Formatação de código  
- **Tailwind CSS IntelliSense** - Autocomplete CSS
- **Prisma** - Suporte para database
- **Docker** - Suporte para containers
- **TypeScript Importer** - Import automático
- **Auto Rename Tag** - Renomear tags HTML/JSX
- **Path Intellisense** - Autocomplete de paths

## 🚀 Benefícios das Configurações

### ✅ Formatação Automática
- Salvar arquivo = formatar automaticamente
- Correção de ESLint ao salvar
- Organização de imports

### ✅ Debug Integrado
- Debug server-side (Node.js)
- Debug client-side (Chrome)
- Debug dos scripts de ambiente

### ✅ Tasks Automáticas
- Validar ambiente com F1 → "Tasks: Run Task"
- Iniciar Docker automaticamente
- Setup rápido com um clique

### ✅ IntelliSense Melhorado
- Autocomplete Tailwind CSS
- Sugestões de imports TypeScript
- Path completion inteligente

## 🎯 Uso Diário

### Atalhos Úteis
- **Ctrl+Shift+P** → "Tasks: Run Task" → "Validate Environment"
- **F5** → Iniciar debug do Next.js
- **Ctrl+Shift+B** → Build do projeto

### Workflow Recomendado
1. **Abrir projeto** → VSCode sugere extensões
2. **Instalar extensões** → Recarregar VSCode
3. **Validar ambiente** → F1 → "Validate Environment"
4. **Iniciar desenvolvimento** → F5 ou `npm run dev`

## 🔧 Personalização

### Se você usa um tema diferente
Adicione ao `settings.json`:
```json
{
  "workbench.colorTheme": "Monokai Pro",
  "editor.fontFamily": "Fira Code, monospace",
  "editor.fontSize": 14
}
```

### Se você usa Git diferente
```json
{
  "git.path": "C:\\Program Files\\Git\\bin\\git.exe",
  "git.autofetch": true,
  "git.enableSmartCommit": true
}
```

### Se você usa WSL2
```json
{
  "terminal.integrated.shell.windows": "C:\\Windows\\System32\\wsl.exe",
  "terminal.integrated.shell.linux": "/bin/bash"
}
```

## ⚠️ Notas Importantes

- Os arquivos `.vscode/` estão no `.gitignore` por design
- Isso permite que cada desenvolvedor tenha suas configurações pessoais
- As configurações acima são recomendações para o time
- Sinta-se à vontade para ajustar conforme sua preferência

## 🆘 Problemas Comuns

### Extensões não aparecem
1. Recarregue VSCode (Ctrl+Shift+P → "Developer: Reload Window")
2. Verifique se os arquivos foram criados corretamente
3. Instale manualmente se necessário

### Formatação não funciona
1. Verifique se Prettier está instalado
2. Execute "Format Document" manualmente primeiro
3. Verifique as configurações de "formatOnSave"

### Debug não inicia
1. Verifique se as portas estão livres
2. Reinicie o VSCode
3. Verifique as configurações de launch.json

---

## ✅ Checklist Final

- [ ] Pasta `.vscode/` criada
- [ ] `settings.json` configurado
- [ ] `extensions.json` criado
- [ ] `launch.json` para debug
- [ ] `tasks.json` para automação
- [ ] Extensões recomendadas instaladas
- [ ] VSCode recarregado
- [ ] Testar formatação automática
- [ ] Testar debug
- [ ] Testar tasks

Com estas configurações, sua experiência de desenvolvimento será muito mais produtiva! 🚀

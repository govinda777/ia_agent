# Prompt para Resolver Problema de Instalação do Husky

## Problema Identificado
O erro `husky: command not found` ocorre durante `npm install` porque:
1. O script `prepare` no package.json executa `husky install`
2. O Husky não está instalado como dependência
3. O lint-staged está configurado mas depende do Husky

## Solução Passo a Passo

### 1. Instalar Dependências Faltantes
```bash
npm install --save-dev husky lint-staged
```

### 2. Inicializar o Husky (Versão Atual)
```bash
# Para Husky v9+ (versão mais recente)
npx husky init

# Ou se estiver usando versão antiga
npx husky install
```

### 3. Configurar o Hook Pre-commit
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

### 4. Verificar Arquivos de Configuração
- `.husky/pre-commit` deve existir e conter o comando lint-staged
- `.lintstagedrc.js` já está configurado corretamente
- `package.json` já tem o script `prepare` e configuração `lint-staged`

### 5. Testar a Configuração
```bash
# Testar o hook manualmente
npx lint-staged

# Fazer um commit para testar o hook automático
git add .
git commit -m "test: verify husky setup"
```

## Comandos Completos para Execução
```bash
# Instalar dependências
npm install --save-dev husky lint-staged

# Inicializar Husky (versão atual)
npx husky init

# Adicionar hook pre-commit
npx husky add .husky/pre-commit "npx lint-staged"

# Testar instalação
npm run prepare
```

## Verificação Final
Após executar os comandos, verifique se:
- `.husky/pre-commit` existe com o conteúdo correto
- `npm install` funciona sem erros
- Commits disparam o lint-staged automaticamente

## Troubleshooting
Se o problema persistir:
1. Remova `node_modules` e `package-lock.json`
2. Execute `npm cache clean --force`
3. Repita os passos de instalação
4. Verifique permissões do arquivo `.husky/pre-commit` (`chmod +x .husky/pre-commit`)

@echo off
echo 🔍 Running pre-commit checks...

REM Get staged files
for /f "delims=" %%f in ('git diff --cached --name-only --diff-filter=ACM ^| findstr /R "\.(js|jsx|ts|tsx|json|md|yml|yaml)$"') do (
    echo Processing %%f...
    
    REM Check if it's a TypeScript/JavaScript file
    echo %%f | findstr /R "\.(js|jsx|ts|tsx)$" >nul
    if !errorlevel! equ 0 (
        echo Linting %%f...
        npx eslint "%%f" --fix
        if !errorlevel! neq 0 (
            echo ❌ ESLint failed on %%f
            exit /b 1
        )
    )
    
    echo Formatting %%f...
    npx prettier --write "%%f"
    if !errorlevel! neq 0 (
        echo ❌ Prettier failed on %%f
        exit /b 1
    )
)

echo ✅ Pre-commit checks passed!
exit /b 0

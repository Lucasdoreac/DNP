param (
    [Parameter(Mandatory=$true)]
    [string]$Name,
    [Parameter(Mandatory=$false)]
    [string]$Description = "Novo subprojeto dnp"
)

$targetDir = "game-dev/$Name"
if (Test-Path $targetDir) {
    Write-Error "O projeto $Name já existe!"
    exit 1
}

Write-Host "🚀 Criando novo subprojeto: $Name..."

# Criar diretórios
New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
New-Item -Path "$targetDir/src" -ItemType Directory -Force | Out-Null
New-Item -Path "$targetDir/tests" -ItemType Directory -Force | Out-Null

# Criar README bilíngue
$readmeContent = @"
# dnp: $Name

[🇧🇷 Português](#português) | [🇺🇸 English](#english)

---

## Português
$Description

## English
$Description (English version)
"@
$readmeContent | Out-File -FilePath "$targetDir/README.md" -Encoding utf8

# Criar package.json
$packageContent = @"
{
  "name": "@dnp/$Name",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "bun test",
    "dev": "bun src/index.ts"
  }
}
"@
$packageContent | Out-File -FilePath "$targetDir/package.json" -Encoding utf8

# Criar index.ts inicial
"print('Iniciando subprojeto $Name...');" | Out-File -FilePath "$targetDir/src/index.ts" -Encoding utf8

Write-Host "✅ Projeto $Name criado com sucesso em $targetDir"
Write-Host "💡 Lembre-se de rodar 'bun install' na raiz para atualizar os workspaces."


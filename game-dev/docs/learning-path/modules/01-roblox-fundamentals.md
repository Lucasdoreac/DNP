# Fundamentos de Roblox Studio e Luau

Bem-vindo ao primeiro passo da sua jornada no ecossistema **dnp** (Desempenho Não é Performance). Neste módulo, vamos explorar a base material da criação no Roblox: o Studio e a linguagem Luau.

## O Que é Roblox Studio?

O Roblox Studio é o motor de desenvolvimento (engine) onde construímos as experiências. Diferente de outras plataformas, o Studio integra edição 3D, scripting e publicação em um único ambiente.

### Interface Básica
- **Explorer:** Onde você vê a hierarquia de todos os objetos do seu jogo (Workspace, Players, Lighting, etc.).
- **Properties:** Onde você altera as características físicas e visuais dos objetos (Cor, Tamanho, Transparência).
- **Output:** O console onde mensagens de erro e depuração (print) aparecem.

## Introdução ao Luau (2026)

O Luau é uma versão otimizada e tipada da linguagem Lua, desenvolvida pelo Roblox para ser rápida e segura.

### 1. Tipagem Estrita (`--!strict`)
Sempre comece seus scripts com a diretiva de tipagem estrita para evitar erros comuns.
```lua
--!strict
local vida: number = 100
local nome: string = "Desenvolvedor dnp"
```

### 2. A Biblioteca `task`
Em 2026, não usamos mais `wait()` ou `spawn()`. Usamos a biblioteca `task` para gerenciar o tempo e a execução de forma performática.
```lua
task.wait(2) -- Aguarda 2 segundos de forma eficiente
task.spawn(function()
    print("Executando em paralelo!")
end)
```

### 3. Serviços (`GetService`)
Sempre acesse os serviços do motor usando `GetService`.
```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
```

## Sua Primeira Lógica: O Evento `Touched`

Mecânicas básicas no Roblox geralmente começam com eventos. O evento `Touched` é disparado quando algo encosta em uma parte.

```lua
local part = script.Parent :: Part

part.Touched:Connect(function(otherPart)
    local character = otherPart.Parent
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    
    if humanoid then
        print("Um jogador tocou na parte!")
    end
end)
```

## Filosofia dnp

Neste módulo inicial, aplicamos o princípio de **Desempenho como Realização**:
- **Simplicidade Material:** Entender cada objeto no Explorer como uma peça da infraestrutura que você controla.
- **Contra a Performance Vazia:** Não escreva código apenas para "parecer" complexo. Escreva o mínimo necessário para que a experiência seja resiliente e clara.
- **Soberania do Conhecimento:** Ao dominar os fundamentos do Luau, você deixa de ser apenas um usuário da plataforma e passa a ser o mestre da sua própria ferramenta de produção.

---
## Resumo para NotebookLM

- **O Que é:** Introdução ao Roblox Studio e à linguagem Luau (versão 2026).
- **Conceitos Chave:** Explorer, Properties, Output, `--!strict`, biblioteca `task`, `GetService`, e eventos (`Touched`).
- **Conexão dnp:** Foco na simplicidade material e na soberania através do domínio da ferramenta básica.

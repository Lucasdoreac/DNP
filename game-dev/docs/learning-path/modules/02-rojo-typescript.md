# Ferramental Profissional: Rojo e TypeScript (Roblox-TS)

Neste módulo, vamos elevar o nível do seu desenvolvimento saindo do editor interno do Roblox Studio para um ambiente profissional usando **Rojo** e **TypeScript**.

## Por que usar Rojo e TypeScript?

No ecossistema **dnp**, buscamos **Soberania do Código**. O editor interno do Roblox é proprietário e limitado. Ao usar Rojo, você pode:
1. Usar o **VS Code** (ou qualquer editor de sua preferência).
2. Utilizar o **Git** para controle de versão real.
3. Aproveitar o ecossistema do **NPM/Bun** para gerenciar dependências.
4. Programar em **TypeScript**, que oferece uma tipagem muito mais robusta que o Luau padrão.

## Configuração do Ambiente

### 1. Ferramentas Necessárias
- **Node.js / Bun:** O runtime para o compilador do TypeScript.
- **Rojo:** O plugin que sincroniza seus arquivos locais com o Studio.
- **Roblox-TS (`rbxtsc`):** O compilador que transforma TypeScript em Luau.

### 2. Estrutura do Projeto (Monorepo)
Seguindo as melhores práticas de 2026, estruturamos nossos projetos como monorepos:
```text
meu-projeto/
├── packages/           # Bibliotecas e pacotes compartilhados
├── src/                # Código fonte do jogo principal
│   ├── client/         # Scripts de cliente
│   ├── server/         # Scripts de servidor
│   └── shared/         # Código compartilhado entre ambos
├── default.project.json # Configuração do Rojo
├── package.json        # Dependências do NPM/Bun
└── tsconfig.json       # Configuração do TypeScript
```

## O Fluxo de Trabalho

1. **Escrever em TypeScript:** Você cria arquivos `.ts` ou `.tsx` na pasta `src`.
2. **Compilar:** O comando `rbxtsc -w` (watch mode) compila seu código para Luau na pasta `out`.
3. **Sincronizar:** O Rojo lê a pasta `out` e atualiza o Roblox Studio em tempo real.

### Exemplo de Código em TypeScript
```typescript
import { Players } from "@rbxts/services";

const player = Players.LocalPlayer;
print(`Olá do TypeScript, ${player.Name}!`);
```

## Filosofia dnp

A adoção do Rojo e do TypeScript não é apenas uma escolha técnica, é um ato de **Soberania Tecnológica**:
- **Meios de Produção:** Ao trazer o código para o seu sistema local, você detém os meios de produção da sua lógica. Você não depende mais exclusivamente das ferramentas fornecidas pela plataforma proprietária.
- **Desempenho como Realização:** O uso de tipos fortes (TypeScript) garante que seu "desempenho" no desenvolvimento resulte em um código mais resiliente e menos propenso a falhas materiais em tempo de execução.
- **Transparência Dialética:** O fluxo de compilação (TS -> Luau) revela a natureza material da linguagem alvo, permitindo uma compreensão mais profunda de como o motor do Roblox processa sua vontade.

---
## Resumo para NotebookLM

- **O Que é:** Guia de configuração de fluxo de trabalho profissional com Rojo e TypeScript (Roblox-TS).
- **Conceitos Chave:** Soberania do código, Git, monorepos, compilação (`rbxtsc`), e sincronização via Rojo.
- **Conexão dnp:** Adoção de ferramentas locais para deter os meios de produção da lógica do jogo.

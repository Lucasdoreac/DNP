# Guia de Ingestão de Projetos: Ecossistema dnp

Este guia descreve o processo padrão para importar repositórios externos e portfólios dispersos para dentro do monorepo **dnp**. O objetivo é centralizar a inteligência e promover a reusabilidade através de módulos e pacotes compartilhados.

---

## 🛠️ Processo de Ingestão

### 1. Preparação
Antes de mover qualquer arquivo, verifique se o projeto de origem possui um `.git`.
- **Importante:** Não moveremos a pasta `.git` do projeto de origem para evitar conflitos.

### 2. Escolha do Local
- **Subprojetos Inteiros:** Se o projeto for um aplicativo ou serviço autônomo (como um novo jogo ou ferramenta agêntica), ele deve ir para a raiz do monorepo ou para uma pasta de categoria (ex: `game-dev/`, `agentic-tools/`).
- **Bibliotecas Reusáveis:** Se o projeto for uma coleção de funções ou utilitários, ele deve ser transformado em um pacote dentro de `packages/`.

### 3. Procedimento de Cópia
Use o comando `gh repo clone` em uma pasta temporária e depois mova os arquivos:
```bash
# Exemplo de ingestão
gh repo clone Lucasdoreac/meu-projeto temp-ingestion
cp -r temp-ingestion/* dnp/novo-local/
rm -rf temp-ingestion
```

### 4. Integração ao Workspace
Após mover os arquivos, atualize o `package.json` na raiz do monorepo:
1. Adicione o novo caminho à seção `workspaces`.
2. Rode `bun install` para vincular as dependências.

### 5. Modularização (Refatoração dnp)
Para que o projeto ingerido siga a filosofia dnp:
- **Remover Redundâncias:** Substitua sistemas de log locais pelo pacote `@dnp/logger`.
- **Compartilhar Memória:** Integre o estado do projeto com `@dnp/context-memory` se ele precisar interagir com agentes.
- **Bilinguismo:** Atualize o README do projeto ingerido para ser bilíngue (PT-BR/EN).

---

## 🧠 Princípios de Escalabilidade
- **Não Duplique Lógica:** Se dois projetos ingeridos usam a mesma função, essa função deve ser movida para um novo pacote em `packages/`.
- **Dependências Enxutas:** Prefira usar os runtimes já presentes no monorepo (Bun).
- **Documentação Dialética:** Cada projeto ingerido deve ter seu propósito e contradições materiais documentados no README local.

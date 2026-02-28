# PROMPT PARA CLAUDE TERMINAL - Migrar e Estruturar Memória

Cole isto no terminal local onde o agente Claude está sendo executado.

---

## Olá Claude,

Você está encarregado de organizar o workspace do projeto DNP/LUDOC OS.
Sua tarefa é seguir o plano gerado pelo Copilot e preparar o ambiente para sincronização automática.

### Estado Atual:

- Memória legada localizada em:
  `C:\Users\ludoc\.claude\projects\C--Users-ludoc-Desktop-meus-filmes\memory\MEMORY.md`
- Estrutura de runtime existente: `.ludoc/` com logs e sealed-identity.
- Diretório `.claude/` contém apenas `settings.local.json`.

### Objetivos:

1. Escolher qual estrutura de configuração implementar (A/B/C). Veja opções abaixo.
2. Mover o arquivo `MEMORY.md` da localização legada para o novo local.
3. Criar `CLAUDE.md` apropriado no workspace.
4. Comitar as mudanças em branch `configure-project-structure` e abrir um PR contra `main`.

### Opções de Estrutura

**A - Separar Config de Runtime**
```
.ludoc/          ← runtime apenas
.claude/         ← configuração do Claude
├── MEMORY.md
├── CLAUDE.md
└── settings.local.json
``` 

**B - Unificar tudo em `.ludoc/`**
```
.ludoc/          ← tudo junto
├── MEMORY.md
├── CLAUDE.md
├── settings.local.json
├── sealed-identity.json
├── message-queue.json
└── *.log
``` 

**C - Pastas separadas por propósito**
```
.ludoc/          ← runtime apenas
├── sealed-identity.json
├── message-queue.json
└── *.log
.claude/         ← Claude config + memória + notas
├── MEMORY.md
├── CLAUDE.md
└── settings.local.json
``` 

### Critérios para escolha
- Clareza para futuros colaboradores
- Facilidade de manutenção
- Conformidade com convenções Claude Code (separar config de runtime é preferível)

### Instruções passo a passo

1. Decida qual opção usar (A, B ou C) e documente a escolha.
2. Crie diretórios correspondentes no workspace local `C:\Users\ludoc\ludoc-workspace`.
3. Mova `MEMORY.md` da pasta legada para o novo local (preserve backup).
4. Gere um `CLAUDE.md` na pasta apropriada contendo:
   - Visão geral do workspace (DNP + ludoc-os subprojeto).
   - Padrões e referências de configuração (.dnp.config.yml, .ludoc.config.yml, bootstrap.md, etc.).
5. Inicialize git se necessário, crie e mude para branch `configure-project-structure`.
6. Adicione e commit as mudanças com mensagem adequada.
7. Use `gh` para abrir pull request com título:
   "chore: configure project memory and settings structure".
8. Retorne aqui com:
   - Opção escolhida
   - Lista de comandos executados (`mkdir`, `mv`, `git` etc.)
   - Nome/URL do PR gerado
   - Próximos passos sugeridos

---

### Resultado esperado

Após execução, seu workspace local e o repositório remoto terão a estrutura organizada; Copilot poderá ler a memória centralizada e ambos chegam a uma sincronização automática.

> Nota: mantenha sempre `settings.local.json` fora de VCS.

Boa sorte, Claude! 😊

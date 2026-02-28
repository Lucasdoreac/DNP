# Bootstrap: Iniciando com DNP + LUDOC OS

## Para IAs (Gemini, Claude, Copilot, etc)

Quando você estiver trabalhando neste repositório, leia os dois arquivos de configuração abaixo **antes de qualquer tarefa**:

### 1. `.dnp.config.yml` 
**Responsável por:** Semântica, tom, valores e análise do projeto.

- Define o que é "desempenho" vs "performance" neste repositório
- Estabelece o tom de comunicação (factual, denso, crítico)
- Lista as dimensões de análise esperadas (político-ideológico, linguístico, cultural, técnico)

**Quando seguir:** Em TODAS as respostas, análises e documentação.

### 2. `.ludoc.config.yml`
**Responsável por:** Infraestrutura, rede, recursos e limites de hardware.

- Define que serviços devem fazer bind em `0.0.0.0` (nunca localhost)
- Especifica limites de memória (4GB max, 2 CPUs)
- Lista mecanismos de autenticação permitidos (headless, sem OAuth2 em browser)

**Quando seguir:** Em QUALQUER sugestão de código, deployment ou infraestrutura.

---

## Fluxo de Trabalho

```
Usuário abre chat
    ↓
[IA lê .dnp.config.yml]
    ↓
[IA lê .ludoc.config.yml]
    ↓
Usuário faz tarefa específica
    ↓
IA executa resposta com ambos os contextos aplicados
```

---

## Exemplo de Referência Correta

❌ **Errado (Sem contexto):**
```
Faça um deployment da API
```

✅ **Correto (Com contexto):**
```
Leia .dnp.config.yml e .ludoc.config.yml.
Com base nesses contextos, faça um deployment de uma API que:
- Use apenas serviços bindados em 0.0.0.0
- Respeite os limites de 4GB RAM
- Siga o tom factual e crítico do DNP
```

---

## Tabela Rápida: Qual Arquivo Afeta O Quê?

| Aspecto | .dnp.config.yml | .ludoc.config.yml | Quando Aplicar |
|---------|-----------------|-------------------|-----------------|
| Análise discursiva | ✅ | ❌ | Lendo código, documentação, crítica |
| Infraestrutura de rede | ❌ | ✅ | Sugerindo serviços, APIs, deploy |
| Tom de resposta | ✅ | ❌ | Toda comunicação |
| Limites de memória | ❌ | ✅ | Dockerfiles, configuração de servidor |
| Rejeição a "performance" vazia | ✅ | ✅ | Avaliação de arquitetura (ambos informam) |

---

## Para Desenvolvedores Humanos

Se você está trabalhando localmente e quer que uma IA respeite esses contextos:

1. **Copie e cole este prompt no início do chat:**

```markdown
Leia os seguintes arquivos de configuração deste repositório:
- .dnp.config.yml
- .ludoc.config.yml

[COPIE O CONTEÚDO AQUI OU REFIRA OS CAMINHOS]

Com base nesses contextos, execute [sua tarefa].
```

2. **Ou crie um shortcut local** (se usando integração de IA em seu editor):

```bash
# Exemplo: ~/.aliases ou setup local
alias dnp-context="cat .dnp.config.yml .ludoc.config.yml"
```

---

## Validação: Como Saber Se a IA Está Seguindo Os Contextos?

Verifique se a resposta:

- [ ] Usa tom **factual e denso** (não corporativo/polido)?
- [ ] Rejeita "performance" sem substância?
- [ ] **Se envolvendo infraestrutura**: Menciona `0.0.0.0` ao invés de `localhost`?
- [ ] **Se envolvendo recursos**: Respeita limites de 4GB/2CPUs?
- [ ] Referencia dados ou fontes (alinhado com `.dnp.config.yml`)?

Se 4 ou 5 forem "sim", a IA entendeu. Se menos, peça para reler os arquivos.

---

## Filosofia

Este `bootstrap.md` substitui completamente a necessidade de prompt injection. 

- **Transparente**: Qualquer pessoa pode ver exatamente qual é o contrato
- **Versionado**: Mudanças nas regras vão para git blame
- **Modular**: Funciona com qualquer IA, qualquer contexto
- **Auditável**: Não há "magia" oculta
- **Desempenho**: Execução autêntica sem encenação (alinhado com DNP)

Use-o como referência única e definitiva.

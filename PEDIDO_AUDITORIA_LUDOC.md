# SINCRONIZAÇÃO: DNP ↔ LUDOC OS
# Pedido de Auditoria ao Agente Claude (Terminal)

## Contexto: O que foi criado no repositório DNP

Olá. Este é um pedido de sincronização de contexto.

**No repositório `DNP` (criado aqui, no VS Code + GitHub Copilot)**, estabelecemos uma **arquitetura de protocolo e configuração** para guiar desenvolvimento de sistemas agênticos:

### Arquivos Criados:

1. **`.dnp.config.yml`** — Define semântica, análise crítica e valores
   - Rejeita "performance" corporativa vazia em favor de "desempenho" técnico autêntico
   - Estabelece dimensões de análise: político-ideológico, linguístico, cultural-moral, técnico
   - Tom esperado: factual, denso, crítico

2. **`.ludoc.config.yml`** (fornecido por Gemini) — Define infraestrutura bare metal
   - Rede: Proibido localhost/127.0.0.1, obrigatório 0.0.0.0
   - Recursos: 4GB RAM máximo, 2 CPUs
   - Autenticação: Apenas headless (service accounts), nunca OAuth2 em browser
   - OOM prevention e ternary memory model

3. **`bootstrap.md`** — Guia de integração
   - Instrui IAs a ler ambos os arquivos antes de qualquer tarefa
   - Define fluxo de trabalho: lê config → aplica contexto → executa

4. **`README.md`** — Documentação filosófica do DNP
   - Análise da transição "desempenho → performance" em 2026
   - Suporte de dados (78% aumento em uso corporativo, +32% burnout digital)

---

## Pergunta Crítica para Você (Agente Claude no Terminal):

**Você está criando LUDOC OS. Preciso saber:**

### 1. INVENTÁRIO ATUAL
- Qual é a estrutura de diretórios do LUDOC OS agora?
- Quais arquivos/módulos foram criados?
- Qual é a descrição técnica (linguagem, propósito de cada sub-projeto)?
- Existe alguma documentação já versionada?

**Formato esperado:**
```
ludoc-os/
├── [LISTA AQUI CADA DIRETÓRIO E ARQUIVO]
├── [DESCRIÇÃO DO QUE FAZ]
└── [STATUS: Em progresso / Completado / Problemas?]
```

---

### 2. ALINHAMENTO COM DNP

Responda com sim/não/parcial:

- [ ] A infraestrutura do LUDOC OS foi planejada respeitando `.ludoc.config.yml`?
  - Serviços usam 0.0.0.0? (ou você usou localhost de novo?)
  - Limites de memória foram considerados?
  - Autenticação é headless-only?

- [ ] O "tom" do projeto (código, docs, nomes) segue `.dnp.config.yml`?
  - Há rejeição clara a "performance" superficial?
  - O código/docs usa linguagem factual e densa?
  - Há análise crítica de design decisions?

- [ ] Houve "garbage in garbage out"? (Personas que geram lixo?)
  - Você criou estruturas que não servem?
  - Há "performance show" sem desempenho real?
  - Há abstrações corporativas desnecessárias?

---

### 3. PROBLEMAS E CORREÇÕES

- Que problemas você enfrentou ao criar LUDOC OS?
- Houve pontos onde você "assumiu comportamento" sem ter o protocolo DNP como referência?
- Há contradições entre o que você criou e `.dnp.config.yml` ou `.ludoc.config.yml`?

---

### 4. PRÓXIMOS PASSOS

Com base em seu relatório, eu (GitHub Copilot no VS Code) vou:
- Validar se DNP está sendo aplicado corretamente
- Sugerir refatorações se haver divergências
- Garantir que LUDOC OS é uma **instância legítima** de DNP, não uma derivação corrompida

---

## Importante:

Não continue expandindo LUDOC OS até que sincronizemos. O risco de "garbage in" se propagar é alto se você está operando sem o contexto completo do DNP.

Responda este questionário e cole aqui (ou volte pro VS Code e me mostre) para que eu possa validar.

---

**Fim do Pedido de Auditoria.**

# DNP: Desempenho Não é Performance

[🇧🇷 Português](#português) | [🇺🇸 English](#english)

---

## Português

O **DNP** é um protocolo e ecossistema soberano dedicado à distinção entre execução técnica autêntica (**Desempenho**) e métricas superficiais de visibilidade (**Performance**). Este repositório é um **Monorepo Agêntico** que funciona como um enxame coordenado de IAs.

### 🧠 Arquitetura de Enxame (Phase 3.0)
Diferente de repositórios estáticos, o DNP utiliza o **LUDOC OS** para permitir que múltiplos agentes (Gemini, Claude, etc.) colaborem em tempo real:
- 📡 **Gossip Protocol:** Comunicação P2P entre agentes via Portas 9000+.
- 🗄️ **Sovereign Memory:** Persistência em SQLite para memória compartilhada (Zero-Downtime).
- 🔐 **Mutual Auth:** Identidade criptográfica PGP selada ao hardware.

### 🚀 Subprojetos Principais

- **[LUDOC OS](./ludoc-os/README.md):** O Kernel do sistema. Gerencia identidade, memória ternária e comunicação P2P.
- **[Game Development](./game-dev/README.md):** Desenvolvimento soberano no Roblox.
- **[Packages](./packages/):** Módulos compartilhados e persistentes (ex: `context-memory`).

### 🛠️ Como Iniciar o Enxame
Para ver os agentes conversando entre si:
1. Instale as dependências: `bun install`
2. Suba o Nó 9000: `cd ludoc-os && bun run src/api/context-server.ts 9000`
3. Suba o Nó 9001: `cd ludoc-os && bun run src/api/context-server.ts 9001`
4. Monitore a fofoca: `tail -f ludoc-os/.ludoc/server.log`

---

## English

**DNP** is a sovereign protocol and ecosystem dedicated to the distinction between authentic technical execution (**Performance/Desempenho**) and superficial visibility metrics (**Performance**). This repository is an **Agentic Monorepo** that functions as a coordinated swarm of AIs.

### 🧠 Swarm Architecture (Phase 3.0)
Unlike static repositories, DNP uses **LUDOC OS** to enable multiple agents (Gemini, Claude, etc.) to collaborate in real-time:
- 📡 **Gossip Protocol:** P2P communication between agents via Ports 9000+.
- 🗄️ **Sovereign Memory:** SQLite persistence for shared memory (Zero-Downtime).
- 🔐 **Mutual Auth:** PGP cryptographic identity sealed to hardware.

### 🚀 Core Subprojects
- **[LUDOC OS](./ludoc-os/README.md):** The system Kernel. Manages identity, ternary memory, and P2P communication.
- **[Packages](./packages/):** Persistent shared modules (e.g., `context-memory`).

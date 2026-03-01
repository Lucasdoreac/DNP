# Tutorial: Seu Primeiro Jogo - O Jardim Resiliente

Neste módulo, vamos aplicar o que aprendemos sobre Luau, Rojo e TypeScript para criar uma experiência que reflete a filosofia de **decrescimento** (degrowth). 

Em vez de um jogo focado em acumular pontos infinitamente, vamos criar o **Jardim Resiliente**, onde o objetivo é manter o equilíbrio de um ecossistema.

## A Mecânica: Equilíbrio de Recursos

Diferente dos simuladores de "clique para ganhar", aqui o excesso de recursos é tão prejudicial quanto a falta.

### 1. Definindo o Estado do Solo (TypeScript)
No seu editor local (VS Code), crie um componente para gerenciar a saúde do solo.

```typescript
// src/shared/SoloData.ts
export interface SoloStatus {
    hidratacao: number; // 0 a 100
    nutrientes: number; // 0 a 100
}

export const LIMITE_SAUDAVEL = 80;
export const SOBRECARGA = 95;
```

### 2. A Lógica de Decrescimento (Server Script)
Se a hidratação passar de 95%, o solo fica "encharcado" e a saúde da planta diminui. Isso ensina que **mais nem sempre é melhor**.

```typescript
// src/server/JardimManager.ts
import { SoloStatus, SOBRECARGA } from "shared/SoloData";

function atualizarPlanta(status: SoloStatus) {
    if (status.hidratacao > SOBRECARGA) {
        print("Cuidado: Solo encharcado! O excesso prejudica o sistema.");
        // Lógica de penalidade
    } else {
        print("O ecossistema está em equilíbrio.");
    }
}
```

## Implementação no Roblox

1. **Crie a Parte do Solo:** No Studio, crie uma Part chamada "Solo".
2. **Crie a Interface de Feedback:** Use **Roact** ou **Fusion** (mencionados no Tech Stack) para mostrar ao jogador o nível de hidratação.
3. **Interação Material:** O jogador deve coletar água de uma fonte limitada. A fonte não é infinita, forçando o jogador a pensar no tempo de reposição da natureza.

## Filosofia dnp

O "Jardim Resiliente" é uma aplicação direta dos nossos pilares:
- **Contra o Crescimento Infinito:** O jogo não tem um "placar de líderes" baseado em quem tem mais água, mas sim em quem consegue manter o jardim vivo por mais tempo com o mínimo de recursos.
- **Estética do Decrescimento (Degrowth Aesthetics):** A interface deve ser limpa, funcional e sem elementos de distração (pop-ups, ofertas, brilhos excessivos).
- **Conscious Friction (Fricção Consciente):** A coleta de água deve ter um tempo de espera real, incentivando o jogador a observar o ambiente em vez de apenas clicar freneticamente.
- **Materialismo Dialético:** O jogador interage com as contradições do sistema — a água é necessária para a vida, mas o excesso de água traz a morte. O equilíbrio é a síntese necessária.

---
## Resumo para NotebookLM

- **O Que é:** Tutorial prático de criação de um "Jardim Resiliente" focado em equilíbrio.
- **Conceitos Chave:** TypeScript compartilhado, lógica de servidor, mecânicas de equilíbrio de recursos vs. acúmulo infinito.
- **Conexão dnp:** Aplicação prática dos pilares de decrescimento e fricção consciente no design de gameplay.

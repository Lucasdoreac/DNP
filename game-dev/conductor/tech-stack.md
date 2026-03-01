# Tech Stack

## Primary Languages
- **TypeScript:** The primary language for application logic, agentic systems, and tooling.
- **Luau:** Optimized Lua for native Roblox development.
- **Python:** Used for specialized scripts, server analysis, and data processing.
- **Shell (Bash/PowerShell):** For infrastructure automation, environment setup, and system commands.

## Runtime and Package Management
- **Bun:** The primary runtime and package manager for the monorepo, selected for its speed and native workspace support.
- **Node.js:** Secondary runtime for compatibility with specific legacy tools or libraries.

## Frameworks and Tooling
- **Rojo:** Essential for syncing local file structures with Roblox Studio.
- **Roblox-TS:** TypeScript-to-Luau compiler for professional Roblox development.
- **Conductor:** Specification-driven development framework for agent-orchestrated workflows.
- **GitHub CLI (gh):** For repository management and automation from the command line.

## Infrastructure and Architecture
- **Monorepo Architecture:** Centralized repository for all subprojects (game-dev, ludoc-os, packages).
- **Git:** Version control system for all source code and documentation.
- **WSL2 / Windows:** Hybrid environment for running agentic systems and local development.

## Evolution Strategy
- **Modular Ingestion:** Workflow for importing and modularizing existing portfolios into the `packages/` directory.
- **Workspace-First:** Utilizing Bun workspaces to manage dependencies and shared logic efficiently across subprojects.

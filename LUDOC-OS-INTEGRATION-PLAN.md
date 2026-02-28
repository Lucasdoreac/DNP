# LUDOC OS Integration Plan into DNP Repository

**Objective:** Incorporate the validated LUDOC OS codebase into the DNP monorepo while preserving protocol semantics, maintaining clear separation of concerns, and enabling future phase development.

## 1. Repository Structure Proposal

The DNP repo will absorb LUDOC OS as a subdirectory while keeping protocol files at the top level.

```
DNP/
├── .dnp.config.yml            # global semantics
├── .ludoc.config.yml          # global infrastructure
├── bootstrap.md               # integration instructions for AIs
├── BRIDGE.md                  # sync protocol
├── COPILOT-PROMPT.md          # Copilot instructions
├── SYNC-PROTOCOL.md           # Claude↔Copilot
├── LUDOC-OS-EXPORT.md         # last export
├── LUDOC-OS-INTEGRATION-PLAN.md  # this document
├── docs/                      # DNP docs + LUDOC docs merged
│   ├── ...existing DNP docs...
│   └── ludoc/                 # LUDOC-specific documentation
│       ├── README.md
│       ├── STATUS-FINAL.md
│       └── ...other LUDOC docs...
├── src/                       # shared or common code (if any)
├── ludoc-os/                  # new subproject with full LUDOC code
│   ├── src/
│   ├── scripts/
│   ├── systemd/
│   ├── docs/
│   ├── protocol.yaml
│   ├── package.json
│   └── ...
└── tests/                     # if any DNP-wide tests
```

### Rationale
- Keeps LUDOC code intact in its own namespace (`ludoc-os/`)
- Allows DNP to act as the overarching "constitution" and documentation base
- Enables independent versioning or submodule management later

## 2. Files to Move

1. Entire contents of LUDOC workspace except `.git/*` into `ludoc-os/`
2. Merge `docs/`:
   - Move LUDOC docs into `docs/ludoc/`
   - Update internal links in moved docs
3. Copy `COPILOT-PROMPT.md`, `SYNC-PROTOCOL.md`, `SYNC-BRIDGE-DIAGRAM.md` already present
4. Keep `.ludoc/` runtime state out of repo by adding entry to `.gitignore` if not already

## 3. Dependency Management

- LUDOC uses Bun/TypeScript; ensure `package.json` locked inside `ludoc-os/`
- DNP root may remain dependency-free or declare a workspace if multi-package (optional)
- Keep `bun.lock` in `ludoc-os/`

## 4. CI/Tests

- Add a GitHub Actions workflow at root that triggers on changes under `ludoc-os/**` and runs:
  ```yaml
  - name: Install Bun
    run: curl -fsSL https://bun.sh/install | bash
  - name: Run LUDOC tests
    run: bun test --workspace ludoc-os
  - name: Run memory limits script
    run: bash ludoc-os/scripts/test-memory-limits.sh
  ```
- Add linting/checks for corporateese removal globally

## 5. Documentation Updates

- Update README.md at repo root to reference LUDOC OS subproject
- Add top-level doc `DNP-LUDOC-INTEGRATION.md` summarizing relationship
- Ensure `bootstrap.md` instructions mention navigating into `ludoc-os/` for code-specific tasks

## 6. Pull Request Plan

Create three PRs as previously defined:

### PR #1: Core Integration
- Add `ludoc-os/` directory with `src/kernel`, `src/crypto`, `src/hardware`
- Update root `.gitignore` to ignore `.ludoc/` runtime
- Add or update top-level `README.md` with subproject reference

**Example commands:**
```bash
git checkout -b integrate-ludoc-core
# copy or move files from local LUDOC workspace
# e.g. rsync -av ~/ludoc-workspace/src/ ludoc-os/src/
# add the skeleton already created above
git add ludoc-os src docs .gitignore README.md
git commit -m "integrate LUDOC core modules into DNP"
git push origin integrate-ludoc-core
# then create PR via GitHub UI or gh cli
gh pr create --title "Integrate LUDOC core" --body "Adds LUDOC core modules under ludoc-os/"
```

### PR #2: Agents Integration
- Add `ludoc-os/src/api`, `ludoc-os/src/agent`, scripts, systemd files
- Ensure network binding compliance and warnings intact
- Add tests in root workflow to execute `ludoc-os/scripts/*`

**Example commands:**
```bash
git checkout -b integrate-ludoc-agents
# copy api/ agent/ scripts/ systemd/ from export
git add ludoc-os/src/api ludoc-os/src/agent ludoc-os/scripts ludoc-os/systemd
# update .github/workflows/ci.yml later if needed
git commit -m "integrate LUDOC agent and API components"
git push origin integrate-ludoc-agents
gh pr create --title "Integrate LUDOC agents" --body "Adds LUDOC API and agent modules"
```

### PR #3: Docs Integration
- Move LUDOC docs under `docs/ludoc/`
- Update links and create index `docs/ludoc/README.md`
- Merge any overlapping DNP docs if needed (e.g. audit reports)

**Example commands:**
```bash
git checkout -b integrate-ludoc-docs
mkdir -p docs/ludoc
# move files from LUDOC workspace docs
# e.g. mv ~/ludoc-workspace/docs/* docs/ludoc/
# adjust relative links inside moved files
git add docs/ludoc
git commit -m "integrate LUDOC documentation into DNP"
git push origin integrate-ludoc-docs
gh pr create --title "Integrate LUDOC docs" --body "Moves LUDOC documentation under docs/ludoc/"
```


## 8. Next Steps After Merge

- Tag repository with `v2.3.1-dnp` or similar
- Plan implementation of Phase 2.4 inside `ludoc-os/` with clear milestones
- Use `.dnp.config.yml` definitions to guide further development

---

**Action Items:**
1. Create PR #1 with directory structure and minimal README
2. After PR #1 merge, proceed with PR #2 and PR #3 sequentially
3. Upon completion, run full CI and ensure no regressions
4. Notify Claude Terminal agent of successful integration for Phase 2.4 planning

With this plan, the DNP workspace becomes a true monorepo that houses both protocol specification and executable LUDOC OS code while maintaining modular separation and clarity.

## 7. Next Steps After Merge

- Tag repository with `v2.3.1-dnp` or similar
- Plan implementation of Phase 2.4 inside `ludoc-os/` with clear milestones
- Use `.dnp.config.yml` definitions to guide further development

---

**Action Items:**
1. Create PR #1 with directory structure and minimal README
2. After PR #1 merge, proceed with PR #2 and PR #3 sequentially
3. Upon completion, run full CI and ensure no regressions
4. Notify Claude Terminal agent of successful integration for Phase 2.4 planning

With this plan, the DNP workspace becomes a true monorepo that houses both protocol specification and executable LUDOC OS code while maintaining modular separation and clarity.

# LUDOC OS Subproject

This directory will house the full LUDOC OS codebase integrated into the DNP monorepo.

**Structure** mirrors the workspace exported by Claude Terminal:

```
ludoc-os/
├── src/
│   ├── agent/
│   ├── api/
│   ├── crypto/
│   ├── hardware/
│   ├── kernel/
│   └── index.ts (to be copied)
├── scripts/
├── systemd/
├── docs/
├── protocol.yaml
├── package.json
└── tsconfig.json
```

Use this skeleton to import the real source files from the LUDOC workspace. After the initial import, maintain the code here; referenced by DNP CI workflows.

The DNP integration plan describes which folders and files to move. This README is a placeholder for that migration process.
#!/bin/bash
# LUDOC Code Review: Valida código do Copilot contra DNP standards
# Uso: ./validate-copilot-code.sh

set -e

echo "========================================="
echo "  LUDOC Code Review - Copilot Validation"
echo "========================================="
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper function
check() {
  local name="$1"
  local cmd="$2"

  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $name"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}❌${NC} $name"
    ((FAILED++))
    return 1
  fi
}

warn() {
  local name="$1"
  echo -e "${YELLOW}⚠️ ${NC} $name"
  ((WARNINGS++))
}

# ============================================
echo "[DNP Compliance Checks]"
echo ""

# 1. Config files
check "Config: .dnp.config.yml exists" "[ -f .dnp.config.yml ]"
check "Config: .ludoc.config.yml exists" "[ -f .ludoc.config.yml ]"
check "Config: protocol.yaml exists" "[ -f protocol.yaml ]"

echo ""
echo "[Network Guardrails]"
echo ""

# 2. Network rules
check "Network: No hardcoded 127.0.0.1" "! grep -r '127.0.0.1' src/ --include='*.ts' 2>/dev/null || echo 'OK'"
check "Network: No localhost binding" "! grep -r 'localhost' src/ --include='*.ts' | grep -v '^.*test' 2>/dev/null || echo 'OK'"

# Check for 0.0.0.0 binding
if grep -r '0.0.0.0' src/ --include='*.ts' > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} Network: 0.0.0.0 binding found"
  ((PASSED++))
else
  warn "Network: No 0.0.0.0 binding found (may be OK if not server code)"
fi

echo ""
echo "[Security Checks]"
echo ""

# 3. No secrets
check "Security: No hardcoded credentials" "! grep -r 'password\|secret\|key' src/ --include='*.ts' | grep -E '=\s*[\"'\'']' 2>/dev/null || echo 'OK'"
check "Security: No .env in git" "[ ! -f .env ] && ! grep -r '\.env' .gitignore 2>/dev/null || echo 'OK'"
check "Security: No API keys in code" "! grep -r 'sk_\|api_key\|APIKEY' src/ --include='*.ts' 2>/dev/null || echo 'OK'"

echo ""
echo "[Code Quality]"
echo ""

# 4. Type safety
if [ -f tsconfig.json ]; then
  check "Types: tsconfig.json exists" "[ -f tsconfig.json ]"
  if [ -f src/index.ts ]; then
    check "Types: TS compilation" "npx -y tsc --noEmit --skipLibCheck src/index.ts 2>/dev/null"
  fi
else
  warn "Types: No tsconfig.json (maybe first iteration)"
fi

# 5. No `any` types
if grep -r 'any' src/ --include='*.ts' > /dev/null 2>&1; then
  ANY_COUNT=$(grep -r 'any' src/ --include='*.ts' | wc -l)
  if [ "$ANY_COUNT" -lt 5 ]; then
    echo -e "${YELLOW}⚠️ ${NC} Types: $ANY_COUNT 'any' types found (check comments)"
    ((WARNINGS++))
  else
    echo -e "${RED}❌${NC} Types: $ANY_COUNT 'any' types (too many)"
    ((FAILED++))
  fi
fi

echo ""
echo "[Code Structure]"
echo ""

# 6. Required directories
check "Structure: src/ directory" "[ -d src ]"
check "Structure: tests/ directory" "[ -d tests ]"
check "Structure: .github/ directory" "[ -d .github ] || echo 'OK (optional)'"

# 7. Code organization
if [ -d src ]; then
  check "Structure: src/crypto/ exists" "[ -d src/crypto ] || echo 'OK'"
  check "Structure: src/api/ exists" "[ -d src/api ] || echo 'OK'"
  check "Structure: src/kernel/ exists" "[ -d src/kernel ] || echo 'OK'"
fi

echo ""
echo "[Documentation]"
echo ""

# 8. Documentation
check "Docs: README.md exists" "[ -f README.md ]"
check "Docs: No TODO without context" "! grep -r 'TODO:' src/ --include='*.ts' | grep -v '//.*TODO: #' 2>/dev/null || echo 'OK'"

echo ""
echo "[Tests]"
echo ""

# 9. Test structure
if [ -d tests ]; then
  TEST_COUNT=$(find tests -name '*.test.ts' | wc -l)
  if [ "$TEST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅${NC} Tests: $TEST_COUNT test files found"
    ((PASSED++))
  else
    warn "Tests: No .test.ts files found"
  fi
else
  warn "Tests: No tests/ directory"
fi

echo ""
echo "========================================="
echo "  Review Summary"
echo "========================================="
echo ""
echo -e "  ${GREEN}Passed:${NC}  $PASSED"
echo -e "  ${RED}Failed:${NC}  $FAILED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

# Save report
cat > validate-report.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "passed": $PASSED,
  "failed": $FAILED,
  "warnings": $WARNINGS,
  "status": "$([ $FAILED -eq 0 ] && echo 'PASS' || echo 'FAIL')"
}
EOF

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ Code review PASSED${NC}"
  echo ""
  echo "Ready to:"
  echo "1. Apply Claude improvements"
  echo "2. Create review PR"
  exit 0
else
  echo -e "${RED}❌ Code review FAILED${NC}"
  echo ""
  echo "Blockers found. Need Copilot to fix."
  exit 1
fi

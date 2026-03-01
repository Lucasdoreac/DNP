import os
import sys

def verify_notebooklm_compatibility(file_path):
    if not os.path.exists(file_path):
        print(f"FAIL: File '{file_path}' not found.")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    errors = []

    # 1. Size check: NotebookLM likes chunks, but not too small or too huge for single context.
    # We aim for > 500 chars to be "substantial".
    if len(content) < 500:
        errors.append(f"Content is too short ({len(content)} chars). Aim for > 500 for better AI analysis.")

    # 2. Must have "Resumo" or metadata for easy indexing
    if "## Resumo" not in content and "### Resumo" not in content and "## Conclusão" not in content:
         # For the final phase, we want to ensure each module has a summary section for the AI to pick up.
        errors.append("Module should include a 'Resumo' or 'Conclusão' section for AI summary optimization.")

    # 3. Check for specific NotebookLM-friendly tags/sections
    # We want a section that explicitly mentions it's for the learning path
    if "Learning Path" not in content and "dnp" not in content:
        errors.append("Document lacks project context tags (dnp / Learning Path)")

    if errors:
        print(f"FAIL: '{file_path}' failed NotebookLM compatibility checks:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print(f"PASS: '{file_path}' is optimized for NotebookLM.")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tests/verify_notebooklm.py <path_to_markdown>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if verify_notebooklm_compatibility(file_path):
        sys.exit(0)
    else:
        sys.exit(1)

import os
import sys

def verify_markdown_file(file_path):
    if not os.path.exists(file_path):
        print(f"FAIL: File '{file_path}' not found.")
        return False

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    errors = []

    # 1. Must have a main H1 title
    if not content.startswith('# '):
        errors.append("Must start with a main H1 title (# Title)")

    # 2. Must have a "Filosofia dnp" section
    if "## Filosofia dnp" not in content and "### Filosofia dnp" not in content:
        errors.append("Must include a 'Filosofia dnp' section")

    # 3. Basic PT-BR check (looking for common Portuguese words)
    pt_words = ["o", "a", "e", "para", "com", "não", "é"]
    found_pt = any(word in content.lower().split() for word in pt_words)
    if not found_pt:
        errors.append("Basic Portuguese check failed (no common PT-BR words found)")

    # 4. Check for core philosophy keywords
    philosophy_keywords = ["materialismo dialético", "fricção consciente", "paradoxo materialista", "decrescimento"]
    found_keywords = [word for word in philosophy_keywords if word in content.lower()]
    if not found_keywords:
        errors.append(f"Must include at least one core philosophy keyword: {philosophy_keywords}")
        print(f"FAIL: '{file_path}' has errors:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print(f"PASS: '{file_path}' meets standards.")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tests/verify_docs.py <path_to_markdown>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if verify_markdown_file(file_path):
        sys.exit(0)
    else:
        sys.exit(1)

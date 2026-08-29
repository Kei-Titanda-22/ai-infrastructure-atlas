#!/usr/bin/env python3
"""Conservative working-tree secret-pattern guard.

This is not a substitute for GitHub secret scanning or history review. It is a CI tripwire
for obvious committed secrets and private key material.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {'.git', 'node_modules', 'dist', '.astro'}
ALLOWED_NAMES = {'.env.example'}
PATTERNS = [
    ('private key', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----')),
    ('GitHub token', re.compile(r'gh[pousr]_[A-Za-z0-9_]{30,}')),
    ('AWS access key', re.compile(r'AKIA[0-9A-Z]{16}')),
    ('generic assigned secret', re.compile(r'(?i)(api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["\']?[A-Za-z0-9_\-]{20,}')),
]
TEXT_EXTS = {'.md','.json','.ts','.js','.mjs','.astro','.py','.yml','.yaml','.txt','.toml','.ini','.env'}

hits = []
for path in ROOT.rglob('*'):
    if not path.is_file() or any(part in SKIP_DIRS for part in path.parts):
        continue
    if path.name in ALLOWED_NAMES:
        continue
    if path.suffix.lower() not in TEXT_EXTS and not path.name.startswith('.env'):
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        continue
    for label, pat in PATTERNS:
        if pat.search(text):
            hits.append(f'{path.relative_to(ROOT)}: possible {label}')

if hits:
    print('Secret scan FAILED')
    for hit in hits:
        print(' -', hit)
    raise SystemExit(1)
print('Secret scan OK: no obvious committed secrets detected')

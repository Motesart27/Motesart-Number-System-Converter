#!/usr/bin/env python3
"""
Motesart Number System Converter — Project Snapshot Generator
Generates SNAPSHOT.md with current project state for AI session context.
Run: python snapshot.py
"""

import os
import subprocess
import json
import datetime

IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', '.next', '.vercel', 'venv', '.netlify'}
IGNORE_FILES = {'package-lock.json', '.DS_Store'}

def get_file_tree(root='.', prefix='', max_depth=4, current_depth=0):
    if current_depth >= max_depth:
        return ''
    lines = []
    try:
        entries = sorted(os.listdir(root))
    except PermissionError:
        return ''
    dirs = [e for e in entries if os.path.isdir(os.path.join(root, e)) and e not in IGNORE_DIRS]
    files = [e for e in entries if os.path.isfile(os.path.join(root, e)) and e not in IGNORE_FILES]
    for f in files:
        lines.append(f'{prefix}{f}')
    for d in dirs:
        lines.append(f'{prefix}{d}/')
        lines.append(get_file_tree(os.path.join(root, d), prefix + '  ', max_depth, current_depth + 1))
    return '\n'.join(lines)

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode().strip()
    except Exception:
        return '(unavailable)'

def generate_snapshot():
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    branch = run('git rev-parse --abbrev-ref HEAD')
    last_commit = run('git log -1 --oneline')
    recent_commits = run('git log --oneline -10')

    # Dependencies from package.json
    deps = ''
    if os.path.exists('package.json'):
        with open('package.json') as f:
            pkg = json.load(f)
            deps_dict = pkg.get('dependencies', {})
            dev_deps_dict = pkg.get('devDependencies', {})
            deps = 'Dependencies:\n'
            for k, v in deps_dict.items():
                deps += f'  {k}: {v}\n'
            deps += '\nDev Dependencies:\n'
            for k, v in dev_deps_dict.items():
                deps += f'  {k}: {v}\n'

    # Quick diff (last 3 days)
    three_days_ago = (datetime.datetime.now() - datetime.timedelta(days=3)).strftime('%Y-%m-%d')
    quick_diff = run(f'git log --oneline --since="{three_days_ago}"')

    tree = get_file_tree()

    snapshot = f"""# SNAPSHOT — Motesart Number System Converter
> Generated: {now}
> Branch: {branch}
> Last Commit: {last_commit}

## File Tree
\`\`\`
{tree}
\`\`\`

## Recent Commits (last 10)
\`\`\`
{recent_commits}
\`\`\`

## Dependencies
\`\`\`
{deps}
\`\`\`

## Quick Diff (last 3 days)
\`\`\`
{quick_diff if quick_diff else '(no changes in last 3 days)'}
\`\`\`
"""

    with open('SNAPSHOT.md', 'w') as f:
        f.write(snapshot)
    print(f'SNAPSHOT.md generated at {now}')

if __name__ == '__main__':
    generate_snapshot()

#!/usr/bin/env python3
"""Create a source-complete, offline playable handoff without development caches."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
output = root.parent / 'artifacts' / 'kick-and-goal.zip'
output.parent.mkdir(exist_ok=True)
files = [root / name for name in ('index.html', 'start-local.py', 'README.md', 'package.json', 'package-lock.json')]
for folder in ('css', 'js', 'vendor', 'scripts', 'tests'):
    files.extend(p for p in (root / folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    for file in sorted(files):
        archive.write(file, Path('kick-and-goal') / file.relative_to(root))
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert 'kick-and-goal/vendor/phaser-4.2.0.min.js' in archive.namelist()
print(f'Packaged {len(files)} files: {output} ({output.stat().st_size:,} bytes)')

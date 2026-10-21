#!/usr/bin/env python3
"""Erzeugt die JS-Wrapper (i18n/de.js, data/tracks/*.js) aus den JSON-Quellen,
damit die Präsentation auch ab Datei (file://, ohne Server) läuft. Nach jeder
Änderung an einer JSON-Datei ausführen: python3 tools/sync.py"""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
for src in sorted((root / 'i18n').glob('*.json')):
    data = json.loads(src.read_text(encoding='utf-8'))
    (root / 'i18n' / (src.stem + '.js')).write_text('window.I18N = ' + json.dumps(data, ensure_ascii=False) + ';\n', encoding='utf-8')
    print('i18n', src.name, '->', src.stem + '.js', len(data), 'Schlüssel')
tracks = {}
for src in sorted((root / 'data' / 'tracks').glob('*.json')):
    data = json.loads(src.read_text(encoding='utf-8'))
    (root / 'data' / 'tracks' / (src.stem + '.js')).write_text(
        'window.TRACKS = window.TRACKS || {}; window.TRACKS[' + json.dumps(src.stem) + '] = ' + json.dumps(data, separators=(',', ':')) + ';\n', encoding='utf-8')
    print('track', src.name, len(data['points']), 'Punkte')

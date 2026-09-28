"""Refresh acceptance evidence while preserving the supplied Word document layout."""
import json
from pathlib import Path
import zipfile
from xml.dom import minidom

root = Path(__file__).resolve().parent
report = json.loads((root / 'phase1-test-results.json').read_text(encoding='utf-8'))
assert report['passed'] >= 30 and all(r['status'] == 'passed' for r in report['results']), 'Complete acceptance run required'
target = root / 'specifications/Deeparture_V2_Phase1_Test_Checklist (1).docx'
with zipfile.ZipFile(target) as archive:
    entries = [(item, archive.read(item.filename)) for item in archive.infolist()]
doc = minidom.parseString(dict((item.filename, data) for item, data in entries)['word/document.xml'])

def text(node):
    return ''.join(t.firstChild.data if t.firstChild else '' for t in node.getElementsByTagName('w:t'))

def replace(node, value):
    texts = node.getElementsByTagName('w:t')
    assert texts
    for t in texts:
        while t.firstChild:
            t.removeChild(t.firstChild)
    texts[0].appendChild(doc.createTextNode(value))

rows = list(doc.getElementsByTagName('w:tr'))
for row in rows:
    cells = row.getElementsByTagName('w:tc')
    if len(cells) != 5 or text(cells[0]) == 'Test':
        continue
    if '\u2713' in text(cells[2]):
        replace(cells[4], 'LOCAL PASS (2026-09-29): verified against isolated local MongoDB and production frontend. Evidence: docs/phase1-test-results.json and docs/phase1-review.md. Hosted deployment not verified.')
    elif 'private V2 GitHub' in text(cells[0]):
        replace(cells[4], 'PENDING: verify private repository and Render deployed revision. Local base: main / 2fd67d2 with uncommitted review changes.')
    elif 'Staging email configuration' in text(cells[0]):
        replace(cells[4], 'PENDING: confirm deployed EMAIL_DELIVERY_MODE=test. Local SMTP-safety regression passes even with SMTP credentials configured; Compose defaults to test mode.')

extra = [
    ('Claim invitation security and existing-account protection work.', 'Admin-only invitation; hashed, expiring token; concurrent single use; existing password retained.', 'claim invitations are admin-only, hashed, expiring, single-use and preserve existing credentials and ownership'),
    ('Deeparture editorial fields cannot be self-awarded by operators.', 'Vessel and resort ratings, verification and publication require admin permission.', 'operators cannot self-award editorial ratings, verification or publication'),
    ('Catalogue-first claim state and import provenance are retained.', 'Imported organisation starts unclaimed; published page exists before claim; source and last-checked timestamp retained.', 'catalogue-first unclaimed organisation, published page and import provenance'),
]
template = next(r for r in rows if "Unauthorised users cannot edit" in text(r))
for title, requirement, evidence in extra:
    if any(title in text(r) for r in rows):
        continue
    assert any(r['label'] == evidence for r in report['results'])
    row = template.cloneNode(deep=True)
    values = [title, requirement, '[\u2713]', '[ ]', 'LOCAL PASS: ' + evidence + '. See docs/phase1-test-results.json. Added from shared specification sections 6, 7 and 9.']
    for cell, value in zip(row.getElementsByTagName('w:tc'), values):
        replace(cell, value)
    template.parentNode.appendChild(row)

checks = [r for r in doc.getElementsByTagName('w:tr') if len(r.getElementsByTagName('w:tc')) == 5 and text(r.getElementsByTagName('w:tc')[0]) != 'Test']
passed = sum('\u2713' in text(r.getElementsByTagName('w:tc')[2]) for r in checks)
for paragraph in doc.getElementsByTagName('w:p'):
    value = text(paragraph)
    if value.startswith('Audit scope:'):
        replace(paragraph, f'Audit scope: {passed}/{len(checks)} checklist items passed locally; {len(checks)-passed} pending external/staging evidence or final sign-off. {report["passed"]} API/browser check groups and 10 regression tests passed. Overall Phase 1 acceptance remains PENDING. A tick means locally verified only. Three missing requirement checks have been added.')
    elif value.startswith('GitHub branch/commit:'):
        replace(paragraph, 'GitHub branch/commit: main / 2fd67d2 + uncommitted local review fixes')
    elif value.startswith('Frontend staging URL:'):
        replace(paragraph, 'Frontend staging URL: not supplied; isolated production frontend http://localhost:3019 tested')
    elif value.startswith('Backend/API URL:'):
        replace(paragraph, 'Backend/API URL: isolated http://localhost:5019; Render deployment not verified')

temporary = target.with_suffix('.tmp.docx')
with zipfile.ZipFile(temporary, 'w') as archive:
    for item, data in entries:
        archive.writestr(item, doc.toxml(encoding='UTF-8') if item.filename == 'word/document.xml' else data)
with zipfile.ZipFile(temporary) as archive:
    assert archive.testzip() is None
    minidom.parseString(archive.read('word/document.xml'))
temporary.replace(target)
print(f'Updated checklist: {passed}/{len(checks)} local passes; {len(checks)-passed} pending.')

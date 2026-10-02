import json
from pathlib import Path

base = Path(__file__).resolve().parent
original = json.loads((base / 'libros.json').read_text(encoding='utf-8'))
files = sorted((base / 'libros').glob('*.json'))
files = [p for p in files if p.name != 'mangas.json']

distributed = []
for path in files:
    distributed.extend(json.loads(path.read_text(encoding='utf-8')))

key = lambda book: (book.get('titulo', ''), book.get('id_autor'), book.get('anio'))
orig_keys = {key(book) for book in original}
dist_keys = {key(book) for book in distributed}

print('Original total:', len(original))
print('Split total:', len(distributed))
print('Difference:', len(distributed) - len(original))
print('Missing in split:', len(orig_keys - dist_keys))
print('Extra in split:', len(dist_keys - orig_keys))
print('Unique types:', sorted({book.get('tipo') for book in original}))
print('PASS:', len(distributed) == len(original) and not (orig_keys - dist_keys) and not (dist_keys - orig_keys))

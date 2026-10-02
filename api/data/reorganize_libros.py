import json
import os
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / 'api' / 'data'
ORIGINAL_PATH = DATA_DIR / 'libros.json'
MANGAS_PATH = DATA_DIR / 'libros' / 'mangas.json'
LIBROS_DIR = DATA_DIR / 'libros'
PUBLIC_DIR = ROOT / 'client' / 'public'

TYPE_FILE_MAP = {
    'Manga': 'mangas.json',
    'Novela': 'novelas.json',
    'Cuento': 'cuentos.json',
    'Poesía': 'poesias.json',
    'Novela Corta': 'novelas_cortas.json',
    'Reportaje': 'reportajes.json',
    'Ensayo': 'ensayos.json',
    'Ensayo/Cuento': 'ensayos_cuentos.json',
    'Cuento/Ensayo': 'cuentos_ensayos.json',
    'Memorias': 'memorias.json',
    'Biografía': 'biografias.json',
    'Fábula': 'fabulas.json',
    'Teatro': 'teatros.json',
    'Cómic': 'comics.json',
    'Epopeya': 'epopeyas.json',
    'Filosófico': 'filosoficos.json',
    'Ficción': 'ficciones.json',
    'Histórico': 'historicos.json',
    'Libro': 'libros_generales.json',
}


def normalize_key(book):
    return (
        (book.get('titulo') or '').strip(),
        book.get('id_autor'),
        book.get('anio')
    )


def slugify_type(tipo):
    text = unicodedata.normalize('NFKD', str(tipo)).encode('ascii', 'ignore').decode('ascii')
    text = text.strip().lower()
    text = text.replace('/', '_').replace(' ', '_').replace('-', '_')
    text = re.sub(r'[^a-z0-9_]+', '_', text)
    text = re.sub(r'_+', '_', text).strip('_')
    return text


def path_from_url(url):
    if not url:
        return None
    normalized = url.strip()
    if normalized.startswith('/'): 
        return PUBLIC_DIR / normalized.lstrip('/')
    return PUBLIC_DIR / normalized


def fix_cover_url(book):
    url = (book.get('url_portada') or '').strip()
    if not url:
        return book
    if url.startswith('/portadasLibros/'):
        fs_path = path_from_url(url)
        if fs_path.exists():
            return book

        basename = os.path.basename(url)
        matches = sorted(
            str(p.relative_to(PUBLIC_DIR)).replace('\\', '/')
            for p in PUBLIC_DIR.glob(f'**/{basename}')
            if p.is_file()
        )
        if len(matches) == 1:
            book['url_portada'] = '/' + matches[0]
    return book


def detect_cover_issues(books):
    issues = []
    valid_count = 0
    missing_count = 0
    suspicious_count = 0
    duplicate_urls = defaultdict(list)

    for idx, book in enumerate(books):
        url = (book.get('url_portada') or '').strip()
        if not url:
            issues.append({'titulo': book.get('titulo'), 'issue': 'sin_url_portada'})
            continue
        if url.startswith('/portadasLibros/'):
            fs_path = path_from_url(url)
            if fs_path.exists():
                valid_count += 1
            else:
                missing_count += 1
                issues.append({'titulo': book.get('titulo'), 'url_portada': url, 'issue': 'inexistente'})
        else:
            suspicious_count += 1
            issues.append({'titulo': book.get('titulo'), 'url_portada': url, 'issue': 'ruta_sospechosa'})

        duplicate_urls[url].append(book.get('titulo'))

    duplicated = {url: titles for url, titles in duplicate_urls.items() if len(titles) > 1}
    return {
        'valid_count': valid_count,
        'missing_count': missing_count,
        'suspicious_count': suspicious_count,
        'duplicates': duplicated,
        'issues': issues,
    }


with ORIGINAL_PATH.open('r', encoding='utf-8') as f:
    original_books = json.load(f)

for book in original_books:
    fix_cover_url(book)

with MANGAS_PATH.open('r', encoding='utf-8') as f:
    manga_books = json.load(f)

orig_keys = [normalize_key(b) for b in original_books]
manga_keys = [normalize_key(b) for b in manga_books]
orig_set = set(orig_keys)
manga_set = set(manga_keys)

def duplicate_keys(keys):
    counts = defaultdict(int)
    for key in keys:
        counts[key] += 1
    dups = {k: v for k, v in counts.items() if v > 1}
    return dups

orig_dups = duplicate_keys(orig_keys)
manga_dups = duplicate_keys(manga_keys)

unique_types = sorted({book.get('tipo') for book in original_books if book.get('tipo')})
print('Original total:', len(original_books))
print('Manga reference total:', len(manga_books))
print('Unique tipos:', unique_types)
print('Manga subset size in original:', len(manga_set & orig_set))
print('Manga only in reference:', len(manga_set - orig_set))
print('Books missing from manga reference:', len(orig_set - manga_set))
print('Origin duplicate keys:', sum(v - 1 for v in orig_dups.values()))
print('Manga duplicate keys:', sum(v - 1 for v in manga_dups.values()))

# Build output by type, but keep existing mangas untouched.
for tipo, filename in TYPE_FILE_MAP.items():
    if tipo == 'Manga':
        continue
    books = [book for book in original_books if book.get('tipo') == tipo]
    if not books:
        continue
    grouped = defaultdict(list)
    for book in books:
        grouped.setdefault(book.get('id_autor'), []).append(book)

    ordered_books = []
    for autor_id in sorted(grouped.keys(), key=lambda item: (item is None, item if item is not None else -1)):
        ordered_books.extend(grouped[autor_id])

    out_path = LIBROS_DIR / filename
    with out_path.open('w', encoding='utf-8') as f:
        json.dump(ordered_books, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'Wrote {filename}: {len(ordered_books)} books')

# final validation
all_split_files = [p for p in LIBROS_DIR.glob('*.json') if p.name != 'mangas.json']
split_total = sum(len(json.load(open(p, encoding='utf-8'))) for p in all_split_files)
print('Generated split total:', split_total)
print('Combined with existing mangas:', split_total + len(manga_books))
print('Difference from original:', (split_total + len(manga_books)) - len(original_books))
print('Manga file preserved:', MANGAS_PATH.exists())

# Cover validation
cover_report = detect_cover_issues(original_books)
print('Cover valid:', cover_report['valid_count'])
print('Cover missing:', cover_report['missing_count'])
print('Cover suspicious:', cover_report['suspicious_count'])
print('Duplicate URL count:', len(cover_report['duplicates']))
if cover_report['issues']:
    print('Missing cover entries:')
    for item in cover_report['issues']:
        if item.get('issue') == 'inexistente':
            print(item['titulo'], '->', item['url_portada'])

# report on file naming map
print('Handled tipo files:', sorted(TYPE_FILE_MAP[key] for key in TYPE_FILE_MAP if key != 'Manga'))

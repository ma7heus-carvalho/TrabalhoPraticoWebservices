import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from scraping.tunefind import buscar_musicas_filme

testes = [
    ("Guardians of the Galaxy", "2014", 284053),
    ("Pulp Fiction", "1994", 680),
    ("The Dark Knight", "2008", 155),
]

for titulo, ano, fid in testes:
    res = buscar_musicas_filme(titulo, fid, ano)
    qtd = len(res.get("musicas", []))
    slug = res.get("slug")
    print(f"[{titulo}] ({ano}) -> {qtd} musicas encontradas via slug '{slug}'")
    if qtd > 0:
        print(f"   Primeira musica: {res['musicas'][0]['titulo']} - {res['musicas'][0]['artista']}")

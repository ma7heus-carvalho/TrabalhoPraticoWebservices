"""
Scraping do Tunefind para buscar músicas de filmes.
Encapsulado em API REST própria para o projeto CineSound.
"""

import json
import logging
import re
import time
from typing import Optional

import requests
from bs4 import BeautifulSoup

from utils.texto import gerar_slug

logger = logging.getLogger(__name__)

# Headers modernos simulando um navegador real
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Referer": "https://www.tunefind.com/",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

_BASE_URL = "https://www.tunefind.com/movie/{slug}"
_MAX_RETRIES = 2
_RETRY_DELAY = 1.5


def _get_html(url: str) -> Optional[str]:
    """
    Realiza requisição HTTP para a URL com retries em caso de falha transitória.
    """
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=_HEADERS, timeout=12)
            if resp.status_code == 200:
                return resp.text
            if resp.status_code == 404:
                return None
            logger.warning("Tentativa %d/%d – status %d para %s", attempt, _MAX_RETRIES, resp.status_code, url)
        except requests.RequestException as exc:
            logger.warning("Tentativa %d/%d – erro de conexão: %s", attempt, _MAX_RETRIES, exc)

        if attempt < _MAX_RETRIES:
            time.sleep(_RETRY_DELAY)

    return None


def _extrair_musicas_html(soup: BeautifulSoup) -> list[dict]:
    """
    Extrai músicas a partir dos links e estruturas HTML reais do Tunefind.
    No Tunefind atual:
      - Título da música está em <a href="/song/...">
      - Artista está em <a href="/artist/..."> ou texto adjacente
    """
    musicas = []
    vistos = set()

    # Procurar todos os links que apontam para /song/
    song_links = soup.find_all("a", href=lambda h: h and "/song/" in h)

    for link in song_links:
        # Texto da música (remover badges como 'Confirmed Correct', 'Your Vote Matters', etc.)
        titulo_bruto = link.get_text(strip=True)
        # Limpar sufixos comuns que vêm no texto do link
        padrao_limpeza = r"(Confirmed\s*Correct|Your\s*Vote\s*Matters|Click\s*to\s*confirm|Featured|Official).*$"
        titulo_limpo = re.sub(padrao_limpeza, "", titulo_bruto, flags=re.IGNORECASE).strip()
        if not titulo_limpo:
            continue

        # Evitar duplicatas
        chave_unicidade = titulo_limpo.lower()
        if chave_unicidade in vistos:
            continue

        # Procurar o artista associado no container próximo
        artista = ""
        cena = ""

        # Subir até 3 níveis na árvore para achar o container da linha da música
        container = link
        for _ in range(4):
            if container.parent:
                container = container.parent
                # Verificar se tem link de artista dentro deste container
                artist_link = container.find("a", href=lambda h: h and "/artist/" in h)
                if artist_link:
                    artista = artist_link.get_text(strip=True)
                    break

        # Se ainda não encontrou artista por link, busca texto adjacente
        if not artista and container:
            textos = list(container.stripped_strings)
            for t in textos:
                if t != titulo_bruto and "confirmed" not in t.lower() and len(t) > 1 and len(t) < 50:
                    artista = t
                    break

        # Tentar capturar descrição de cena
        cena_elem = container.find(class_=lambda c: c and ("scene" in c.lower() or "description" in c.lower()))
        if cena_elem:
            cena = cena_elem.get_text(strip=True)

        vistos.add(chave_unicidade)
        musicas.append({
            "titulo": titulo_limpo,
            "artista": artista or "Artista Desconhecido",
            "cena": cena
        })

    return musicas


def _extrair_via_json_script(soup: BeautifulSoup) -> list[dict]:
    """
    Extrai músicas se houver algum script com schema.org ou JSON de estado inicial.
    """
    musicas = []
    for script in soup.find_all("script", type="application/ld+json"):
        if not script.string:
            continue
        try:
            dados = json.loads(script.string)
            tracks = dados.get("track") or dados.get("tracks") or []
            if isinstance(tracks, list):
                for item in tracks:
                    nome = item.get("name")
                    by_artist = item.get("byArtist", {})
                    artista = by_artist.get("name", "") if isinstance(by_artist, dict) else str(by_artist)
                    if nome:
                        musicas.append({
                            "titulo": nome,
                            "artista": artista,
                            "cena": ""
                        })
        except Exception:
            continue

    return musicas


def buscar_musicas_filme(titulo: str, tmdb_id: int, ano: Optional[str] = None) -> dict:
    """
    Busca músicas de um filme no Tunefind testando variações inteligentes de slug.

    Args:
        titulo: Título do filme.
        tmdb_id: ID TMDb correspondente.
        ano: Ano de lançamento (opcional, melhora correspondência no Tunefind).
    """
    slug_base = gerar_slug(titulo)
    candidatos_slug = []

    # 1. Se ano fornecido, tentar slug com ano primeiro
    if ano:
        candidatos_slug.append(f"{slug_base}-{ano}")
    
    # 2. Slug puro
    candidatos_slug.append(slug_base)

    # 3. Se título contém ano no nome (ex: "Blade Runner 2049"), tentar variações
    match_ano = re.search(r"\b(19\d{2}|20\d{2})\b", titulo)
    if match_ano and not ano:
        candidatos_slug.append(f"{slug_base}-{match_ano.group(1)}")

    html = None
    slug_usado = None

    for slug in candidatos_slug:
        url = _BASE_URL.format(slug=slug)
        logger.info("Tentando URL Tunefind: %s", url)
        html = _get_html(url)
        if html:
            slug_usado = slug
            break

    if not html:
        return {
            "filmeId": tmdb_id,
            "titulo": titulo,
            "musicas": [],
            "aviso": f"Filme '{titulo}' não localizado no Tunefind ou acesso restrito."
        }

    soup = BeautifulSoup(html, "lxml")

    # Estratégia 1: Links e elementos HTML do Tunefind
    musicas = _extrair_musicas_html(soup)

    # Estratégia 2: JSON-LD se houver
    if not musicas:
        musicas = _extrair_via_json_script(soup)

    aviso = None
    if not musicas:
        aviso = f"Nenhuma música listada na página do Tunefind para '{titulo}' ({slug_usado})."

    return {
        "filmeId": tmdb_id,
        "titulo": titulo,
        "slug": slug_usado,
        "musicas": musicas,
        "aviso": aviso
    }

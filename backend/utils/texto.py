"""
Utilitários de texto para o projeto CineSound.
"""

import re
import unicodedata


def gerar_slug(titulo: str) -> str:
    """
    Gera um slug URL-amigável a partir de um título.

    - Remove acentos (normaliza para NFD e filtra caracteres de categoria Mn)
    - Converte para lowercase
    - Substitui espaços e underscores por hífens
    - Remove caracteres que não sejam alfanuméricos ou hífens
    - Colapsa hífens consecutivos
    - Remove hífens no início/fim

    Args:
        titulo: Título do filme (pode conter acentos, espaços, etc.)

    Returns:
        Slug normalizado, e.g. "O Poderoso Chefão" -> "o-poderoso-chefao"
    """
    if not titulo:
        return ""

    # Normaliza Unicode para NFD e remove marcas de acento (categoria Mn)
    nfkd = unicodedata.normalize("NFD", titulo)
    sem_acentos = "".join(c for c in nfkd if unicodedata.category(c) != "Mn")

    # Lowercase
    slug = sem_acentos.lower()

    # Substitui espaços e underscores por hífens
    slug = re.sub(r"[\s_]+", "-", slug)

    # Remove caracteres que não sejam alfanuméricos ou hífens
    slug = re.sub(r"[^a-z0-9\-]", "", slug)

    # Colapsa hífens consecutivos
    slug = re.sub(r"-{2,}", "-", slug)

    # Remove hífens no início e no fim
    slug = slug.strip("-")

    return slug

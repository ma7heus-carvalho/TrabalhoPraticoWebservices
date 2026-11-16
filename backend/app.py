"""
CineSound – Backend Flask
Servidor de API REST própria que encapsula scraping do Tunefind.
"""

import logging
import sys
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

# Garante visibilidade dos módulos locais
sys.path.insert(0, os.path.dirname(__file__))

from scraping.tunefind import buscar_musicas_filme

# ---------------------------------------------------------------------------
# Configurações e Logs
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("cinesound")

app = Flask(__name__)

# Habilita CORS irrestrito para endpoints de API
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ---------------------------------------------------------------------------
# Rotas REST
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    """Endpoint de checagem de saúde da API própria."""
    return jsonify({
        "status": "ok",
        "servico": "CineSound API REST",
        "versao": "1.0.0"
    }), 200


@app.route("/api/filmes/<int:tmdb_id>/musicas", methods=["GET"])
def obter_musicas_filme(tmdb_id: int):
    """
    Retorna as músicas da trilha sonora extraídas do Tunefind.
    
    Query Params:
        titulo (str, obrigatório): título do filme
        ano (str, opcional): ano de lançamento do filme
    """
    titulo = request.args.get("titulo", "").strip()
    ano = request.args.get("ano", "").strip() or None

    if not titulo:
        return jsonify({
            "erro": "O parâmetro query 'titulo' é obrigatório."
        }), 400

    logger.info("Requisição: filmeId=%d, titulo='%s', ano=%s", tmdb_id, titulo, ano)

    try:
        dados = buscar_musicas_filme(titulo=titulo, tmdb_id=tmdb_id, ano=ano)
        return jsonify(dados), 200
    except Exception as exc:
        logger.exception("Falha ao extrair músicas para %s", titulo)
        return jsonify({
            "filmeId": tmdb_id,
            "titulo": titulo,
            "musicas": [],
            "erro": str(exc),
            "aviso": "Falha no processamento de scraping."
        }), 500


# ---------------------------------------------------------------------------
# Tratamento de Erros HTTP
# ---------------------------------------------------------------------------

@app.errorhandler(404)
def recurso_nao_encontrado(e):
    return jsonify({"erro": "Endpoint não encontrado.", "codigo": 404}), 404


@app.errorhandler(405)
def metodo_nao_permitido(e):
    return jsonify({"erro": "Método HTTP não permitido.", "codigo": 405}), 405


@app.errorhandler(500)
def erro_servidor(e):
    return jsonify({"erro": "Erro interno do servidor.", "codigo": 500}), 500


# ---------------------------------------------------------------------------
# Execução
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    porta = int(os.environ.get("PORT", 5000))
    print(f"🎬 CineSound Backend rodando em http://localhost:{porta}")
    app.run(host="0.0.0.0", port=porta, debug=False)

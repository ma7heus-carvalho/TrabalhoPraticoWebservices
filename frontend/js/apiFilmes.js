/**
 * apiFilmes.js
 * Integração com o backend Flask para busca de músicas de filmes via Tunefind.
 */

const BACKEND_URL = 'http://localhost:5000';

/**
 * Busca músicas de um filme pelo backend Flask (que faz scraping no Tunefind).
 * @param {number} filmeId - ID TMDb do filme
 * @param {string} titulo - Título do filme para busca no Tunefind
 * @param {string|number} [ano] - Ano de lançamento do filme (opcional, melhora correspondência)
 * @returns {Promise<Array>} Lista de músicas ou array vazio em caso de erro
 */
export async function buscarMusicasFilme(filmeId, titulo, ano) {
  try {
    const url = new URL(`${BACKEND_URL}/api/filmes/${filmeId}/musicas`);
    url.searchParams.set('titulo', titulo);
    if (ano && ano !== '—') {
      url.searchParams.set('ano', String(ano));
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      console.warn(`Backend retornou status ${res.status} para filme ${filmeId} (${titulo})`);
      return [];
    }

    const data = await res.json();
    return data.musicas || [];
  } catch (e) {
    console.warn(`Erro ao conectar com o backend para o filme ${filmeId} (${titulo}):`, e.message);
    return [];
  }
}

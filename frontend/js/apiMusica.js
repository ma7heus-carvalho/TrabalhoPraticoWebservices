/**
 * apiMusica.js
 * Stub para enriquecimento de dados musicais.
 * Pode ser implementado futuramente com Spotify, Last.fm, etc.
 */

/**
 * Enriquece dados de uma música com informações adicionais.
 * Atualmente retorna os dados como estão (stub).
 * @param {string} titulo - Título da música
 * @param {string} artista - Nome do artista
 * @returns {Promise<Object>} Dados da música (possivelmente enriquecidos)
 */
export async function enriquecerMusica(titulo, artista) {
  // Stub: retorna os dados como recebidos.
  // Implementação futura pode chamar Spotify API, Last.fm, etc.
  return {
    titulo,
    artista,
    // Campos que poderiam ser preenchidos futuramente:
    // genero: null,
    // bpm: null,
    // energia: null,
    // popularidade: null,
    // previewUrl: null,
  };
}

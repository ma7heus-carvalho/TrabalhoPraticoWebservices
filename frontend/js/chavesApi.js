/**
 * chavesApi.js
 * Gerenciador de chaves de API com rodízio circular e persistência em localStorage.
 */

class GerenciadorChaves {
  constructor() {
    this._chaves = { tmdb: [], gemini: [] };
    this._indices = { tmdb: 0, gemini: 0 };
    this._carregar();
  }

  _carregar() {
    try {
      const salvo = localStorage.getItem('cinesound_chaves');
      if (salvo) {
        const parsed = JSON.parse(salvo);
        this._chaves.tmdb = parsed.tmdb || [];
        this._chaves.gemini = parsed.gemini || [];
      }
    } catch (e) {
      console.warn('Erro ao carregar chaves do localStorage:', e);
    }
  }

  _salvar() {
    try {
      localStorage.setItem('cinesound_chaves', JSON.stringify(this._chaves));
    } catch (e) {
      console.warn('Erro ao salvar chaves no localStorage:', e);
    }
  }

  _normalizar(api) {
    return api.toLowerCase();
  }

  /**
   * Adiciona uma chave à lista da API especificada.
   * @param {string} api - 'tmdb' ou 'gemini'
   * @param {string} chave
   */
  adicionarChave(api, chave) {
    const a = this._normalizar(api);
    if (!this._chaves[a]) throw new Error(`API desconhecida: ${api}`);
    chave = chave.trim();
    if (!chave) throw new Error('Chave vazia não é permitida.');
    if (this._chaves[a].includes(chave)) throw new Error('Chave já cadastrada.');
    this._chaves[a].push(chave);
    this._salvar();
  }

  /**
   * Remove uma chave da lista da API especificada.
   * @param {string} api
   * @param {string} chave
   */
  removerChave(api, chave) {
    const a = this._normalizar(api);
    if (!this._chaves[a]) throw new Error(`API desconhecida: ${api}`);
    const idx = this._chaves[a].indexOf(chave);
    if (idx === -1) throw new Error('Chave não encontrada.');
    this._chaves[a].splice(idx, 1);
    // Ajustar índice de rodízio
    if (this._indices[a] >= this._chaves[a].length) {
      this._indices[a] = 0;
    }
    this._salvar();
  }

  /**
   * Retorna a próxima chave no rodízio circular.
   * @param {string} api
   * @returns {string}
   */
  obterProximaChave(api) {
    const a = this._normalizar(api);
    if (!this._chaves[a]) throw new Error(`API desconhecida: ${api}`);
    if (this._chaves[a].length === 0) {
      throw new Error(`Nenhuma chave cadastrada para ${api.toUpperCase()}. Configure suas chaves antes de continuar.`);
    }
    const idx = this._indices[a] % this._chaves[a].length;
    this._indices[a] = (idx + 1) % this._chaves[a].length;
    return this._chaves[a][idx];
  }

  /**
   * Move a chave com falha para o fim da fila.
   * @param {string} api
   * @param {string} chave
   */
  marcarChaveComoFalha(api, chave) {
    const a = this._normalizar(api);
    if (!this._chaves[a]) return;
    const idx = this._chaves[a].indexOf(chave);
    if (idx === -1) return;
    // Remove da posição atual e coloca no fim
    this._chaves[a].splice(idx, 1);
    this._chaves[a].push(chave);
    this._indices[a] = 0;
    this._salvar();
  }

  /**
   * Retorna todas as chaves de uma API (para exibição na UI).
   * @param {string} api
   * @returns {string[]}
   */
  listarChaves(api) {
    const a = this._normalizar(api);
    return [...(this._chaves[a] || [])];
  }

  /**
   * Verifica se há chaves cadastradas para uma API.
   * @param {string} api
   * @returns {boolean}
   */
  temChaves(api) {
    const a = this._normalizar(api);
    return (this._chaves[a] || []).length > 0;
  }
}

export const gerenciadorChaves = new GerenciadorChaves();

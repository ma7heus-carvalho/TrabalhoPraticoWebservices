/**
 * apiTmdb.js
 * Integração com a API do The Movie Database (TMDb).
 */

import { gerenciadorChaves } from './chavesApi.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

export const GENEROS_FILME = {
  'Ação': 28,
  'Comédia': 35,
  'Drama': 18,
  'Terror': 27,
  'Ficção Científica': 878,
  'Romance': 10749,
  'Animação': 16,
  'Thriller': 53,
  'Aventura': 12,
  'Documentário': 99,
};

class ApiTmdb {
  /**
   * Faz uma requisição autenticada à TMDb, com rodízio de chaves.
   */
  async _fetch(endpoint, params = {}) {
    let tentativas = gerenciadorChaves.listarChaves('tmdb').length || 1;
    let ultimoErro;

    for (let i = 0; i < tentativas; i++) {
      let chave;
      try {
        chave = gerenciadorChaves.obterProximaChave('tmdb');
      } catch (e) {
        throw e;
      }

      const url = new URL(`${BASE_URL}${endpoint}`);
      url.searchParams.set('api_key', chave);
      url.searchParams.set('language', 'pt-BR');
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          url.searchParams.set(k, v);
        }
      }

      try {
        const res = await fetch(url.toString());
        if (res.status === 401 || res.status === 429) {
          gerenciadorChaves.marcarChaveComoFalha('tmdb', chave);
          ultimoErro = new Error(`TMDb retornou ${res.status}`);
          continue;
        }
        if (!res.ok) {
          throw new Error(`TMDb erro ${res.status}: ${res.statusText}`);
        }
        return await res.json();
      } catch (e) {
        ultimoErro = e;
        if (e.message.includes('401') || e.message.includes('429')) {
          gerenciadorChaves.marcarChaveComoFalha('tmdb', chave);
          continue;
        }
        throw e;
      }
    }
    throw ultimoErro || new Error('Todas as chaves TMDb falharam.');
  }

  /**
   * Busca filmes com filtros.
   */
  async buscarFilmes({ generoId, notaMinima, anoMinimo, anoMaximo, duracaoMaxima, votosMinimos } = {}) {
    const params = {
      sort_by: 'popularity.desc',
      page: 1,
    };

    if (generoId) params['with_genres'] = generoId;
    if (notaMinima) params['vote_average.gte'] = notaMinima;
    if (anoMinimo) params['primary_release_date.gte'] = `${anoMinimo}-01-01`;
    if (anoMaximo) params['primary_release_date.lte'] = `${anoMaximo}-12-31`;
    if (duracaoMaxima) params['with_runtime.lte'] = duracaoMaxima;
    if (votosMinimos) params['vote_count.gte'] = votosMinimos;

    const data = await this._fetch('/discover/movie', params);
    const filmes = (data.results || []).slice(0, 10);

    return filmes.map(f => ({
      id: f.id,
      titulo: f.title,
      tituloOriginal: f.original_title,
      ano: f.release_date ? f.release_date.split('-')[0] : '—',
      nota: f.vote_average,
      votos: f.vote_count,
      popularidade: f.popularity,
      generos: f.genre_ids || [],
      poster: f.poster_path ? `${IMG_BASE}${f.poster_path}` : null,
      sinopse: f.overview || '',
    }));
  }

  /**
   * Busca detalhes de um filme (incluindo duração).
   */
  async buscarDetalhesFilme(id) {
    const data = await this._fetch(`/movie/${id}`);
    return {
      id: data.id,
      duracao: data.runtime,
      generos: (data.genres || []).map(g => g.name),
      tagline: data.tagline || '',
    };
  }
}

export const apiTmdb = new ApiTmdb();

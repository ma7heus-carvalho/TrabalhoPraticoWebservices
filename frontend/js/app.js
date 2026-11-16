/**
 * app.js
 * Orquestrador principal do CineSound.
 * Conecta UI, TMDb, Tunefind (backend) e Gemini.
 */

import { gerenciadorChaves } from './chavesApi.js';
import { apiTmdb, GENEROS_FILME } from './apiTmdb.js';
import { buscarMusicasFilme } from './apiFilmes.js';
import { enriquecerMusica } from './apiMusica.js';
import { apiGemini } from './apiGemini.js';
import { renderizarResultados } from './renderizacao.js';

// ─── Elementos do DOM ────────────────────────────────────────────────────────
const formFiltros = document.getElementById('form-filtros');
const btnAnalisar = document.getElementById('btn-analisar');
const selectGenero = document.getElementById('select-genero');
const selectEstilo = document.getElementById('select-estilo');
const inputNotaMin = document.getElementById('input-nota-min');
const valNotaMin = document.getElementById('val-nota-min');
const inputAnoMin = document.getElementById('input-ano-min');
const inputAnoMax = document.getElementById('input-ano-max');
const inputDuracaoMax = document.getElementById('input-duracao-max');
const valDuracaoMax = document.getElementById('val-duracao-max');
const inputVotosMin = document.getElementById('input-votos-min');

const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
const containerFiltrosAvancados = document.getElementById('filtros-avancados');

const btnAbrirChaves = document.getElementById('btn-abrir-chaves');
const btnFecharChaves = document.getElementById('btn-fechar-chaves');
const modalChaves = document.getElementById('modal-chaves');
const listaChavesTmdb = document.getElementById('lista-chaves-tmdb');
const listaChavesGemini = document.getElementById('lista-chaves-gemini');
const formChaveTmdb = document.getElementById('form-chave-tmdb');
const formChaveGemini = document.getElementById('form-chave-gemini');
const inputChaveTmdb = document.getElementById('input-chave-tmdb');
const inputChaveGemini = document.getElementById('input-chave-gemini');

const secaoStatus = document.getElementById('secao-status');
const statusMensagem = document.getElementById('status-mensagem');
const statusPasso = document.getElementById('status-passo');
const secaoErro = document.getElementById('secao-erro');
const erroMensagem = document.getElementById('erro-mensagem');

const secaoResultados = document.getElementById('secao-resultados');
const secaoDestaque = document.getElementById('secao-destaque');
const gridFilmes = document.getElementById('grid-filmes');
const secaoGrafico = document.getElementById('secao-grafico');

// ─── Inicialização de Sliders e Controles ────────────────────────────────────
function inicializarControles() {
  if (inputNotaMin && valNotaMin) {
    inputNotaMin.addEventListener('input', () => {
      valNotaMin.textContent = Number(inputNotaMin.value).toFixed(1);
    });
  }

  if (inputDuracaoMax && valDuracaoMax) {
    inputDuracaoMax.addEventListener('input', () => {
      valDuracaoMax.textContent = `${inputDuracaoMax.value} min`;
    });
  }

  if (btnToggleFiltros && containerFiltrosAvancados) {
    btnToggleFiltros.addEventListener('click', () => {
      const oculto = containerFiltrosAvancados.classList.toggle('oculto');
      btnToggleFiltros.textContent = oculto ? '⚙️ Mostrar Filtros Avançados' : '🔼 Ocultar Filtros Avançados';
    });
  }

  // Preencher gêneros dinamicamente caso o select esteja vazio
  if (selectGenero && selectGenero.options.length <= 1) {
    selectGenero.innerHTML = '<option value="">Selecione um gênero...</option>';
    Object.entries(GENEROS_FILME).forEach(([nome, id]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = nome;
      selectGenero.appendChild(opt);
    });
  }
}

// ─── Gerenciamento de Chaves de API na UI ───────────────────────────────────
function atualizarListaChaves(api, elementoLista) {
  if (!elementoLista) return;
  const chaves = gerenciadorChaves.listarChaves(api);
  elementoLista.innerHTML = '';

  if (chaves.length === 0) {
    elementoLista.innerHTML = '<li class="chave-vazia">Nenhuma chave cadastrada.</li>';
    return;
  }

  chaves.forEach((chave, index) => {
    const li = document.createElement('li');
    li.className = 'chave-item';

    const mascarada = chave.length > 8
      ? `${chave.substring(0, 4)}••••${chave.substring(chave.length - 4)}`
      : '••••••••';

    li.innerHTML = `
      <span class="chave-texto" title="${chave}">🔑 #${index + 1} (${mascarada})</span>
      <button type="button" class="btn-remover-chave" data-api="${api}" data-chave="${chave}" title="Remover chave">✕</button>
    `;
    elementoLista.appendChild(li);
  });

  // Event listener para botões de remoção
  elementoLista.querySelectorAll('.btn-remover-chave').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const { api: apiAlvo, chave: chaveAlvo } = e.currentTarget.dataset;
      try {
        gerenciadorChaves.removerChave(apiAlvo, chaveAlvo);
        atualizarTodasChaves();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function atualizarTodasChaves() {
  atualizarListaChaves('tmdb', listaChavesTmdb);
  atualizarListaChaves('gemini', listaChavesGemini);
}

function inicializarModalChaves() {
  if (btnAbrirChaves && modalChaves) {
    btnAbrirChaves.addEventListener('click', () => {
      atualizarTodasChaves();
      modalChaves.classList.remove('oculto');
    });
  }

  if (btnFecharChaves && modalChaves) {
    btnFecharChaves.addEventListener('click', () => {
      modalChaves.classList.add('oculto');
    });
  }

  if (modalChaves) {
    modalChaves.addEventListener('click', (e) => {
      if (e.target === modalChaves) {
        modalChaves.classList.add('oculto');
      }
    });
  }

  if (formChaveTmdb && inputChaveTmdb) {
    formChaveTmdb.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputChaveTmdb.value.trim();
      if (!val) return;
      try {
        gerenciadorChaves.adicionarChave('tmdb', val);
        inputChaveTmdb.value = '';
        atualizarTodasChaves();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (formChaveGemini && inputChaveGemini) {
    formChaveGemini.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputChaveGemini.value.trim();
      if (!val) return;
      try {
        gerenciadorChaves.adicionarChave('gemini', val);
        inputChaveGemini.value = '';
        atualizarTodasChaves();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  atualizarTodasChaves();
}

// ─── Feedbacks de Status e Erro ──────────────────────────────────────────────
function mostrarStatus(mensagem, passoAtual = 1, totalPassos = 4) {
  if (secaoErro) secaoErro.classList.add('oculto');
  if (secaoStatus) {
    secaoStatus.classList.remove('oculto');
    if (statusMensagem) statusMensagem.textContent = mensagem;
    if (statusPasso) statusPasso.textContent = `Passo ${passoAtual} de ${totalPassos}`;
  }
}

function ocultarStatus() {
  if (secaoStatus) secaoStatus.classList.add('oculto');
}

function mostrarErro(mensagem) {
  ocultarStatus();
  if (secaoErro) {
    secaoErro.classList.remove('oculto');
    if (erroMensagem) erroMensagem.textContent = mensagem;
  }
}

function limparResultados() {
  if (secaoResultados) secaoResultados.classList.add('oculto');
  if (secaoDestaque) secaoDestaque.innerHTML = '';
  if (gridFilmes) gridFilmes.innerHTML = '';
  if (secaoGrafico) secaoGrafico.style.display = 'none';
}

// ─── Fluxo Principal de Análise ──────────────────────────────────────────────
async function executarAnalise(e) {
  e.preventDefault();

  // 1. Validar seleção de gênero e estilo
  const generoId = selectGenero ? selectGenero.value : '';
  const generoNome = selectGenero && selectGenero.selectedIndex >= 0
    ? selectGenero.options[selectGenero.selectedIndex].text
    : '';
  const estiloMusical = selectEstilo ? selectEstilo.value : '';

  if (!generoId) {
    mostrarErro('Por favor, selecione um gênero de filme.');
    selectGenero?.focus();
    return;
  }

  if (!estiloMusical) {
    mostrarErro('Por favor, selecione um estilo musical preferido.');
    selectEstilo?.focus();
    return;
  }

  // 2. Validar chaves de API
  if (!gerenciadorChaves.temChaves('tmdb')) {
    mostrarErro('É necessário cadastrar pelo menos uma chave da TMDb para buscar filmes.');
    modalChaves?.classList.remove('oculto');
    return;
  }

  if (!gerenciadorChaves.temChaves('gemini')) {
    mostrarErro('É necessário cadastrar pelo menos uma chave do Gemini para realizar a análise.');
    modalChaves?.classList.remove('oculto');
    return;
  }

  limparResultados();
  btnAnalisar.disabled = true;

  try {
    // ─── Passo 1: Buscar filmes candidatos no TMDb ───
    mostrarStatus('Consultando catálogo de filmes na TMDb...', 1, 4);

    const filtrosTmdb = {
      generoId,
      notaMinima: inputNotaMin ? parseFloat(inputNotaMin.value) : undefined,
      anoMinimo: inputAnoMin?.value ? parseInt(inputAnoMin.value, 10) : undefined,
      anoMaximo: inputAnoMax?.value ? parseInt(inputAnoMax.value, 10) : undefined,
      duracaoMaxima: inputDuracaoMax?.value ? parseInt(inputDuracaoMax.value, 10) : undefined,
      votosMinimos: inputVotosMin?.value ? parseInt(inputVotosMin.value, 10) : undefined,
    };

    const filmesCandidatos = await apiTmdb.buscarFilmes(filtrosTmdb);

    if (!filmesCandidatos || filmesCandidatos.length === 0) {
      throw new Error('Nenhum filme encontrado com os filtros selecionados. Tente relaxar os critérios.');
    }

    // ─── Passo 2: Buscar músicas de cada filme via API Própria (Tunefind) ───
    mostrarStatus(`Buscando trilhas sonoras no Tunefind para ${filmesCandidatos.length} filmes...`, 2, 4);

    const promessasMusicas = filmesCandidatos.map(async (filme) => {
      // Priorizar título original ou título em inglês se disponível para melhorar scraping no Tunefind
      const tituloParaBusca = filme.tituloOriginal || filme.titulo;
      const musicas = await buscarMusicasFilme(filme.id, tituloParaBusca, filme.ano);
      
      // Opcional: enriquecer músicas
      const musicasEnriquecidas = await Promise.all(
        musicas.map(m => enriquecerMusica(m.titulo, m.artista))
      );

      return {
        ...filme,
        musicas: musicasEnriquecidas.length > 0 ? musicasEnriquecidas : musicas,
      };
    });

    const filmesComMusicas = await Promise.all(promessasMusicas);

    // ─── Passo 3: Consolidar dados e enviar ao Gemini ───
    mostrarStatus('Enviando dados consolidados ao Gemini para análise semântica...', 3, 4);

    const dadosConsolidados = {
      preferenciasUsuario: {
        generoFilme: generoNome,
        estiloMusical,
        notaMinima: filtrosTmdb.notaMinima,
        anoMinimo: filtrosTmdb.anoMinimo,
        anoMaximo: filtrosTmdb.anoMaximo,
        duracaoMaxima: filtrosTmdb.duracaoMaxima,
      },
      filmes: filmesComMusicas.map(f => ({
        id: f.id,
        titulo: f.titulo,
        tituloOriginal: f.tituloOriginal,
        ano: f.ano,
        nota: f.nota,
        votos: f.votos,
        sinopse: f.sinopse,
        musicas: f.musicas,
      })),
    };

    const analiseGemini = await apiGemini.analisarCompatibilidade(dadosConsolidados);

    // ─── Passo 4: Renderização visual dos resultados ───
    mostrarStatus('Construindo elementos visuais e gráficos...', 4, 4);

    ocultarStatus();
    if (secaoResultados) secaoResultados.classList.remove('oculto');

    renderizarResultados(filmesComMusicas, analiseGemini);

    // Rolar suavemente para os resultados
    secaoResultados?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    console.error('Erro durante a execução do fluxo:', err);
    mostrarErro(err.message || 'Ocorreu um erro inesperado ao processar os dados.');
  } finally {
    btnAnalisar.disabled = false;
  }
}

// ─── Inicialização da Aplicação ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inicializarControles();
  inicializarModalChaves();

  if (formFiltros) {
    formFiltros.addEventListener('submit', executarAnalise);
  }
});

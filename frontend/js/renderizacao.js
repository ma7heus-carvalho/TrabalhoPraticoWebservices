/**
 * renderizacao.js
 * Responsável por renderizar todos os elementos visuais dos resultados.
 */

// ─── Utilitários ────────────────────────────────────────────────────────────

function compatibilidadeCor(valor) {
  if (valor >= 70) return '#4caf50';
  if (valor >= 40) return '#f0c060';
  return '#ef5350';
}

function compatibilidadeLabel(valor) {
  if (valor >= 70) return 'Alta';
  if (valor >= 40) return 'Média';
  return 'Baixa';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Destaque do melhor filme ─────────────────────────────────────────────

function renderizarDestaque(filme, resultado) {
  const compat = resultado?.compatibilidade ?? 0;
  const cor = compatibilidadeCor(compat);
  const poster = filme.poster
    ? `<img src="${escapeHtml(filme.poster)}" alt="${escapeHtml(filme.titulo)}" class="destaque-poster" onerror="this.style.display='none'">`
    : `<div class="destaque-poster destaque-poster--sem-imagem">🎬</div>`;

  return `
<div class="destaque-card" style="--compat-cor: ${cor}">
  <div class="destaque-badge">⭐ Melhor Compatibilidade</div>
  <div class="destaque-inner">
    ${poster}
    <div class="destaque-info">
      <h2 class="destaque-titulo">${escapeHtml(filme.titulo)}</h2>
      <p class="destaque-ano">${escapeHtml(filme.ano)} · ⭐ ${filme.nota?.toFixed(1) ?? '—'}</p>
      <div class="compat-barra-wrap">
        <div class="compat-barra" style="width: ${compat}%; background: ${cor}"></div>
      </div>
      <p class="compat-label" style="color: ${cor}">${compat}% — Compatibilidade ${compatibilidadeLabel(compat)}</p>
      ${resultado?.analise ? `<p class="destaque-analise">${escapeHtml(resultado.analise)}</p>` : ''}
      ${resultado?.destaques?.length ? `
      <div class="destaque-musicas">
        <span class="destaque-musicas-label">🎵 Destaques:</span>
        <ul>${resultado.destaques.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
      </div>` : ''}
    </div>
  </div>
</div>`;
}

// ─── Card de filme ────────────────────────────────────────────────────────

function renderizarCard(filme, resultado, index) {
  const compat = resultado?.compatibilidade ?? 0;
  const cor = compatibilidadeCor(compat);
  const totalMusicas = filme.musicas?.length ?? 0;
  const musicasCompativeis = resultado?.musicasCompativeis ?? 0;

  const poster = filme.poster
    ? `<img src="${escapeHtml(filme.poster)}" alt="${escapeHtml(filme.titulo)}" class="card-poster" loading="lazy" onerror="this.parentElement.classList.add('sem-poster')">`
    : `<div class="card-poster card-poster--vazio">🎬</div>`;

  return `
<article class="filme-card" data-index="${index}" tabindex="0" role="button" aria-label="Ver detalhes de ${escapeHtml(filme.titulo)}">
  <div class="card-poster-wrap">
    ${poster}
    <div class="card-compat-badge" style="background: ${cor}">${compat}%</div>
  </div>
  <div class="card-body">
    <h3 class="card-titulo">${escapeHtml(filme.titulo)}</h3>
    <p class="card-meta">${escapeHtml(filme.ano)} · ⭐ ${filme.nota?.toFixed(1) ?? '—'}</p>
    <div class="compat-barra-wrap">
      <div class="compat-barra" style="width: 0%; background: ${cor}" data-width="${compat}%"></div>
    </div>
    <p class="card-musicas">${musicasCompativeis}/${totalMusicas} músicas compatíveis</p>
  </div>
</article>`;
}

// ─── Modal de detalhes ────────────────────────────────────────────────────

function renderizarModal(filme, resultado) {
  const compat = resultado?.compatibilidade ?? 0;
  const cor = compatibilidadeCor(compat);
  const musicas = filme.musicas || [];

  const musicasHtml = musicas.length > 0
    ? musicas.map(m => `
      <li class="modal-musica">
        <span class="modal-musica-titulo">🎵 ${escapeHtml(m.titulo)}</span>
        <span class="modal-musica-artista">${escapeHtml(m.artista)}</span>
        ${m.cena ? `<span class="modal-musica-cena">${escapeHtml(m.cena)}</span>` : ''}
      </li>`).join('')
    : '<li class="modal-musica modal-musica--vazio">Nenhuma música encontrada no Tunefind.</li>';

  return `
<div class="modal-overlay" id="modal-detalhes" role="dialog" aria-modal="true" aria-label="Detalhes de ${escapeHtml(filme.titulo)}">
  <div class="modal-content">
    <button class="modal-fechar" id="modal-fechar" aria-label="Fechar">✕</button>
    <div class="modal-header">
      ${filme.poster ? `<img src="${escapeHtml(filme.poster)}" alt="${escapeHtml(filme.titulo)}" class="modal-poster">` : ''}
      <div class="modal-header-info">
        <h2>${escapeHtml(filme.titulo)}</h2>
        <p class="modal-meta">${escapeHtml(filme.ano)} · ⭐ ${filme.nota?.toFixed(1) ?? '—'}</p>
        ${filme.sinopse ? `<p class="modal-sinopse">${escapeHtml(filme.sinopse)}</p>` : ''}
      </div>
    </div>

    <div class="modal-compat">
      <h3>Compatibilidade Musical</h3>
      <div class="modal-compat-valor" style="color: ${cor}">${compat}%</div>
      <div class="compat-barra-wrap">
        <div class="compat-barra" style="width: ${compat}%; background: ${cor}"></div>
      </div>
      ${resultado?.analise ? `<p class="modal-analise">${escapeHtml(resultado.analise)}</p>` : ''}
    </div>

    <div class="modal-grafico-wrap">
      <h3>Distribuição de Compatibilidade</h3>
      <canvas id="modal-pizza" width="200" height="200" aria-label="Gráfico de pizza de compatibilidade"></canvas>
    </div>

    ${resultado?.destaques?.length ? `
    <div class="modal-destaques">
      <h3>🎵 Destaques</h3>
      <ul>${resultado.destaques.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
    </div>` : ''}

    <div class="modal-musicas">
      <h3>Trilha Sonora (${musicas.length} músicas)</h3>
      <ul class="modal-musicas-lista">${musicasHtml}</ul>
    </div>
  </div>
</div>`;
}

// ─── Gráfico de pizza (Canvas) ────────────────────────────────────────────

function desenharPizza(canvasId, compatibilidade) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 10;
  const compat = compatibilidade / 100;
  const incompativel = 1 - compat;
  const startAngle = -Math.PI / 2;

  // Fatia compatível
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, startAngle, startAngle + compat * 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = compatibilidadeCor(compatibilidade);
  ctx.fill();

  // Fatia incompatível
  if (incompativel > 0) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle + compat * 2 * Math.PI, startAngle + 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#2d333b';
    ctx.fill();
  }

  // Círculo central (donut)
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, 2 * Math.PI);
  ctx.fillStyle = '#161b22';
  ctx.fill();

  // Texto central
  ctx.fillStyle = compatibilidadeCor(compatibilidade);
  ctx.font = `bold ${Math.floor(r * 0.35)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${compatibilidade}%`, cx, cy);
}

// ─── Gráfico de barras comparativo (Canvas) ───────────────────────────────

function desenharGraficoBarras(canvasId, filmes, resultados) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const pad = { top: 20, right: 20, bottom: 60, left: 40 };
  const areaW = W - pad.left - pad.right;
  const areaH = H - pad.top - pad.bottom;

  ctx.clearRect(0, 0, W, H);

  const n = filmes.length;
  if (n === 0) return;

  const barW = Math.min(60, (areaW / n) * 0.6);
  const gap = areaW / n;

  // Eixo Y
  ctx.strokeStyle = '#30363d';
  ctx.lineWidth = 1;
  for (let v = 0; v <= 100; v += 25) {
    const y = pad.top + areaH - (v / 100) * areaH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + areaW, y);
    ctx.stroke();
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(v, pad.left - 5, y + 4);
  }

  filmes.forEach((filme, i) => {
    const resultado = resultados.find(r => r.filmeId === filme.id);
    const compat = resultado?.compatibilidade ?? 0;
    const x = pad.left + gap * i + gap / 2 - barW / 2;
    const barH = (compat / 100) * areaH;
    const y = pad.top + areaH - barH;
    const cor = compatibilidadeCor(compat);

    // Barra
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 4);
    ctx.fill();

    // Valor no topo
    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${compat}%`, x + barW / 2, y - 6);

    // Label abaixo
    const titulo = filme.titulo.length > 10 ? filme.titulo.substring(0, 9) + '…' : filme.titulo;
    ctx.fillStyle = '#8b949e';
    ctx.font = '10px sans-serif';
    ctx.fillText(titulo, x + barW / 2, pad.top + areaH + 16);
    ctx.fillText(filme.ano, x + barW / 2, pad.top + areaH + 30);
  });
}

// ─── Função principal de renderização ────────────────────────────────────

export function renderizarResultados(filmes, analiseGemini) {
  const resultados = analiseGemini?.resultados || [];

  // Encontrar melhor filme
  let melhorFilme = null;
  let melhorResultado = null;
  let melhorCompat = -1;

  filmes.forEach(filme => {
    const resultado = resultados.find(r => r.filmeId === filme.id);
    const compat = resultado?.compatibilidade ?? 0;
    if (compat > melhorCompat) {
      melhorCompat = compat;
      melhorFilme = filme;
      melhorResultado = resultado;
    }
  });

  // Seção destaque
  const secaoDestaque = document.getElementById('secao-destaque');
  if (secaoDestaque && melhorFilme) {
    secaoDestaque.innerHTML = renderizarDestaque(melhorFilme, melhorResultado);
    secaoDestaque.style.display = 'block';
  }

  // Grid de cards
  const gridFilmes = document.getElementById('grid-filmes');
  if (gridFilmes) {
    gridFilmes.innerHTML = filmes.map((filme, i) => {
      const resultado = resultados.find(r => r.filmeId === filme.id);
      return renderizarCard(filme, resultado, i);
    }).join('');

    // Animar barras após inserção
    requestAnimationFrame(() => {
      gridFilmes.querySelectorAll('.compat-barra[data-width]').forEach(el => {
        el.style.width = el.dataset.width;
      });
    });

    // Event listeners dos cards
    gridFilmes.querySelectorAll('.filme-card').forEach(card => {
      const abrirModal = () => {
        const idx = parseInt(card.dataset.index);
        const filme = filmes[idx];
        const resultado = resultados.find(r => r.filmeId === filme.id);
        abrirModalDetalhes(filme, resultado);
      };
      card.addEventListener('click', abrirModal);
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') abrirModal(); });
    });
  }

  // Gráfico de barras
  const secaoGrafico = document.getElementById('secao-grafico');
  if (secaoGrafico) {
    secaoGrafico.style.display = 'block';
    // Ajustar canvas ao container
    setTimeout(() => {
      const canvas = document.getElementById('grafico-barras');
      if (canvas) {
        canvas.width = canvas.parentElement.clientWidth || 600;
        canvas.height = 280;
        desenharGraficoBarras('grafico-barras', filmes, resultados);
      }
    }, 50);
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────

function abrirModalDetalhes(filme, resultado) {
  // Remover modal anterior se existir
  const modalAnterior = document.getElementById('modal-detalhes');
  if (modalAnterior) modalAnterior.remove();

  document.body.insertAdjacentHTML('beforeend', renderizarModal(filme, resultado));
  const modal = document.getElementById('modal-detalhes');

  // Desenhar gráfico de pizza
  setTimeout(() => {
    desenharPizza('modal-pizza', resultado?.compatibilidade ?? 0);
  }, 50);

  // Fechar modal
  const fechar = () => {
    modal.classList.add('modal--saindo');
    setTimeout(() => modal.remove(), 200);
    document.removeEventListener('keydown', teclaEsc);
  };

  document.getElementById('modal-fechar').addEventListener('click', fechar);
  modal.addEventListener('click', e => { if (e.target === modal) fechar(); });

  const teclaEsc = e => { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', teclaEsc);

  // Animação de entrada
  requestAnimationFrame(() => modal.classList.add('modal--visivel'));

  // Foco acessível
  document.getElementById('modal-fechar').focus();
}

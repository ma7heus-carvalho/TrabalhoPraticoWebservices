/**
 * apiGemini.js
 * Integração com a API Gemini (Google Generative Language).
 * Suporte a rodízio de chaves, retry automático para 429 (rate limit) e múltiplos modelos.
 */

import { gerenciadorChaves } from './chavesApi.js';

// Modelos ordenados por velocidade e disponibilidade comum no AI Studio
const MODELOS_PRIORITARIOS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ApiGemini {
  constructor() {
    this._modeloAtivo = 'gemini-1.5-flash';
  }

  /**
   * Monta o prompt otimizado para economizar tokens e evitar rate limits.
   */
  _montarPrompt(dadosConsolidados) {
    const { preferenciasUsuario, filmes } = dadosConsolidados;

    const filmesTexto = filmes.map(f => {
      const musicasTexto = (f.musicas || []).length > 0
        ? f.musicas.slice(0, 10).map(m => `"${m.titulo}" - ${m.artista}`).join(', ')
        : 'Sem músicas identificadas';
      return `ID ${f.id}: "${f.titulo}" (${f.ano}) | Músicas: [${musicasTexto}]`;
    }).join('\n');

    return `Você é um avaliador de trilhas sonoras de filmes.
Preferências do usuário:
- Gênero de filme: ${preferenciasUsuario.generoFilme}
- Estilo musical preferido: ${preferenciasUsuario.estiloMusical}

Candidatos e músicas da trilha:
${filmesTexto}

Avalie a compatibilidade de cada filme com o estilo musical "${preferenciasUsuario.estiloMusical}".
Responda APENAS com um JSON puro no formato:
{
  "resultados": [
    {
      "filmeId": <id_numero>,
      "compatibilidade": <numero_0_a_100>,
      "musicasCompativeis": <qtd_musicas_compativeis>,
      "destaques": ["musica ou destaque 1", "musica 2"],
      "analise": "<explicacao curta em 2 frases>"
    }
  ]
}`;
  }

  /**
   * Realiza a chamada HTTP POST para o endpoint do modelo.
   */
  async _chamarGenerateContent(modelo, chave, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${chave}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    };

    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  /**
   * Analisa compatibilidade entre filmes e preferências musicais via Gemini.
   */
  async analisarCompatibilidade(dadosConsolidados) {
    const prompt = this._montarPrompt(dadosConsolidados);
    const totalChaves = gerenciadorChaves.listarChaves('gemini').length;

    if (totalChaves === 0) {
      throw new Error('Nenhuma chave do Gemini cadastrada. Configure em ⚙️ Chaves de API.');
    }

    let ultimoErro = null;

    // Tentar cada uma das chaves cadastradas (rodízio)
    for (let c = 0; c < totalChaves; c++) {
      let chave;
      try {
        chave = gerenciadorChaves.obterProximaChave('gemini');
      } catch (e) {
        throw e;
      }

      // Modelos a testar para esta chave (começando pelo que funcionou antes)
      const modelos = [this._modeloAtivo, ...MODELOS_PRIORITARIOS.filter(m => m !== this._modeloAtivo)];

      for (const modelo of modelos) {
        let tentativasRateLimit = 0;

        while (tentativasRateLimit < 2) {
          try {
            console.info(`Consultando Gemini com modelo '${modelo}' (Tentativa chave #${c + 1})...`);
            const res = await this._chamarGenerateContent(modelo, chave, prompt);

            // 429: Rate Limit / Cota esgotada
            if (res.status === 429) {
              const errData = await res.json().catch(() => ({}));
              const msgErro = errData?.error?.message || 'Limite de requisições excedido (Rate Limit / Quota).';
              console.warn(`Gemini 429 com chave atual no modelo ${modelo}:`, msgErro);

              // Se tivermos mais de uma chave cadastrada, marca falha e troca imediatamente para a próxima
              if (totalChaves > 1) {
                gerenciadorChaves.marcarChaveComoFalha('gemini', chave);
                ultimoErro = new Error(`Chave Gemini atingiu limite (429). Alternando para próxima chave do rodízio...`);
                tentativasRateLimit = 99; // sai do loop deste modelo
                break;
              }

              // Se tiver só 1 chave, tenta aguardar 3 segundos uma única vez
              if (tentativasRateLimit === 0) {
                console.info('Aguardando 3 segundos para re-tentar devido a limite por segundo...');
                await sleep(3000);
                tentativasRateLimit++;
                continue;
              } else {
                gerenciadorChaves.marcarChaveComoFalha('gemini', chave);
                throw new Error(
                  'A chave do Gemini atingiu o limite de requisições (Status 429 - Quota Exceeded).\n\n' +
                  '💡 Soluções:\n' +
                  '1. Cadastre uma 2ª chave gratuita no botão "⚙️ Chaves de API" para que o sistema use o rodízio automático.\n' +
                  '2. Ou aguarde cerca de 1 a 2 minutos para que o Google AI Studio renove a cota da chave atual.'
                );
              }
            }

            // 401 ou 403: Chave inválida ou bloqueada
            if (res.status === 401 || res.status === 403) {
              gerenciadorChaves.marcarChaveComoFalha('gemini', chave);
              ultimoErro = new Error(`Chave Gemini não autorizada (${res.status}). Verifique a chave cadastrada.`);
              tentativasRateLimit = 99;
              break;
            }

            // 404: Modelo não encontrado, tenta o próximo modelo da lista
            if (res.status === 404) {
              console.warn(`Modelo ${modelo} não encontrado (404). Tentando próximo modelo...`);
              break;
            }

            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              ultimoErro = new Error(`Gemini erro ${res.status}: ${errData?.error?.message || res.statusText}`);
              break;
            }

            // Resposta bem sucedida (200 OK)
            const data = await res.json();
            const textoResposta = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (!textoResposta) {
              throw new Error('Gemini retornou conteúdo vazio.');
            }

            // Limpar marcações de código markdown se houver
            const jsonLimpo = textoResposta
              .replace(/^```json\s*/i, '')
              .replace(/^```\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim();

            const resultadoJson = JSON.parse(jsonLimpo);

            // Sucesso! Guardar modelo como ativo
            this._modeloAtivo = modelo;
            console.info(`Gemini respondeu com sucesso usando modelo: ${modelo}`);
            return resultadoJson;

          } catch (err) {
            ultimoErro = err;
            if (err.message.includes('Status 429') || err.message.includes('401') || err.message.includes('403')) {
              break;
            }
          }
          tentativasRateLimit++;
        }

        // Se deu erro de cota ou autorização, passa para a próxima chave
        if (ultimoErro && (ultimoErro.message.includes('429') || ultimoErro.message.includes('401') || ultimoErro.message.includes('403'))) {
          break;
        }
      }
    }

    throw ultimoErro || new Error('Não foi possível obter análise do Gemini. Verifique as chaves cadastradas.');
  }
}

export const apiGemini = new ApiGemini();

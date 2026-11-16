# 🎬 CineSound

> **Análise de Compatibilidade Musical em Filmes com Inteligência Artificial**

![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.x-000000?style=flat-square&logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-Mobile--First-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Dark%20Mode-1572B6?style=flat-square&logo=css3&logoColor=white)
![TMDb](https://img.shields.io/badge/API-TMDb-01D277?style=flat-square)
![Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)

---

> 📸 **Screenshot** — Interface dark mode com cards de filmes e barras de compatibilidade musical.  
> *(Veja `frontend/index.html` em execução para visualizar a interface completa.)*

---

## 📋 Descrição

CineSound é um **webapp responsivo mobile-first** que analisa a compatibilidade entre seus filmes favoritos e suas preferências musicais. Você informa o gênero cinematográfico e o estilo musical que gosta, e a aplicação:

1. Busca filmes relevantes via **TMDb API**
2. Extrai as trilhas sonoras de cada filme via **scraping do Tunefind**
3. Envia todos os dados para o **Gemini 1.5 Flash** analisar a compatibilidade
4. Exibe resultados visuais ricos com **cards, barras de progresso e gráficos**

---

## ✨ Funcionalidades

- 🎭 **Busca de filmes por gênero** com filtros avançados (nota mínima, intervalo de ano, duração máxima)
- 🎵 **Extração automática de trilhas sonoras** via scraping do Tunefind
- 🤖 **Análise de compatibilidade musical via IA** (Google Gemini 1.5 Flash)
- 📊 **Visualização rica**: cards de filmes, barras de compatibilidade e gráfico comparativo (Canvas API nativo)
- 🔑 **Rodízio de chaves de API** para evitar limites de requisição
- 🌙 **Interface responsiva dark mode** (mobile-first, sem frameworks externos)
- ⚡ **Requisições paralelas** para busca eficiente de músicas (Promise.all)

---

## 🛠️ Pré-requisitos

| Requisito | Versão mínima |
|-----------|--------------|
| Python    | 3.8+         |
| pip       | qualquer     |
| Navegador | moderno (Chrome 90+, Firefox 88+, Edge 90+) |

---

## 🚀 Instalação e Execução

### 1. Obtenha o projeto

```bash
# Clone ou baixe/descompacte o projeto
git clone <url-do-repositorio>
cd tp-ws-individual-matheusCarvalho
```

### 2. Instale as dependências do backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Inicie o servidor Flask

```bash
# Dentro da pasta backend/
python app.py
```

> O servidor sobe em **http://localhost:5000**  
> Você verá: `* Running on http://127.0.0.1:5000`

### 4. Abra o frontend

**Opção A — Abrir direto no navegador:**
```
Abra o arquivo frontend/index.html diretamente no seu navegador
```

**Opção B — Servir via HTTP (recomendado para ES6 modules):**
```bash
# Em um segundo terminal, a partir da raiz do projeto:
cd frontend
python -m http.server 8080
# Acesse: http://localhost:8080
```

---

## 🔑 Configuração de Chaves de API

A aplicação usa duas APIs externas. As chaves são inseridas diretamente na interface (não ficam salvas em arquivos).

### TMDb (The Movie Database)

1. Acesse [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Crie uma conta gratuita e solicite uma chave de API (tipo "Developer")
3. Copie a **API Key (v3 auth)**

### Gemini (Google AI Studio)

1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Faça login com sua conta Google
3. Clique em **"Get API key"** → **"Create API key"**
4. Copie a chave gerada

### Como inserir na interface

Na tela do CineSound, clique em **"⚙️ Configurar Chaves de API"** e preencha:
- **Chave(s) TMDb**: cole uma ou mais chaves (uma por linha, para rodízio automático)
- **Chave(s) Gemini**: cole uma ou mais chaves (uma por linha, para rodízio automático)

As chaves ficam armazenadas apenas na memória da sessão atual.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        USUÁRIO                              │
│                (Browser - frontend/index.html)              │
└──────────────────────────┬──────────────────────────────────┘
                           │  Interação
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vanilla JS)                   │
│                                                             │
│  app.js ──► apiTmdb.js ──────────────────► TMDb API        │
│      │                                    (filmes)          │
│      │      apiFilmes.js ────────────────► Backend Flask    │
│      │      (músicas por filme)           localhost:5000    │
│      │                                         │            │
│      │      apiGemini.js ────────────────► Gemini API      │
│      │      (análise de compatibilidade)  (análise IA)     │
│      │                                                      │
│      └────► renderizacao.js                                 │
│             (cards, barras, gráfico Canvas)                 │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │  REST JSON
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Python Flask)                    │
│                   backend/app.py                            │
│                                                             │
│  GET /api/filmes/{id}/musicas                               │
│       │                                                     │
│       └──► scraping/tunefind.py ──────────► Tunefind.com   │
│            (BeautifulSoup4)                (trilhas sonoras)│
│                                                             │
│  GET /api/health                                            │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de dados detalhado

```
Usuário preenche formulário
        │
        ▼
[1] apiTmdb.js busca ~10 filmes no TMDb por gênero + filtros
        │
        ▼
[2] Para cada filme, apiFilmes.js chama GET /api/filmes/{id}/musicas
    (paralelo via Promise.all)
        │
        ▼
[3] Backend faz scraping do Tunefind e retorna lista de músicas
        │
        ▼
[4] Frontend consolida: { filmes: [...], musicasPreferidas: "..." }
        │
        ▼
[5] apiGemini.js envia JSON consolidado ao Gemini 1.5 Flash
        │
        ▼
[6] Gemini retorna JSON: { compatibilidade: [...], recomendacao: "..." }
        │
        ▼
[7] renderizacao.js exibe cards, barras e gráfico comparativo
```

---

## 📡 Endpoints da API Própria (Backend Flask)

### `GET /api/filmes/{tmdb_id}/musicas`

Busca as músicas da trilha sonora de um filme via scraping do Tunefind.

**Parâmetros:**

| Parâmetro | Tipo  | Local | Descrição                              |
|-----------|-------|-------|----------------------------------------|
| `tmdb_id` | `int` | path  | ID do filme no TMDb                    |
| `titulo`  | `str` | query | Título do filme (usado para gerar slug)|

**Exemplo de requisição:**
```
GET http://localhost:5000/api/filmes/550/musicas?titulo=Fight+Club
```

**Exemplo de resposta (sucesso):**
```json
{
  "filmeId": 550,
  "titulo": "Fight Club",
  "musicas": [
    {
      "titulo": "Where Is My Mind?",
      "artista": "Pixies",
      "cena": "Cena final"
    }
  ],
  "status": "ok"
}
```

**Exemplo de resposta (bloqueio/erro):**
```json
{
  "filmeId": 550,
  "titulo": "Fight Club",
  "musicas": [],
  "status": "bloqueado",
  "aviso": "Tunefind bloqueou a requisição ou filme não encontrado."
}
```

---

### `GET /api/health`

Verifica se o servidor está operacional.

**Exemplo de requisição:**
```
GET http://localhost:5000/api/health
```

**Resposta:**
```json
{
  "status": "ok",
  "versao": "1.0.0"
}
```

---

## ⚠️ Observações sobre o Scraping do Tunefind

O Tunefind pode **bloquear requisições automatizadas** (robots.txt, rate limiting, Cloudflare):

- O backend usa **headers realistas** (User-Agent de browser moderno) para minimizar bloqueios
- Implementa **retry com delay** em caso de falha temporária
- Em caso de bloqueio persistente, retorna **lista vazia de músicas** com aviso (`status: "bloqueado"`)
- A análise do Gemini continua funcionando mesmo sem músicas (analisa o gênero/estilo informado pelo usuário)
- Testado em ambiente de desenvolvimento — uso em produção deve respeitar os termos de serviço do Tunefind

---

## 📂 Estrutura de Pastas

```
tp-ws-individual-matheusCarvalho/
├── frontend/
│   ├── index.html          # SPA principal (dark mode, mobile-first)
│   ├── css/
│   │   └── style.css       # Estilos (CSS puro, variáveis CSS, responsivo)
│   └── js/
│       ├── app.js          # Orquestrador principal, event listeners
│       ├── apiTmdb.js      # Integração com TMDb API
│       ├── apiMusica.js    # Enriquecimento opcional de dados musicais
│       ├── apiGemini.js    # Integração com Gemini 1.5 Flash
│       ├── apiFilmes.js    # Chamadas ao backend Flask (músicas)
│       ├── renderizacao.js # Renderização de cards, barras e gráfico Canvas
│       └── chavesApi.js    # Gerenciamento e rodízio de chaves de API
├── backend/
│   ├── app.py              # Servidor Flask, rotas REST
│   ├── requirements.txt    # Dependências Python
│   ├── scraping/
│   │   ├── __init__.py
│   │   └── tunefind.py     # Lógica de scraping do Tunefind
│   └── utils/
│       ├── __init__.py
│       └── texto.py        # Utilitários (geração de slug, normalização)
├── README.md               # Este arquivo
└── documento_base/         # Especificação e requisitos da atividade
```

## 👨‍💻 Autor

**Matheus Carvalho**  
Disciplina: **Webservice — 4º Período**  
Trabalho Prático Individual — CineSound

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.

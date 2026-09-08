/* =========================================================
   CHATBOT "LAÇO" — Assistente de dúvidas do site Entre Laços
   Widget flutuante, injetado em todas as páginas via API.
========================================================= */
(function () {
  const sugestoesRapidas = [
    "Como adoto um animal?",
    "Como faço uma doação?",
    "Esqueci minha senha",
    "Como edito meu perfil?"
  ];

  /* -------- ESTILOS -------- */
  const estilo = document.createElement("style");
  estilo.textContent = `
    #laco-bolha {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ffc971, #fa5eb4);
      box-shadow: 0 10px 25px rgba(230, 126, 34, 0.35);
      border: none;
      cursor: pointer;
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      transition: transform 0.25s ease;
    }
    #laco-bolha:hover { transform: translateY(-3px) scale(1.05); }

    #laco-janela {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 340px;
      max-width: calc(100vw - 32px);
      height: 460px;
      max-height: calc(100vh - 140px);
      background: #fffdfe;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.25);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 3000;
      font-family: "Lora", serif, sans-serif;
    }
    #laco-janela.ativo { display: flex; }

    #laco-cabecalho {
      background: linear-gradient(135deg, #ffc971, #fa5eb4);
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #laco-cabecalho strong { font-size: 15px; }
    #laco-cabecalho span { font-size: 11px; opacity: 0.9; display: block; }
    #laco-fechar {
      background: rgba(255,255,255,0.25);
      border: none;
      color: #fff;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    }

    #laco-mensagens {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #fff8f5;
    }

    .laco-msg {
      max-width: 85%;
      padding: 10px 13px;
      border-radius: 14px;
      font-size: 13px;
      line-height: 1.5;
    }
    .laco-msg.bot {
      align-self: flex-start;
      background: #ffffff;
      color: #2b2b2b;
      border: 1px solid #ffe1d2;
      border-bottom-left-radius: 4px;
    }
    .laco-msg.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #ffc971, #fa5eb4);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    #laco-sugestoes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 0 14px 10px;
      background: #fff8f5;
    }
    .laco-chip {
      border: 1px solid #fd83a8;
      color: #f37f70;
      background: #fff;
      border-radius: 999px;
      padding: 6px 10px;
      font-size: 11px;
      cursor: pointer;
      transition: 0.2s ease;
    }
    .laco-chip:hover { background: #f37f70; color: #fff; }

    #laco-form {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #f2dfd5;
      background: #fff;
    }
    #laco-input {
      flex: 1;
      border: 1px solid #f2dfd5;
      border-radius: 999px;
      padding: 10px 14px;
      font-size: 13px;
      font-family: inherit;
      outline: none;
    }
    #laco-input:focus { border-color: #f37f70; }
    #laco-enviar {
      border: none;
      background: linear-gradient(135deg, #ffc971, #fa5eb4);
      color: #fff;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 15px;
    }

    @media (max-width: 430px) {
      #laco-janela { right: 16px; width: calc(100vw - 32px); }
      #laco-bolha { right: 16px; }
    }
  `;
  document.head.appendChild(estilo);

  /* -------- INJEÇÃO HTML -------- */
  const bolha = document.createElement("button");
  bolha.id = "laco-bolha";
  bolha.setAttribute("aria-label", "Abrir chat de dúvidas");
  bolha.textContent = "🐾";

  const janela = document.createElement("div");
  janela.id = "laco-janela";
  janela.innerHTML = `
    <div id="laco-cabecalho">
      <div>
        <strong>Laço · Tira-dúvidas</strong>
        <span>Pergunte sobre o site Entre Laços</span>
      </div>
      <button id="laco-fechar" aria-label="Fechar chat">✕</button>
    </div>
    <div id="laco-mensagens"></div>
    <div id="laco-sugestoes"></div>
    <form id="laco-form">
      <input id="laco-input" type="text" placeholder="Digite sua dúvida..." autocomplete="off">
      <button id="laco-enviar" type="submit" aria-label="Enviar">➤</button>
    </form>
  `;

  document.body.appendChild(bolha);
  document.body.appendChild(janela);

  const areaMensagens = janela.querySelector("#laco-mensagens");
  const areaSugestoes = janela.querySelector("#laco-sugestoes");
  const form = janela.querySelector("#laco-form");
  const input = janela.querySelector("#laco-input");

  function adicionarMensagem(texto, autor) {
    const bolhaMsg = document.createElement("div");
    bolhaMsg.className = `laco-msg ${autor}`;
    bolhaMsg.innerHTML = texto;
    areaMensagens.appendChild(bolhaMsg);
    areaMensagens.scrollTop = areaMensagens.scrollHeight;
  }

  function montarSugestoes() {
    areaSugestoes.innerHTML = "";
    sugestoesRapidas.forEach(sugestao => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "laco-chip";
      chip.textContent = sugestao;
      chip.addEventListener("click", () => enviarPergunta(sugestao));
      areaSugestoes.appendChild(chip);
    });
  }

  async function enviarPergunta(texto) {
    if (!texto.trim()) return;
    
    const divTemp = document.createElement("div");
    divTemp.textContent = texto;
    const textoEscapado = divTemp.innerHTML;

    adicionarMensagem(textoEscapado, "user");
    input.value = "";

    try {
      // Aponta diretamente para a porta do backend
      const response = await fetch('http://localhost:3000/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: texto })
      });
      
      const data = await response.json();
      adicionarMensagem(data.reply, "bot");
    } catch (err) {
      adicionarMensagem("Ocorreu um erro ao conectar ao servidor 🐾.", "bot");
    }
  }

  let iniciado = false;
  function abrirChat() {
    janela.classList.add("ativo");
    if (!iniciado) {
      iniciado = true;
      adicionarMensagem(
        "Oi! Eu sou o Laço 🐾, o assistente virtual do Entre Laços. Posso te ajudar com dúvidas sobre adoção, doação, cadastro e uso do site. Escolha uma opção abaixo ou digite sua pergunta:",
        "bot"
      );
      montarSugestoes();
    }
    input.focus();
  }

  bolha.addEventListener("click", () => {
    if (janela.classList.contains("ativo")) {
      janela.classList.remove("ativo");
    } else {
      abrirChat();
    }
  });

  janela.querySelector("#laco-fechar").addEventListener("click", () => {
    janela.classList.remove("ativo");
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    enviarPergunta(input.value);
  });
})();
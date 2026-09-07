(() => {
    const temas = [
        { id: "ruby", nome: "Ruby", icone: "◆", cor: "#ef3340", grupo: "Escuros" },
        { id: "ocean", nome: "Ocean", icone: "●", cor: "#2196f3", grupo: "Escuros" },
        { id: "violet", nome: "Violet", icone: "◆", cor: "#9c5cff", grupo: "Escuros" },
        { id: "emerald", nome: "Emerald", icone: "●", cor: "#20c77a", grupo: "Escuros" },
        { id: "amber", nome: "Amber", icone: "◆", cor: "#f0a51a", grupo: "Escuros" },
        { id: "ice", nome: "Ice", icone: "●", cor: "#55d8ff", grupo: "Escuros" },
        { id: "midnight", nome: "Midnight", icone: "✦", cor: "#6875ff", grupo: "Especiais" },
        { id: "bordeaux", nome: "Bordeaux", icone: "◆", cor: "#9e1638", grupo: "Especiais" },
        { id: "ancient", nome: "Ancient", icone: "◈", cor: "#c9a227", grupo: "Especiais" },
        { id: "forest", nome: "Forest", icone: "❖", cor: "#4caf72", grupo: "Especiais" },
        { id: "sakura", nome: "Sakura", icone: "✿", cor: "#ef78a5", grupo: "Especiais" },
        { id: "arctic", nome: "Arctic", icone: "❄", cor: "#62d9ff", grupo: "Especiais" },
        { id: "turkey", nome: "Turkey", icone: "☾", cor: "#e30a17", grupo: "Especiais" },
        { id: "ruby-light", nome: "Ruby Light", icone: "◆", cor: "#d92838", grupo: "Claros" },
        { id: "ocean-light", nome: "Ocean Light", icone: "●", cor: "#0878c9", grupo: "Claros" },
        { id: "violet-light", nome: "Violet Light", icone: "◆", cor: "#7c3dcc", grupo: "Claros" },
        { id: "emerald-light", nome: "Emerald Light", icone: "●", cor: "#07935a", grupo: "Claros" },
        { id: "amber-light", nome: "Amber Light", icone: "◆", cor: "#bd7900", grupo: "Claros" },
        { id: "ice-light", nome: "Ice Light", icone: "●", cor: "#089fc7", grupo: "Claros" },
        { id: "system", nome: "Sistema", icone: "◐", cor: "#888", grupo: "Automático" }
    ];

    const chave = "agenda-auruda-tema";
    const temaSalvo = localStorage.getItem(chave) || "ruby";

    document.documentElement.dataset.theme = temas.some(t => t.id === temaSalvo) ? temaSalvo : "ruby";

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "themes.css?v=20260907-lightfix2";
    document.head.appendChild(link);

    const reforco = document.createElement("style");
    reforco.textContent = `
        :root[data-theme$="-light"] {
            color-scheme: light !important;
            --bg: var(--theme-bg) !important;
            --surface: var(--theme-surface) !important;
            --surface-2: var(--theme-surface-2) !important;
            --surface-3: var(--theme-surface-3) !important;
            --border: var(--theme-border) !important;
            --border-hover: var(--theme-border-hover) !important;
            --text: var(--theme-text) !important;
            --muted: var(--theme-muted) !important;
            --accent: var(--theme-accent) !important;
            --accent-hover: var(--theme-accent-hover) !important;
            --accent-dark: var(--theme-accent-dark) !important;
        }

        :root[data-theme$="-light"] body {
            background: var(--theme-bg) !important;
            color: var(--theme-text) !important;
        }

        :root[data-theme$="-light"] header {
            background: linear-gradient(180deg, var(--theme-header), var(--theme-header-2)) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }

        :root[data-theme$="-light"] header p,
        :root[data-theme$="-light"] #usuario-logado,
        :root[data-theme$="-light"] .filtro label,
        :root[data-theme$="-light"] .formulario label,
        :root[data-theme$="-light"] .tarefa p,
        :root[data-theme$="-light"] .dia h2 {
            color: var(--theme-text) !important;
        }

        :root[data-theme$="-light"] main,
        :root[data-theme$="-light"] section,
        :root[data-theme$="-light"] .filtro,
        :root[data-theme$="-light"] .painel-admin,
        :root[data-theme$="-light"] .formulario,
        :root[data-theme$="-light"] .tarefa,
        :root[data-theme$="-light"] .conteudo-modal,
        :root[data-theme$="-light"] .contador-feira,
        :root[data-theme$="-light"] .decoracao,
        :root[data-theme$="-light"] .equipe,
        :root[data-theme$="-light"] .card-equipe {
            color: var(--theme-text) !important;
            background-color: var(--theme-surface) !important;
            border-color: var(--theme-border) !important;
        }

        :root[data-theme$="-light"] .tarefa {
            background: linear-gradient(145deg, var(--theme-surface-2), var(--theme-surface)) !important;
        }

        :root[data-theme$="-light"] .tarefa:hover {
            background: var(--theme-surface-3) !important;
            border-color: var(--theme-border-hover) !important;
        }

        :root[data-theme$="-light"] input,
        :root[data-theme$="-light"] textarea,
        :root[data-theme$="-light"] select {
            background: var(--theme-input) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
            color-scheme: light !important;
        }

        :root[data-theme$="-light"] input:focus,
        :root[data-theme$="-light"] textarea:focus {
            background: var(--theme-input) !important;
        }

        :root[data-theme$="-light"] ::placeholder {
            color: var(--theme-muted) !important;
            opacity: 1 !important;
        }

        :root[data-theme$="-light"] #botao-logout,
        :root[data-theme$="-light"] .cancelar {
            background: var(--theme-button) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }

        :root[data-theme$="-light"] #botao-logout:hover,
        :root[data-theme$="-light"] .cancelar:hover {
            background: var(--theme-button-hover) !important;
        }

        :root[data-theme$="-light"] .botao-imagem,
        :root[data-theme$="-light"] .botao-voltar {
            background: var(--theme-surface-2) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }

        :root[data-theme$="-light"] .botao-imagem:hover,
        :root[data-theme$="-light"] .botao-voltar:hover {
            background: var(--theme-surface-3) !important;
        }

        :root[data-theme$="-light"] .arquivo:hover {
            color: var(--theme-text) !important;
        }

        :root[data-theme$="-light"] .modal-senha {
            background: rgba(30, 30, 35, 0.45) !important;
        }

        :root[data-theme$="-light"] .seletor-tema-botao,
        :root[data-theme$="-light"] .seletor-tema-lista {
            background: var(--theme-surface) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }

        :root[data-theme$="-light"] .tema-opcao,
        :root[data-theme$="-light"] .tema-grupo-titulo {
            color: var(--theme-text) !important;
        }
    `;
    document.head.appendChild(reforco);

    function aplicarTema(id) {
        if (!temas.some(t => t.id === id)) return;

        document.documentElement.classList.add("trocando-tema");
        document.documentElement.dataset.theme = id;
        localStorage.setItem(chave, id);

        document.querySelectorAll(".tema-opcao").forEach(botao => {
            botao.classList.toggle("ativo", botao.dataset.tema === id);
        });

        const tema = temas.find(t => t.id === id);
        const nome = document.querySelector(".seletor-tema-nome");
        if (nome && tema) nome.textContent = tema.nome;

        window.setTimeout(() => document.documentElement.classList.remove("trocando-tema"), 260);
    }

    function criarSeletor() {
        if (document.querySelector(".seletor-tema")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "seletor-tema";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "seletor-tema-botao";
        botao.setAttribute("aria-expanded", "false");
        botao.setAttribute("aria-label", "Escolher tema");
        botao.innerHTML = `
            <span class="seletor-tema-atual"><span class="seletor-tema-icone">🎨</span><span class="seletor-tema-nome"></span></span>
            <span class="seletor-tema-seta" aria-hidden="true">⌄</span>
        `;

        const lista = document.createElement("div");
        lista.className = "seletor-tema-lista";
        lista.hidden = true;
        lista.setAttribute("role", "menu");

        const grupos = ["Automático", "Especiais", "Escuros", "Claros"];
        grupos.forEach(grupo => {
            const itens = temas.filter(tema => tema.grupo === grupo);
            if (!itens.length) return;

            const titulo = document.createElement("div");
            titulo.className = "tema-grupo-titulo";
            titulo.textContent = grupo;
            lista.appendChild(titulo);

            const grade = document.createElement("div");
            grade.className = "tema-grupo-grade";

            itens.forEach(tema => {
                const opcao = document.createElement("button");
                opcao.type = "button";
                opcao.className = "tema-opcao";
                opcao.dataset.tema = tema.id;
                opcao.setAttribute("role", "menuitem");
                opcao.innerHTML = `
                    <span class="tema-bolinha" style="--cor-tema: ${tema.cor}"></span>
                    <span class="tema-opcao-texto"><span class="tema-opcao-icone">${tema.icone}</span>${tema.nome}</span>
                `;

                opcao.addEventListener("click", () => {
                    aplicarTema(tema.id);
                    lista.hidden = true;
                    botao.setAttribute("aria-expanded", "false");
                });

                grade.appendChild(opcao);
            });

            lista.appendChild(grade);
        });

        botao.addEventListener("click", event => {
            event.stopPropagation();
            lista.hidden = !lista.hidden;
            botao.setAttribute("aria-expanded", String(!lista.hidden));
        });

        document.addEventListener("click", event => {
            if (!wrapper.contains(event.target)) {
                lista.hidden = true;
                botao.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                lista.hidden = true;
                botao.setAttribute("aria-expanded", "false");
            }
        });

        wrapper.append(botao, lista);
        document.body.appendChild(wrapper);
        aplicarTema(document.documentElement.dataset.theme);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", criarSeletor);
    } else {
        criarSeletor();
    }
})();

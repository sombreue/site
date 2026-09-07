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

    const temasClaros = {
        "ruby-light": {
            bg: "#f6f6f7", surface: "#ffffff", surface2: "#f1f1f3", surface3: "#e9e9ec", border: "#d7d7dc", borderHover: "#b8b8c0", text: "#18181b", muted: "#666670", accent: "#d92838", accentHover: "#ef3340", accentDark: "#a71925", input: "#ffffff", header: "#ffffff", header2: "#f5f5f6", button: "#e7e7ea", buttonHover: "#dcdce0"
        },
        "ocean-light": {
            bg: "#f3f8fb", surface: "#ffffff", surface2: "#eaf3f8", surface3: "#dfeef5", border: "#cbdde7", borderHover: "#aac5d3", text: "#15232b", muted: "#60747f", accent: "#0878c9", accentHover: "#1595ec", accentDark: "#07588f", input: "#ffffff", header: "#ffffff", header2: "#eef6fa", button: "#e4f0f6", buttonHover: "#d5e7ef"
        },
        "violet-light": {
            bg: "#f7f4fa", surface: "#ffffff", surface2: "#f0eaf6", surface3: "#e8dff0", border: "#dacde3", borderHover: "#bea9cb", text: "#21192a", muted: "#75667e", accent: "#7c3dcc", accentHover: "#9553e8", accentDark: "#5d249f", input: "#ffffff", header: "#ffffff", header2: "#f5f0f8", button: "#ede5f3", buttonHover: "#e1d5e9"
        },
        "emerald-light": {
            bg: "#f2f8f5", surface: "#ffffff", surface2: "#e8f3ed", surface3: "#dcece4", border: "#c8ded2", borderHover: "#a9c8b7", text: "#17251e", muted: "#60766a", accent: "#07935a", accentHover: "#12b76e", accentDark: "#056b41", input: "#ffffff", header: "#ffffff", header2: "#edf6f1", button: "#e1eee7", buttonHover: "#d2e4da"
        },
        "amber-light": {
            bg: "#fbf8f0", surface: "#ffffff", surface2: "#f7f0df", surface3: "#eee4ca", border: "#dfd2b5", borderHover: "#c8b78f", text: "#2b2418", muted: "#786b54", accent: "#bd7900", accentHover: "#d89400", accentDark: "#8c5b00", input: "#ffffff", header: "#fffdf8", header2: "#f8f1e2", button: "#f0e7d2", buttonHover: "#e6dac0"
        },
        "ice-light": {
            bg: "#f2f9fc", surface: "#ffffff", surface2: "#e8f5fa", surface3: "#dceef4", border: "#c7dfe8", borderHover: "#a7c9d5", text: "#17272d", muted: "#607b85", accent: "#089fc7", accentHover: "#18b9e2", accentDark: "#087b99", input: "#ffffff", header: "#ffffff", header2: "#edf7fa", button: "#e1f0f5", buttonHover: "#d1e6ed"
        }
    };

    const chave = "agenda-auruda-tema";
    const temaSalvo = localStorage.getItem(chave) || "ruby";
    const temaInicial = temas.some(t => t.id === temaSalvo) ? temaSalvo : "ruby";
    document.documentElement.dataset.theme = temaInicial;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "themes.css?v=20260907-lightfix3";
    document.head.appendChild(link);

    const estilo = document.createElement("style");
    estilo.textContent = `
        html[data-theme$="-light"],
        html[data-theme$="-light"] body {
            background: var(--theme-bg) !important;
            color: var(--theme-text) !important;
        }

        html[data-theme$="-light"] header {
            background: linear-gradient(180deg, var(--theme-header), var(--theme-header-2)) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }

        html[data-theme$="-light"] main,
        html[data-theme$="-light"] section,
        html[data-theme$="-light"] .filtro,
        html[data-theme$="-light"] .painel-admin,
        html[data-theme$="-light"] .formulario,
        html[data-theme$="-light"] .tarefa,
        html[data-theme$="-light"] .conteudo-modal,
        html[data-theme$="-light"] .contador-feira,
        html[data-theme$="-light"] .equipe,
        html[data-theme$="-light"] .card-equipe {
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }

        html[data-theme$="-light"] .filtro,
        html[data-theme$="-light"] .painel-admin,
        html[data-theme$="-light"] .formulario,
        html[data-theme$="-light"] .conteudo-modal,
        html[data-theme$="-light"] .contador-feira,
        html[data-theme$="-light"] .equipe,
        html[data-theme$="-light"] .card-equipe {
            background: var(--theme-surface) !important;
        }

        html[data-theme$="-light"] .tarefa {
            background: linear-gradient(145deg, var(--theme-surface-2), var(--theme-surface)) !important;
        }

        html[data-theme$="-light"] input,
        html[data-theme$="-light"] textarea,
        html[data-theme$="-light"] select {
            background: var(--theme-input) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
            color-scheme: light !important;
        }

        html[data-theme$="-light"] .dia h2,
        html[data-theme$="-light"] .tarefa p,
        html[data-theme$="-light"] .filtro label,
        html[data-theme$="-light"] .formulario label,
        html[data-theme$="-light"] #usuario-logado {
            color: var(--theme-text) !important;
        }

        html[data-theme$="-light"] #botao-logout,
        html[data-theme$="-light"] .cancelar,
        html[data-theme$="-light"] .botao-imagem,
        html[data-theme$="-light"] .botao-voltar {
            background: var(--theme-button) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }

        html[data-theme$="-light"] .seletor-tema-botao,
        html[data-theme$="-light"] .seletor-tema-lista {
            background: var(--theme-surface) !important;
            color: var(--theme-text) !important;
            border-color: var(--theme-border) !important;
        }
    `;
    document.head.appendChild(estilo);

    function limparVariaveisForcadas() {
        const root = document.documentElement;
        [
            "--theme-bg", "--theme-surface", "--theme-surface-2", "--theme-surface-3",
            "--theme-border", "--theme-border-hover", "--theme-text", "--theme-muted",
            "--theme-accent", "--theme-accent-hover", "--theme-accent-dark", "--theme-input",
            "--theme-header", "--theme-header-2", "--theme-button", "--theme-button-hover",
            "--bg", "--surface", "--surface-2", "--surface-3", "--border", "--border-hover",
            "--text", "--muted", "--accent", "--accent-hover", "--accent-dark"
        ].forEach(nome => root.style.removeProperty(nome));
    }

    function forcarVariaveisClaras(id) {
        const cores = temasClaros[id];
        const root = document.documentElement;
        if (!cores) {
            limparVariaveisForcadas();
            return;
        }

        const vars = {
            "--theme-bg": cores.bg,
            "--theme-surface": cores.surface,
            "--theme-surface-2": cores.surface2,
            "--theme-surface-3": cores.surface3,
            "--theme-border": cores.border,
            "--theme-border-hover": cores.borderHover,
            "--theme-text": cores.text,
            "--theme-muted": cores.muted,
            "--theme-accent": cores.accent,
            "--theme-accent-hover": cores.accentHover,
            "--theme-accent-dark": cores.accentDark,
            "--theme-input": cores.input,
            "--theme-header": cores.header,
            "--theme-header-2": cores.header2,
            "--theme-button": cores.button,
            "--theme-button-hover": cores.buttonHover,
            "--bg": cores.bg,
            "--surface": cores.surface,
            "--surface-2": cores.surface2,
            "--surface-3": cores.surface3,
            "--border": cores.border,
            "--border-hover": cores.borderHover,
            "--text": cores.text,
            "--muted": cores.muted,
            "--accent": cores.accent,
            "--accent-hover": cores.accentHover,
            "--accent-dark": cores.accentDark
        };

        Object.entries(vars).forEach(([nome, valor]) => root.style.setProperty(nome, valor, "important"));
        root.style.setProperty("color-scheme", "light", "important");
    }

    function aplicarTema(id) {
        if (!temas.some(t => t.id === id)) return;

        document.documentElement.classList.add("trocando-tema");
        document.documentElement.dataset.theme = id;
        forcarVariaveisClaras(id);
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

        ["Automático", "Especiais", "Escuros", "Claros"].forEach(grupo => {
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

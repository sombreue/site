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
    link.href = "themes.css";
    document.head.appendChild(link);

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

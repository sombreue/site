(() => {
    const temas = [
        { id: "ruby", nome: "Ruby", icone: "◆", cor: "#ef3340" },
        { id: "ocean", nome: "Ocean", icone: "●", cor: "#2196f3" },
        { id: "violet", nome: "Violet", icone: "◆", cor: "#9c5cff" },
        { id: "emerald", nome: "Emerald", icone: "●", cor: "#20c77a" },
        { id: "amber", nome: "Amber", icone: "◆", cor: "#f0a51a" },
        { id: "ice", nome: "Ice", icone: "●", cor: "#55d8ff" },
        { id: "ruby-light", nome: "Ruby Light", icone: "◆", cor: "#d92838" },
        { id: "ocean-light", nome: "Ocean Light", icone: "●", cor: "#0878c9" },
        { id: "violet-light", nome: "Violet Light", icone: "◆", cor: "#7c3dcc" },
        { id: "emerald-light", nome: "Emerald Light", icone: "●", cor: "#07935a" },
        { id: "amber-light", nome: "Amber Light", icone: "◆", cor: "#bd7900" },
        { id: "ice-light", nome: "Ice Light", icone: "●", cor: "#089fc7" },
        { id: "turkey", nome: "Turkey", icone: "☾", cor: "#e30a17" }
    ];

    const chave = "agenda-auruda-tema";
    const temaSalvo = localStorage.getItem(chave) || "ruby";

    document.documentElement.dataset.theme = temas.some(t => t.id === temaSalvo)
        ? temaSalvo
        : "ruby";

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "themes.css";
    document.head.appendChild(link);

    function aplicarTema(id) {
        if (!temas.some(t => t.id === id)) return;

        document.documentElement.dataset.theme = id;
        localStorage.setItem(chave, id);

        document.querySelectorAll(".tema-opcao").forEach(botao => {
            botao.classList.toggle("ativo", botao.dataset.tema === id);
        });

        const tema = temas.find(t => t.id === id);
        const nome = document.querySelector(".seletor-tema-nome");
        if (nome && tema) nome.textContent = tema.nome;
    }

    function criarSeletor() {
        const wrapper = document.createElement("div");
        wrapper.className = "seletor-tema";

        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "seletor-tema-botao";
        botao.setAttribute("aria-expanded", "false");
        botao.innerHTML = `
            <span>🎨 <span class="seletor-tema-nome"></span></span>
            <span aria-hidden="true">⌄</span>
        `;

        const lista = document.createElement("div");
        lista.className = "seletor-tema-lista";
        lista.hidden = true;
        lista.setAttribute("role", "menu");

        temas.forEach(tema => {
            const opcao = document.createElement("button");
            opcao.type = "button";
            opcao.className = "tema-opcao";
            opcao.dataset.tema = tema.id;
            opcao.setAttribute("role", "menuitem");
            opcao.innerHTML = `
                <span class="tema-bolinha" style="--cor-tema: ${tema.cor}"></span>
                <span>${tema.icone} ${tema.nome}</span>
            `;

            opcao.addEventListener("click", () => {
                aplicarTema(tema.id);
                lista.hidden = true;
                botao.setAttribute("aria-expanded", "false");
            });

            lista.appendChild(opcao);
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

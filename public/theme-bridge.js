(() => {
    const root = document.documentElement;

    const sincronizar = () => {
        const tema = root.dataset.theme || "ruby";
        const claro = tema.endsWith("-light") || tema === "system" && window.matchMedia("(prefers-color-scheme: light)").matches;
        if (!claro) return;

        const vars = {
            "--bg": "var(--theme-bg)",
            "--surface": "var(--theme-surface)",
            "--surface-2": "var(--theme-surface-2)",
            "--surface-3": "var(--theme-surface-3)",
            "--border": "var(--theme-border)",
            "--border-hover": "var(--theme-border-hover)",
            "--text": "var(--theme-text)",
            "--muted": "var(--theme-muted)",
            "--accent": "var(--theme-accent)",
            "--accent-hover": "var(--theme-accent-hover)",
            "--accent-dark": "var(--theme-accent-dark)"
        };

        Object.entries(vars).forEach(([nome, valor]) => {
            root.style.setProperty(nome, valor, "important");
        });

        root.style.setProperty("color-scheme", "light", "important");

        const aplicar = (seletor, propriedades) => {
            document.querySelectorAll(seletor).forEach(elemento => {
                Object.entries(propriedades).forEach(([nome, valor]) => {
                    elemento.style.setProperty(nome, valor, "important");
                });
            });
        };

        document.body.style.setProperty("background", "var(--theme-bg)", "important");
        document.body.style.setProperty("background-image", "none", "important");
        document.body.style.setProperty("color", "var(--theme-text)", "important");

        aplicar("header", {
            background: "linear-gradient(180deg, var(--theme-header), var(--theme-header-2))",
            color: "var(--theme-text)",
            "border-color": "var(--theme-border)"
        });

        aplicar(".filtro, .painel-admin, .formulario, .conteudo-modal, .tarefa, .equipe, .card-equipe, .contador-feira", {
            "border-color": "var(--theme-border)",
            color: "var(--theme-text)"
        });

        aplicar(".filtro, .painel-admin, .formulario, .conteudo-modal, .equipe, .card-equipe, .contador-feira", {
            background: "var(--theme-surface)"
        });

        aplicar(".tarefa", {
            background: "linear-gradient(145deg, var(--theme-surface-2), var(--theme-surface))"
        });

        aplicar("input, textarea, select", {
            background: "var(--theme-input)",
            color: "var(--theme-text)",
            "border-color": "var(--theme-border)"
        });

        aplicar(".dia h2, .tarefa h3, .painel-admin h2, .formulario h2", {
            color: "var(--theme-accent)"
        });

        aplicar(".tarefa p, .filtro label, .formulario label, .painel-admin h3", {
            color: "var(--theme-text)"
        });

        aplicar("#usuario-logado, header p, .secao-cabecalho p", {
            color: "var(--theme-muted)"
        });

        aplicar("#botao-logout, .cancelar, .botao-imagem, .botao-voltar", {
            background: "var(--theme-button)",
            color: "var(--theme-text)",
            "border-color": "var(--theme-border)"
        });
    };

    sincronizar();

    new MutationObserver(sincronizar).observe(root, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });

    const esquema = window.matchMedia("(prefers-color-scheme: light)");
    if (esquema.addEventListener) esquema.addEventListener("change", sincronizar);
    else if (esquema.addListener) esquema.addListener(sincronizar);
})();

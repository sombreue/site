(() => {
    if (window.__notificacoesInicializadas) return;
    window.__notificacoesInicializadas = true;

    const estilo = document.createElement("style");
    estilo.textContent = `
        .notificacoes-widget{position:fixed;top:16px;right:16px;z-index:9999;font-family:Arial,Helvetica,sans-serif}
        .notificacoes-botao{position:relative;width:46px;height:46px;border:1px solid var(--theme-border,#2c2c34);border-radius:14px;background:var(--theme-surface,#19191f);color:var(--theme-text,#f4f4f5);cursor:pointer;font-size:20px;box-shadow:0 8px 24px rgba(0,0,0,.18)}
        .notificacoes-botao:hover{border-color:var(--theme-accent,#ef3340);transform:translateY(-1px)}
        .notificacoes-badge{position:absolute;top:-5px;right:-5px;min-width:19px;height:19px;padding:0 5px;display:none;align-items:center;justify-content:center;border-radius:999px;background:var(--theme-accent,#ef3340);color:#fff;font-size:11px;font-weight:800;border:2px solid var(--theme-bg,#111116)}
        .notificacoes-badge.visivel{display:flex}
        .notificacoes-painel{position:absolute;top:56px;right:0;width:min(380px,calc(100vw - 24px));max-height:min(620px,calc(100vh - 90px));overflow:auto;padding:14px;border:1px solid var(--theme-border,#2c2c34);border-radius:18px;background:var(--theme-surface,#19191f);color:var(--theme-text,#f4f4f5);box-shadow:0 18px 50px rgba(0,0,0,.3);display:none}
        .notificacoes-painel.aberto{display:block}
        .notificacoes-cabecalho{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
        .notificacoes-cabecalho h2{margin:0;font-size:1.05rem}
        .notificacoes-acoes{display:flex;gap:7px}
        .notificacoes-acao{border:1px solid var(--theme-border,#2c2c34);border-radius:8px;background:var(--theme-surface-2,#202027);color:var(--theme-text,#f4f4f5);padding:7px 9px;cursor:pointer;font:inherit;font-size:.78rem}
        .notificacoes-acao:hover{border-color:var(--theme-accent,#ef3340)}
        .notificacao-item{display:block;width:100%;padding:12px;margin:8px 0;border:1px solid var(--theme-border,#2c2c34);border-radius:12px;background:var(--theme-surface-2,#202027);color:inherit;text-align:left;cursor:pointer}
        .notificacao-item.nao-lida{border-color:var(--theme-accent,#ef3340)}
        .notificacao-item strong{display:block;font-size:.9rem;margin-bottom:4px}
        .notificacao-item p{margin:0;color:var(--theme-muted,#a1a1aa);font-size:.84rem;line-height:1.4}
        .notificacao-item small{display:block;margin-top:7px;color:var(--theme-muted,#a1a1aa);font-size:.72rem}
        .notificacoes-vazio{padding:24px 8px;text-align:center;color:var(--theme-muted,#a1a1aa)}
        .notificacoes-config{display:none;border-top:1px solid var(--theme-border,#2c2c34);margin-top:12px;padding-top:14px}
        .notificacoes-config.aberto{display:block}
        .notificacoes-config label{display:flex;align-items:center;gap:9px;margin:9px 0;font-size:.88rem}
        .notificacoes-config select{width:100%;margin-top:5px;padding:9px;border-radius:9px;border:1px solid var(--theme-border,#2c2c34);background:var(--theme-input,#202027);color:var(--theme-text,#f4f4f5)}
        .notificacoes-config-status{min-height:18px;color:var(--theme-muted,#a1a1aa);font-size:.78rem}
        @media(max-width:600px){.notificacoes-widget{top:10px;right:10px}.notificacoes-painel{right:-2px}}
    `;
    document.head.appendChild(estilo);

    const widget = document.createElement("div");
    widget.className = "notificacoes-widget";
    widget.innerHTML = `
        <button type="button" class="notificacoes-botao" aria-label="Notificações" aria-expanded="false">
            <span aria-hidden="true">🔔</span><span class="notificacoes-badge">0</span>
        </button>
        <section class="notificacoes-painel" aria-label="Notificações">
            <div class="notificacoes-cabecalho">
                <h2>Notificações</h2>
                <div class="notificacoes-acoes">
                    <button type="button" class="notificacoes-acao marcar-todas">Marcar lidas</button>
                    <button type="button" class="notificacoes-acao abrir-config">Configurar</button>
                </div>
            </div>
            <div class="notificacoes-lista"><div class="notificacoes-vazio">Carregando...</div></div>
            <div class="notificacoes-config">
                <label><input type="checkbox" class="config-ativa"> Receber lembretes de atividades</label>
                <label>Antecedência:
                    <select class="config-dias">
                        <option value="0">No dia</option>
                        <option value="1">1 dia antes</option>
                        <option value="2">2 dias antes</option>
                        <option value="3">3 dias antes</option>
                        <option value="4">4 dias antes</option>
                        <option value="5">5 dias antes</option>
                        <option value="7">7 dias antes</option>
                        <option value="14">14 dias antes</option>
                        <option value="30">30 dias antes</option>
                    </select>
                </label>
                <button type="button" class="notificacoes-acao salvar-config">Salvar preferências</button>
                <div class="notificacoes-config-status"></div>
            </div>
        </section>
    `;
    document.body.appendChild(widget);

    const botao = widget.querySelector(".notificacoes-botao");
    const painel = widget.querySelector(".notificacoes-painel");
    const badge = widget.querySelector(".notificacoes-badge");
    const lista = widget.querySelector(".notificacoes-lista");
    const config = widget.querySelector(".notificacoes-config");
    const configAtiva = widget.querySelector(".config-ativa");
    const configDias = widget.querySelector(".config-dias");
    const configStatus = widget.querySelector(".notificacoes-config-status");

    let notificacoes = [];

    function formatarData(data) {
        if (!data) return "";
        const valor = String(data).slice(0, 10);
        return new Date(`${valor}T12:00:00`).toLocaleDateString("pt-BR");
    }

    function renderizar() {
        const naoLidas = notificacoes.filter(n => !n.lida_em).length;
        badge.textContent = naoLidas > 99 ? "99+" : String(naoLidas);
        badge.classList.toggle("visivel", naoLidas > 0);

        if (!notificacoes.length) {
            lista.innerHTML = '<div class="notificacoes-vazio">Nenhuma notificação por enquanto.</div>';
            return;
        }

        lista.innerHTML = notificacoes.map(n => {
            const classe = n.lida_em ? "" : " nao-lida";
            return `<button type="button" class="notificacao-item${classe}" data-notificacao-id="${Number(n.id)}" data-link="${n.link || ""}">
                <strong>${escapar(n.titulo)}</strong>
                <p>${escapar(n.mensagem)}</p>
                <small>Entrega: ${formatarData(n.data_atividade)}</small>
            </button>`;
        }).join("");
    }

    function escapar(valor) {
        return String(valor ?? "").replace(/[&<>'"]/g, c => ({
            "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"
        }[c]));
    }

    async function carregar() {
        try {
            const resposta = await fetch("/api/notificacoes", {cache:"no-store", credentials:"same-origin"});
            if (resposta.status === 401) { widget.remove(); return; }
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || "Erro");
            notificacoes = dados.notificacoes || [];
            renderizar();
        } catch (erro) {
            console.error("[NOTIFICAÇÕES]", erro);
            lista.innerHTML = '<div class="notificacoes-vazio">Não foi possível carregar as notificações.</div>';
        }
    }

    async function carregarConfig() {
        try {
            const resposta = await fetch("/api/notificacoes/config", {cache:"no-store", credentials:"same-origin"});
            if (!resposta.ok) return;
            const dados = await resposta.json();
            if (!dados.sucesso) return;
            configAtiva.checked = dados.configuracao.ativa !== false;
            configDias.value = String(dados.configuracao.dias_antecedencia ?? 1);
        } catch (erro) {
            console.error("[NOTIFICAÇÕES] Configuração:", erro);
        }
    }

    async function marcarTodas() {
        try {
            const resposta = await fetch("/api/notificacoes/marcar-todas-lidas", {
                method:"POST", credentials:"same-origin"
            });
            if (!resposta.ok) throw new Error("Falha");
            notificacoes.forEach(n => n.lida_em = n.lida_em || new Date().toISOString());
            renderizar();
        } catch (erro) { console.error("[NOTIFICAÇÕES]", erro); }
    }

    async function marcarLida(id) {
        try {
            await fetch(`/api/notificacoes/${encodeURIComponent(id)}/lida`, {
                method:"PATCH", credentials:"same-origin"
            });
            const n = notificacoes.find(x => Number(x.id) === Number(id));
            if (n) n.lida_em = new Date().toISOString();
        } catch (erro) { console.error("[NOTIFICAÇÕES]", erro); }
    }

    async function salvarConfig() {
        configStatus.textContent = "Salvando...";
        try {
            const resposta = await fetch("/api/notificacoes/config", {
                method:"PUT",
                headers:{"Content-Type":"application/json"},
                credentials:"same-origin",
                body:JSON.stringify({
                    ativa: configAtiva.checked,
                    dias_antecedencia: Number(configDias.value)
                })
            });
            const dados = await resposta.json();
            if (!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || "Não foi possível salvar.");
            configStatus.textContent = "Preferências salvas.";
        } catch (erro) {
            configStatus.textContent = erro.message || "Erro ao salvar.";
        }
    }

    botao.addEventListener("click", async () => {
        const aberto = painel.classList.toggle("aberto");
        botao.setAttribute("aria-expanded", String(aberto));
        if (aberto) {
            await carregar();
            await carregarConfig();
        }
    });

    widget.querySelector(".marcar-todas").addEventListener("click", marcarTodas);
    widget.querySelector(".abrir-config").addEventListener("click", async () => {
        config.classList.toggle("aberto");
        if (config.classList.contains("aberto")) await carregarConfig();
    });
    widget.querySelector(".salvar-config").addEventListener("click", salvarConfig);

    lista.addEventListener("click", async evento => {
        const item = evento.target.closest("[data-notificacao-id]");
        if (!item) return;
        const id = item.dataset.notificacaoId;
        await marcarLida(id);
        renderizar();
        const link = item.dataset.link;
        if (link) window.location.href = link;
    });

    document.addEventListener("click", evento => {
        if (!widget.contains(evento.target)) {
            painel.classList.remove("aberto");
            botao.setAttribute("aria-expanded", "false");
        }
    });

    carregar();
    setInterval(carregar, 60 * 1000);
})();

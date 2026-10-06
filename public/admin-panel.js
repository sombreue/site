(() => {
    const $ = id => document.getElementById(id);
    const usuarioLogado = $("admin-usuario");
    const listaUsuarios = $("lista-usuarios");
    const listaSessoes = $("lista-sessoes");
    const status = $("status-admin");
    const campoSenha = $("nova-senha");
    const botaoMostrarSenha = $("botao-mostrar-senha");

    const escapar = valor => String(valor ?? "").replace(/[&<>'"]/g, c => ({
        "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
    }[c]));

    const dataLocal = valor => {
        if (!valor) return "sem data";
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? "sem data" : data.toLocaleString("pt-BR", {dateStyle:"short", timeStyle:"short"});
    };

    async function json(resposta) {
        const dados = await resposta.json().catch(() => ({}));
        if (resposta.status === 401) {
            window.location.href = "/login.html";
            throw new Error("Sessão encerrada.");
        }
        if (resposta.status === 403) {
            window.location.href = "/";
            throw new Error("Acesso negado.");
        }
        if (!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || "Não foi possível concluir a operação.");
        return dados;
    }

    async function verificarAdmin() {
        try {
            const resposta = await fetch("/api/usuario", {
                credentials: "same-origin",
                cache: "no-store",
                headers: { "Accept": "application/json" },
                signal: AbortSignal.timeout(5000)
            });

            if (resposta.status === 401 || resposta.status === 403) {
                window.location.replace("/login.html");
                return false;
            }

            const dados = await resposta.json().catch(() => null);

            if (!resposta.ok || !dados?.sucesso || !dados?.usuario) {
                throw new Error(dados?.mensagem || "Não foi possível verificar a sessão.");
            }

            if (dados.usuario.tipo !== "admin") {
                window.location.replace("/");
                return false;
            }

            usuarioLogado.textContent = `Logado como: ${dados.usuario.usuario} (administrador)`;
            return true;
        } catch (erro) {
            usuarioLogado.textContent = erro.name === "TimeoutError"
                ? "O servidor demorou demais para responder."
                : "Não foi possível verificar a sessão.";
            setTimeout(() => window.location.replace("/login.html"), 700);
            return false;
        }
    }

    async function carregarUsuarios() {
        try {
            const dados = await json(await fetch("/api/admin/usuarios", {credentials:"same-origin", cache:"no-store"}));
            const atual = dados.usuarioLogadoId ?? null;
            listaUsuarios.innerHTML = dados.usuarios.map(usuario => `
                <article class="usuario-admin-item">
                    <div class="item-principal">
                        <strong>${escapar(usuario.usuario)}</strong>
                        <span class="item-meta">${usuario.tipo === "admin" ? "Administrador" : "Usuário"}</span>
                    </div>
                    <div class="usuario-acoes">
                        <button type="button" data-alterar-senha="${usuario.id}">Mudar senha</button>
                        ${usuario.tipo === "admin" ? '<em>Administrador</em>' : usuario.id === atual ? '<em>Conta atual</em>' : `<button type="button" data-excluir-usuario="${usuario.id}">Excluir</button>`}
                    </div>
                </article>`
            ).join("") || '<div class="estado-vazio">Nenhum usuário cadastrado.</div>';
        } catch (erro) {
            listaUsuarios.innerHTML = `<div class="estado-vazio">${escapar(erro.message)}</div>`;
        }
    }

    async function carregarSessoes() {
        try {
            const dados = await json(await fetch("/api/admin/sessoes", {credentials:"same-origin", cache:"no-store"}));
            listaSessoes.innerHTML = dados.sessoes.map(sessao => `
                <article class="sessao-admin-item ${sessao.atual ? "sessao-atual" : ""}">
                    <div class="item-principal">
                        <div>
                            <strong>${escapar(sessao.usuario || "Sessão sem usuário")}</strong>
                            <div class="item-meta">${sessao.tipo === "admin" ? "Administrador" : "Usuário"} · expira em ${escapar(dataLocal(sessao.expiraEm))}</div>
                        </div>
                    </div>
                    <div class="sessao-acoes">
                        ${sessao.atual ? '<span class="sessao-tag">Esta sessão</span>' : `<button type="button" class="botao-perigo" data-encerrar-sessao="${encodeURIComponent(sessao.sid)}">Encerrar</button>`}
                    </div>
                </article>`
            ).join("") || '<div class="estado-vazio">Nenhuma sessão ativa.</div>';
        } catch (erro) {
            listaSessoes.innerHTML = `<div class="estado-vazio">${escapar(erro.message)}</div>`;
        }
    }

    async function alterarSenha(id, nome) {
        const novaSenha = prompt(`Digite a nova senha para ${nome}:`);
        if (novaSenha === null) return;
        if (novaSenha.length < 4) { status.textContent = "A senha precisa ter pelo menos 4 caracteres."; return; }
        try {
            await json(await fetch(`/api/admin/usuarios/${id}/senha`, {
                method:"PUT", credentials:"same-origin",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({senha:novaSenha})
            }));
            status.textContent = `Senha de ${nome} alterada com sucesso.`;
            carregarSessoes();
        } catch (erro) { status.textContent = erro.message; }
    }

    listaUsuarios.addEventListener("click", async evento => {
        const alterar = evento.target.closest("[data-alterar-senha]");
        if (alterar) {
            const item = alterar.closest(".usuario-admin-item");
            const nome = item?.querySelector("strong")?.textContent || "este usuário";
            await alterarSenha(alterar.dataset.alterarSenha, nome);
            return;
        }
        const excluir = evento.target.closest("[data-excluir-usuario]");
        if (!excluir || !confirm("Excluir este usuário?")) return;
        try {
            await json(await fetch(`/api/admin/usuarios/${excluir.dataset.excluirUsuario}`, {method:"DELETE", credentials:"same-origin"}));
            status.textContent = "Usuário excluído.";
            carregarUsuarios();
            carregarSessoes();
        } catch (erro) { status.textContent = erro.message; }
    });

    listaSessoes.addEventListener("click", async evento => {
        const botao = evento.target.closest("[data-encerrar-sessao]");
        if (!botao) return;
        const sid = decodeURIComponent(botao.dataset.encerrarSessao);
        if (!confirm("Encerrar esta sessão remotamente? O usuário perderá o acesso imediatamente.")) return;
        try {
            await json(await fetch(`/api/admin/sessoes/${encodeURIComponent(sid)}`, {method:"DELETE", credentials:"same-origin"}));
            carregarSessoes();
        } catch (erro) { alert(erro.message); }
    });

    $("form-criar-usuario").addEventListener("submit", async evento => {
        evento.preventDefault();
        status.textContent = "Criando usuário...";
        try {
            await json(await fetch("/api/admin/usuarios", {
                method:"POST", credentials:"same-origin",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    usuario:$("novo-usuario").value.trim(),
                    senha:campoSenha.value,
                    tipo:$("tipo-nova-conta").value
                })
            }));
            status.textContent = "Usuário criado com sucesso.";
            evento.target.reset();
            campoSenha.type = "password";
            botaoMostrarSenha.textContent = "Mostrar";
            $("tipo-nova-conta").value = "usuario";
            carregarUsuarios();
        } catch (erro) { status.textContent = erro.message; }
    });

    botaoMostrarSenha.addEventListener("click", () => {
        const mostrar = campoSenha.type === "password";
        campoSenha.type = mostrar ? "text" : "password";
        botaoMostrarSenha.textContent = mostrar ? "Ocultar" : "Mostrar";
    });

    $("botao-atualizar-usuarios").addEventListener("click", carregarUsuarios);
    $("botao-atualizar-sessoes").addEventListener("click", carregarSessoes);

    $("botao-logout").addEventListener("click", async () => {
        try { await fetch("/api/logout", {method:"POST", credentials:"same-origin"}); }
        finally { window.location.href="/login.html"; }
    });

    (async () => {
        try {
            if (await verificarAdmin()) {
                await Promise.all([carregarUsuarios(), carregarSessoes()]);
            }
        } catch (_) {}
    })();
})();
(() => {
    const usuarioLogado = document.getElementById("usuario-logado-index");
    const botaoLogout = document.getElementById("botao-logout-index");
    const linkAdmin = document.getElementById("link-admin-index");

    async function sair() {
        try {
            await fetch("/api/logout", { method:"POST", credentials:"same-origin" });
        } finally {
            window.location.href = "/login.html";
        }
    }

    botaoLogout?.addEventListener("click", sair);

    async function inicializar() {
        try {
            const resposta = await fetch("/api/usuario", {
                credentials:"same-origin",
                cache:"no-store"
            });
            const dados = await resposta.json();

            if (!resposta.ok || !dados.sucesso || !dados.usuario) {
                window.location.href = "/login.html";
                return;
            }

            const usuario = dados.usuario;
            usuarioLogado.textContent = `Logado como: ${usuario.usuario}${usuario.tipo === "admin" ? " (administrador)" : ""}`;
            if (botaoLogout) botaoLogout.hidden = false;

            if (usuario.tipo === "admin" && linkAdmin) {
                linkAdmin.hidden = false;
            }
        } catch (erro) {
            window.location.href = "/login.html";
        }
    }

    inicializar();
})();
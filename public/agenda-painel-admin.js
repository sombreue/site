/* =========================================================
   PAINEL ADMINISTRATIVO — MINIMIZÁVEL
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "agenda-admin-panel-minimizado";

    function obterPainel() {
        return document.getElementById("painel-admin");
    }

    function obterBotao() {
        return document.getElementById("botao-minimizar-admin");
    }

    function aplicarEstado(minimizado) {
        const painel = obterPainel();
        const botao = obterBotao();

        if (!painel || !botao) return;

        painel.classList.toggle("minimizado", minimizado);
        botao.setAttribute("aria-expanded", String(!minimizado));
        botao.setAttribute("aria-label", minimizado ? "Expandir painel de administração" : "Minimizar painel de administração");
        botao.title = minimizado ? "Expandir painel" : "Minimizar painel";
        botao.textContent = minimizado ? "+" : "−";
    }

    function alternarPainel() {
        const painel = obterPainel();
        if (!painel) return;

        const minimizado = !painel.classList.contains("minimizado");
        aplicarEstado(minimizado);

        try {
            localStorage.setItem(STORAGE_KEY, String(minimizado));
        } catch (erro) {
            console.warn("Não foi possível salvar o estado do painel admin.", erro);
        }
    }

    function inicializarPainel() {
        const painel = obterPainel();
        const botao = obterBotao();
        if (!painel || !botao) return;

        botao.addEventListener("click", alternarPainel);

        let minimizado = false;
        try {
            minimizado = localStorage.getItem(STORAGE_KEY) === "true";
        } catch (erro) {
            console.warn("Não foi possível ler o estado do painel admin.", erro);
        }

        aplicarEstado(minimizado);

        // O botão só aparece para administradores.
        fetch("/api/sessao")
            .then(resposta => resposta.json())
            .then(sessao => {
                if (sessao.logado && sessao.tipo === "admin") {
                    const link = document.createElement("a");
                    link.href = "/admin-sugestoes.html";
                    link.className = "botao-sugestoes-admin";
                    link.textContent = "Sugestões recebidas";
                    link.title = "Abrir sugestões recebidas";
                    painel.querySelector(".painel-admin-cabecalho")?.appendChild(link);
                }
            })
            .catch(() => {});
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializarPainel);
    } else {
        inicializarPainel();
    }
})();

/* =========================================================
   HORÁRIO DE AULAS — PAINEL MINIMIZÁVEL
   ========================================================= */

(function () {
    "use strict";

    const STORAGE_KEY = "agenda-horario-aulas-minimizado";

    function aplicarEstado(minimizado) {
        const painel = document.getElementById("horario-aulas");
        const botao = document.getElementById("botao-minimizar-horario");

        if (!painel || !botao) return;

        painel.classList.toggle("minimizado", minimizado);
        botao.setAttribute("aria-expanded", String(!minimizado));
        botao.setAttribute(
            "aria-label",
            minimizado ? "Expandir horário de aulas" : "Minimizar horário de aulas"
        );
        botao.title = minimizado ? "Expandir horário" : "Minimizar horário";
        botao.textContent = minimizado ? "+" : "−";
    }

    function alternar() {
        const painel = document.getElementById("horario-aulas");
        if (!painel) return;

        const minimizado = !painel.classList.contains("minimizado");
        aplicarEstado(minimizado);

        try {
            localStorage.setItem(STORAGE_KEY, String(minimizado));
        } catch (erro) {
            console.warn("Não foi possível salvar o estado do horário.", erro);
        }
    }

    function inicializar() {
        const botao = document.getElementById("botao-minimizar-horario");
        if (!botao) return;

        botao.addEventListener("click", alternar);

        let minimizado = false;
        try {
            minimizado = localStorage.getItem(STORAGE_KEY) === "true";
        } catch (erro) {
            console.warn("Não foi possível ler o estado do horário.", erro);
        }

        aplicarEstado(minimizado);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }
})();

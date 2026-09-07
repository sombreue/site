const CHAVE_SUGESTOES = "agenda-sugestoes-site";

function inicializarSugestoes() {
    const secao = document.getElementById("sugestoes-secao");
    const formulario = document.getElementById("formulario-sugestao");
    const botao = document.getElementById("botao-aba-sugestoes");

    if (!secao || !formulario || !botao) return;

    botao.addEventListener("click", () => {
        const minimizado = secao.classList.toggle("minimizado");
        botao.setAttribute("aria-expanded", String(!minimizado));
        botao.textContent = minimizado ? "Abrir" : "Minimizar";
    });

    formulario.addEventListener("submit", salvarSugestao);
}

function salvarSugestao(evento) {
    evento.preventDefault();

    const nome = document.getElementById("nome-sugestao")?.value.trim();
    const sugestao = document.getElementById("texto-sugestao")?.value.trim();
    const status = document.getElementById("status-sugestao");

    if (!nome || !sugestao) {
        if (status) status.textContent = "Preencha seu nome e a sugestão.";
        return;
    }

    const sugestoes = JSON.parse(localStorage.getItem(CHAVE_SUGESTOES) || "[]");

    sugestoes.push({
        nome,
        sugestao,
        data: new Date().toISOString()
    });

    localStorage.setItem(CHAVE_SUGESTOES, JSON.stringify(sugestoes));
    evento.target.reset();

    if (status) {
        status.textContent = "Sugestão enviada! Valeu pela ideia.";
        setTimeout(() => {
            status.textContent = "";
        }, 4000);
    }
}

document.addEventListener("DOMContentLoaded", inicializarSugestoes);

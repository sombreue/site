function inicializarSugestoes() {
    const secao = document.getElementById("sugestoes-secao");
    const formulario = document.getElementById("formulario-sugestao");
    const botao = document.getElementById("botao-aba-sugestoes");

    if (!secao || !formulario || !botao) return;

    botao.addEventListener("click", () => {
        const minimizado = secao.classList.toggle("minimizado");
        botao.setAttribute("aria-expanded", String(!minimizado));
        botao.setAttribute("aria-label", minimizado ? "Expandir sugestões" : "Minimizar sugestões");
        botao.title = minimizado ? "Expandir sugestões" : "Minimizar sugestões";
        botao.textContent = minimizado ? "+" : "−";
    });

    formulario.addEventListener("submit", enviarSugestao);
}

async function enviarSugestao(evento) {
    evento.preventDefault();

    const nome = document.getElementById("nome-sugestao")?.value.trim();
    const sugestao = document.getElementById("texto-sugestao")?.value.trim();
    const status = document.getElementById("status-sugestao");
    const botao = evento.target.querySelector("button[type='submit']");

    if (!nome || !sugestao) {
        if (status) status.textContent = "Preencha seu nome e a sugestão.";
        return;
    }

    if (botao) botao.disabled = true;

    try {
        const resposta = await fetch("/api/sugestoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome, sugestao })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível enviar a sugestão.");
        }

        evento.target.reset();
        if (status) status.textContent = "Sugestão enviada! Valeu pela ideia.";

        setTimeout(() => {
            if (status) status.textContent = "";
        }, 4000);
    } catch (erro) {
        if (status) status.textContent = erro.message;
    } finally {
        if (botao) botao.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", inicializarSugestoes);

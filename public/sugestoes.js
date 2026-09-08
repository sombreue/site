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

async function lerRespostaSugestao(resposta) {
    const tipo = resposta.headers.get("content-type") || "";
    if (!tipo.includes("application/json")) {
        const texto = await resposta.text();
        if (texto.trimStart().startsWith("<!DOCTYPE") || texto.trimStart().startsWith("<html")) {
            throw new Error(`O servidor não entregou a API de sugestões (HTTP ${resposta.status}). Reinicie/reimplante o servidor para aplicar as alterações.`);
        }
        throw new Error(`Resposta inválida do servidor (HTTP ${resposta.status}).`);
    }
    return resposta.json();
}

async function enviarSugestao(evento) {
    evento.preventDefault();
    const nome = document.getElementById("nome-sugestao")?.value.trim();
    const sugestao = document.getElementById("texto-sugestao")?.value.trim();
    const tipo = document.getElementById("tipo-sugestao")?.value || "sugestao";
    const status = document.getElementById("status-sugestao");
    const botao = evento.target.querySelector("button[type='submit']");
    if (!nome || !sugestao) {
        if (status) status.textContent = "Preencha seu nome e a mensagem.";
        return;
    }
    if (botao) botao.disabled = true;
    try {
        const resposta = await fetch("/api/sugestoes", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ nome, sugestao, tipo })
        });
        if (resposta.status === 401) throw new Error("Você precisa estar logado para enviar.");
        const dados = await lerRespostaSugestao(resposta);
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível enviar.");
        evento.target.reset();
        if (status) status.textContent = "Enviado com sucesso!";
        setTimeout(() => { if (status) status.textContent = ""; }, 4000);
    } catch (erro) {
        if (status) status.textContent = erro.message;
    } finally {
        if (botao) botao.disabled = false;
    }
}

document.addEventListener("DOMContentLoaded", inicializarSugestoes);

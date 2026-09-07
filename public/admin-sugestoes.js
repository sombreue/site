async function lerResposta(resposta) {
    const tipo = resposta.headers.get("content-type") || "";

    if (!tipo.includes("application/json")) {
        const texto = await resposta.text();
        if (texto.trimStart().startsWith("<!DOCTYPE") || texto.trimStart().startsWith("<html")) {
            throw new Error(`O servidor não está entregando a API de sugestões (HTTP ${resposta.status}). Verifique se o servidor foi reiniciado com o novo código.`);
        }
        throw new Error(`Resposta inválida do servidor (HTTP ${resposta.status}).`);
    }

    return resposta.json();
}

async function carregarSugestoes() {
    const lista = document.getElementById("lista-sugestoes");
    const contador = document.getElementById("contador-sugestoes");

    try {
        const resposta = await fetch("/api/sugestoes", {
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });

        if (resposta.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (resposta.status === 403) {
            window.location.href = "/";
            return;
        }

        const dados = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível carregar as sugestões.");
        }

        const sugestoes = dados.sugestoes || [];
        contador.textContent = `${sugestoes.length} sugestão(ões) recebida(s)`;

        if (!sugestoes.length) {
            lista.innerHTML = '<div class="estado-vazio">Nenhuma sugestão recebida ainda.</div>';
            return;
        }

        lista.innerHTML = sugestoes.map(sugestao => `
            <article class="sugestao-card">
                <h3>${escaparHtml(sugestao.nome)}</h3>
                <p>${escaparHtml(sugestao.sugestao)}</p>
                <div class="sugestao-data">${formatarData(sugestao.data)}</div>
                <button type="button" class="botao-excluir-sugestao" onclick="excluirSugestao(${sugestao.id})">Excluir</button>
            </article>
        `).join("");
    } catch (erro) {
        lista.innerHTML = `<div class="estado-vazio">${escaparHtml(erro.message)}</div>`;
    }
}

async function excluirSugestao(id) {
    if (!confirm("Excluir esta sugestão?")) return;

    try {
        const resposta = await fetch(`/api/sugestoes/${id}`, {
            method: "DELETE",
            headers: { "Accept": "application/json" }
        });

        if (resposta.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (resposta.status === 403) {
            window.location.href = "/";
            return;
        }

        const dados = await lerResposta(resposta);

        if (!resposta.ok) {
            throw new Error(dados.mensagem || "Não foi possível excluir a sugestão.");
        }

        carregarSugestoes();
    } catch (erro) {
        alert(erro.message);
    }
}

function escaparHtml(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
}

function formatarData(data) {
    if (!data) return "";
    const dataObj = new Date(data);
    if (Number.isNaN(dataObj.getTime())) return "";
    return dataObj.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

document.getElementById("botao-atualizar")?.addEventListener("click", carregarSugestoes);
document.addEventListener("DOMContentLoaded", carregarSugestoes);

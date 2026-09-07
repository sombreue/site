async function carregarSugestoes() {
    const lista = document.getElementById("lista-sugestoes");
    const contador = document.getElementById("contador-sugestoes");

    try {
        const resposta = await fetch("/api/sugestoes");
        const dados = await resposta.json();

        if (resposta.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        if (resposta.status === 403) {
            window.location.href = "/";
            return;
        }

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

    const resposta = await fetch(`/api/sugestoes/${id}`, { method: "DELETE" });
    const dados = await resposta.json();

    if (!resposta.ok) {
        alert(dados.mensagem || "Não foi possível excluir a sugestão.");
        return;
    }

    carregarSugestoes();
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

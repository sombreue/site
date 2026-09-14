const fs = require("fs");

const path = "public/expec.js";
let text = fs.readFileSync(path, "utf8");

const inicioSessao = text.indexOf("async function verificarSessao() {");
const fimSessao = text.indexOf("// =========================\n// CARREGAR EQUIPES", inicioSessao);

if (inicioSessao === -1 || fimSessao === -1) {
    throw new Error("Não foi possível localizar a função de sessão da EXPEC.");
}

const novaSessao = `async function verificarSessao() {
    try {
        const resposta = await fetch("/api/usuario", {
            credentials: "same-origin",
            cache: "no-store",
            headers: { "Accept": "application/json" }
        });

        const textoResposta = await resposta.text();
        let dados;
        try {
            dados = textoResposta ? JSON.parse(textoResposta) : {};
        } catch (erro) {
            throw new Error("O servidor respondeu sem JSON ao verificar a sessão.");
        }

        if (!resposta.ok || !dados.logado) {
            window.location.href = "/login.html";
            return;
        }

        const tipo = dados.tipo || dados.usuario?.tipo || "usuario";

        if (tipo === "admin") {
            const botaoCriar = document.getElementById("btnCriarEquipe");
            if (botaoCriar) botaoCriar.style.display = "block";
        }

        carregarEquipes(tipo);
        carregarDecoracoes(tipo);
    } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
    }
}


`;

text = text.slice(0, inicioSessao) + novaSessao + text.slice(fimSessao);

const inicioContagem = text.indexOf("async function carregarContagem() {");
const fimContagem = text.indexOf("// =========================\n// SALVAR DATA", inicioContagem);

if (inicioContagem === -1 || fimContagem === -1) {
    throw new Error("Não foi possível localizar a função do contador da EXPEC.");
}

const novaContagem = `async function carregarContagem() {
    const contador = document.getElementById("contador");
    const barra = document.getElementById("barraProgresso");
    const dataTexto = document.getElementById("dataApresentacao");
    const config = document.getElementById("configContador");

    try {
        if (contador) contador.textContent = "Carregando...";

        const resposta = await fetch("/api/feira/contagem", {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: { "Accept": "application/json" }
        });

        const textoResposta = await resposta.text();
        let dados;
        try {
            dados = textoResposta ? JSON.parse(textoResposta) : {};
        } catch (erro) {
            throw new Error("O servidor respondeu sem JSON (HTTP " + resposta.status + ").");
        }

        if (!resposta.ok) {
            throw new Error(dados.mensagem || ("Erro HTTP " + resposta.status + " ao carregar contagem."));
        }

        const dataRecebida = dados.data || dados.data_apresentacao;
        if (!dataRecebida) {
            throw new Error("A API não retornou a data da apresentação.");
        }

        const dataAlvo = new Date(dataRecebida);
        if (Number.isNaN(dataAlvo.getTime())) {
            throw new Error("A data recebida pela API é inválida: " + dataRecebida);
        }

        if (dados.tipo === "admin" && config) {
            config.style.display = "block";

            const campo = document.getElementById("novaDataApresentacao");
            if (campo) {
                const local = new Date(dataAlvo.getTime() - dataAlvo.getTimezoneOffset() * 60000);
                campo.value = local.toISOString().slice(0, 16);
            }
        }

        const dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);

        function atualizarContador() {
            const agora = new Date();
            const diferenca = dataAlvo.getTime() - agora.getTime();

            if (barra) {
                const inicio = dataInicio.getTime();
                const fim = dataAlvo.getTime();
                const progresso = fim > inicio
                    ? ((agora.getTime() - inicio) / (fim - inicio)) * 100
                    : 100;
                barra.style.width = Math.min(100, Math.max(0, progresso)) + "%";
            }

            if (dataTexto) {
                dataTexto.textContent = "Apresentações: " + dataAlvo.toLocaleString("pt-BR");
            }

            if (!contador) return;

            if (diferenca <= 0) {
                contador.textContent = "É HOJE!";
                if (barra) barra.style.width = "100%";
                return;
            }

            const segundosTotais = Math.floor(diferenca / 1000);
            const dias = Math.floor(segundosTotais / 86400);
            const horas = Math.floor((segundosTotais % 86400) / 3600);
            const minutos = Math.floor((segundosTotais % 3600) / 60);
            const segundos = segundosTotais % 60;

            contador.textContent =
                dias + "d " +
                String(horas).padStart(2, "0") + "h " +
                String(minutos).padStart(2, "0") + "m " +
                String(segundos).padStart(2, "0") + "s";
        }

        atualizarContador();

        if (window.__expecContadorIntervalo) {
            clearInterval(window.__expecContadorIntervalo);
        }
        window.__expecContadorIntervalo = setInterval(atualizarContador, 1000);
    } catch (erro) {
        console.error("Erro no contador:", erro);
        if (contador) {
            contador.textContent = "Erro ao carregar contador.";
        }
        if (dataTexto) {
            dataTexto.textContent = "Não foi possível carregar a data da apresentação.";
        }
    }
}


`;

text = text.slice(0, inicioContagem) + novaContagem + text.slice(fimContagem);

fs.writeFileSync(path, text, "utf8");
console.log("Correções robustas do contador e da sessão da EXPEC aplicadas.");

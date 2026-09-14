let equipeEditando = null;
let tipoUsuarioAtual = null;

async function verificarSessao() {
    try {
        const resposta = await fetch("/api/usuario", { credentials: "same-origin", cache: "no-store" });
        if (resposta.status === 401) {
            window.location.replace("/login.html?redirect=/expec.html");
            return false;
        }
        if (!resposta.ok) return false;
        const dados = await resposta.json();
        const usuario = dados.usuario || {};
        tipoUsuarioAtual = usuario.tipo;

        if (tipoUsuarioAtual === "admin") {
            const botaoCriar = document.getElementById("btnCriarEquipe");
            if (botaoCriar) botaoCriar.style.display = "block";
            const formDecoracao = document.getElementById("formDecoracao");
            if (formDecoracao) formDecoracao.style.display = "flex";
            const colunaAcoes = document.getElementById("colunaAcoes");
            const totalAcoes = document.getElementById("totalAcoes");
            if (colunaAcoes) colunaAcoes.style.display = "table-cell";
            if (totalAcoes) totalAcoes.style.display = "table-cell";
        }

        await Promise.allSettled([carregarEquipes(tipoUsuarioAtual), carregarDecoracoes(tipoUsuarioAtual)]);
        return true;
    } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
        return false;
    }
}

async function carregarEquipes(tipoUsuario) {
    try {
        const resposta = await fetch("/api/feira/equipes", { credentials: "same-origin", cache: "no-store" });
        if (!resposta.ok) throw new Error("Erro ao buscar equipes.");
        const payload = await resposta.json();
        const equipes = Array.isArray(payload) ? payload : (payload.equipes || []);
        const lista = document.getElementById("listaEquipes");
        if (!lista) return;
        lista.innerHTML = "";
        if (!equipes.length) {
            lista.innerHTML = "<p>Nenhuma equipe cadastrada ainda.</p>";
            return;
        }
        equipes.forEach(equipe => {
            const card = document.createElement("div");
            card.className = "equipe";
            card.innerHTML = `<h3>${equipe.nome || ""}</h3><p><strong>Tema:</strong> ${equipe.tema || ""}</p><p><strong>Professor:</strong> ${equipe.professor || "Não informado"}</p><p><strong>Líder:</strong> ${equipe.lider || "Não informado"}</p><p><strong>Integrantes:</strong> ${equipe.integrantes || "Não informados"}</p>`;
            if (tipoUsuario === "admin") {
                const acoes = document.createElement("div");
                acoes.className = "equipe-acoes";
                acoes.innerHTML = `<button onclick="editarEquipe(${equipe.id})">Editar</button><button onclick="excluirEquipe(${equipe.id})">Excluir</button>`;
                card.appendChild(acoes);
            }
            lista.appendChild(card);
        });
    } catch (erro) {
        console.error("Erro ao carregar equipes:", erro);
        const lista = document.getElementById("listaEquipes");
        if (lista) lista.innerHTML = "<p>Não foi possível carregar as equipes.</p>";
    }
}

async function carregarDecoracoes(tipoUsuario) {
    try {
        const resposta = await fetch("/api/feira/decoracoes", { credentials: "same-origin", cache: "no-store" });
        if (!resposta.ok) throw new Error("Erro ao buscar decorações.");
        const payload = await resposta.json();
        const decoracoes = Array.isArray(payload) ? payload : (payload.decoracoes || []);
        const lista = document.getElementById("listaDecoracoes");
        if (!lista) return;
        lista.innerHTML = "";
        let total = 0;
        if (!decoracoes.length) {
            lista.innerHTML = `<tr><td colspan="3">Nenhuma decoração cadastrada.</td></tr>`;
        } else {
            decoracoes.forEach(item => {
                const preco = Number(item.preco) || 0;
                total += preco;
                const tr = document.createElement("tr");
                const nome = document.createElement("td");
                nome.textContent = item.nome || "";
                const valor = document.createElement("td");
                valor.textContent = preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                const acoes = document.createElement("td");
                if (tipoUsuario === "admin") {
                    acoes.innerHTML = `<button type="button" onclick="editarDecoracao(${item.id}, ${JSON.stringify(item.nome || "")}, ${preco})">Editar</button> <button type="button" onclick="excluirDecoracao(${item.id})">Excluir</button>`;
                }
                tr.append(nome, valor, acoes);
                lista.appendChild(tr);
            });
        }
        const totalEl = document.getElementById("totalDecoracao");
        if (totalEl) totalEl.textContent = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    } catch (erro) {
        console.error("Erro ao carregar decorações:", erro);
        const lista = document.getElementById("listaDecoracoes");
        if (lista) lista.innerHTML = `<tr><td colspan="3">Não foi possível carregar as decorações.</td></tr>`;
    }
}

const btnAdicionarDecoracao = document.getElementById("btnAdicionarDecoracao");
if (btnAdicionarDecoracao) btnAdicionarDecoracao.addEventListener("click", async () => {
    const nome = document.getElementById("descricaoDecoracao").value.trim();
    const preco = Number(document.getElementById("precoDecoracao").value);
    if (!nome) return alert("Informe a decoração.");
    if (!Number.isFinite(preco) || preco < 0) return alert("Informe um preço válido.");
    try {
        const resposta = await fetch("/api/feira/decoracoes", {
            method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
            body: JSON.stringify({ nome, preco })
        });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao adicionar decoração.");
        document.getElementById("descricaoDecoracao").value = "";
        document.getElementById("precoDecoracao").value = "";
        carregarDecoracoes(tipoUsuarioAtual);
    } catch (erro) { console.error(erro); alert("Erro de conexão com o servidor."); }
});

async function editarDecoracao(id, nomeAtual, precoAtual) {
    const nome = prompt("Nome da decoração:", nomeAtual);
    if (nome === null) return;
    const precoTexto = prompt("Preço:", String(precoAtual).replace(".", ","));
    if (precoTexto === null) return;
    const preco = Number(String(precoTexto).replace(",", "."));
    if (!nome.trim() || !Number.isFinite(preco) || preco < 0) return alert("Dados inválidos.");
    try {
        const resposta = await fetch(`/api/feira/decoracoes/${id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
            body: JSON.stringify({ nome: nome.trim(), preco })
        });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao editar decoração.");
        carregarDecoracoes(tipoUsuarioAtual);
    } catch (erro) { console.error(erro); alert("Erro de conexão com o servidor."); }
}

async function excluirDecoracao(id) {
    if (!confirm("Tem certeza que deseja excluir esta decoração?")) return;
    try {
        const resposta = await fetch(`/api/feira/decoracoes/${id}`, { method: "DELETE", credentials: "same-origin" });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao excluir decoração.");
        carregarDecoracoes(tipoUsuarioAtual);
    } catch (erro) { console.error(erro); alert("Erro de conexão com o servidor."); }
}

const btnCriarEquipe = document.getElementById("btnCriarEquipe");
if (btnCriarEquipe) btnCriarEquipe.addEventListener("click", () => {
    equipeEditando = null;
    document.getElementById("tituloModal").textContent = "Criar equipe";
    document.getElementById("formEquipe").reset();
    document.getElementById("modalEquipe").style.display = "flex";
});

const btnCancelar = document.getElementById("btnCancelar");
if (btnCancelar) btnCancelar.addEventListener("click", () => {
    document.getElementById("modalEquipe").style.display = "none";
    equipeEditando = null;
});

const formEquipe = document.getElementById("formEquipe");
if (formEquipe) formEquipe.addEventListener("submit", async evento => {
    evento.preventDefault();
    const dados = {
        nome: document.getElementById("nomeEquipe").value,
        tema: document.getElementById("temaEquipe").value,
        professor: document.getElementById("professorEquipe").value,
        lider: document.getElementById("liderEquipe").value,
        integrantes: document.getElementById("integrantesEquipe").value
    };
    try {
        const resposta = await fetch(equipeEditando !== null ? `/api/feira/equipes/${equipeEditando}` : "/api/feira/equipes", {
            method: equipeEditando !== null ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao salvar equipe.");
        document.getElementById("modalEquipe").style.display = "none";
        equipeEditando = null;
        verificarSessao();
    } catch (erro) { console.error("Erro ao salvar equipe:", erro); alert("Erro de conexão com o servidor."); }
});

async function editarEquipe(id) {
    try {
        const resposta = await fetch("/api/feira/equipes", { credentials: "same-origin", cache: "no-store" });
        if (!resposta.ok) throw new Error("Erro ao buscar equipes.");
        const payload = await resposta.json();
        const equipes = Array.isArray(payload) ? payload : (payload.equipes || []);
        const equipe = equipes.find(item => item.id === id);
        if (!equipe) return alert("Equipe não encontrada.");
        equipeEditando = id;
        document.getElementById("tituloModal").textContent = "Editar equipe";
        document.getElementById("nomeEquipe").value = equipe.nome || "";
        document.getElementById("temaEquipe").value = equipe.tema || "";
        document.getElementById("professorEquipe").value = equipe.professor || "";
        document.getElementById("liderEquipe").value = equipe.lider || "";
        document.getElementById("integrantesEquipe").value = equipe.integrantes || "";
        document.getElementById("modalEquipe").style.display = "flex";
    } catch (erro) { console.error("Erro ao editar equipe:", erro); alert("Não foi possível carregar a equipe."); }
}

async function excluirEquipe(id) {
    if (!confirm("Tem certeza que deseja excluir esta equipe?")) return;
    try {
        const resposta = await fetch(`/api/feira/equipes/${id}`, { method: "DELETE", credentials: "same-origin" });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao excluir equipe.");
        verificarSessao();
    } catch (erro) { console.error("Erro ao excluir equipe:", erro); alert("Erro de conexão com o servidor."); }
}

async function carregarContagem() {
    try {
        const resposta = await fetch("/api/feira/contagem", { credentials: "same-origin", cache: "no-store" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Erro ao carregar contagem.");
        const dataValor = dados.data_apresentacao ?? dados.data;
        const dataAlvo = new Date(dataValor);
        if (Number.isNaN(dataAlvo.getTime())) throw new Error("Data da apresentação inválida recebida pela API.");
        const campoData = document.getElementById("novaDataApresentacao");
        if (campoData && dataValor) campoData.value = String(dataValor).slice(0, 16);
        const dataInicio = new Date(); dataInicio.setHours(0, 0, 0, 0);
        function atualizarContador() {
            const agora = new Date(), diferenca = dataAlvo - agora;
            const inicio = dataInicio.getTime(), fim = dataAlvo.getTime(), atual = agora.getTime();
            const progresso = fim > inicio ? ((atual - inicio) / (fim - inicio)) * 100 : 100;
            const barra = document.getElementById("barraProgresso");
            if (barra) barra.style.width = Math.min(100, Math.max(0, progresso)) + "%";
            const contador = document.getElementById("contador"), dataTexto = document.getElementById("dataApresentacao");
            if (diferenca <= 0) { if (contador) contador.textContent = "É HOJE!"; if (barra) barra.style.width = "100%"; }
            else {
                const total = Math.floor(diferenca / 1000), dias = Math.floor(total / 86400), horas = Math.floor((total % 86400) / 3600), minutos = Math.floor((total % 3600) / 60), segundos = total % 60;
                if (contador) contador.textContent = `${dias}d ${String(horas).padStart(2,"0")}h ${String(minutos).padStart(2,"0")}m ${String(segundos).padStart(2,"0")}s`;
            }
            if (dataTexto) dataTexto.textContent = "Apresentações: " + dataAlvo.toLocaleString("pt-BR");
        }
        atualizarContador(); setInterval(atualizarContador, 1000);
    } catch (erro) {
        console.error("Erro no contador:", erro);
        const contador = document.getElementById("contador"); if (contador) contador.textContent = "Erro ao carregar contador.";
    }
}

const btnSalvarData = document.getElementById("btnSalvarData");
if (btnSalvarData) btnSalvarData.addEventListener("click", async () => {
    const campo = document.getElementById("novaDataApresentacao");
    if (!campo.value) return alert("Escolha uma data e horário.");
    try {
        const resposta = await fetch("/api/feira/contagem", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ data: campo.value }) });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao salvar data.");
        alert("Data da apresentação atualizada!"); carregarContagem();
    } catch (erro) { console.error(erro); alert("Erro de conexão com o servidor."); }
});

async function carregarStatusExpec() {
    try {
        const resposta = await fetch("/api/feira/status", { credentials: "same-origin", cache: "no-store" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Erro ao verificar EXPEC.");
        const status = document.getElementById("statusExpec"), botao = document.getElementById("btnAlternarExpec");
        if (!status || !botao) return;
        status.textContent = dados.ativa ? "EXPEC está ativa." : "EXPEC está inativa.";
        botao.textContent = dados.ativa ? "Desativar EXPEC" : "Ativar EXPEC";
        botao.style.display = tipoUsuarioAtual === "admin" ? "block" : "none";
        botao.onclick = async () => {
            try {
                const r = await fetch("/api/feira/status", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ ativa: !dados.ativa }) });
                const d = await r.json(); if (!r.ok) return alert(d.mensagem || "Erro ao alterar status."); carregarStatusExpec();
            } catch (e) { console.error(e); alert("Erro de conexão com o servidor."); }
        };
    } catch (erro) { console.error("Erro no status da EXPEC:", erro); }
}

carregarContagem();
verificarSessao().then(() => carregarStatusExpec());

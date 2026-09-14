let equipeEditando = null;

// EXPEC: a autenticação é feita pela página principal/servidor.
// Não redirecionar para login por falhas transitórias de API.
async function verificarSessao() {
    try {
        const resposta = await fetch("/api/usuario", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (resposta.status === 401) {
            window.location.replace("/login.html?redirect=/expec.html");
            return false;
        }

        if (!resposta.ok) {
            console.error("Falha ao verificar sessão da EXPEC:", resposta.status);
            return false;
        }

        const dados = await resposta.json();
        const usuario = dados.usuario || {};
        const tipo = usuario.tipo;

        if (tipo === "admin") {
            const botaoCriar = document.getElementById("btnCriarEquipe");
            if (botaoCriar) botaoCriar.style.display = "block";
        }

        await Promise.allSettled([
            carregarEquipes(tipo),
            carregarDecoracoes(tipo)
        ]);

        return true;
    } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
        // Erro de rede não significa logout.
        return false;
    }
}

// O restante da lógica da EXPEC usa as APIs normalmente.
async function carregarEquipes(tipoUsuario) {
    try {
        const resposta = await fetch("/api/feira/equipes", { credentials: "same-origin" });
        if (!resposta.ok) throw new Error("Erro ao buscar equipes.");
        const equipes = await resposta.json();
        const lista = document.getElementById("listaEquipes");
        if (!lista) return;
        lista.innerHTML = "";
        if (equipes.length === 0) {
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
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao salvar equipe.");
        document.getElementById("modalEquipe").style.display = "none";
        equipeEditando = null;
        verificarSessao();
    } catch (erro) {
        console.error("Erro ao salvar equipe:", erro);
        alert("Erro de conexão com o servidor.");
    }
});

async function editarEquipe(id) {
    try {
        const resposta = await fetch("/api/feira/equipes", { credentials: "same-origin" });
        const equipes = await resposta.json();
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
    } catch (erro) { console.error("Erro ao editar equipe:", erro); }
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
        if (dados.tipo === "admin") {
            const config = document.getElementById("configContador");
            if (config) config.style.display = "block";
        }
        const dataAlvo = new Date(dados.data);
        const dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);
        function atualizarContador() {
            const agora = new Date();
            const diferenca = dataAlvo - agora;
            const inicio = dataInicio.getTime();
            const fim = dataAlvo.getTime();
            const atual = agora.getTime();
            const progresso = fim > inicio ? ((atual - inicio) / (fim - inicio)) * 100 : 100;
            const barra = document.getElementById("barraProgresso");
            if (barra) barra.style.width = Math.min(100, Math.max(0, progresso)) + "%";
            const contador = document.getElementById("contador");
            const dataTexto = document.getElementById("dataApresentacao");
            if (diferenca <= 0) {
                if (contador) contador.textContent = "É HOJE!";
                if (barra) barra.style.width = "100%";
            } else {
                const total = Math.floor(diferenca / 1000);
                const dias = Math.floor(total / 86400);
                const horas = Math.floor((total % 86400) / 3600);
                const minutos = Math.floor((total % 3600) / 60);
                const segundos = total % 60;
                if (contador) contador.textContent = `${dias}d ${String(horas).padStart(2,"0")}h ${String(minutos).padStart(2,"0")}m ${String(segundos).padStart(2,"0")}s`;
            }
            if (dataTexto) dataTexto.textContent = "Apresentações: " + dataAlvo.toLocaleString("pt-BR");
        }
        atualizarContador();
        setInterval(atualizarContador, 1000);
    } catch (erro) {
        console.error("Erro no contador:", erro);
        const contador = document.getElementById("contador");
        if (contador) contador.textContent = "Erro ao carregar contador.";
    }
}

const btnSalvarData = document.getElementById("btnSalvarData");
if (btnSalvarData) btnSalvarData.addEventListener("click", async () => {
    const campo = document.getElementById("novaDataApresentacao");
    if (!campo.value) return alert("Escolha uma data e horário.");
    try {
        const resposta = await fetch("/api/feira/contagem", {
            method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
            body: JSON.stringify({ data: campo.value })
        });
        const resultado = await resposta.json();
        if (!resposta.ok) return alert(resultado.mensagem || "Erro ao salvar data.");
        alert("Data da apresentação atualizada!");
        carregarContagem();
    } catch (erro) { console.error(erro); alert("Erro de conexão com o servidor."); }
});

async function carregarStatusExpec() {
    try {
        const resposta = await fetch("/api/feira/status", { credentials: "same-origin" });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Erro ao verificar EXPEC.");
        const status = document.getElementById("statusExpec");
        const botao = document.getElementById("btnAlternarExpec");
        if (!status || !botao) return;
        status.textContent = dados.ativa ? "EXPEC está ativa." : "EXPEC está inativa.";
        botao.textContent = dados.ativa ? "Desativar EXPEC" : "Ativar EXPEC";
        botao.onclick = async () => {
            try {
                const r = await fetch("/api/feira/status", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ ativa: !dados.ativa }) });
                const d = await r.json();
                if (!r.ok) return alert(d.mensagem || "Erro ao alterar status.");
                carregarStatusExpec();
            } catch (e) { console.error(e); alert("Erro de conexão com o servidor."); }
        };
    } catch (erro) { console.error("Erro no status da EXPEC:", erro); }
}

// As funções de decoração existentes continuam sendo usadas quando definidas.
carregarContagem();
verificarSessao();
if (typeof carregarStatusExpec === "function") carregarStatusExpec();

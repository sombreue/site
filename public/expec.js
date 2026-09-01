```js
let equipeEditando = null;


// =========================
// VERIFICAR SESSÃO
// =========================

async function verificarSessao() {

    const resposta = await fetch("/api/sessao");

    const sessao = await resposta.json();

    if (!sessao.logado) {
        window.location.href = "/login.html";
        return;
    }

    // Apenas admin pode criar/editar/excluir
    if (sessao.tipo === "admin") {
        document.getElementById("btnCriarEquipe").style.display = "block";
    }

    carregarEquipes(sessao.tipo);
}


// =========================
// CARREGAR EQUIPES
// =========================

async function carregarEquipes(tipoUsuario) {

    try {

        const resposta = await fetch("/api/feira/equipes");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar equipes.");
        }

        const equipes = await resposta.json();

        const lista = document.getElementById("listaEquipes");

        lista.innerHTML = "";

        if (equipes.length === 0) {

            lista.innerHTML = `
                <p>Nenhuma equipe cadastrada ainda.</p>
            `;

            return;
        }

        equipes.forEach(equipe => {

            const card = document.createElement("div");

            card.className = "equipe";

            card.innerHTML = `
                <h3>${equipe.nome}</h3>

                <p>
                    <strong>Tema:</strong>
                    ${equipe.tema}
                </p>

                <p>
                    <strong>Professor:</strong>
                    ${equipe.professor || "Não informado"}
                </p>

                <p>
                    <strong>Líder:</strong>
                    ${equipe.lider || "Não informado"}
                </p>

                <p>
                    <strong>Integrantes:</strong>
                    ${equipe.integrantes || "Não informados"}
                </p>

                ${
                    tipoUsuario === "admin"
                    ? `
                        <div class="equipe-acoes">
                            <button onclick="editarEquipe(${equipe.id})">
                                Editar
                            </button>

                            <button onclick="excluirEquipe(${equipe.id})">
                                Excluir
                            </button>
                        </div>
                    `
                    : ""
                }
            `;

            lista.appendChild(card);
        });

    } catch (erro) {

        console.error(erro);

        document.getElementById("listaEquipes").innerHTML = `
            <p>Não foi possível carregar as equipes.</p>
        `;
    }
}


// =========================
// ABRIR FORMULÁRIO
// =========================

document.getElementById("btnCriarEquipe").addEventListener("click", () => {

    equipeEditando = null;

    document.getElementById("tituloModal").textContent = "Criar equipe";

    document.getElementById("formEquipe").reset();

    document.getElementById("modalEquipe").style.display = "flex";
});


// =========================
// CANCELAR
// =========================

document.getElementById("btnCancelar").addEventListener("click", () => {

    document.getElementById("modalEquipe").style.display = "none";

    equipeEditando = null;
});


// =========================
// SALVAR / EDITAR
// =========================

document.getElementById("formEquipe").addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const dados = {
        nome: document.getElementById("nomeEquipe").value,
        tema: document.getElementById("temaEquipe").value,
        professor: document.getElementById("professorEquipe").value,
        integrantes: document.getElementById("integrantesEquipe").value,
        lider: document.getElementById("liderEquipe").value
    };

    try {

        let resposta;

        if (equipeEditando) {

            resposta = await fetch(
                `/api/feira/equipes/${equipeEditando}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)
                }
            );

        } else {

            resposta = await fetch(
                "/api/feira/equipes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dados)
                }
            );
        }

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.mensagem || "Erro ao salvar equipe.");
            return;
        }

        document.getElementById("modalEquipe").style.display = "none";

        equipeEditando = null;

        verificarSessao();

    } catch (erro) {

        console.error(erro);

        alert("Erro de conexão com o servidor.");
    }
});


// =========================
// EDITAR
// =========================

async function editarEquipe(id) {

    const resposta = await fetch("/api/feira/equipes");

    const equipes = await resposta.json();

    const equipe = equipes.find(e => e.id === id);

    if (!equipe) {
        alert("Equipe não encontrada.");
        return;
    }

    equipeEditando = id;

    document.getElementById("tituloModal").textContent = "Editar equipe";

    document.getElementById("nomeEquipe").value =
        equipe.nome;

    document.getElementById("temaEquipe").value =
        equipe.tema;

    document.getElementById("professorEquipe").value =
        equipe.professor || "";

    document.getElementById("integrantesEquipe").value =
        equipe.integrantes || "";

    document.getElementById("liderEquipe").value =
        equipe.lider || "";

    document.getElementById("modalEquipe").style.display = "flex";
}


// =========================
// EXCLUIR
// =========================

async function excluirEquipe(id) {

    const confirmar = confirm(
        "Tem certeza que deseja excluir esta equipe?"
    );

    if (!confirmar) return;

    try {

        const resposta = await fetch(
            `/api/feira/equipes/${id}`,
            {
                method: "DELETE"
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            alert(resultado.mensagem || "Erro ao excluir equipe.");
            return;
        }

        verificarSessao();

    } catch (erro) {

        console.error(erro);

        alert("Erro de conexão com o servidor.");
    }
}


// =========================
// CONTAGEM REGRESSIVA
// =========================

async function carregarContagem() {

    try {

        const resposta = await fetch(
            "/api/feira/contagem"
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem);
        }

        // Mostrar configuração somente para admin
        if (dados.tipo === "admin") {

            document.getElementById(
                "configContador"
            ).style.display = "block";
        }

        const dataAlvo = new Date(dados.data);

        // A barra começa hoje às 00:00
        const dataInicio = new Date();

        dataInicio.setHours(0, 0, 0, 0);


        function atualizarContador() {

            const agora = new Date();

            const diferenca =
                dataAlvo.getTime() - agora.getTime();


            // =========================
            // BARRA DE PROGRESSO
            // =========================

            const inicio =
                dataInicio.getTime();

            const fim =
                dataAlvo.getTime();

            const atual =
                agora.getTime();

            const progresso =
                ((atual - inicio) / (fim - inicio)) * 100;

            const porcentagem =
                Math.min(
                    100,
                    Math.max(0, progresso)
                );

            document.getElementById(
                "barraProgresso"
            ).style.width =
                `${porcentagem}%`;


            // =========================
            // APRESENTAÇÃO CHEGOU
            // =========================

            if (diferenca <= 0) {

                document.getElementById(
                    "contador"
                ).textContent =
                    "É HOJE!";

                document.getElementById(
                    "barraProgresso"
                ).style.width =
                    "100%";

                document.getElementById(
                    "dataApresentacao"
                ).textContent =
                    `Apresentações: ${dataAlvo.toLocaleString("pt-BR")}`;

                return;
            }


            // =========================
            // TEMPO RESTANTE
            // =========================

            const segundosTotais =
                Math.floor(diferenca / 1000);

            const dias =
                Math.floor(
                    segundosTotais / 86400
                );

            const horas =
                Math.floor(
                    (segundosTotais % 86400) / 3600
                );

            const minutos =
                Math.floor(
                    (segundosTotais % 3600) / 60
                );

            const segundos =
                segundosTotais % 60;


            document.getElementById(
                "contador"
            ).textContent =
                `${dias}d ${String(horas).padStart(2, "0")}h ` +
                `${String(minutos).padStart(2, "0")}m ` +
                `${String(segundos).padStart(2, "0")}s`;


            document.getElementById(
                "dataApresentacao"
            ).textContent =
                `Apresentações: ${dataAlvo.toLocaleString("pt-BR")}`;
        }


        atualizarContador();

        setInterval(
            atualizarContador,
            1000
        );

    } catch (erro) {

        console.error(erro);

        document.getElementById(
            "contador"
        ).textContent =
            "Erro ao carregar contador.";
    }
}


// =========================
// CONFIGURAR CONTADOR
// =========================

document
    .getElementById("btnSalvarData")
    .addEventListener("click", async () => {

        const data =
            document.getElementById(
                "novaDataApresentacao"
            ).value;

        if (!data) {

            alert(
                "Escolha uma data e horário."
            );

            return;
        }

        try {

            const resposta =
                await fetch(
                    "/api/feira/contagem",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            data
                        })
                    }
                );

            const resultado =
                await resposta.json();

            if (!resposta.ok) {

                alert(
                    resultado.mensagem ||
                    "Erro ao salvar data."
                );

                return;
            }

            alert(
                "Data da apresentação atualizada!"
            );

            carregarContagem();

        } catch (erro) {

            console.error(erro);

            alert(
                "Erro de conexão com o servidor."
            );
        }

    });


// =========================
// CONTROLE DA EXPEC
// =========================

async function carregarStatusExpec() {

    try {

        const resposta =
            await fetch(
                "/api/feira/status"
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.mensagem);
        }

        const status =
            document.getElementById(
                "statusExpec"
            );

        const botao =
            document.getElementById(
                "btnAlternarExpec"
            );

        if (!status || !botao) {
            return;
        }

        if (dados.ativa) {

            status.textContent =
                "EXPEC está ativa.";

            botao.textContent =
                "Desativar EXPEC";

        } else {

            status.textContent =
                "EXPEC está desativada.";

            botao.textContent =
                "Ativar EXPEC";
        }


        botao.onclick = async () => {

            const novoStatus =
                !dados.ativa;

            const confirmar =
                confirm(
                    novoStatus
                        ? "Deseja ativar a EXPEC novamente?"
                        : "Deseja desativar a EXPEC?"
                );

            if (!confirmar) {
                return;
            }


            const resposta =
                await fetch(
                    "/api/feira/status",
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            ativa: novoStatus
                        })
                    }
                );

            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                alert(
                    resultado.mensagem ||
                    "Erro ao alterar status da EXPEC."
                );

                return;
            }


            alert(
                novoStatus
                    ? "EXPEC ativada!"
                    : "EXPEC desativada!"
            );


            carregarStatusExpec();
        };

    } catch (erro) {

        console.error(erro);

        const status =
            document.getElementById(
                "statusExpec"
            );

        if (status) {

            status.textContent =
                "Erro ao carregar status.";
        }
    }
}


// =========================
// INICIAR
// =========================

verificarSessao();

carregarContagem();

carregarStatusExpec();
```

let equipeEditando = null;


// =========================
// VERIFICAR SESSÃO
// =========================

async function verificarSessao() {

    try {

        const resposta = await fetch("/api/sessao");
        const sessao = await resposta.json();

        if (!sessao.logado) {
            window.location.href = "/login.html";
            return;
        }

        if (sessao.tipo === "admin") {

            const botaoCriar =
                document.getElementById("btnCriarEquipe");

            if (botaoCriar) {
                botaoCriar.style.display = "block";
            }
        }

        carregarEquipes(sessao.tipo);

    } catch (erro) {

        console.error("Erro ao verificar sessão:", erro);
    }
}


// =========================
// CARREGAR EQUIPES
// =========================

async function carregarEquipes(tipoUsuario) {

    try {

        const resposta =
            await fetch("/api/feira/equipes");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar equipes.");
        }

        const equipes =
            await resposta.json();

        const lista =
            document.getElementById("listaEquipes");

        if (!lista) {
            return;
        }

        lista.innerHTML = "";

        if (equipes.length === 0) {

            lista.innerHTML =
                "<p>Nenhuma equipe cadastrada ainda.</p>";

            return;
        }

        equipes.forEach(function(equipe) {

            const card =
                document.createElement("div");

            card.className = "equipe";

            const nome =
                equipe.nome || "";

            const tema =
                equipe.tema || "";

            const professor =
                equipe.professor || "Não informado";

            const lider =
                equipe.lider || "Não informado";

            const integrantes =
                equipe.integrantes || "Não informados";

            card.innerHTML =
                "<h3>" + nome + "</h3>" +
                "<p><strong>Tema:</strong> " +
                tema +
                "</p>" +
                "<p><strong>Professor:</strong> " +
                professor +
                "</p>" +
                "<p><strong>Líder:</strong> " +
                lider +
                "</p>" +
                "<p><strong>Integrantes:</strong> " +
                integrantes +
                "</p>";

            if (tipoUsuario === "admin") {

                const acoes =
                    document.createElement("div");

                acoes.className =
                    "equipe-acoes";

                acoes.innerHTML =
                    '<button onclick="editarEquipe(' +
                    equipe.id +
                    ')">Editar</button>' +

                    '<button onclick="excluirEquipe(' +
                    equipe.id +
                    ')">Excluir</button>';

                card.appendChild(acoes);
            }

            lista.appendChild(card);
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar equipes:",
            erro
        );

        const lista =
            document.getElementById("listaEquipes");

        if (lista) {

            lista.innerHTML =
                "<p>Não foi possível carregar as equipes.</p>";
        }
    }
}


// =========================
// ABRIR FORMULÁRIO
// =========================

const btnCriarEquipe =
    document.getElementById("btnCriarEquipe");

if (btnCriarEquipe) {

    btnCriarEquipe.addEventListener(
        "click",
        function() {

            equipeEditando = null;

            document.getElementById(
                "tituloModal"
            ).textContent = "Criar equipe";

            document.getElementById(
                "formEquipe"
            ).reset();

            document.getElementById(
                "modalEquipe"
            ).style.display = "flex";
        }
    );
}


// =========================
// CANCELAR
// =========================

const btnCancelar =
    document.getElementById("btnCancelar");

if (btnCancelar) {

    btnCancelar.addEventListener(
        "click",
        function() {

            document.getElementById(
                "modalEquipe"
            ).style.display = "none";

            equipeEditando = null;
        }
    );
}


// =========================
// SALVAR / EDITAR
// =========================

const formEquipe =
    document.getElementById("formEquipe");

if (formEquipe) {

    formEquipe.addEventListener(
        "submit",
        async function(evento) {

            evento.preventDefault();

            const dados = {

                nome:
                    document.getElementById(
                        "nomeEquipe"
                    ).value,

                tema:
                    document.getElementById(
                        "temaEquipe"
                    ).value,

                professor:
                    document.getElementById(
                        "professorEquipe"
                    ).value,

                lider:
                    document.getElementById(
                        "liderEquipe"
                    ).value,

                integrantes:
                    document.getElementById(
                        "integrantesEquipe"
                    ).value
            };

            try {

                let resposta;

                if (equipeEditando !== null) {

                    resposta =
                        await fetch(
                            "/api/feira/equipes/" +
                            equipeEditando,
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(dados)
                            }
                        );

                } else {

                    resposta =
                        await fetch(
                            "/api/feira/equipes",
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(dados)
                            }
                        );
                }

                const resultado =
                    await resposta.json();

                if (!resposta.ok) {

                    alert(
                        resultado.mensagem ||
                        "Erro ao salvar equipe."
                    );

                    return;
                }

                document.getElementById(
                    "modalEquipe"
                ).style.display = "none";

                equipeEditando = null;

                verificarSessao();

            } catch (erro) {

                console.error(
                    "Erro ao salvar equipe:",
                    erro
                );

                alert(
                    "Erro de conexão com o servidor."
                );
            }
        }
    );
}


// =========================
// EDITAR EQUIPE
// =========================

async function editarEquipe(id) {

    try {

        const resposta =
            await fetch("/api/feira/equipes");

        const equipes =
            await resposta.json();

        const equipe =
            equipes.find(
                function(item) {
                    return item.id === id;
                }
            );

        if (!equipe) {

            alert(
                "Equipe não encontrada."
            );

            return;
        }

        equipeEditando = id;

        document.getElementById(
            "tituloModal"
        ).textContent = "Editar equipe";

        document.getElementById(
            "nomeEquipe"
        ).value = equipe.nome || "";

        document.getElementById(
            "temaEquipe"
        ).value = equipe.tema || "";

        document.getElementById(
            "professorEquipe"
        ).value = equipe.professor || "";

        document.getElementById(
            "liderEquipe"
        ).value = equipe.lider || "";

        document.getElementById(
            "integrantesEquipe"
        ).value = equipe.integrantes || "";

        document.getElementById(
            "modalEquipe"
        ).style.display = "flex";

    } catch (erro) {

        console.error(
            "Erro ao editar equipe:",
            erro
        );
    }
}


// =========================
// EXCLUIR EQUIPE
// =========================

async function excluirEquipe(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta equipe?"
        );

    if (!confirmar) {
        return;
    }

    try {

        const resposta =
            await fetch(
                "/api/feira/equipes/" + id,
                {
                    method: "DELETE"
                }
            );

        const resultado =
            await resposta.json();

        if (!resposta.ok) {

            alert(
                resultado.mensagem ||
                "Erro ao excluir equipe."
            );

            return;
        }

        verificarSessao();

    } catch (erro) {

        console.error(
            "Erro ao excluir equipe:",
            erro
        );

        alert(
            "Erro de conexão com o servidor."
        );
    }
}


// =========================
// CONTAGEM REGRESSIVA
// =========================

async function carregarContagem() {

    try {

        const resposta =
            await fetch(
                "/api/feira/contagem"
            );

        const dados =
            await resposta.json();

        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                "Erro ao carregar contagem."
            );
        }

        if (dados.tipo === "admin") {

            const config =
                document.getElementById(
                    "configContador"
                );

            if (config) {
                config.style.display = "block";
            }
        }

        const dataAlvo =
            new Date(dados.data);

        const dataInicio =
            new Date();

        dataInicio.setHours(
            0,
            0,
            0,
            0
        );

        function atualizarContador() {

            const agora =
                new Date();

            const diferenca =
                dataAlvo.getTime() -
                agora.getTime();

            const inicio =
                dataInicio.getTime();

            const fim =
                dataAlvo.getTime();

            const atual =
                agora.getTime();

            let progresso = 100;

            if (fim > inicio) {

                progresso =
                    ((atual - inicio) /
                    (fim - inicio)) *
                    100;
            }

            const porcentagem =
                Math.min(
                    100,
                    Math.max(
                        0,
                        progresso
                    )
                );

            const barra =
                document.getElementById(
                    "barraProgresso"
                );

            if (barra) {

                barra.style.width =
                    porcentagem + "%";
            }

            const contador =
                document.getElementById(
                    "contador"
                );

            const dataTexto =
                document.getElementById(
                    "dataApresentacao"
                );

            if (diferenca <= 0) {

                if (contador) {
                    contador.textContent =
                        "É HOJE!";
                }

                if (barra) {
                    barra.style.width =
                        "100%";
                }

                if (dataTexto) {

                    dataTexto.textContent =
                        "Apresentações: " +
                        dataAlvo.toLocaleString(
                            "pt-BR"
                        );
                }

                return;
            }

            const segundosTotais =
                Math.floor(
                    diferenca / 1000
                );

            const dias =
                Math.floor(
                    segundosTotais / 86400
                );

            const horas =
                Math.floor(
                    (segundosTotais % 86400) /
                    3600
                );

            const minutos =
                Math.floor(
                    (segundosTotais % 3600) /
                    60
                );

            const segundos =
                segundosTotais % 60;

            if (contador) {

                contador.textContent =
                    dias +
                    "d " +
                    String(horas)
                        .padStart(2, "0") +
                    "h " +
                    String(minutos)
                        .padStart(2, "0") +
                    "m " +
                    String(segundos)
                        .padStart(2, "0") +
                    "s";
            }

            if (dataTexto) {

                dataTexto.textContent =
                    "Apresentações: " +
                    dataAlvo.toLocaleString(
                        "pt-BR"
                    );
            }
        }

        atualizarContador();

        setInterval(
            atualizarContador,
            1000
        );

    } catch (erro) {

        console.error(
            "Erro no contador:",
            erro
        );

        const contador =
            document.getElementById(
                "contador"
            );

        if (contador) {

            contador.textContent =
                "Erro ao carregar contador.";
        }
    }
}


// =========================
// SALVAR DATA
// =========================

const btnSalvarData =
    document.getElementById(
        "btnSalvarData"
    );

if (btnSalvarData) {

    btnSalvarData.addEventListener(
        "click",
        async function() {

            const campo =
                document.getElementById(
                    "novaDataApresentacao"
                );

            const data =
                campo.value;

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

                            body:
                                JSON.stringify({
                                    data: data
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

                console.error(
                    "Erro ao salvar data:",
                    erro
                );

                alert(
                    "Erro de conexão com o servidor."
                );
            }
        }
    );
}


// =========================
// STATUS DA EXPEC
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

            throw new Error(
                dados.mensagem ||
                "Erro ao verificar EXPEC."
            );
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

        botao.onclick =
            async function() {

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

                try {

                    const resposta =
                        await fetch(
                            "/api/feira/status",
                            {
                                method: "PUT",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        ativa:
                                            novoStatus
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

                } catch (erro) {

                    console.error(
                        "Erro ao alterar status:",
                        erro
                    );

                    alert(
                        "Erro de conexão com o servidor."
                    );
                }
            };

    } catch (erro) {

        console.error(
            "Erro ao carregar status:",
            erro
        );

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

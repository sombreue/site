/* =========================
   HORÁRIO DE AULAS
========================= */

const horarioAulas = {

    1: [
        "Ciências",
        "Português",
        "Matemática",
        "Português",
        "Matemática"
    ],

    2: [
        "Redação",
        "Redação",
        "Bilíngue",
        "Artes",
        "Matemática",
        "Robótica"
    ],

    3: [
        "Ed. Física",
        "Ed. Física",
        "Socioemocional",
        "Literatura",
        "Matemática"
    ],

    4: [
        "Gramática",
        "História",
        "História",
        "Matemática",
        "Bilíngue",
        "Química"
    ],

    5: [
        "Geografia",
        "Física",
        "Geografia",
        "Física",
        "Gramática",
        "Ciências"
    ]

};


/* =========================
   USUÁRIO LOGADO
========================= */

let usuarioAtual = null;


/* =========================
   FORMULÁRIO
========================= */

function abrirFormulario() {

    const formulario =
        document.getElementById("formulario");

    if (!formulario) {
        return;
    }

    formulario.style.display = "block";

    formulario.scrollIntoView({
        behavior: "smooth"
    });

}


function fecharFormulario() {

    const formulario =
        document.getElementById("formulario");

    if (!formulario) {
        return;
    }

    formulario.style.display = "none";

    const data =
        document.getElementById("nova-data");

    if (data) {
        data.value = "";
    }

    const lista =
        document.getElementById(
            "lista-materias-formulario"
        );

    if (lista) {
        lista.innerHTML = "";
    }

}


/* =========================
   DATA / DIA DA SEMANA
========================= */

function descobrirDiaDaSemana(data) {

    const partes =
        data.split("-");

    const ano =
        Number(partes[0]);

    const mes =
        Number(partes[1]) - 1;

    const dia =
        Number(partes[2]);

    const dataObj =
        new Date(
            ano,
            mes,
            dia
        );

    return dataObj.getDay();

}


function nomeDoDia(numero) {

    const dias = [

        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado"

    ];

    return dias[numero];

}


/* =========================
   MATÉRIAS DO DIA
========================= */

function obterMateriasDoDia(data) {

    const diaSemana =
        descobrirDiaDaSemana(data);

    /*
        Domingo = 0
        Segunda = 1
        Terça = 2
        Quarta = 3
        Quinta = 4
        Sexta = 5
        Sábado = 6
    */

    if (
        diaSemana === 0 ||
        diaSemana === 6
    ) {

        return [];

    }

    const materias =
        horarioAulas[diaSemana];

    if (!materias) {
        return [];
    }

    /*
        Remove matérias repetidas.
    */

    return [
        ...new Set(materias)
    ];

}


/* =========================
   MOSTRAR MATÉRIAS DO DIA
========================= */

function mostrarMateriasDoDia() {

    const campoData =
        document.getElementById(
            "nova-data"
        );

    const lista =
        document.getElementById(
            "lista-materias-formulario"
        );

    if (!campoData || !lista) {

        console.error(
            "Campo de data ou lista de matérias não encontrado."
        );

        return;
    }

    const data =
        campoData.value;

    lista.innerHTML = "";

    if (!data) {
        return;
    }

    const diaSemana =
        descobrirDiaDaSemana(data);

    const nomeDia =
        nomeDoDia(diaSemana);

    const materias =
        obterMateriasDoDia(data);


    console.log(
        "Data selecionada:",
        data
    );

    console.log(
        "Dia da semana:",
        nomeDia
    );

    console.log(
        "Matérias:",
        materias
    );


    /* =========================
       FIM DE SEMANA
    ========================= */

    if (materias.length === 0) {

        const mensagem =
            document.createElement("p");

        mensagem.textContent =
            `${nomeDia} não possui aulas cadastradas no horário.`;

        lista.appendChild(
            mensagem
        );

        return;

    }


    /* =========================
       TÍTULO
    ========================= */

    const titulo =
        document.createElement("h3");

    titulo.textContent =
        `Matérias de ${nomeDia}`;

    lista.appendChild(
        titulo
    );


    /* =========================
       CRIAR CAMPOS
    ========================= */

    materias.forEach(materia => {

        const container =
            document.createElement("div");

        container.className =
            "materia-formulario";


        const label =
            document.createElement("label");

        label.textContent =
            materia;


        const textarea =
            document.createElement("textarea");

        textarea.placeholder =
            `Digite a tarefa de ${materia}...`;

        textarea.dataset.materia =
            materia;


        container.appendChild(
            label
        );

        container.appendChild(
            textarea
        );


        lista.appendChild(
            container
        );

    });

}


/* =========================
   ADICIONAR TAREFAS DO DIA
========================= */

async function adicionarTarefasDoDia() {

    const campoData =
        document.getElementById(
            "nova-data"
        );

    const lista =
        document.getElementById(
            "lista-materias-formulario"
        );

    if (!campoData || !lista) {

        alert(
            "Erro: formulário não encontrado."
        );

        return;
    }


    const data =
        campoData.value;


    if (!data) {

        alert(
            "Selecione uma data."
        );

        return;

    }


    const campos =
        lista.querySelectorAll(
            "textarea[data-materia]"
        );


    if (campos.length === 0) {

        alert(
            "Não existem matérias cadastradas para esse dia."
        );

        return;

    }


    const tarefas = [];


    campos.forEach(campo => {

        const descricao =
            campo.value.trim();


        if (!descricao) {
            return;
        }


        tarefas.push({

            data:
                data,

            materia:
                campo.dataset.materia,

            descricao:
                descricao

        });

    });


    if (tarefas.length === 0) {

        alert(
            "Digite pelo menos uma tarefa."
        );

        return;

    }


    try {

        /*
            Envia cada tarefa individualmente
            para o backend.
        */

        for (const tarefa of tarefas) {

            const resposta =
                await fetch(
                    "/api/tarefas",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                tarefa
                            )

                    }
                );


            const dados =
                await resposta.json();


            if (!dados.sucesso) {

                alert(
                    dados.mensagem
                );

                return;

            }

        }


        await carregarTarefas();


        fecharFormulario();


        alert(
            `${tarefas.length} tarefa(s) adicionada(s) com sucesso!`
        );


    } catch (erro) {

        console.error(
            "Erro ao adicionar tarefas:",
            erro
        );

        alert(
            "Erro ao conectar ao servidor."
        );

    }

}


/* =========================
   CRIAR TAREFA NA TELA
========================= */

function criarTarefa(
    id,
    data,
    materia,
    descricao
) {

    let dia =
        document.querySelector(
            `.dia[data-data="${data}"]`
        );


    if (!dia) {

        dia =
            document.createElement("div");

        dia.className =
            "dia";

        dia.dataset.data =
            data;


        dia.innerHTML = `
            <h2>${formatarData(data)}</h2>
            <div class="tarefas"></div>
        `;


        const listaTarefas =
            document.getElementById(
                "lista-tarefas"
            );


        if (!listaTarefas) {
            return;
        }


        listaTarefas.prepend(
            dia
        );

    }


    const lista =
        dia.querySelector(
            ".tarefas"
        );


    const novaTarefa =
        document.createElement(
            "div"
        );


    novaTarefa.className =
        "tarefa";


    novaTarefa.dataset.id =
        id;


    novaTarefa.innerHTML = `
        <h3>${materia}</h3>
        <p>${descricao}</p>
    `;


    /* =========================
       BOTÕES DO ADMIN
    ========================= */

    if (
        usuarioAtual &&
        usuarioAtual.tipo === "admin"
    ) {

        const areaBotoes =
            document.createElement(
                "div"
            );


        areaBotoes.className =
            "botoes-tarefa";


        /* EDITAR */

        const botaoEditar =
            document.createElement(
                "button"
            );


        botaoEditar.textContent =
            "Editar";


        botaoEditar.onclick =
            () => editarTarefa(
                id,
                data,
                materia,
                descricao
            );


        /* EXCLUIR */

        const botaoExcluir =
            document.createElement(
                "button"
            );


        botaoExcluir.textContent =
            "Excluir";


        botaoExcluir.onclick =
            () => excluirTarefa(id);


        areaBotoes.appendChild(
            botaoEditar
        );


        areaBotoes.appendChild(
            botaoExcluir
        );


        novaTarefa.appendChild(
            areaBotoes
        );

    }


    lista.appendChild(
        novaTarefa
    );

}


/* =========================
   CARREGAR TAREFAS
========================= */

async function carregarTarefas() {

    try {

        const resposta =
            await fetch(
                "/api/tarefas"
            );


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            console.error(
                dados.mensagem
            );

            return;

        }


        const lista =
            document.getElementById(
                "lista-tarefas"
            );


        if (!lista) {
            return;
        }


        lista.innerHTML = "";


        dados.tarefas
    .sort((a, b) => {

        // Datas mais recentes primeiro
        const comparacaoData =
            b.data.localeCompare(a.data);

        // Se forem do mesmo dia,
        // tarefas adicionadas mais recentemente primeiro
        if (comparacaoData !== 0) {
            return comparacaoData;
        }

        return b.id - a.id;

    })
    .forEach(tarefa => {

        criarTarefa(

            tarefa.id,

            tarefa.data,

            tarefa.materia,

            tarefa.descricao

        );

    });


    } catch (erro) {

        console.error(
            "Erro ao carregar tarefas:",
            erro
        );

    }

}


/* =========================
   EDITAR TAREFA
========================= */

async function editarTarefa(
    id,
    dataAtual,
    materiaAtual,
    descricaoAtual
) {

    const data =
        prompt(
            "Nova data:",
            dataAtual
        );


    if (data === null) {
        return;
    }


    const materia =
        prompt(
            "Nova matéria:",
            materiaAtual
        );


    if (materia === null) {
        return;
    }


    const descricao =
        prompt(
            "Nova descrição:",
            descricaoAtual
        );


    if (descricao === null) {
        return;
    }


    if (
        !data ||
        !materia ||
        !descricao
    ) {

        alert(
            "Todos os campos são obrigatórios."
        );

        return;

    }


    try {

        const resposta =
            await fetch(
                `/api/tarefas/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            data:
                                data,

                            materia:
                                materia,

                            descricao:
                                descricao

                        })

                }
            );


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.mensagem
            );

            return;

        }


        await carregarTarefas();


        alert(
            "Tarefa alterada com sucesso!"
        );


    } catch (erro) {

        console.error(
            "Erro ao editar tarefa:",
            erro
        );

        alert(
            "Erro ao conectar ao servidor."
        );

    }

}


/* =========================
   EXCLUIR TAREFA
========================= */

async function excluirTarefa(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta tarefa?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `/api/tarefas/${id}`,
                {

                    method: "DELETE"

                }
            );


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.mensagem
            );

            return;

        }


        await carregarTarefas();


        alert(
            "Tarefa excluída!"
        );


    } catch (erro) {

        console.error(
            "Erro ao excluir tarefa:",
            erro
        );

        alert(
            "Erro ao conectar ao servidor."
        );

    }

}


/* =========================
   FILTRO POR DATA
========================= */

function filtrarPorData() {

    const campoData =
        document.getElementById(
            "data"
        );


    if (!campoData) {
        return;
    }


    const dataSelecionada =
        campoData.value;


    const dias =
        document.querySelectorAll(
            ".dia"
        );


    dias.forEach(dia => {

        if (
            dia.dataset.data ===
            dataSelecionada
        ) {

            dia.style.display =
                "block";

        } else {

            dia.style.display =
                "none";

        }

    });

}


function limparFiltro() {

    document
        .querySelectorAll(
            ".dia"
        )
        .forEach(dia => {

            dia.style.display =
                "block";

        });


    const campoData =
        document.getElementById(
            "data"
        );


    if (campoData) {

        campoData.value =
            "";

    }

}


/* =========================
   FORMATAR DATA
========================= */

function formatarData(data) {

    const partes =
        data.split("-");


    return `${partes[2]} de ${nomeDoMes(partes[1])} de ${partes[0]}`;

}


function nomeDoMes(numero) {

    const meses = [

        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro"

    ];


    return meses[
        parseInt(numero) - 1
    ];

}


/* =========================
   SESSÃO
========================= */

async function verificarSessao() {

    try {

        const resposta =
            await fetch(
                "/api/sessao"
            );


        const dados =
            await resposta.json();


        if (!dados.logado) {

            window.location.href =
                "/login.html";

            return;

        }


        usuarioAtual = {

            id:
                dados.id,

            usuario:
                dados.usuario,

            tipo:
                dados.tipo

        };


        console.log(
            "USUÁRIO LOGADO:",
            usuarioAtual
        );


        /* =========================
           USUÁRIO NA TELA
        ========================= */

        const elemento =
            document.getElementById(
                "usuario-logado"
            );


        if (elemento) {

            elemento.textContent =
                `Logado como: ${dados.usuario} (${dados.tipo})`;

        }


        /* =========================
           ÁREA DE ADICIONAR
        ========================= */

        const areaAdicionar =
            document.getElementById(
                "area-adicionar"
            );


        if (areaAdicionar) {

            areaAdicionar.style.display =
                dados.tipo === "admin"
                    ? "block"
                    : "none";

        }


        /* =========================
           PAINEL ADMIN
        ========================= */

        const painelAdmin =
            document.getElementById(
                "painel-admin"
            );


        if (painelAdmin) {

            if (
                dados.tipo ===
                "admin"
            ) {

                painelAdmin.style.display =
                    "block";


                await carregarUsuarios();

            } else {

                painelAdmin.style.display =
                    "none";

            }

        }


        /* =========================
           CARREGAR TAREFAS
        ========================= */

        await carregarTarefas();


    } catch (erro) {

        console.error(
            "Erro ao verificar sessão:",
            erro
        );

    }

}


/* =========================
   USUÁRIOS
========================= */

async function carregarUsuarios() {

    try {

        const resposta =
            await fetch(
                "/api/usuarios"
            );


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            console.error(
                dados.mensagem
            );

            return;

        }


        const lista =
            document.getElementById(
                "lista-usuarios"
            );


        if (!lista) {
            return;
        }


        lista.innerHTML = "";


        dados.usuarios.forEach(
            usuario => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "usuario-admin";


                /* INFORMAÇÕES */

                const informacoes =
                    document.createElement(
                        "span"
                    );


                informacoes.textContent =
                    `${usuario.usuario} — ${usuario.tipo}`;


                item.appendChild(
                    informacoes
                );


                /* ALTERAR SENHA */

                const botaoSenha =
                    document.createElement(
                        "button"
                    );


                botaoSenha.textContent =
                    "Alterar senha";


                botaoSenha.onclick =
                    () => alterarSenha(
                        usuario.id,
                        usuario.usuario
                    );


                item.appendChild(
                    botaoSenha
                );


                /* EXCLUIR */

                if (
                    usuario.id !==
                    dados.usuarioLogadoId
                ) {

                    const botaoExcluir =
                        document.createElement(
                            "button"
                        );


                    botaoExcluir.textContent =
                        "Excluir";


                    botaoExcluir.onclick =
                        () => excluirUsuario(
                            usuario.id
                        );


                    item.appendChild(
                        botaoExcluir
                    );

                }


                lista.appendChild(
                    item
                );

            }
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar usuários:",
            erro
        );

    }

}


/* =========================
   ALTERAR SENHA
========================= */

let usuarioAlterarSenhaId =
    null;


function alterarSenha(
    id,
    usuario
) {

    usuarioAlterarSenhaId =
        id;


    const texto =
        document.getElementById(
            "usuario-senha"
        );


    if (texto) {

        texto.textContent =
            `Alterando senha de: ${usuario}`;

    }


    const campo =
        document.getElementById(
            "senha-alterada"
        );


    if (campo) {

        campo.value =
            "";

    }


    const modal =
        document.getElementById(
            "modal-senha"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }


    if (campo) {

        campo.focus();

    }

}


function fecharModalSenha() {

    const modal =
        document.getElementById(
            "modal-senha"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    usuarioAlterarSenhaId =
        null;

}


async function confirmarAlteracaoSenha() {

    if (
        !usuarioAlterarSenhaId
    ) {

        alert(
            "Nenhum usuário selecionado."
        );

        return;

    }


    const campo =
        document.getElementById(
            "senha-alterada"
        );


    if (!campo) {
        return;
    }


    const senha =
        campo.value;


    if (!senha) {

        alert(
            "Digite uma nova senha."
        );

        return;

    }


    if (senha.length < 4) {

        alert(
            "A senha precisa ter pelo menos 4 caracteres."
        );

        return;

    }


    try {

        const resposta =
            await fetch(
                `/api/usuarios/${usuarioAlterarSenhaId}/senha`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            senha:
                                senha
                        })

                }
            );


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.mensagem
            );

            return;

        }


        alert(
            "Senha alterada com sucesso!"
        );


        fecharModalSenha();


    } catch (erro) {

        console.error(
            "Erro ao alterar senha:",
            erro
        );

        alert(
            "Erro ao conectar ao servidor."
        );

    }

}


/* =========================
   CRIAR USUÁRIO
========================= */

async function criarUsuario() {

    const campoUsuario =
        document.getElementById(
            "novo-usuario"
        );


    const campoSenha =
        document.getElementById(
            "nova-senha"
        );


    if (
        !campoUsuario ||
        !campoSenha
    ) {

        return;

    }


    const usuario =
        campoUsuario.value.trim();


    const senha =
        campoSenha.value;


    if (
        !usuario ||
        !senha
    ) {

        alert(
            "Preencha usuário e senha."
        );

        return;

    }


    try {

        const resposta =
            await fetch(
                "/api/usuarios",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            usuario:
                                usuario,

                            senha:
                                senha

                        })

                }
            );


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.mensagem
            );

            return;

        }


        alert(
            "Conta criada com sucesso!"
        );


        campoUsuario.value =
            "";


        campoSenha.value =
            "";


        await carregarUsuarios();


    } catch (erro) {

        console.error(
            "Erro ao criar usuário:",
            erro
        );

        alert(
            "Erro ao conectar ao servidor."
        );

    }

}


/* =========================
   EXCLUIR USUÁRIO
========================= */

async function excluirUsuario(id) {

    if (
        !confirm(
            "Tem certeza que deseja excluir este usuário?"
        )
    ) {

        return;

    }


    try {

        const resposta =
            await fetch(
                `/api/usuarios/${id}`,
                {

                    method: "DELETE"

                }
            );


        const dados =
            await resposta.json();


        if (!dados.sucesso) {

            alert(
                dados.mensagem
            );

            return;

        }


        await carregarUsuarios();


        alert(
            "Usuário excluído!"
        );


    } catch (erro) {

        console.error(
            "Erro ao excluir usuário:",
            erro
        );

        alert(
            "Erro ao conectar ao servidor."
        );

    }

}


/* =========================
   LOGOUT
========================= */

async function logout() {

    try {

        const resposta =
            await fetch(
                "/api/logout",
                {

                    method: "POST"

                }
            );


        const dados =
            await resposta.json();


        if (dados.sucesso) {

            window.location.href =
                "/login.html";

        }


    } catch (erro) {

        console.error(
            "Erro ao fazer logout:",
            erro
        );

    }

}


/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        verificarSessao();

    }
);

```js
/* =========================================================
   FEIRA ESCOLAR
   =========================================================
   
   Este arquivo controla a página da feira.
   
   Estrutura planejada:
   1. Equipes e temas
   2. Tabelas
   3. Arquivos
   4. Cronômetro

   Por enquanto os dados são locais.
   Depois vamos conectar tudo ao banco de dados/API.
   ========================================================= */


/* =========================================================
   ESTADO DA FEIRA
========================================================= */

const feira = {

    equipes: [],

    tabelas: [],

    arquivos: [],

    cronometro: {
        duracao: 0,
        restante: 0,
        rodando: false,
        intervalo: null
    }

};


/* =========================================================
   USUÁRIO
========================================================= */

// Depois vamos pegar isso diretamente da sessão/API.
// Por enquanto deixamos preparado.

let usuarioAtual = null;


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("Página da feira carregada.");

    inicializarFeira();

});


function inicializarFeira() {

    carregarUsuario();

    carregarEquipes();

    carregarTabelas();

    carregarArquivos();

    inicializarCronometro();

    atualizarInterfaceAdmin();

}


/* =========================================================
   USUÁRIO / PERMISSÕES
========================================================= */

async function carregarUsuario() {

    try {

        const resposta = await fetch("/api/usuario");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar o usuário.");
        }

        usuarioAtual = await resposta.json();

        console.log("Usuário atual:", usuarioAtual);

        atualizarInterfaceAdmin();

    } catch (erro) {

        console.error("Erro ao carregar usuário:", erro);

    }

}


function ehAdmin() {

    return usuarioAtual?.tipo === "admin";

}


function atualizarInterfaceAdmin() {

    const elementosAdmin = document.querySelectorAll(".somente-admin");

    elementosAdmin.forEach(elemento => {

        elemento.style.display = ehAdmin()
            ? ""
            : "none";

    });

}


/* =========================================================
   EQUIPES
========================================================= */

async function carregarEquipes() {

    /*
        Futuramente:

        const resposta = await fetch("/api/feira/equipes");

        feira.equipes = await resposta.json();

        renderizarEquipes();
    */

    console.log("Carregando equipes...");

    renderizarEquipes();

}


function renderizarEquipes() {

    const container = document.getElementById("equipes");

    if (!container) return;

    container.innerHTML = "";

    if (feira.equipes.length === 0) {

        container.innerHTML = `
            <p class="sem-conteudo">
                Nenhuma equipe cadastrada ainda.
            </p>
        `;

        return;

    }

    feira.equipes.forEach(equipe => {

        const elemento = document.createElement("div");

        elemento.className = "equipe";

        elemento.innerHTML = `
            <h3>${equipe.nome}</h3>

            <p>
                <strong>Tema:</strong>
                ${equipe.tema || "Não definido"}
            </p>

            <p>
                <strong>Professor:</strong>
                ${equipe.professor || "Não definido"}
            </p>

            <p>
                <strong>Integrantes:</strong>
                ${equipe.integrantes?.join(", ") || "Nenhum"}
            </p>

            ${
                ehAdmin()
                ? `
                    <div class="acoes-admin">
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

        container.appendChild(elemento);

    });

}


function adicionarEquipe(equipe) {

    if (!ehAdmin()) {

        alert("Apenas administradores podem adicionar equipes.");

        return;

    }

    feira.equipes.push({

        id: Date.now(),

        nome: equipe.nome,

        tema: equipe.tema || "",

        professor: equipe.professor || "",

        integrantes: equipe.integrantes || []

    });

    renderizarEquipes();

}


function editarEquipe(id) {

    if (!ehAdmin()) return;

    const equipe = feira.equipes.find(e => e.id === id);

    if (!equipe) return;

    console.log("Editar equipe:", equipe);

    // Depois colocaremos um formulário/modal aqui.

}


function excluirEquipe(id) {

    if (!ehAdmin()) return;

    const confirmar = confirm(
        "Tem certeza que deseja excluir esta equipe?"
    );

    if (!confirmar) return;

    feira.equipes = feira.equipes.filter(
        equipe => equipe.id !== id
    );

    renderizarEquipes();

}


/* =========================================================
   TABELAS
========================================================= */

async function carregarTabelas() {

    /*
        Futuramente:

        const resposta = await fetch("/api/feira/tabelas");

        feira.tabelas = await resposta.json();
    */

    console.log("Carregando tabelas...");

    renderizarTabelas();

}


function renderizarTabelas() {

    const container = document.getElementById("tabelas");

    if (!container) return;

    container.innerHTML = "";

    if (feira.tabelas.length === 0) {

        container.innerHTML = `
            <p class="sem-conteudo">
                Nenhuma tabela criada ainda.
            </p>
        `;

        return;

    }

    feira.tabelas.forEach(tabela => {

        const elemento = document.createElement("div");

        elemento.className = "tabela-feira";

        elemento.innerHTML = `
            <h3>${tabela.nome}</h3>

            <table>

                <thead>
                    <tr>
                        ${tabela.colunas.map(coluna =>
                            `<th>${coluna}</th>`
                        ).join("")}
                    </tr>
                </thead>

                <tbody>

                    ${tabela.linhas.map(linha => `
                        <tr>
                            ${linha.map(celula =>
                                `<td>${celula}</td>`
                            ).join("")}
                        </tr>
                    `).join("")}

                </tbody>

            </table>

            ${
                ehAdmin()
                ? `
                    <div class="acoes-admin">

                        <button onclick="editarTabela(${tabela.id})">
                            Editar
                        </button>

                        <button onclick="excluirTabela(${tabela.id})">
                            Excluir
                        </button>

                    </div>
                `
                : ""
            }

        `;

        container.appendChild(elemento);

    });

}


function adicionarTabela(tabela) {

    if (!ehAdmin()) {

        alert("Apenas administradores podem criar tabelas.");

        return;

    }

    feira.tabelas.push({

        id: Date.now(),

        nome: tabela.nome,

        colunas: tabela.colunas || [],

        linhas: tabela.linhas || []

    });

    renderizarTabelas();

}


function editarTabela(id) {

    if (!ehAdmin()) return;

    const tabela = feira.tabelas.find(
        tabela => tabela.id === id
    );

    if (!tabela) return;

    console.log("Editar tabela:", tabela);

}


function excluirTabela(id) {

    if (!ehAdmin()) return;

    const confirmar = confirm(
        "Tem certeza que deseja excluir esta tabela?"
    );

    if (!confirmar) return;

    feira.tabelas = feira.tabelas.filter(
        tabela => tabela.id !== id
    );

    renderizarTabelas();

}


/* =========================================================
   ARQUIVOS
========================================================= */

async function carregarArquivos() {

    /*
        Futuramente:

        const resposta = await fetch("/api/feira/arquivos");

        feira.arquivos = await resposta.json();
    */

    console.log("Carregando arquivos...");

    renderizarArquivos();

}


function renderizarArquivos() {

    const container = document.getElementById("arquivos");

    if (!container) return;

    container.innerHTML = "";

    if (feira.arquivos.length === 0) {

        container.innerHTML = `
            <p class="sem-conteudo">
                Nenhum arquivo disponível.
            </p>
        `;

        return;

    }

    feira.arquivos.forEach(arquivo => {

        const elemento = document.createElement("div");

        elemento.className = "arquivo";

        elemento.innerHTML = `

            <div>

                <strong>
                    ${arquivo.nome}
                </strong>

                <small>
                    ${arquivo.equipe || "Geral"}
                </small>

            </div>

            <div>

                <a
                    href="${arquivo.url}"
                    target="_blank"
                >
                    Abrir
                </a>

                ${
                    ehAdmin()
                    ? `
                        <button
                            onclick="excluirArquivo(${arquivo.id})"
                        >
                            Excluir
                        </button>
                    `
                    : ""
                }

            </div>

        `;

        container.appendChild(elemento);

    });

}


function excluirArquivo(id) {

    if (!ehAdmin()) return;

    const confirmar = confirm(
        "Tem certeza que deseja excluir este arquivo?"
    );

    if (!confirmar) return;

    /*
        Depois:

        await fetch(
            `/api/feira/arquivos/${id}`,
            { method: "DELETE" }
        );

    */

    feira.arquivos = feira.arquivos.filter(
        arquivo => arquivo.id !== id
    );

    renderizarArquivos();

}


/* =========================================================
   CRONÔMETRO
========================================================= */

function inicializarCronometro() {

    atualizarDisplayCronometro();

}


function iniciarCronometro() {

    if (!ehAdmin()) {

        alert("Apenas administradores podem controlar o cronômetro.");

        return;

    }

    if (feira.cronometro.rodando) return;

    feira.cronometro.rodando = true;

    feira.cronometro.intervalo = setInterval(() => {

        if (feira.cronometro.restante <= 0) {

            pararCronometro();

            return;

        }

        feira.cronometro.restante--;

        atualizarDisplayCronometro();

    }, 1000);

}


function pausarCronometro() {

    if (!ehAdmin()) return;

    feira.cronometro.rodando = false;

    clearInterval(
        feira.cronometro.intervalo
    );

}


function pararCronometro() {

    feira.cronometro.rodando = false;

    clearInterval(
        feira.cronometro.intervalo
    );

    atualizarDisplayCronometro();

}


function resetarCronometro() {

    if (!ehAdmin()) return;

    pararCronometro();

    feira.cronometro.restante =
        feira.cronometro.duracao;

    atualizarDisplayCronometro();

}


function definirTempoCronometro(segundos) {

    if (!ehAdmin()) return;

    pararCronometro();

    feira.cronometro.duracao = segundos;

    feira.cronometro.restante = segundos;

    atualizarDisplayCronometro();

}


function atualizarDisplayCronometro() {

    const display =
        document.getElementById("cronometro-display");

    if (!display) return;

    const minutos =
        Math.floor(feira.cronometro.restante / 60);

    const segundos =
        feira.cronometro.restante % 60;

    display.textContent =
        `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

}


/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function formatarTamanhoArquivo(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

}
```

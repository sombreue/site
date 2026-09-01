require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;


// =========================
// CONFIGURAÇÕES
// =========================

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));


// =========================
// BANCO POSTGRESQL - NEON
// =========================

if (!process.env.DATABASE_URL) {

    console.error(
        "ERRO: DATABASE_URL não foi encontrada."
    );

    process.exit(1);

}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }
});


// Testar conexão

pool.query("SELECT NOW()")
    .then(() => {

        console.log("================================");
        console.log("POSTGRESQL CONECTADO!");
        console.log("================================");

    })
    .catch(erro => {

        console.error(
            "Erro ao conectar ao PostgreSQL:",
            erro
        );

    });


// =========================
// SESSÕES
// =========================

app.use(session({

    secret:
        process.env.SESSION_SECRET ||
        "tarefas-da-turma-segredo",

    resave: false,

    saveUninitialized: false,

    cookie: {

        httpOnly: true,

        maxAge:
            1000 * 60 * 60 * 24

    }

}));


// =========================
// ARQUIVOS DO SITE
// =========================

app.use(express.static("public", {
    index: false
}));


// =========================
// PÁGINA PRINCIPAL
// =========================

app.get("/", (req, res) => {

    if (!req.session.usuario) {

        return res.redirect("/login.html");

    }

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// =========================
// CRIAR TABELAS
// =========================

async function criarTabelas() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS usuarios (

            id SERIAL PRIMARY KEY,

            usuario TEXT NOT NULL UNIQUE,

            senha TEXT NOT NULL,

            tipo TEXT NOT NULL
                CHECK (tipo IN ('admin', 'usuario'))

        );

    `);


    await pool.query(`

        CREATE TABLE IF NOT EXISTS tarefas (

            id SERIAL PRIMARY KEY,

            data TEXT NOT NULL,

            materia TEXT NOT NULL,

            descricao TEXT NOT NULL

        );

    `);
await pool.query(`
    CREATE TABLE IF NOT EXISTS feira_equipes (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        tema TEXT NOT NULL,
        professor TEXT,
        integrantes TEXT
    );
`);

await pool.query(`
    ALTER TABLE feira_equipes
    ADD COLUMN IF NOT EXISTS lider TEXT;
`);
await pool.query(`
    CREATE TABLE IF NOT EXISTS feira_config (
        id SERIAL PRIMARY KEY,
        data_apresentacao TIMESTAMP NOT NULL
    );
`);
await pool.query(`
    ALTER TABLE feira_config
    ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true;
`);
await pool.query(`
    INSERT INTO feira_config (id, data_apresentacao)
    VALUES (1, '2026-09-13 08:00:00')
    ON CONFLICT (id) DO NOTHING;
`);
await pool.query(`
    UPDATE feira_config
    SET ativa = true
    WHERE id = 1
      AND ativa IS NULL;
`);
}


// =========================
// CRIAR ADMIN
// =========================

async function criarAdmin() {

    const resultado =
        await pool.query(
            `
            SELECT id, usuario, senha, tipo
            FROM usuarios
            WHERE usuario = $1
            `,
            ["admin"]
        );


    if (resultado.rows.length === 0) {

        const senhaHash =
            await bcrypt.hash(
                "admin123",
                10
            );


        await pool.query(
            `
            INSERT INTO usuarios (
                usuario,
                senha,
                tipo
            )

            VALUES ($1, $2, $3)
            `,
            [
                "admin",
                senhaHash,
                "admin"
            ]
        );


        console.log(
            "Administrador criado."
        );

    }

}


// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {

    try {

        const {
            usuario,
            senha
        } = req.body;


        if (!usuario || !senha) {

            return res.status(400).json({

                sucesso: false,

                mensagem:
                    "Preencha usuário e senha."

            });

        }


        const resultado =
            await pool.query(
                `
                SELECT *
                FROM usuarios
                WHERE usuario = $1
                `,
                [usuario]
            );


        if (
            resultado.rows.length === 0
        ) {

            return res.status(401).json({

                sucesso: false,

                mensagem:
                    "Usuário ou senha incorretos."

            });

        }


        const usuarioBanco =
            resultado.rows[0];


        const senhaCorreta =
            await bcrypt.compare(
                senha,
                usuarioBanco.senha
            );


        if (!senhaCorreta) {

            return res.status(401).json({

                sucesso: false,

                mensagem:
                    "Usuário ou senha incorretos."

            });

        }


        req.session.usuario = {

            id:
                usuarioBanco.id,

            usuario:
                usuarioBanco.usuario,

            tipo:
                usuarioBanco.tipo

        };


        console.log(
            "LOGIN REALIZADO:",
            req.session.usuario
        );


        res.json({

            sucesso: true,

            usuario:
                usuarioBanco.usuario,

            tipo:
                usuarioBanco.tipo

        });


    } catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );


        res.status(500).json({

            sucesso: false,

            mensagem:
                "Erro interno do servidor."

        });

    }

});


// =========================
// VERIFICAR SESSÃO
// =========================

app.get("/api/sessao", (req, res) => {

    if (!req.session.usuario) {

        return res.json({

            logado: false

        });

    }


    res.json({

        logado: true,

        id:
            req.session.usuario.id,

        usuario:
            req.session.usuario.usuario,

        tipo:
            req.session.usuario.tipo

    });

});


// =========================
// LOGOUT
// =========================

app.post("/api/logout", (req, res) => {

    req.session.destroy(() => {

        res.json({

            sucesso: true

        });

    });

});


// =========================
// AUTENTICAÇÃO
// =========================

function exigirLogin(
    req,
    res,
    next
) {

    if (!req.session.usuario) {

        return res.status(401).json({

            sucesso: false,

            mensagem:
                "Você precisa estar logado."

        });

    }

    next();

}


function exigirAdmin(
    req,
    res,
    next
) {

    if (!req.session.usuario) {

        return res.status(401).json({

            sucesso: false,

            mensagem:
                "Você precisa estar logado."

        });

    }


    if (
        req.session.usuario.tipo !==
        "admin"
    ) {

        return res.status(403).json({

            sucesso: false,

            mensagem:
                "Acesso permitido somente para administradores."

        });

    }

    next();

}


// =========================
// USUÁRIOS
// =========================


// CRIAR USUÁRIO

app.post(
    "/api/usuarios",
    exigirAdmin,
    async (req, res) => {

        try {

            const {
                usuario,
                senha
            } = req.body;


            if (!usuario || !senha) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Preencha o usuário e a senha."

                });

            }


            if (usuario.length < 3) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "O usuário precisa ter pelo menos 3 caracteres."

                });

            }


            if (senha.length < 4) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "A senha precisa ter pelo menos 4 caracteres."

                });

            }


            const existente =
                await pool.query(
                    `
                    SELECT id
                    FROM usuarios
                    WHERE usuario = $1
                    `,
                    [usuario]
                );


            if (
                existente.rows.length > 0
            ) {

                return res.status(409).json({

                    sucesso: false,

                    mensagem:
                        "Esse usuário já existe."

                });

            }


            const senhaHash =
                await bcrypt.hash(
                    senha,
                    10
                );


            const resultado =
                await pool.query(
                    `
                    INSERT INTO usuarios (
                        usuario,
                        senha,
                        tipo
                    )

                    VALUES ($1, $2, $3)

                    RETURNING id
                    `,
                    [
                        usuario,
                        senhaHash,
                        "usuario"
                    ]
                );


            res.json({

                sucesso: true,

                mensagem:
                    "Usuário criado com sucesso!",

                id:
                    resultado.rows[0].id

            });


        } catch (erro) {

            console.error(
                "Erro ao criar usuário:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// LISTAR USUÁRIOS

app.get(
    "/api/usuarios",
    exigirAdmin,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        id,
                        usuario,
                        tipo
                    FROM usuarios
                    ORDER BY usuario ASC
                `);


            res.json({

                sucesso: true,

                usuarios:
                    resultado.rows,

                usuarioLogadoId:
                    req.session.usuario.id

            });


        } catch (erro) {

            console.error(
                "Erro ao carregar usuários:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// EXCLUIR USUÁRIO

app.delete(
    "/api/usuarios/:id",
    exigirAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            if (!id) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "ID inválido."

                });

            }


            if (
                id ===
                req.session.usuario.id
            ) {

                return res.status(403).json({

                    sucesso: false,

                    mensagem:
                        "Você não pode excluir sua própria conta."

                });

            }


            const resultado =
                await pool.query(
                    `
                    DELETE FROM usuarios
                    WHERE id = $1
                    `,
                    [id]
                );


            if (
                resultado.rowCount === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Usuário não encontrado."

                });

            }


            res.json({

                sucesso: true,

                mensagem:
                    "Usuário excluído com sucesso."

            });


        } catch (erro) {

            console.error(
                "Erro ao excluir usuário:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// ALTERAR SENHA

app.put(
    "/api/usuarios/:id/senha",
    exigirAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const {
                senha
            } = req.body;


            if (!id) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "ID inválido."

                });

            }


            if (!senha) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Digite uma nova senha."

                });

            }


            if (senha.length < 4) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "A senha precisa ter pelo menos 4 caracteres."

                });

            }


            const usuarioExiste =
                await pool.query(
                    `
                    SELECT id
                    FROM usuarios
                    WHERE id = $1
                    `,
                    [id]
                );


            if (
                usuarioExiste.rows.length === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Usuário não encontrado."

                });

            }


            const senhaHash =
                await bcrypt.hash(
                    senha,
                    10
                );


            await pool.query(
                `
                UPDATE usuarios
                SET senha = $1
                WHERE id = $2
                `,
                [
                    senhaHash,
                    id
                ]
            );


            res.json({

                sucesso: true,

                mensagem:
                    "Senha alterada com sucesso."

            });


        } catch (erro) {

            console.error(
                "Erro ao alterar senha:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// =========================
// FEIRA - EQUIPES
// =========================

// Listar equipes
app.get("/api/feira/equipes", exigirLogin, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT *
            FROM feira_equipes
            ORDER BY id ASC
        `);

        res.json(resultado.rows);

    } catch (erro) {
        console.error("Erro ao buscar equipes:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar equipes."
        });
    }
});


// Criar equipe
app.post("/api/feira/equipes", exigirAdmin, async (req, res) => {
    try {
        const { nome, tema, professor, lider, integrantes } = req.body;

        if (!nome || !tema) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Nome e tema são obrigatórios."
            });
        }

        const resultado = await pool.query(`
            INSERT INTO feira_equipes
            (nome, tema, professor, lider, integrantes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            nome,
            tema,
            professor || "",
            lider || "",
            integrantes || ""
        ]);

        res.status(201).json({
            sucesso: true,
            equipe: resultado.rows[0]
        });

    } catch (erro) {
        console.error("Erro ao criar equipe:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao criar equipe."
        });
    }
});


// Editar equipe
app.put("/api/feira/equipes/:id", exigirAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tema, professor, lider, integrantes } = req.body;

        if (!nome || !tema) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Nome e tema são obrigatórios."
            });
        }

        const resultado = await pool.query(`
            UPDATE feira_equipes
            SET
                nome = $1,
                tema = $2,
                professor = $3,
                integrantes = $4
                lider = $5
            WHERE id = $6
            RETURNING *
        `, [
            nome,
            tema,
            professor || "",
            lider || "",
            integrantes || "",
            id
        ]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Equipe não encontrada."
            });
        }

        res.json({
            sucesso: true,
            equipe: resultado.rows[0]
        });

    } catch (erro) {
        console.error("Erro ao editar equipe:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao editar equipe."
        });
    }
});


// Excluir equipe
app.delete("/api/feira/equipes/:id", exigirAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await pool.query(`
            DELETE FROM feira_equipes
            WHERE id = $1
            RETURNING *
        `, [id]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Equipe não encontrada."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Equipe excluída com sucesso."
        });

    } catch (erro) {
        console.error("Erro ao excluir equipe:", erro);

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao excluir equipe."
        });
    }
});

// =========================
// FEIRA - CONTAGEM REGRESSIVA
// =========================

// Buscar data da apresentação
app.get("/api/feira/contagem", exigirLogin, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT data_apresentacao
            FROM feira_config
            WHERE id = 1
        `);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                sucesso: false,
                mensagem: "Data da apresentação não configurada."
            });

        }

        res.json({
    sucesso: true,
    data: resultado.rows[0].data_apresentacao,
    tipo: req.session.usuario.tipo
});

    } catch (erro) {

        console.error(
            "Erro ao buscar data da apresentação:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar contagem regressiva."
        });

    }

});

// Alterar data da apresentação
app.put("/api/feira/contagem", exigirAdmin, async (req, res) => {

    try {

        const { data } = req.body;

        if (!data) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Data da apresentação é obrigatória."
            });
        }

        const resultado = await pool.query(`
            UPDATE feira_config
            SET data_apresentacao = $1
            WHERE id = 1
            RETURNING *
        `, [data]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Configuração não encontrada."
            });
        }

        res.json({
            sucesso: true,
            data: resultado.rows[0].data_apresentacao
        });

    } catch (erro) {

        console.error(
            "Erro ao alterar data da apresentação:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar data."
        });

    }

});
app.get("/api/feira/status", exigirLogin, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT ativa
            FROM feira_config
            WHERE id = 1
        `);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                sucesso: false,
                mensagem: "Configuração da EXPEC não encontrada."
            });

        }

        res.json({
            sucesso: true,
            ativa: resultado.rows[0].ativa,
            tipo: req.session.usuario.tipo
        });

    } catch (erro) {

        console.error(
            "Erro ao verificar status da EXPEC:",
            erro
        );

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao verificar status da EXPEC."
        });

    }

});

// =========================
// TAREFAS
// =========================


// BUSCAR TAREFAS

app.get(
    "/api/tarefas",
    exigirLogin,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        id,
                        data,
                        materia,
                        descricao
                    FROM tarefas
                    ORDER BY data DESC, id ASC
                `);


            res.json({

                sucesso: true,

                tarefas:
                    resultado.rows

            });


        } catch (erro) {

            console.error(
                "Erro ao carregar tarefas:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// ADICIONAR TAREFA

app.post(
    "/api/tarefas",
    exigirAdmin,
    async (req, res) => {

        try {

            const {
                data,
                materia,
                descricao
            } = req.body;


            if (
                !data ||
                !materia ||
                !descricao
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Preencha todos os campos."

                });

            }


            const resultado =
                await pool.query(
                    `
                    INSERT INTO tarefas (
                        data,
                        materia,
                        descricao
                    )

                    VALUES ($1, $2, $3)

                    RETURNING id
                    `,
                    [
                        data,
                        materia,
                        descricao
                    ]
                );


            res.json({

                sucesso: true,

                mensagem:
                    "Tarefa adicionada!",

                id:
                    resultado.rows[0].id

            });


        } catch (erro) {

            console.error(
                "Erro ao adicionar tarefa:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// EXCLUIR TAREFA

app.delete(
    "/api/tarefas/:id",
    exigirAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            if (!id) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "ID inválido."

                });

            }


            const resultado =
                await pool.query(
                    `
                    DELETE FROM tarefas
                    WHERE id = $1
                    `,
                    [id]
                );


            if (
                resultado.rowCount === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Tarefa não encontrada."

                });

            }


            res.json({

                sucesso: true,

                mensagem:
                    "Tarefa excluída!"

            });


        } catch (erro) {

            console.error(
                "Erro ao excluir tarefa:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// ALTERAR TAREFA

app.put(
    "/api/tarefas/:id",
    exigirAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            const {
                data,
                materia,
                descricao
            } = req.body;


            if (!id) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "ID inválido."

                });

            }


            if (
                !data ||
                !materia ||
                !descricao
            ) {

                return res.status(400).json({

                    sucesso: false,

                    mensagem:
                        "Preencha todos os campos."

                });

            }


            const resultado =
                await pool.query(
                    `
                    UPDATE tarefas

                    SET
                        data = $1,
                        materia = $2,
                        descricao = $3

                    WHERE id = $4
                    `,
                    [
                        data,
                        materia,
                        descricao,
                        id
                    ]
                );


            if (
                resultado.rowCount === 0
            ) {

                return res.status(404).json({

                    sucesso: false,

                    mensagem:
                        "Tarefa não encontrada."

                });

            }


            res.json({

                sucesso: true,

                mensagem:
                    "Tarefa alterada com sucesso."

            });


        } catch (erro) {

            console.error(
                "Erro ao alterar tarefa:",
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    "Erro interno do servidor."

            });

        }

    }
);


// =========================
// ROTA DE TESTE
// =========================

app.get(
    "/api/teste",
    (req, res) => {

        res.json({

            mensagem:
                "Backend funcionando!"

        });

    }
);


// =========================
// INICIAR SERVIDOR
// =========================

async function iniciarServidor() {

    try {

        console.log(
            "Criando/verificando tabelas..."
        );


        await criarTabelas();


        console.log(
            "Tabelas verificadas."
        );


        await criarAdmin();


        app.listen(
            PORT,
            () => {

                console.log(
                    `Servidor rodando na porta ${PORT}`
                );

            }
        );


    } catch (erro) {

        console.error(
            "ERRO AO INICIAR SERVIDOR:",
            erro
        );

        process.exit(1);

    }

}


iniciarServidor();

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
app.get("/expec.html", (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect("/login.html");
    }

    res.sendFile(
        path.join(__dirname, "public", "expec.html")
    );
});

// Favicon padrão do site.
app.get("/favicon.ico", (req, res) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.sendFile(path.join(__dirname, "public", "imagens", "favicon.ico"));
});

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
    ADD COLUMN IF NOT EXISTS ativa BOOLEAN NOT NULL DEFAULT FALSE;
`);
await pool.query(`
    CREATE TABLE IF NOT EXISTS feira_membros (
        id SERIAL PRIMARY KEY,
        equipe_id INTEGER NOT NULL REFERENCES feira_equipes(id) ON DELETE CASCADE,
        nome TEXT NOT NULL
    );
`);

}


// =========================
// FUNÇÕES AUXILIARES
// =========================

function exigirLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Você precisa estar logado."
        });
    }
    next();
}

function exigirAdmin(req, res, next) {
    if (!req.session.usuario || req.session.usuario.tipo !== "admin") {
        return res.status(403).json({
            sucesso: false,
            mensagem: "Acesso permitido apenas para administradores."
        });
    }
    next();
}


// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {
    try {
        const { usuario, senha } = req.body;

        if (!usuario || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha usuário e senha."
            });
        }

        const resultado = await pool.query(
            "SELECT id, usuario, senha, tipo FROM usuarios WHERE usuario = $1",
            [usuario]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário ou senha incorretos."
            });
        }

        const usuarioBanco = resultado.rows[0];
        const senhaCorreta = await bcrypt.compare(senha, usuarioBanco.senha);

        if (!senhaCorreta) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário ou senha incorretos."
            });
        }

        req.session.usuario = {
            id: usuarioBanco.id,
            usuario: usuarioBanco.usuario,
            tipo: usuarioBanco.tipo
        };

        req.session.save((erroSessao) => {
            if (erroSessao) {
                console.error("Erro ao salvar sessão de login:", erroSessao);
                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Não foi possível manter a sessão de login."
                });
            }
            res.json({
                sucesso: true,
                tipo: usuarioBanco.tipo
            });
        });

    } catch (erro) {
        console.error("Erro no login:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});


// =========================
// LOGOUT
// =========================

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ sucesso: true });
    });
});


// =========================
// USUÁRIO LOGADO
// =========================

app.get("/api/usuario", exigirLogin, (req, res) => {
    res.json({
        sucesso: true,
        usuario: req.session.usuario
    });
});

// Compatibilidade para páginas que ainda usam /api/sessao.
app.get("/api/sessao", (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!req.session?.usuario) {
        return res.json({ logado: false, tipo: null, usuario: null });
    }
    res.json({
        logado: true,
        tipo: req.session.usuario.tipo,
        usuario: req.session.usuario
    });
});

// APIs de sugestões e pedidos de novas contas.
// Instaladas diretamente no server.js porque o Render atualmente inicia
// este arquivo diretamente, sem depender de scripts de pós-inicialização.
require("./rotas-sugestoes-contas")(app, pool);




// Compatibilidade de sessão para páginas antigas
app.get("/api/sessao", (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!req.session || !req.session.usuario) {
        return res.json({
            logado: false,
            tipo: null,
            usuario: null
        });
    }

    res.json({
        logado: true,
        tipo: req.session.usuario.tipo,
        usuario: req.session.usuario
    });
});

// =========================
// TAREFAS
// =========================

app.get("/api/tarefas", async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT id, data, materia, descricao FROM tarefas ORDER BY data DESC, id DESC"
        );

        res.json({
            sucesso: true,
            tarefas: resultado.rows
        });
    } catch (erro) {
        console.error("Erro ao buscar tarefas:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar tarefas."
        });
    }
});

app.post("/api/tarefas", exigirAdmin, async (req, res) => {
    try {
        const { data, materia, descricao } = req.body;

        if (!data || !materia || !descricao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha todos os campos."
            });
        }

        const resultado = await pool.query(
            "INSERT INTO tarefas (data, materia, descricao) VALUES ($1, $2, $3) RETURNING id, data, materia, descricao",
            [data, materia, descricao]
        );

        res.json({
            sucesso: true,
            tarefa: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao criar tarefa:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao criar tarefa."
        });
    }
});

app.delete("/api/tarefas/:id", exigirAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query(
            "DELETE FROM tarefas WHERE id = $1",
            [id]
        );

        res.json({ sucesso: true });
    } catch (erro) {
        console.error("Erro ao excluir tarefa:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao excluir tarefa."
        });
    }
});


// =========================
// ADMIN - USUÁRIOS
// =========================

app.get("/api/admin/usuarios", exigirAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT id, usuario, tipo FROM usuarios ORDER BY id ASC"
        );

        res.json({
            sucesso: true,
            usuarios: resultado.rows
        });
    } catch (erro) {
        console.error("Erro ao listar usuários:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao listar usuários."
        });
    }
});

app.post("/api/admin/usuarios", exigirAdmin, async (req, res) => {
    try {
        const { usuario, senha, tipo = "usuario" } = req.body;

        if (!usuario || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha usuário e senha."
            });
        }

        if (!["admin", "usuario"].includes(tipo)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Tipo de usuário inválido."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const resultado = await pool.query(
            "INSERT INTO usuarios (usuario, senha, tipo) VALUES ($1, $2, $3) RETURNING id, usuario, tipo",
            [usuario, senhaHash, tipo]
        );

        res.json({
            sucesso: true,
            usuario: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao criar usuário:", erro);

        if (erro.code === "23505") {
            return res.status(409).json({
                sucesso: false,
                mensagem: "Esse usuário já existe."
            });
        }

        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao criar usuário."
        });
    }
});

app.delete("/api/admin/usuarios/:id", exigirAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === req.session.usuario.id) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Você não pode excluir sua própria conta."
            });
        }

        await pool.query(
            "DELETE FROM usuarios WHERE id = $1",
            [id]
        );

        res.json({ sucesso: true });
    } catch (erro) {
        console.error("Erro ao excluir usuário:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao excluir usuário."
        });
    }
});

app.put("/api/admin/usuarios/:id/senha", exigirAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { senha } = req.body;

        if (!senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Informe a nova senha."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        await pool.query(
            "UPDATE usuarios SET senha = $1 WHERE id = $2",
            [senhaHash, id]
        );

        res.json({ sucesso: true });
    } catch (erro) {
        console.error("Erro ao alterar senha:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar senha."
        });
    }
});




// =========================
// EXPEC - API COMPLETA
// =========================

// Garantir que exista a configuração principal da EXPEC.
app.get("/api/feira/contagem", exigirLogin, async (req, res) => {
    try {
        await pool.query(`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, '2026-09-13 08:00:00', true)
            ON CONFLICT (id) DO NOTHING
        `);

        const resultado = await pool.query(`
            SELECT data_apresentacao
            FROM feira_config
            WHERE id = 1
        `);

        if (!resultado.rows.length) {
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
        console.error("Erro ao buscar data da apresentação:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao buscar contagem regressiva."
        });
    }
});

app.put("/api/feira/contagem", exigirAdmin, async (req, res) => {
    try {
        const data = String(req.body?.data || "").trim();

        if (!data) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Data da apresentação é obrigatória."
            });
        }

        // Cria a linha caso a instalação do banco ainda não tenha uma.
        await pool.query(`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, $1, true)
            ON CONFLICT (id)
            DO UPDATE SET data_apresentacao = EXCLUDED.data_apresentacao
        `, [data]);

        const resultado = await pool.query(`
            SELECT data_apresentacao
            FROM feira_config
            WHERE id = 1
        `);

        res.json({
            sucesso: true,
            data: resultado.rows[0].data_apresentacao
        });
    } catch (erro) {
        console.error("Erro ao alterar data da apresentação:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar data."
        });
    }
});

app.get("/api/feira/status", exigirLogin, async (req, res) => {
    try {
        await pool.query(`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, '2026-09-13 08:00:00', true)
            ON CONFLICT (id) DO NOTHING
        `);

        const resultado = await pool.query(`
            SELECT ativa
            FROM feira_config
            WHERE id = 1
        `);

        res.json({
            sucesso: true,
            ativa: Boolean(resultado.rows[0]?.ativa),
            tipo: req.session.usuario.tipo
        });
    } catch (erro) {
        console.error("Erro ao verificar status da EXPEC:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao verificar status da EXPEC."
        });
    }
});

app.put("/api/feira/status", exigirAdmin, async (req, res) => {
    try {
        if (typeof req.body?.ativa !== "boolean") {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O status deve ser true ou false."
            });
        }

        await pool.query(`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, '2026-09-13 08:00:00', $1)
            ON CONFLICT (id)
            DO UPDATE SET ativa = EXCLUDED.ativa
        `, [req.body.ativa]);

        res.json({ sucesso: true, ativa: req.body.ativa });
    } catch (erro) {
        console.error("Erro ao alterar status da EXPEC:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar status da EXPEC."
        });
    }
});

// EQUIPES
app.get("/api/feira/equipes", exigirLogin, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT id, nome, tema, professor, lider, integrantes
            FROM feira_equipes
            ORDER BY id ASC
        `);
        res.json(resultado.rows);
    } catch (erro) {
        console.error("Erro ao buscar equipes:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar equipes." });
    }
});

app.post("/api/feira/equipes", exigirAdmin, async (req, res) => {
    try {
        const { nome, tema, professor, lider, integrantes } = req.body || {};
        if (!nome || !tema) {
            return res.status(400).json({ sucesso: false, mensagem: "Nome e tema são obrigatórios." });
        }
        const resultado = await pool.query(`
            INSERT INTO feira_equipes (nome, tema, professor, lider, integrantes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [nome, tema, professor || "", lider || "", integrantes || ""]);
        res.status(201).json({ sucesso: true, equipe: resultado.rows[0] });
    } catch (erro) {
        console.error("Erro ao criar equipe:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao criar equipe." });
    }
});

app.put("/api/feira/equipes/:id", exigirAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nome, tema, professor, lider, integrantes } = req.body || {};
        if (!Number.isInteger(id) || id <= 0 || !nome || !tema) {
            return res.status(400).json({ sucesso: false, mensagem: "Preencha os campos corretamente." });
        }
        const resultado = await pool.query(`
            UPDATE feira_equipes
            SET nome = $1, tema = $2, professor = $3, lider = $4, integrantes = $5
            WHERE id = $6
            RETURNING *
        `, [nome, tema, professor || "", lider || "", integrantes || "", id]);
        if (!resultado.rows.length) {
            return res.status(404).json({ sucesso: false, mensagem: "Equipe não encontrada." });
        }
        res.json({ sucesso: true, equipe: resultado.rows[0] });
    } catch (erro) {
        console.error("Erro ao editar equipe:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao editar equipe." });
    }
});

app.delete("/api/feira/equipes/:id", exigirAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            "DELETE FROM feira_equipes WHERE id = $1 RETURNING id",
            [Number(req.params.id)]
        );
        if (!resultado.rows.length) {
            return res.status(404).json({ sucesso: false, mensagem: "Equipe não encontrada." });
        }
        res.json({ sucesso: true, mensagem: "Equipe excluída com sucesso." });
    } catch (erro) {
        console.error("Erro ao excluir equipe:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir equipe." });
    }
});

// DECORAÇÕES
app.get("/api/feira/decoracoes", exigirLogin, async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feira_decoracoes (
                id SERIAL PRIMARY KEY,
                descricao TEXT NOT NULL,
                preco NUMERIC(10,2) NOT NULL
            )
        `);
        const resultado = await pool.query("SELECT id, descricao, preco FROM feira_decoracoes ORDER BY id ASC");
        res.json(resultado.rows);
    } catch (erro) {
        console.error("Erro ao buscar decorações:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar decorações." });
    }
});

app.post("/api/feira/decoracoes", exigirAdmin, async (req, res) => {
    try {
        const { descricao, preco } = req.body || {};
        if (!descricao || preco === undefined || preco === "") {
            return res.status(400).json({ sucesso: false, mensagem: "Descrição e preço são obrigatórios." });
        }
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feira_decoracoes (
                id SERIAL PRIMARY KEY,
                descricao TEXT NOT NULL,
                preco NUMERIC(10,2) NOT NULL
            )
        `);
        const resultado = await pool.query(
            "INSERT INTO feira_decoracoes (descricao, preco) VALUES ($1, $2) RETURNING *",
            [descricao, preco]
        );
        res.status(201).json({ sucesso: true, decoracao: resultado.rows[0] });
    } catch (erro) {
        console.error("Erro ao adicionar decoração:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao adicionar decoração." });
    }
});

app.put("/api/feira/decoracoes/:id", exigirAdmin, async (req, res) => {
    try {
        const { descricao, preco } = req.body || {};
        const resultado = await pool.query(
            "UPDATE feira_decoracoes SET descricao = $1, preco = $2 WHERE id = $3 RETURNING *",
            [descricao, preco, Number(req.params.id)]
        );
        if (!resultado.rows.length) return res.status(404).json({ sucesso: false, mensagem: "Decoração não encontrada." });
        res.json({ sucesso: true, decoracao: resultado.rows[0] });
    } catch (erro) {
        console.error("Erro ao editar decoração:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao editar decoração." });
    }
});

app.delete("/api/feira/decoracoes/:id", exigirAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            "DELETE FROM feira_decoracoes WHERE id = $1 RETURNING id",
            [Number(req.params.id)]
        );
        if (!resultado.rows.length) return res.status(404).json({ sucesso: false, mensagem: "Decoração não encontrada." });
        res.json({ sucesso: true, mensagem: "Decoração excluída." });
    } catch (erro) {
        console.error("Erro ao excluir decoração:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir decoração." });
    }
});


// =========================
// INICIALIZAÇÃO
// =========================

criarTabelas()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch(erro => {
        console.error("Erro ao criar tabelas:", erro);
        process.exit(1);
    });

module.exports = app;

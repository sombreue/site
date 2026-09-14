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
app.get("/expec.html", async (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect("/login.html");
    }
    next();
}, exigirLogin, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT ativa
            FROM feira_config
            WHERE id = 1
        `);

        if (!resultado.rows[0]?.ativa) {
            return res.redirect("/");
        }

        res.sendFile(
            path.join(__dirname, "public", "expec.html")
        );

    } catch (erro) {

        console.error(
            "Erro ao verificar acesso à EXPEC:",
            erro
        );

        res.redirect("/");

    }
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

const expressPath = require.resolve("express");
const expressOriginal = require(expressPath);
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const apps = [];

function expressCapturado(...args) {
    const app = expressOriginal(...args);
    apps.push(app);
    return app;
}

Object.assign(expressCapturado, expressOriginal);
require.cache[expressPath].exports = expressCapturado;

process.nextTick(() => {
    const app = apps[0];
    if (!app || !process.env.DATABASE_URL) return;

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const admin = (req, res, next) => {
        if (!req.session?.usuario) return res.status(401).json({ sucesso: false, mensagem: "Você precisa estar logado." });
        if (req.session.usuario.tipo !== "admin") return res.status(403).json({ sucesso: false, mensagem: "Acesso permitido somente para administradores." });
        next();
    };

    const tabela = pool.query(`
        CREATE TABLE IF NOT EXISTS pedidos_conta (
            id SERIAL PRIMARY KEY,
            usuario TEXT NOT NULL,
            senha_hash TEXT NOT NULL,
            data TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    app.post("/api/pedidos-conta", async (req, res) => {
        try {
            await tabela;
            const usuario = String(req.body?.usuario || "").trim();
            const senha = String(req.body?.senha || "");
            if (!usuario || !senha) return res.status(400).json({ sucesso: false, mensagem: "Preencha usuário e senha." });
            if (usuario.length < 3) return res.status(400).json({ sucesso: false, mensagem: "O usuário precisa ter pelo menos 3 caracteres." });
            if (senha.length < 4) return res.status(400).json({ sucesso: false, mensagem: "A senha precisa ter pelo menos 4 caracteres." });

            const existente = await pool.query("SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER($1)", [usuario]);
            if (existente.rows.length) return res.status(409).json({ sucesso: false, mensagem: "Esse usuário já existe." });

            const pendente = await pool.query("SELECT id FROM pedidos_conta WHERE LOWER(usuario) = LOWER($1)", [usuario]);
            if (pendente.rows.length) return res.status(409).json({ sucesso: false, mensagem: "Já existe um pedido pendente para esse usuário." });

            const hash = await bcrypt.hash(senha, 10);
            await pool.query("INSERT INTO pedidos_conta (usuario, senha_hash) VALUES ($1, $2)", [usuario, hash]);
            res.status(201).json({ sucesso: true, mensagem: "Pedido enviado! Aguarde a aprovação do administrador." });
        } catch (erro) {
            console.error("Erro ao criar pedido de conta:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
        }
    });

    app.get("/api/pedidos-conta", admin, async (req, res) => {
        try {
            await tabela;
            const resultado = await pool.query("SELECT id, usuario, data FROM pedidos_conta ORDER BY data ASC");
            res.json({ sucesso: true, pedidos: resultado.rows });
        } catch (erro) {
            console.error("Erro ao listar pedidos de conta:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
        }
    });

    app.post("/api/pedidos-conta/:id/aceitar", admin, async (req, res) => {
        try {
            await tabela;
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID inválido." });

            const pedido = await pool.query("SELECT usuario, senha_hash FROM pedidos_conta WHERE id = $1", [id]);
            if (!pedido.rows.length) return res.status(404).json({ sucesso: false, mensagem: "Pedido não encontrado." });

            const { usuario, senha_hash } = pedido.rows[0];
            const existente = await pool.query("SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER($1)", [usuario]);
            if (existente.rows.length) {
                await pool.query("DELETE FROM pedidos_conta WHERE id = $1", [id]);
                return res.status(409).json({ sucesso: false, mensagem: "Esse usuário já existe. O pedido foi removido." });
            }

            await pool.query("INSERT INTO usuarios (usuario, senha, tipo) VALUES ($1, $2, 'usuario')", [usuario, senha_hash]);
            await pool.query("DELETE FROM pedidos_conta WHERE id = $1", [id]);
            res.json({ sucesso: true, mensagem: "Conta aprovada com sucesso!" });
        } catch (erro) {
            console.error("Erro ao aceitar pedido de conta:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
        }
    });

    app.delete("/api/pedidos-conta/:id", admin, async (req, res) => {
        try {
            await tabela;
            const id = Number(req.params.id);
            if (!id) return res.status(400).json({ sucesso: false, mensagem: "ID inválido." });
            const resultado = await pool.query("DELETE FROM pedidos_conta WHERE id = $1", [id]);
            if (!resultado.rowCount) return res.status(404).json({ sucesso: false, mensagem: "Pedido não encontrado." });
            res.json({ sucesso: true, mensagem: "Pedido recusado." });
        } catch (erro) {
            console.error("Erro ao recusar pedido de conta:", erro);
            res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
        }
    });

    console.log("API de pedidos de conta carregada no servidor principal.");
});

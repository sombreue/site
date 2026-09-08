require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const expressOriginal = express;
const apps = [];
let escutaSolicitada = null;
let rotasProntas = false;
let servidorIniciado = false;

function expressCapturado(...args) {
    const app = expressOriginal(...args);
    apps.push(app);

    const listenOriginal = app.listen.bind(app);
    app.listen = (...listenArgs) => {
        escutaSolicitada = { listenOriginal, listenArgs };

        if (rotasProntas && !servidorIniciado) {
            servidorIniciado = true;
            listenOriginal(...listenArgs);
        }

        return app;
    };

    return app;
}

Object.assign(expressCapturado, expressOriginal);
require.cache[require.resolve("express")].exports = expressCapturado;

require("./server.js");

const app = apps[0];

if (!app) {
    console.error("Não foi possível obter a aplicação Express.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function prepararSugestoes() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS sugestoes (
            id SERIAL PRIMARY KEY,
            nome TEXT NOT NULL,
            sugestao TEXT NOT NULL,
            data TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

const tabelaSugestoesPronta = prepararSugestoes();

tabelaSugestoesPronta.catch(erro => {
    console.error("Erro ao preparar tabela de sugestões:", erro);
});

function exigirLoginSugestoes(req, res, next) {
    if (!req.session?.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Você precisa estar logado."
        });
    }
    next();
}

function exigirAdminSugestoes(req, res, next) {
    if (!req.session?.usuario) {
        return res.status(401).json({
            sucesso: false,
            mensagem: "Você precisa estar logado."
        });
    }

    if (req.session.usuario.tipo !== "admin") {
        return res.status(403).json({
            sucesso: false,
            mensagem: "Acesso permitido somente para administradores."
        });
    }

    next();
}

app.post("/api/sugestoes", exigirLoginSugestoes, async (req, res) => {
    try {
        await tabelaSugestoesPronta;

        const nome = String(req.body.nome || "").trim();
        const sugestao = String(req.body.sugestao || "").trim();

        if (!nome || !sugestao) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "Preencha seu nome e a sugestão."
            });
        }

        if (nome.length > 80 || sugestao.length > 1000) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "A sugestão ou o nome ultrapassou o limite permitido."
            });
        }

        await pool.query(
            `INSERT INTO sugestoes (nome, sugestao) VALUES ($1, $2)`,
            [nome, sugestao]
        );

        res.status(201).json({
            sucesso: true,
            mensagem: "Sugestão enviada com sucesso!"
        });
    } catch (erro) {
        console.error("Erro ao salvar sugestão:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});

app.get("/api/sugestoes", exigirAdminSugestoes, async (req, res) => {
    try {
        await tabelaSugestoesPronta;

        const resultado = await pool.query(`
            SELECT id, nome, sugestao, data
            FROM sugestoes
            ORDER BY data DESC, id DESC
        `);

        res.json({
            sucesso: true,
            sugestoes: resultado.rows
        });
    } catch (erro) {
        console.error("Erro ao carregar sugestões:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});

app.delete("/api/sugestoes/:id", exigirAdminSugestoes, async (req, res) => {
    try {
        await tabelaSugestoesPronta;

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "ID inválido."
            });
        }

        const resultado = await pool.query(
            `DELETE FROM sugestoes WHERE id = $1`,
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                sucesso: false,
                mensagem: "Sugestão não encontrada."
            });
        }

        res.json({
            sucesso: true,
            mensagem: "Sugestão excluída."
        });
    } catch (erro) {
        console.error("Erro ao excluir sugestão:", erro);
        res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno do servidor."
        });
    }
});

// =========================
// TRABALHOS E PESQUISAS
// =========================

async function prepararTrabalhos() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS trabalhos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            materia TEXT NOT NULL,
            prazo TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            descricao TEXT NOT NULL DEFAULT ''
        );
    `);
}

const tabelaTrabalhosPronta = prepararTrabalhos();
tabelaTrabalhosPronta.catch(erro => {
    console.error("Erro ao preparar tabela de trabalhos:", erro);
});

function exigirLoginTrabalhos(req, res, next) {
    if (!req.session?.usuario) {
        return res.status(401).json({ sucesso: false, mensagem: "Você precisa estar logado." });
    }
    next();
}

function exigirAdminTrabalhos(req, res, next) {
    if (!req.session?.usuario) {
        return res.status(401).json({ sucesso: false, mensagem: "Você precisa estar logado." });
    }
    if (req.session.usuario.tipo !== "admin") {
        return res.status(403).json({ sucesso: false, mensagem: "Acesso permitido somente para administradores." });
    }
    next();
}

app.get("/api/trabalhos", exigirLoginTrabalhos, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const resultado = await pool.query(`
            SELECT id, titulo, materia, prazo, status, descricao
            FROM trabalhos
            ORDER BY prazo ASC, id ASC
        `);
        res.json({ sucesso: true, trabalhos: resultado.rows });
    } catch (erro) {
        console.error("Erro ao carregar trabalhos:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
    }
});

app.post("/api/trabalhos", exigirAdminTrabalhos, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const titulo = String(req.body.titulo || "").trim();
        const materia = String(req.body.materia || "").trim();
        const prazo = String(req.body.prazo || "").trim();
        const status = String(req.body.status || "pendente").trim();
        const descricao = String(req.body.descricao || "").trim();
        const statusPermitidos = ["pendente", "em-andamento", "concluido"];

        if (!titulo || !materia || !prazo) {
            return res.status(400).json({ sucesso: false, mensagem: "Título, matéria e prazo são obrigatórios." });
        }
        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({ sucesso: false, mensagem: "Status inválido." });
        }

        const resultado = await pool.query(`
            INSERT INTO trabalhos (titulo, materia, prazo, status, descricao)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [titulo, materia, prazo, status, descricao]);

        res.status(201).json({ sucesso: true, trabalho: resultado.rows[0] });
    } catch (erro) {
        console.error("Erro ao criar trabalho:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
    }
});

app.put("/api/trabalhos/:id", exigirAdminTrabalhos, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const id = Number(req.params.id);
        const titulo = String(req.body.titulo || "").trim();
        const materia = String(req.body.materia || "").trim();
        const prazo = String(req.body.prazo || "").trim();
        const status = String(req.body.status || "pendente").trim();
        const descricao = String(req.body.descricao || "").trim();
        const statusPermitidos = ["pendente", "em-andamento", "concluido"];

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ sucesso: false, mensagem: "ID inválido." });
        }
        if (!titulo || !materia || !prazo || !statusPermitidos.includes(status)) {
            return res.status(400).json({ sucesso: false, mensagem: "Preencha os campos corretamente." });
        }

        const resultado = await pool.query(`
            UPDATE trabalhos
            SET titulo = $1, materia = $2, prazo = $3, status = $4, descricao = $5
            WHERE id = $6
            RETURNING *
        `, [titulo, materia, prazo, status, descricao, id]);

        if (!resultado.rows.length) {
            return res.status(404).json({ sucesso: false, mensagem: "Trabalho não encontrado." });
        }
        res.json({ sucesso: true, trabalho: resultado.rows[0] });
    } catch (erro) {
        console.error("Erro ao editar trabalho:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
    }
});

app.delete("/api/trabalhos/:id", exigirAdminTrabalhos, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ sucesso: false, mensagem: "ID inválido." });
        }

        const resultado = await pool.query(`DELETE FROM trabalhos WHERE id = $1`, [id]);
        if (!resultado.rowCount) {
            return res.status(404).json({ sucesso: false, mensagem: "Trabalho não encontrado." });
        }
        res.json({ sucesso: true, mensagem: "Trabalho excluído com sucesso." });
    } catch (erro) {
        console.error("Erro ao excluir trabalho:", erro);
        res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
    }
});

rotasProntas = true;
if (escutaSolicitada && !servidorIniciado) {
    servidorIniciado = true;
    escutaSolicitada.listenOriginal(...escutaSolicitada.listenArgs);
}
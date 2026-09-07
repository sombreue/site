require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const expressOriginal = express;
const apps = [];

function expressCapturado(...args) {
    const app = expressOriginal(...args);
    apps.push(app);
    return app;
}

Object.assign(expressCapturado, expressOriginal);
require.cache[require.resolve("express")].exports = expressCapturado;

require("./server.js");

const app = apps[0];
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

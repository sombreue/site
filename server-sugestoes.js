require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const expressOriginal = express;
const apps = [];
let escutaSolicitada = null;
let rotasProntas = false;
let servidorIniciado = false;
function expressCapturado(...args) { const app = expressOriginal(...args); apps.push(app); const listenOriginal = app.listen.bind(app); app.listen = (...listenArgs) => { escutaSolicitada = { listenOriginal, listenArgs }; if (rotasProntas && !servidorIniciado) { servidorIniciado = true; listenOriginal(...listenArgs); } return app; }; return app; }
Object.assign(expressCapturado, expressOriginal);
require.cache[require.resolve("express")].exports = expressCapturado;
require("./server.js");
const app = apps[0];
if (!app) { console.error("Não foi possível obter a aplicação Express."); process.exit(1); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function prepararSugestoes() {
    await pool.query(`CREATE TABLE IF NOT EXISTS sugestoes (id SERIAL PRIMARY KEY, nome TEXT NOT NULL, sugestao TEXT NOT NULL, data TIMESTAMPTZ NOT NULL DEFAULT NOW());`);
    await pool.query(`ALTER TABLE sugestoes ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'sugestao';`);
}
const tabelaSugestoesPronta = prepararSugestoes();
tabelaSugestoesPronta.catch(erro => console.error("Erro ao preparar tabela de sugestões:", erro));
function exigirLoginSugestoes(req, res, next) { if (!req.session?.usuario) return res.status(401).json({ sucesso:false, mensagem:"Você precisa estar logado." }); next(); }
function exigirAdminSugestoes(req, res, next) { if (!req.session?.usuario) return res.status(401).json({ sucesso:false, mensagem:"Você precisa estar logado." }); if (req.session.usuario.tipo !== "admin") return res.status(403).json({ sucesso:false, mensagem:"Acesso permitido somente para administradores." }); next(); }
app.post("/api/sugestoes", exigirLoginSugestoes, async (req, res) => {
    try {
        await tabelaSugestoesPronta;
        const nome = String(req.body.nome || "").trim();
        const sugestao = String(req.body.sugestao || "").trim();
        const tipo = String(req.body.tipo || "sugestao").trim();
        if (!nome || !sugestao) return res.status(400).json({ sucesso:false, mensagem:"Preencha seu nome e a mensagem." });
        if (!["sugestao", "bug"].includes(tipo)) return res.status(400).json({ sucesso:false, mensagem:"Tipo de envio inválido." });
        if (nome.length > 80 || sugestao.length > 1000) return res.status(400).json({ sucesso:false, mensagem:"A mensagem ou o nome ultrapassou o limite permitido." });
        await pool.query(`INSERT INTO sugestoes (nome, sugestao, tipo) VALUES ($1, $2, $3)`, [nome, sugestao, tipo]);
        res.status(201).json({ sucesso:true, mensagem:"Enviado com sucesso!" });
    } catch (erro) { console.error("Erro ao salvar sugestão:", erro); res.status(500).json({ sucesso:false, mensagem:"Erro interno do servidor." }); }
});
app.get("/api/sugestoes", exigirAdminSugestoes, async (req, res) => {
    try { await tabelaSugestoesPronta; const resultado = await pool.query(`SELECT id, nome, sugestao, tipo, data FROM sugestoes ORDER BY data DESC, id DESC`); res.json({ sucesso:true, sugestoes:resultado.rows }); }
    catch (erro) { console.error("Erro ao carregar sugestões:", erro); res.status(500).json({ sucesso:false, mensagem:"Erro interno do servidor." }); }
});
app.delete("/api/sugestoes/:id", exigirAdminSugestoes, async (req, res) => {
    try { await tabelaSugestoesPronta; const id = Number(req.params.id); if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ sucesso:false, mensagem:"ID inválido." }); const resultado = await pool.query(`DELETE FROM sugestoes WHERE id = $1`, [id]); if (!resultado.rowCount) return res.status(404).json({ sucesso:false, mensagem:"Sugestão não encontrada." }); res.json({ sucesso:true, mensagem:"Enviado excluído com sucesso." }); }
    catch (erro) { console.error("Erro ao excluir sugestão:", erro); res.status(500).json({ sucesso:false, mensagem:"Erro interno do servidor." }); }
});

// =========================
// PEDIDOS DE NOVA CONTA
// =========================
async function prepararPedidosConta() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS pedidos_conta (
            id SERIAL PRIMARY KEY,
            usuario TEXT NOT NULL,
            senha_hash TEXT NOT NULL,
            data TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}
const tabelaPedidosContaPronta = prepararPedidosConta();
tabelaPedidosContaPronta.catch(erro => console.error("Erro ao preparar pedidos de conta:", erro));

app.post("/api/pedidos-conta", async (req, res) => {
    try {
        await tabelaPedidosContaPronta;
        const usuario = String(req.body.usuario || "").trim();
        const senha = String(req.body.senha || "");
        if (!usuario || !senha) return res.status(400).json({ sucesso:false, mensagem:"Preencha usuário e senha." });
        if (usuario.length < 3) return res.status(400).json({ sucesso:false, mensagem:"O usuário precisa ter pelo menos 3 caracteres." });
        if (usuario.length > 50) return res.status(400).json({ sucesso:false, mensagem:"O usuário é muito longo." });
        if (senha.length < 4) return res.status(400).json({ sucesso:false, mensagem:"A senha precisa ter pelo menos 4 caracteres." });
        if (senha.length > 200) return res.status(400).json({ sucesso:false, mensagem:"A senha é muito longa." });

        const existente = await pool.query(`SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER($1)`, [usuario]);
        if (existente.rows.length) return res.status(409).json({ sucesso:false, mensagem:"Esse usuário já existe." });

        const pedidoExistente = await pool.query(`SELECT id FROM pedidos_conta WHERE LOWER(usuario) = LOWER($1)`, [usuario]);
        if (pedidoExistente.rows.length) return res.status(409).json({ sucesso:false, mensagem:"Já existe um pedido pendente para esse usuário." });

        const senhaHash = await bcrypt.hash(senha, 10);
        await pool.query(`INSERT INTO pedidos_conta (usuario, senha_hash) VALUES ($1, $2)`, [usuario, senhaHash]);
        res.status(201).json({ sucesso:true, mensagem:"Pedido enviado! Aguarde a aprovação do administrador." });
    } catch (erro) {
        console.error("Erro ao criar pedido de conta:", erro);
        res.status(500).json({ sucesso:false, mensagem:"Erro interno do servidor." });
    }
});

app.get("/api/pedidos-conta", exigirAdminSugestoes, async (req, res) => {
    try {
        await tabelaPedidosContaPronta;
        const resultado = await pool.query(`SELECT id, usuario, data FROM pedidos_conta ORDER BY data ASC, id ASC`);
        res.json({ sucesso:true, pedidos:resultado.rows });
    } catch (erro) {
        console.error("Erro ao carregar pedidos de conta:", erro);
        res.status(500).json({ sucesso:false, mensagem:"Erro interno do servidor." });
    }
});

app.post("/api/pedidos-conta/:id/aceitar", exigirAdminSugestoes, async (req, res) => {
    try {
        await tabelaPedidosContaPronta;
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ sucesso:false, mensagem:"ID inválido." });

        const pedido = await pool.query(`SELECT id, usuario, senha_hash FROM pedidos_conta WHERE id = $1`, [id]);
        if (!pedido.rows.length) return res.status(404).json({ sucesso:false, mensagem:"Pedido não encontrado." });

        const dados = pedido.rows[0];
        const existente = await pool.query(`SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER($1)`, [dados.usuario]);
        if (existente.rows.length) {
            await pool.query(`DELETE FROM pedidos_conta WHERE id = $1`, [id]);
            return res.status(409).json({ sucesso:false, mensagem:"Esse usuário já existe. O pedido foi removido." });
        }

        await pool.query(`INSERT INTO usuarios (usuario, senha, tipo) VALUES ($1, $2, 'usuario')`, [dados.usuario, dados.senha_hash]);
        await pool.query(`DELETE FROM pedidos_conta WHERE id = $1`, [id]);
        res.json({ sucesso:true, mensagem:`Conta de ${dados.usuario} aprovada.` });
    } catch (erro) {
        console.error("Erro ao aceitar pedido de conta:", erro);
        res.status(500).json({ sucesso:false, mensagem:"Erro interno do servidor." });
    }
});

app.delete("/api/pedidos-conta/:id", exigirAdminSugestoes, async (req, res) => {
    try {
        await tabelaPedidosContaPronta;
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ sucesso:false, mensagem:"ID inválido." });
        const resultado = await pool.query(`DELETE FROM pedidos_conta WHERE id = $1`, [id]);
        if (!resultado.rowCount) return res.status(404).json({ sucesso:false, mensagem:"Pedido não encontrado." });
        res.json({ sucesso:true, mensagem:"Pedido recusado." });
    } catch (erro) {
        console.error("Erro ao recusar pedido de conta:", erro);
        res.status(500).json({ sucesso:false, mensagem:"Erro interno do servidor." });
    }
});

// =========================
// TRABALHOS E PESQUISAS
// =========================
async function prepararTrabalhos() {
    await pool.query(`CREATE TABLE IF NOT EXISTS trabalhos (id SERIAL PRIMARY KEY, titulo TEXT NOT NULL, materia TEXT NOT NULL, prazo TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pendente', descricao TEXT NOT NULL DEFAULT '');`);
}
const tabelaTrabalhosPronta = prepararTrabalhos();
tabelaTrabalhosPronta.catch(erro => console.error("Erro ao preparar tabela de trabalhos:", erro));
function exigirLoginTrabalhos(req,res,next){if(!req.session?.usuario)return res.status(401).json({sucesso:false,mensagem:"Você precisa estar logado."});next();}
function exigirAdminTrabalhos(req,res,next){if(!req.session?.usuario)return res.status(401).json({sucesso:false,mensagem:"Você precisa estar logado."});if(req.session.usuario.tipo!=="admin")return res.status(403).json({sucesso:false,mensagem:"Acesso permitido somente para administradores."});next();}
app.get("/api/trabalhos", exigirLoginTrabalhos, async(req,res)=>{try{await tabelaTrabalhosPronta;const r=await pool.query(`SELECT id,titulo,materia,prazo,status,descricao FROM trabalhos ORDER BY prazo ASC,id ASC`);res.json({sucesso:true,trabalhos:r.rows});}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro interno do servidor."});}});
app.post("/api/trabalhos", exigirAdminTrabalhos, async(req,res)=>{try{await tabelaTrabalhosPronta;const titulo=String(req.body.titulo||"").trim(),materia=String(req.body.materia||"").trim(),prazo=String(req.body.prazo||"").trim(),status=String(req.body.status||"pendente").trim(),descricao=String(req.body.descricao||"").trim();if(!titulo||!materia||!prazo)return res.status(400).json({sucesso:false,mensagem:"Título, matéria e prazo são obrigatórios."});if(!["pendente","em-andamento","concluido"].includes(status))return res.status(400).json({sucesso:false,mensagem:"Status inválido."});const r=await pool.query(`INSERT INTO trabalhos (titulo,materia,prazo,status,descricao) VALUES ($1,$2,$3,$4,$5) RETURNING *`,[titulo,materia,prazo,status,descricao]);res.status(201).json({sucesso:true,trabalho:r.rows[0]});}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro interno do servidor."});}});
app.put("/api/trabalhos/:id", exigirAdminTrabalhos, async(req,res)=>{try{await tabelaTrabalhosPronta;const id=Number(req.params.id),titulo=String(req.body.titulo||"").trim(),materia=String(req.body.materia||"").trim(),prazo=String(req.body.prazo||"").trim(),status=String(req.body.status||"pendente").trim(),descricao=String(req.body.descricao||"").trim();if(!Number.isInteger(id)||id<=0)return res.status(400).json({sucesso:false,mensagem:"ID inválido."});if(!titulo||!materia||!prazo||!["pendente","em-andamento","concluido"].includes(status))return res.status(400).json({sucesso:false,mensagem:"Preencha os campos corretamente."});const r=await pool.query(`UPDATE trabalhos SET titulo=$1,materia=$2,prazo=$3,status=$4,descricao=$5 WHERE id=$6 RETURNING *`,[titulo,materia,prazo,status,descricao,id]);if(!r.rows.length)return res.status(404).json({sucesso:false,mensagem:"Trabalho não encontrado."});res.json({sucesso:true,trabalho:r.rows[0]});}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro interno do servidor."});}});
app.delete("/api/trabalhos/:id", exigirAdminTrabalhos, async(req,res)=>{try{await tabelaTrabalhosPronta;const id=Number(req.params.id);if(!Number.isInteger(id)||id<=0)return res.status(400).json({sucesso:false,mensagem:"ID inválido."});const r=await pool.query(`DELETE FROM trabalhos WHERE id=$1`,[id]);if(!r.rowCount)return res.status(404).json({sucesso:false,mensagem:"Trabalho não encontrado."});res.json({sucesso:true,mensagem:"Trabalho excluído com sucesso."});}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro interno do servidor."});}});
rotasProntas = true;
if (escutaSolicitada && !servidorIniciado) { servidorIniciado=true; escutaSolicitada.listenOriginal(...escutaSolicitada.listenArgs); }

require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const { Pool } = require("pg");
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!process.env.DATABASE_URL) { console.error("ERRO: DATABASE_URL não foi encontrada."); process.exit(1); }
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
app.use(session({ secret: process.env.SESSION_SECRET || "tarefas-da-turma-segredo", resave: false, saveUninitialized: false, cookie: { httpOnly: true, maxAge: 86400000, sameSite: "lax", secure: process.env.NODE_ENV === "production" } }));

// Todas as páginas HTML, inclusive EXPEC, são arquivos estáticos. A EXPEC NÃO possui rota de redirect.
app.get("/favicon.ico", (req,res)=>{res.set("Cache-Control","no-store");res.sendFile(path.join(__dirname,"public","imagens","favicon.ico"));});
app.use(express.static(path.join(__dirname,"public"), { index:false, setHeaders: res => res.set("Cache-Control","no-cache, must-revalidate") }));
app.get("/", (req,res)=>{ if(!req.session.usuario) return res.redirect("/login.html"); res.sendFile(path.join(__dirname,"public","index.html")); });

async function criarTabelas(){
 await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (id SERIAL PRIMARY KEY, usuario TEXT NOT NULL UNIQUE, senha TEXT NOT NULL, tipo TEXT NOT NULL CHECK (tipo IN ('admin','usuario')));`);
 await pool.query(`CREATE TABLE IF NOT EXISTS tarefas (id SERIAL PRIMARY KEY, data TEXT NOT NULL, materia TEXT NOT NULL, descricao TEXT NOT NULL);`);
 await pool.query(`CREATE TABLE IF NOT EXISTS feira_equipes (id SERIAL PRIMARY KEY, nome TEXT NOT NULL, tema TEXT NOT NULL, professor TEXT, integrantes TEXT);`);
 await pool.query(`ALTER TABLE feira_equipes ADD COLUMN IF NOT EXISTS lider TEXT;`);
 await pool.query(`CREATE TABLE IF NOT EXISTS feira_config (id SERIAL PRIMARY KEY, data_apresentacao TIMESTAMP NOT NULL);`);
 await pool.query(`ALTER TABLE feira_config ADD COLUMN IF NOT EXISTS ativa BOOLEAN NOT NULL DEFAULT FALSE;`);
 await pool.query(`CREATE TABLE IF NOT EXISTS feira_membros (id SERIAL PRIMARY KEY, equipe_id INTEGER NOT NULL REFERENCES feira_equipes(id) ON DELETE CASCADE, nome TEXT NOT NULL);`);
}
function exigirLogin(req,res,next){if(!req.session?.usuario)return res.status(401).json({sucesso:false,mensagem:"Você precisa estar logado."});next();}
function exigirAdmin(req,res,next){if(!req.session?.usuario)return res.status(401).json({sucesso:false,mensagem:"Você precisa estar logado."});if(req.session.usuario.tipo!=="admin")return res.status(403).json({sucesso:false,mensagem:"Acesso permitido apenas para administradores."});next();}

app.post("/api/login",async(req,res)=>{try{const {usuario,senha}=req.body;if(!usuario||!senha)return res.status(400).json({sucesso:false,mensagem:"Preencha usuário e senha."});const r=await pool.query("SELECT id,usuario,senha,tipo FROM usuarios WHERE usuario=$1",[usuario]);if(!r.rows.length)return res.status(401).json({sucesso:false,mensagem:"Usuário ou senha incorretos."});const u=r.rows[0];if(!await bcrypt.compare(senha,u.senha))return res.status(401).json({sucesso:false,mensagem:"Usuário ou senha incorretos."});req.session.usuario={id:u.id,usuario:u.usuario,tipo:u.tipo};req.session.save(e=>{if(e)return res.status(500).json({sucesso:false,mensagem:"Não foi possível manter a sessão de login."});res.json({sucesso:true,tipo:u.tipo});});}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro interno do servidor."});}});
app.post("/api/logout",(req,res)=>req.session.destroy(()=>res.json({sucesso:true})));
app.get("/api/usuario",exigirLogin,(req,res)=>res.json({sucesso:true,usuario:req.session.usuario}));
app.get("/api/sessao",(req,res)=>{res.set("Cache-Control","no-store");res.json(req.session?.usuario?{logado:true,tipo:req.session.usuario.tipo,usuario:req.session.usuario}:{logado:false,tipo:null,usuario:null});});
require("./rotas-sugestoes-contas")(app,pool);

app.get("/api/tarefas",async(req,res)=>{try{const r=await pool.query("SELECT id,data,materia,descricao FROM tarefas ORDER BY data DESC,id DESC");res.json({sucesso:true,tarefas:r.rows});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao buscar tarefas."});}});
app.post("/api/tarefas",exigirAdmin,async(req,res)=>{try{const {data,materia,descricao}=req.body;if(!data||!materia||!descricao)return res.status(400).json({sucesso:false,mensagem:"Preencha todos os campos."});const r=await pool.query("INSERT INTO tarefas(data,materia,descricao) VALUES($1,$2,$3) RETURNING id,data,materia,descricao",[data,materia,descricao]);res.json({sucesso:true,tarefa:r.rows[0]});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao criar tarefa."});}});
app.delete("/api/tarefas/:id",exigirAdmin,async(req,res)=>{try{await pool.query("DELETE FROM tarefas WHERE id=$1",[req.params.id]);res.json({sucesso:true});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao excluir tarefa."});}});
app.get("/api/admin/usuarios",exigirAdmin,async(req,res)=>{try{const r=await pool.query("SELECT id,usuario,tipo FROM usuarios ORDER BY id ASC");res.json({sucesso:true,usuarios:r.rows});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao listar usuários."});}});
app.post("/api/admin/usuarios",exigirAdmin,async(req,res)=>{try{const {usuario,senha,tipo="usuario"}=req.body;if(!usuario||!senha)return res.status(400).json({sucesso:false,mensagem:"Preencha usuário e senha."});if(!["admin","usuario"].includes(tipo))return res.status(400).json({sucesso:false,mensagem:"Tipo de usuário inválido."});const hash=await bcrypt.hash(senha,10);const r=await pool.query("INSERT INTO usuarios(usuario,senha,tipo) VALUES($1,$2,$3) RETURNING id,usuario,tipo",[usuario,hash,tipo]);res.json({sucesso:true,usuario:r.rows[0]});}catch(e){if(e.code==="23505")return res.status(409).json({sucesso:false,mensagem:"Esse usuário já existe."});res.status(500).json({sucesso:false,mensagem:"Erro ao criar usuário."});}});
app.delete("/api/admin/usuarios/:id",exigirAdmin,async(req,res)=>{try{if(Number(req.params.id)===req.session.usuario.id)return res.status(400).json({sucesso:false,mensagem:"Você não pode excluir sua própria conta."});await pool.query("DELETE FROM usuarios WHERE id=$1",[req.params.id]);res.json({sucesso:true});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao excluir usuário."});}});
app.put("/api/admin/usuarios/:id/senha",exigirAdmin,async(req,res)=>{try{if(!req.body.senha)return res.status(400).json({sucesso:false,mensagem:"Informe a nova senha."});await pool.query("UPDATE usuarios SET senha=$1 WHERE id=$2",[await bcrypt.hash(req.body.senha,10),req.params.id]);res.json({sucesso:true});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao alterar senha."});}});

// EXPEC APIs
app.get("/api/feira/contagem",exigirLogin,async(req,res)=>{try{await pool.query(`INSERT INTO feira_config(id,data_apresentacao,ativa) VALUES(1,'2026-09-13 08:00:00',true) ON CONFLICT(id) DO NOTHING`);const r=await pool.query("SELECT data_apresentacao FROM feira_config WHERE id=1");res.json({sucesso:true,data:r.rows[0].data_apresentacao,tipo:req.session.usuario.tipo});}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro ao carregar contagem."});}});
app.put("/api/feira/contagem",exigirAdmin,async(req,res)=>{try{if(!req.body.data)return res.status(400).json({sucesso:false,mensagem:"Informe a data."});await pool.query("UPDATE feira_config SET data_apresentacao=$1 WHERE id=1",[req.body.data]);res.json({sucesso:true});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao salvar data."});}});
app.get("/api/feira/status",exigirLogin,async(req,res)=>{try{const r=await pool.query("SELECT ativa FROM feira_config WHERE id=1");res.json({sucesso:true,ativa:r.rows[0]?.ativa??true});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao verificar EXPEC."});}});
app.put("/api/feira/status",exigirAdmin,async(req,res)=>{try{await pool.query("UPDATE feira_config SET ativa=$1 WHERE id=1",[!!req.body.ativa]);res.json({sucesso:true,ativa:!!req.body.ativa});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao alterar status."});}});
app.get("/api/feira/equipes",exigirLogin,async(req,res)=>{try{const r=await pool.query("SELECT id,nome,tema,professor,lider,integrantes FROM feira_equipes ORDER BY id ASC");res.json(r.rows);}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao buscar equipes."});}});
app.post("/api/feira/equipes",exigirAdmin,async(req,res)=>{try{const {nome,tema,professor,lider,integrantes}=req.body;if(!nome||!tema)return res.status(400).json({sucesso:false,mensagem:"Nome e tema são obrigatórios."});const r=await pool.query("INSERT INTO feira_equipes(nome,tema,professor,lider,integrantes) VALUES($1,$2,$3,$4,$5) RETURNING *",[nome,tema,professor||null,lider||null,integrantes||null]);res.json(r.rows[0]);}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro ao criar equipe."});}});
app.put("/api/feira/equipes/:id",exigirAdmin,async(req,res)=>{try{const {nome,tema,professor,lider,integrantes}=req.body;const r=await pool.query("UPDATE feira_equipes SET nome=$1,tema=$2,professor=$3,lider=$4,integrantes=$5 WHERE id=$6 RETURNING *",[nome,tema,professor||null,lider||null,integrantes||null,req.params.id]);if(!r.rows.length)return res.status(404).json({sucesso:false,mensagem:"Equipe não encontrada."});res.json(r.rows[0]);}catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:"Erro ao editar equipe."});}});
app.delete("/api/feira/equipes/:id",exigirAdmin,async(req,res)=>{try{await pool.query("DELETE FROM feira_equipes WHERE id=$1",[req.params.id]);res.json({sucesso:true});}catch(e){res.status(500).json({sucesso:false,mensagem:"Erro ao excluir equipe."});}});

async function iniciar(){await criarTabelas();app.listen(PORT,()=>console.log(`Servidor rodando na porta ${PORT}`));}
iniciar().catch(e=>{console.error("Erro ao iniciar:",e);process.exit(1);});

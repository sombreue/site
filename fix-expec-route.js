const fs = require("fs");

const path = "server.js";
let text = fs.readFileSync(path, "utf8");

const old = 'app.get("/expec.html", exigirLogin, async (req, res) => {';
const replacement = `app.get("/expec.html", async (req, res, next) => {
    if (!req.session.usuario) {
        return res.redirect("/login.html");
    }
    next();
}, exigirLogin, async (req, res) => {`;

if (text.includes(old)) {
    text = text.replace(old, replacement);
    console.log("Rota da EXPEC ajustada: usuários sem sessão serão enviados ao login.");
} else {
    console.log("Rota da EXPEC já está ajustada ou não foi encontrada.");
}

const marcadorSugestoes = "// =========================\n// SUGESTÕES DOS COLEGAS\n// =========================";

if (!text.includes(marcadorSugestoes)) {
    const rotasSugestoes = `

${marcadorSugestoes}

app.post("/api/sugestoes", exigirLogin, async (req, res) => {
    try {
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

        await pool.query(`
            CREATE TABLE IF NOT EXISTS sugestoes (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                sugestao TEXT NOT NULL,
                data TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

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

app.get("/api/sugestoes", exigirAdmin, async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sugestoes (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                sugestao TEXT NOT NULL,
                data TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

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

app.delete("/api/sugestoes/:id", exigirAdmin, async (req, res) => {
    try {
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
`;

    const marcadorServidor = "// =========================\n// INICIAR SERVIDOR\n// =========================";

    if (!text.includes(marcadorServidor)) {
        throw new Error("Não foi encontrado o ponto seguro para inserir as rotas de sugestões.");
    }

    text = text.replace(marcadorServidor, rotasSugestoes + "\n\n" + marcadorServidor);
    console.log("Rotas da API de sugestões adicionadas ao server.js.");
} else {
    console.log("Rotas da API de sugestões já estão presentes no server.js.");
}

fs.writeFileSync(path, text, "utf8");

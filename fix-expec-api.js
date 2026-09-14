const fs = require("fs");

const path = "server.js";
let text = fs.readFileSync(path, "utf8");

const marker = "// =========================\n// INICIALIZAÇÃO\n// =========================";

if (text.includes("// EXPEC - API COMPLETA") && text.includes('app.put("/api/feira/contagem"')) {
    console.log("API da EXPEC já está presente no server.js.");
    process.exit(0);
}

if (!text.includes(marker)) {
    throw new Error("Não foi encontrado o ponto seguro para inserir a API da EXPEC.");
}

const routes = `

// =========================
// EXPEC - API COMPLETA
// =========================

// Garantir que exista a configuração principal da EXPEC.
app.get("/api/feira/contagem", exigirLogin, async (req, res) => {
    try {
        await pool.query(\`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, '2026-09-13 08:00:00', true)
            ON CONFLICT (id) DO NOTHING
        \`);

        const resultado = await pool.query(\`
            SELECT data_apresentacao
            FROM feira_config
            WHERE id = 1
        \`);

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
        await pool.query(\`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, $1, true)
            ON CONFLICT (id)
            DO UPDATE SET data_apresentacao = EXCLUDED.data_apresentacao
        \`, [data]);

        const resultado = await pool.query(\`
            SELECT data_apresentacao
            FROM feira_config
            WHERE id = 1
        \`);

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
        await pool.query(\`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, '2026-09-13 08:00:00', true)
            ON CONFLICT (id) DO NOTHING
        \`);

        const resultado = await pool.query(\`
            SELECT ativa
            FROM feira_config
            WHERE id = 1
        \`);

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

        await pool.query(\`
            INSERT INTO feira_config (id, data_apresentacao, ativa)
            VALUES (1, '2026-09-13 08:00:00', $1)
            ON CONFLICT (id)
            DO UPDATE SET ativa = EXCLUDED.ativa
        \`, [req.body.ativa]);

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
        const resultado = await pool.query(\`
            SELECT id, nome, tema, professor, lider, integrantes
            FROM feira_equipes
            ORDER BY id ASC
        \`);
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
        const resultado = await pool.query(\`
            INSERT INTO feira_equipes (nome, tema, professor, lider, integrantes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        \`, [nome, tema, professor || "", lider || "", integrantes || ""]);
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
        const resultado = await pool.query(\`
            UPDATE feira_equipes
            SET nome = $1, tema = $2, professor = $3, lider = $4, integrantes = $5
            WHERE id = $6
            RETURNING *
        \`, [nome, tema, professor || "", lider || "", integrantes || "", id]);
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
        await pool.query(\`
            CREATE TABLE IF NOT EXISTS feira_decoracoes (
                id SERIAL PRIMARY KEY,
                descricao TEXT NOT NULL,
                preco NUMERIC(10,2) NOT NULL
            )
        \`);
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
        await pool.query(\`
            CREATE TABLE IF NOT EXISTS feira_decoracoes (
                id SERIAL PRIMARY KEY,
                descricao TEXT NOT NULL,
                preco NUMERIC(10,2) NOT NULL
            )
        \`);
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
`;

text = text.replace(marker, routes + "\n\n" + marker);
fs.writeFileSync(path, text, "utf8");
console.log("API da EXPEC adicionada ao server.js.");

module.exports = function instalarRotasTrabalhos(app, pool) {
    function exigirLogin(req, res, next) {
        if (!req.session?.usuario) {
            return res.status(401).json({ sucesso: false, mensagem: "Você precisa estar logado." });
        }
        next();
    }

    function exigirAdmin(req, res, next) {
        if (!req.session?.usuario) {
            return res.status(401).json({ sucesso: false, mensagem: "Você precisa estar logado." });
        }
        if (req.session.usuario.tipo !== "admin") {
            return res.status(403).json({ sucesso: false, mensagem: "Acesso permitido somente para administradores." });
        }
        next();
    }

    const tabelaPronta = pool.query(`
        CREATE TABLE IF NOT EXISTS trabalhos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            materia TEXT NOT NULL,
            prazo DATE,
            descricao TEXT NOT NULL DEFAULT '',
            vale_ponto BOOLEAN NOT NULL DEFAULT TRUE,
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    tabelaPronta.catch(e => console.error("Erro ao preparar tabela de trabalhos:", e));

    app.get("/api/trabalhos", exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const resultado = await pool.query(`
                SELECT id, titulo, materia,
                       TO_CHAR(prazo, 'YYYY-MM-DD') AS prazo,
                       descricao, vale_ponto
                FROM trabalhos
                ORDER BY prazo ASC NULLS LAST, id DESC
            `);
            res.json({ sucesso: true, trabalhos: resultado.rows });
        } catch (e) {
            console.error("Erro ao buscar trabalhos:", e);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar trabalhos." });
        }
    });

    app.post("/api/trabalhos", exigirAdmin, async (req, res) => {
        try {
            await tabelaPronta;
            const titulo = String(req.body.titulo || "").trim();
            const materia = String(req.body.materia || "").trim();
            const prazo = req.body.prazo ? String(req.body.prazo).slice(0, 10) : null;
            const descricao = String(req.body.descricao || "").trim();
            const valePonto = req.body.vale_ponto !== false;

            if (!titulo || !materia) {
                return res.status(400).json({ sucesso: false, mensagem: "Preencha título e matéria." });
            }
            if (titulo.length > 160 || materia.length > 80 || descricao.length > 1000) {
                return res.status(400).json({ sucesso: false, mensagem: "Um dos campos ultrapassou o limite permitido." });
            }

            const resultado = await pool.query(`
                INSERT INTO trabalhos (titulo, materia, prazo, descricao, vale_ponto)
                VALUES ($1, $2, $3::date, $4, $5)
                RETURNING id, titulo, materia, TO_CHAR(prazo, 'YYYY-MM-DD') AS prazo, descricao, vale_ponto
            `, [titulo, materia, prazo, descricao, valePonto]);
            res.status(201).json({ sucesso: true, trabalho: resultado.rows[0] });
        } catch (e) {
            console.error("Erro ao criar trabalho:", e);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao criar trabalho." });
        }
    });

    app.put("/api/trabalhos/:id", exigirAdmin, async (req, res) => {
        try {
            await tabelaPronta;
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({ sucesso: false, mensagem: "ID inválido." });
            }

            const titulo = String(req.body.titulo || "").trim();
            const materia = String(req.body.materia || "").trim();
            const prazo = req.body.prazo ? String(req.body.prazo).slice(0, 10) : null;
            const descricao = String(req.body.descricao || "").trim();
            const valePonto = req.body.vale_ponto !== false;

            if (!titulo || !materia) {
                return res.status(400).json({ sucesso: false, mensagem: "Preencha título e matéria." });
            }
            if (titulo.length > 160 || materia.length > 80 || descricao.length > 1000) {
                return res.status(400).json({ sucesso: false, mensagem: "Um dos campos ultrapassou o limite permitido." });
            }

            const resultado = await pool.query(`
                UPDATE trabalhos
                SET titulo = $1, materia = $2, prazo = $3::date, descricao = $4, vale_ponto = $5
                WHERE id = $6
                RETURNING id, titulo, materia, TO_CHAR(prazo, 'YYYY-MM-DD') AS prazo, descricao, vale_ponto
            `, [titulo, materia, prazo, descricao, valePonto, id]);

            if (!resultado.rows.length) {
                return res.status(404).json({ sucesso: false, mensagem: "Trabalho não encontrado." });
            }
            res.json({ sucesso: true, trabalho: resultado.rows[0] });
        } catch (e) {
            console.error("Erro ao editar trabalho:", e);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao editar trabalho." });
        }
    });

    app.delete("/api/trabalhos/:id", exigirAdmin, async (req, res) => {
        try {
            await tabelaPronta;
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({ sucesso: false, mensagem: "ID inválido." });
            }
            const resultado = await pool.query("DELETE FROM trabalhos WHERE id = $1", [id]);
            if (!resultado.rowCount) {
                return res.status(404).json({ sucesso: false, mensagem: "Trabalho não encontrado." });
            }
            res.json({ sucesso: true, mensagem: "Trabalho excluído com sucesso." });
        } catch (e) {
            console.error("Erro ao excluir trabalho:", e);
            res.status(500).json({ sucesso: false, mensagem: "Erro ao excluir trabalho." });
        }
    });

    console.log("API de trabalhos instalada.");
};

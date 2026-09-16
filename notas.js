module.exports = function registrarNotas(app, pool, exigirLogin) {
    let tabelaPronta = pool.query(`
        CREATE TABLE IF NOT EXISTS notas_escolares (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL,
            materia TEXT NOT NULL,
            periodo TEXT NOT NULL DEFAULT '1º bimestre',
            nota NUMERIC(5,2) NOT NULL CHECK (nota >= 0 AND nota <= 10),
            descricao TEXT NOT NULL DEFAULT '',
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `).then(async () => {
        await pool.query(`ALTER TABLE notas_escolares DROP COLUMN IF EXISTS peso;`);
    });

    app.get('/api/notas', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const r = await pool.query(`
                SELECT id, materia, periodo, nota, descricao, criado_em
                FROM notas_escolares
                WHERE usuario_id = $1
                ORDER BY materia ASC, CASE periodo
                    WHEN '1º bimestre' THEN 1
                    WHEN '2º bimestre' THEN 2
                    WHEN '3º bimestre' THEN 3
                    WHEN '4º bimestre' THEN 4
                    ELSE 5 END, id DESC
            `, [req.session.usuario.id]);
            res.json({ sucesso: true, notas: r.rows });
        } catch (e) {
            console.error(e);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });

    app.post('/api/notas', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const materia = String(req.body.materia || '').trim();
            const periodo = String(req.body.periodo || '1º bimestre').trim();
            const nota = Number(req.body.nota);
            const descricao = String(req.body.descricao || '').trim();

            if (!materia) return res.status(400).json({ sucesso: false, mensagem: 'Informe a matéria.' });
            if (materia.length > 80 || descricao.length > 1000) return res.status(400).json({ sucesso: false, mensagem: 'Algum campo ultrapassou o limite permitido.' });
            if (!Number.isFinite(nota) || nota < 0 || nota > 10) return res.status(400).json({ sucesso: false, mensagem: 'A nota deve estar entre 0 e 10.' });

            const r = await pool.query(`
                INSERT INTO notas_escolares(usuario_id, materia, periodo, nota, descricao)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [req.session.usuario.id, materia, periodo, nota, descricao]);
            res.status(201).json({ sucesso: true, nota: r.rows[0] });
        } catch (e) {
            console.error(e);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });

    app.put('/api/notas/:id', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const id = Number(req.params.id);
            const materia = String(req.body.materia || '').trim();
            const periodo = String(req.body.periodo || '1º bimestre').trim();
            const nota = Number(req.body.nota);
            const descricao = String(req.body.descricao || '').trim();

            if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ sucesso: false, mensagem: 'ID inválido.' });
            if (!materia) return res.status(400).json({ sucesso: false, mensagem: 'Informe a matéria.' });
            if (!Number.isFinite(nota) || nota < 0 || nota > 10) return res.status(400).json({ sucesso: false, mensagem: 'A nota deve estar entre 0 e 10.' });

            const r = await pool.query(`
                UPDATE notas_escolares
                SET materia=$1, periodo=$2, nota=$3, descricao=$4
                WHERE id=$5 AND usuario_id=$6
                RETURNING *
            `, [materia, periodo, nota, descricao, id, req.session.usuario.id]);
            if (!r.rows.length) return res.status(404).json({ sucesso: false, mensagem: 'Nota não encontrada.' });
            res.json({ sucesso: true, nota: r.rows[0] });
        } catch (e) {
            console.error(e);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });

    app.delete('/api/notas/:id', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const id = Number(req.params.id);
            const r = await pool.query(`DELETE FROM notas_escolares WHERE id=$1 AND usuario_id=$2`, [id, req.session.usuario.id]);
            if (!r.rowCount) return res.status(404).json({ sucesso: false, mensagem: 'Nota não encontrada.' });
            res.json({ sucesso: true });
        } catch (e) {
            console.error(e);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });
};

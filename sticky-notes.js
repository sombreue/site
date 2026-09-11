const criarTabelaNotas = async pool => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS notas_pessoais (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL,
            titulo TEXT NOT NULL DEFAULT '',
            conteudo TEXT NOT NULL DEFAULT '',
            cor TEXT NOT NULL DEFAULT 'amarela',
            fixada BOOLEAN NOT NULL DEFAULT false,
            criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            atualizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    // A tabela pode já existir por uma versão anterior do sistema.
    // Garante que todas as colunas usadas pelas Sticky Notes estejam presentes.
    await pool.query(`
        ALTER TABLE notas_pessoais ADD COLUMN IF NOT EXISTS titulo TEXT NOT NULL DEFAULT '';
        ALTER TABLE notas_pessoais ADD COLUMN IF NOT EXISTS conteudo TEXT NOT NULL DEFAULT '';
        ALTER TABLE notas_pessoais ADD COLUMN IF NOT EXISTS cor TEXT NOT NULL DEFAULT 'amarela';
        ALTER TABLE notas_pessoais ADD COLUMN IF NOT EXISTS fixada BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE notas_pessoais ADD COLUMN IF NOT EXISTS criada_em TIMESTAMPTZ NOT NULL DEFAULT NOW();
        ALTER TABLE notas_pessoais ADD COLUMN IF NOT EXISTS atualizada_em TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
};

function registrarNotasPessoais(app, pool, exigirLogin) {
    const bancoPronto = criarTabelaNotas(pool);

    app.get('/api/notas-pessoais', exigirLogin, async (req, res) => {
        try {
            await bancoPronto;
            const resultado = await pool.query(`
                SELECT id, titulo, conteudo, cor, fixada, criada_em, atualizada_em
                FROM notas_pessoais
                WHERE usuario_id = $1
                ORDER BY fixada DESC, atualizada_em DESC, id DESC
            `, [req.session.usuario.id]);
            res.json({ sucesso: true, notas: resultado.rows });
        } catch (erro) {
            console.error('Erro ao listar notas pessoais:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });

    app.post('/api/notas-pessoais', exigirLogin, async (req, res) => {
        try {
            await bancoPronto;
            const { titulo = '', conteudo = '', cor = 'amarela', fixada = false } = req.body;
            const cores = ['amarela', 'azul', 'verde', 'rosa', 'roxa', 'laranja'];
            if (!cores.includes(cor)) return res.status(400).json({ sucesso: false, mensagem: 'Cor inválida.' });
            if (!String(titulo).trim() && !String(conteudo).trim()) return res.status(400).json({ sucesso: false, mensagem: 'A nota não pode estar vazia.' });
            const resultado = await pool.query(`
                INSERT INTO notas_pessoais (usuario_id, titulo, conteudo, cor, fixada)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, titulo, conteudo, cor, fixada, criada_em, atualizada_em
            `, [req.session.usuario.id, String(titulo).trim(), String(conteudo), cor, Boolean(fixada)]);
            res.json({ sucesso: true, nota: resultado.rows[0] });
        } catch (erro) {
            console.error('Erro ao criar nota pessoal:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });

    app.put('/api/notas-pessoais/:id', exigirLogin, async (req, res) => {
        try {
            await bancoPronto;
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ sucesso: false, mensagem: 'ID inválido.' });
            const { titulo = '', conteudo = '', cor = 'amarela', fixada = false } = req.body;
            const cores = ['amarela', 'azul', 'verde', 'rosa', 'roxa', 'laranja'];
            if (!cores.includes(cor)) return res.status(400).json({ sucesso: false, mensagem: 'Cor inválida.' });
            if (!String(titulo).trim() && !String(conteudo).trim()) return res.status(400).json({ sucesso: false, mensagem: 'A nota não pode estar vazia.' });
            const resultado = await pool.query(`
                UPDATE notas_pessoais
                SET titulo = $1, conteudo = $2, cor = $3, fixada = $4, atualizada_em = NOW()
                WHERE id = $5 AND usuario_id = $6
                RETURNING id, titulo, conteudo, cor, fixada, criada_em, atualizada_em
            `, [String(titulo).trim(), String(conteudo), cor, Boolean(fixada), id, req.session.usuario.id]);
            if (!resultado.rows.length) return res.status(404).json({ sucesso: false, mensagem: 'Nota não encontrada.' });
            res.json({ sucesso: true, nota: resultado.rows[0] });
        } catch (erro) {
            console.error('Erro ao editar nota pessoal:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });

    app.delete('/api/notas-pessoais/:id', exigirLogin, async (req, res) => {
        try {
            await bancoPronto;
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ sucesso: false, mensagem: 'ID inválido.' });
            const resultado = await pool.query(`DELETE FROM notas_pessoais WHERE id = $1 AND usuario_id = $2`, [id, req.session.usuario.id]);
            if (!resultado.rowCount) return res.status(404).json({ sucesso: false, mensagem: 'Nota não encontrada.' });
            res.json({ sucesso: true });
        } catch (erro) {
            console.error('Erro ao excluir nota pessoal:', erro);
            res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
        }
    });
}

module.exports = registrarNotasPessoais;

module.exports = function registrarTarefasPessoais(app, pool, exigirLogin) {
    let tabelaPronta = pool.query(`
        CREATE TABLE IF NOT EXISTS tarefas_pessoais (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            titulo TEXT NOT NULL,
            materia TEXT NOT NULL DEFAULT '',
            prazo TEXT,
            data_planejada TEXT,
            prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta')),
            status TEXT NOT NULL DEFAULT 'a-fazer' CHECK (status IN ('a-fazer','em-andamento','concluida')),
            descricao TEXT NOT NULL DEFAULT '',
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    app.get('/api/tarefas-pessoais', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const r = await pool.query(`
                SELECT id,titulo,materia,prazo,data_planejada,prioridade,status,descricao,criado_em
                FROM tarefas_pessoais
                WHERE usuario_id=$1
                ORDER BY CASE WHEN data_planejada IS NULL OR data_planejada='' THEN 1 ELSE 0 END,
                         data_planejada ASC, prazo ASC NULLS LAST, id DESC
            `, [req.session.usuario.id]);
            res.json({ sucesso:true, tarefas:r.rows });
        } catch (e) { console.error(e); res.status(500).json({ sucesso:false, mensagem:'Erro interno do servidor.' }); }
    });

    app.post('/api/tarefas-pessoais', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const titulo=String(req.body.titulo||'').trim();
            const materia=String(req.body.materia||'').trim();
            const prazo=String(req.body.prazo||'').trim();
            const planejada=String(req.body.data_planejada||'').trim();
            const prioridade=String(req.body.prioridade||'media');
            const status=String(req.body.status||'a-fazer');
            const descricao=String(req.body.descricao||'');
            if(!titulo) return res.status(400).json({sucesso:false,mensagem:'Dê um título para a tarefa.'});
            if(titulo.length>160||materia.length>80||descricao.length>10000) return res.status(400).json({sucesso:false,mensagem:'Algum campo ultrapassou o limite permitido.'});
            if(!['baixa','media','alta'].includes(prioridade)||!['a-fazer','em-andamento','concluida'].includes(status)) return res.status(400).json({sucesso:false,mensagem:'Prioridade ou status inválido.'});
            const r=await pool.query(`INSERT INTO tarefas_pessoais(usuario_id,titulo,materia,prazo,data_planejada,prioridade,status,descricao) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[req.session.usuario.id,titulo,materia,prazo||null,planejada||null,prioridade,status,descricao]);
            res.status(201).json({sucesso:true,tarefa:r.rows[0]});
        } catch(e) { console.error(e); res.status(500).json({sucesso:false,mensagem:'Erro interno do servidor.'}); }
    });

    app.put('/api/tarefas-pessoais/:id', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const id=Number(req.params.id); if(!Number.isInteger(id)||id<=0) return res.status(400).json({sucesso:false,mensagem:'ID inválido.'});
            const titulo=String(req.body.titulo||'').trim(), materia=String(req.body.materia||'').trim(), prazo=String(req.body.prazo||'').trim(), planejada=String(req.body.data_planejada||'').trim(), prioridade=String(req.body.prioridade||'media'), status=String(req.body.status||'a-fazer'), descricao=String(req.body.descricao||'');
            if(!titulo) return res.status(400).json({sucesso:false,mensagem:'Dê um título para a tarefa.'});
            if(!['baixa','media','alta'].includes(prioridade)||!['a-fazer','em-andamento','concluida'].includes(status)) return res.status(400).json({sucesso:false,mensagem:'Prioridade ou status inválido.'});
            const r=await pool.query(`UPDATE tarefas_pessoais SET titulo=$1,materia=$2,prazo=$3,data_planejada=$4,prioridade=$5,status=$6,descricao=$7 WHERE id=$8 AND usuario_id=$9 RETURNING *`,[titulo,materia,prazo||null,planejada||null,prioridade,status,descricao,id,req.session.usuario.id]);
            if(!r.rows.length) return res.status(404).json({sucesso:false,mensagem:'Tarefa não encontrada.'});
            res.json({sucesso:true,tarefa:r.rows[0]});
        } catch(e) { console.error(e); res.status(500).json({sucesso:false,mensagem:'Erro interno do servidor.'}); }
    });

    app.delete('/api/tarefas-pessoais/:id', exigirLogin, async (req, res) => {
        try { await tabelaPronta; const id=Number(req.params.id); const r=await pool.query(`DELETE FROM tarefas_pessoais WHERE id=$1 AND usuario_id=$2`,[id,req.session.usuario.id]); if(!r.rowCount)return res.status(404).json({sucesso:false,mensagem:'Tarefa não encontrada.'}); res.json({sucesso:true}); }
        catch(e) { console.error(e); res.status(500).json({sucesso:false,mensagem:'Erro interno do servidor.'}); }
    });
};

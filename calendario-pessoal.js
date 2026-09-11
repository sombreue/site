module.exports = function registrarCalendarioPessoal(app, pool, exigirLogin) {
    const tabelaPronta = pool.query(`
        CREATE TABLE IF NOT EXISTS eventos_calendario (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            descricao TEXT NOT NULL DEFAULT '',
            data TEXT NOT NULL,
            hora_inicio TEXT,
            hora_fim TEXT,
            categoria TEXT NOT NULL DEFAULT 'pessoal' CHECK (categoria IN ('pessoal','estudo','lembrete')),
            criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    app.get('/api/calendario-pessoal', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const r = await pool.query(`SELECT id,titulo,descricao,data,hora_inicio,hora_fim,categoria,criado_em,atualizado_em FROM eventos_calendario WHERE usuario_id=$1 ORDER BY data ASC, hora_inicio ASC NULLS LAST, id DESC`, [req.session.usuario.id]);
            res.json({ sucesso: true, eventos: r.rows });
        } catch (e) { console.error(e); res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' }); }
    });

    app.post('/api/calendario-pessoal', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const titulo=String(req.body.titulo||'').trim(), descricao=String(req.body.descricao||''), data=String(req.body.data||'').trim(), inicio=String(req.body.hora_inicio||'').trim(), fim=String(req.body.hora_fim||'').trim(), categoria=String(req.body.categoria||'pessoal');
            if (!titulo || !data) return res.status(400).json({sucesso:false,mensagem:'Informe o título e a data.'});
            if (titulo.length>160 || descricao.length>10000) return res.status(400).json({sucesso:false,mensagem:'Algum campo ultrapassou o limite permitido.'});
            if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || (inicio && !/^\d{2}:\d{2}$/.test(inicio)) || (fim && !/^\d{2}:\d{2}$/.test(fim))) return res.status(400).json({sucesso:false,mensagem:'Data ou horário inválido.'});
            if (!['pessoal','estudo','lembrete'].includes(categoria)) return res.status(400).json({sucesso:false,mensagem:'Categoria inválida.'});
            if (inicio && fim && fim < inicio) return res.status(400).json({sucesso:false,mensagem:'O horário final não pode ser antes do inicial.'});
            const r=await pool.query(`INSERT INTO eventos_calendario(usuario_id,titulo,descricao,data,hora_inicio,hora_fim,categoria) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[req.session.usuario.id,titulo,descricao,data,inicio||null,fim||null,categoria]);
            res.status(201).json({sucesso:true,evento:r.rows[0]});
        } catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:'Erro interno do servidor.'});}
    });

    app.put('/api/calendario-pessoal/:id', exigirLogin, async (req, res) => {
        try {
            await tabelaPronta;
            const id=Number(req.params.id); if(!Number.isInteger(id)||id<=0)return res.status(400).json({sucesso:false,mensagem:'ID inválido.'});
            const titulo=String(req.body.titulo||'').trim(), descricao=String(req.body.descricao||''), data=String(req.body.data||'').trim(), inicio=String(req.body.hora_inicio||'').trim(), fim=String(req.body.hora_fim||'').trim(), categoria=String(req.body.categoria||'pessoal');
            if(!titulo||!data)return res.status(400).json({sucesso:false,mensagem:'Informe o título e a data.'});
            if(!/^\d{4}-\d{2}-\d{2}$/.test(data)||(inicio&&!/^\d{2}:\d{2}$/.test(inicio))||(fim&&!/^\d{2}:\d{2}$/.test(fim)))return res.status(400).json({sucesso:false,mensagem:'Data ou horário inválido.'});
            if(!['pessoal','estudo','lembrete'].includes(categoria))return res.status(400).json({sucesso:false,mensagem:'Categoria inválida.'});
            if(inicio&&fim&&fim<inicio)return res.status(400).json({sucesso:false,mensagem:'O horário final não pode ser antes do inicial.'});
            const r=await pool.query(`UPDATE eventos_calendario SET titulo=$1,descricao=$2,data=$3,hora_inicio=$4,hora_fim=$5,categoria=$6,atualizado_em=NOW() WHERE id=$7 AND usuario_id=$8 RETURNING *`,[titulo,descricao,data,inicio||null,fim||null,categoria,id,req.session.usuario.id]);
            if(!r.rows.length)return res.status(404).json({sucesso:false,mensagem:'Evento não encontrado.'});
            res.json({sucesso:true,evento:r.rows[0]});
        }catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:'Erro interno do servidor.'});}
    });

    app.delete('/api/calendario-pessoal/:id', exigirLogin, async (req,res)=>{
        try{await tabelaPronta;const id=Number(req.params.id);const r=await pool.query(`DELETE FROM eventos_calendario WHERE id=$1 AND usuario_id=$2`,[id,req.session.usuario.id]);if(!r.rowCount)return res.status(404).json({sucesso:false,mensagem:'Evento não encontrado.'});res.json({sucesso:true});}
        catch(e){console.error(e);res.status(500).json({sucesso:false,mensagem:'Erro interno do servidor.'});}
    });
};

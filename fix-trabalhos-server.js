const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, 'server.js');
const marcador = '// === TRABALHOS API INJETADA ===';

if (!fs.existsSync(arquivo)) {
    console.error('server.js não encontrado.');
    process.exit(1);
}

let codigo = fs.readFileSync(arquivo, 'utf8');

if (codigo.includes(marcador)) {
    console.log('API de trabalhos já está presente no server.js.');
    process.exit(0);
}

const bloco = `
${marcador}
async function prepararTrabalhos() {
    await pool.query(\`
        CREATE TABLE IF NOT EXISTS trabalhos (
            id SERIAL PRIMARY KEY,
            titulo TEXT NOT NULL,
            materia TEXT NOT NULL,
            prazo TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pendente',
            descricao TEXT NOT NULL DEFAULT ''
        );
    \`);
}

const tabelaTrabalhosPronta = prepararTrabalhos();
tabelaTrabalhosPronta.catch(erro => console.error('Erro ao preparar tabela de trabalhos:', erro));

app.get('/api/trabalhos', exigirLogin, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const resultado = await pool.query(\`
            SELECT id, titulo, materia, prazo, status, descricao
            FROM trabalhos
            ORDER BY prazo ASC, id ASC
        \`);
        res.json({ sucesso: true, trabalhos: resultado.rows });
    } catch (erro) {
        console.error('Erro ao carregar trabalhos:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
    }
});

app.post('/api/trabalhos', exigirAdmin, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const titulo = String(req.body.titulo || '').trim();
        const materia = String(req.body.materia || '').trim();
        const prazo = String(req.body.prazo || '').trim();
        const status = String(req.body.status || 'pendente').trim();
        const descricao = String(req.body.descricao || '').trim();
        const permitidos = ['pendente', 'em-andamento', 'concluido'];

        if (!titulo || !materia || !prazo) {
            return res.status(400).json({ sucesso: false, mensagem: 'Título, matéria e prazo são obrigatórios.' });
        }
        if (!permitidos.includes(status)) {
            return res.status(400).json({ sucesso: false, mensagem: 'Status inválido.' });
        }

        const resultado = await pool.query(\`
            INSERT INTO trabalhos (titulo, materia, prazo, status, descricao)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        \`, [titulo, materia, prazo, status, descricao]);

        res.status(201).json({ sucesso: true, trabalho: resultado.rows[0] });
    } catch (erro) {
        console.error('Erro ao criar trabalho:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
    }
});

app.put('/api/trabalhos/:id', exigirAdmin, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const id = Number(req.params.id);
        const titulo = String(req.body.titulo || '').trim();
        const materia = String(req.body.materia || '').trim();
        const prazo = String(req.body.prazo || '').trim();
        const status = String(req.body.status || 'pendente').trim();
        const descricao = String(req.body.descricao || '').trim();
        const permitidos = ['pendente', 'em-andamento', 'concluido'];

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ sucesso: false, mensagem: 'ID inválido.' });
        }
        if (!titulo || !materia || !prazo || !permitidos.includes(status)) {
            return res.status(400).json({ sucesso: false, mensagem: 'Preencha os campos corretamente.' });
        }

        const resultado = await pool.query(\`
            UPDATE trabalhos
            SET titulo = $1, materia = $2, prazo = $3, status = $4, descricao = $5
            WHERE id = $6
            RETURNING *
        \`, [titulo, materia, prazo, status, descricao, id]);

        if (!resultado.rows.length) {
            return res.status(404).json({ sucesso: false, mensagem: 'Trabalho não encontrado.' });
        }
        res.json({ sucesso: true, trabalho: resultado.rows[0] });
    } catch (erro) {
        console.error('Erro ao editar trabalho:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
    }
});

app.delete('/api/trabalhos/:id', exigirAdmin, async (req, res) => {
    try {
        await tabelaTrabalhosPronta;
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ sucesso: false, mensagem: 'ID inválido.' });
        }

        const resultado = await pool.query('DELETE FROM trabalhos WHERE id = $1', [id]);
        if (!resultado.rowCount) {
            return res.status(404).json({ sucesso: false, mensagem: 'Trabalho não encontrado.' });
        }
        res.json({ sucesso: true, mensagem: 'Trabalho excluído com sucesso.' });
    } catch (erro) {
        console.error('Erro ao excluir trabalho:', erro);
        res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
    }
});
`;

const alvo = '// =========================\n// ROTA DE TESTE';

if (!codigo.includes(alvo)) {
    console.error('Ponto de inserção não encontrado no server.js.');
    process.exit(1);
}

codigo = codigo.replace(alvo, bloco + '\n\n' + alvo);
fs.writeFileSync(arquivo, codigo, 'utf8');
console.log('API de trabalhos adicionada ao server.js durante o build.');

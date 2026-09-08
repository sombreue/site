const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, 'server.js');
const marcador = '// === PROTECAO DE PAGINAS E SESSAO INJETADA ===';

if (!fs.existsSync(arquivo)) {
    console.error('server.js não encontrado.');
    process.exit(1);
}

let codigo = fs.readFileSync(arquivo, 'utf8');

if (codigo.includes(marcador)) {
    console.log('Proteção de páginas e rota de sessão já está presente no server.js.');
    process.exit(0);
}

const bloco = `
${marcador}
// Qualquer página HTML, exceto o login, exige uma sessão válida.
app.use((req, res, next) => {
    const caminho = req.path || '';
    const ehPaginaHtml = caminho.toLowerCase().endsWith('.html');
    const ehLogin = caminho === '/login.html';

    if (ehPaginaHtml && !ehLogin && !req.session?.usuario) {
        return res.redirect('/login.html');
    }

    next();
});

// Usado pelas páginas para descobrir se há usuário logado e se ele é administrador.
app.get('/api/sessao', (req, res) => {
    if (!req.session?.usuario) {
        return res.json({ logado: false });
    }

    res.json({
        sucesso: true,
        logado: true,
        usuario: req.session.usuario.usuario,
        tipo: req.session.usuario.tipo
    });
});
`;

const alvo = 'app.use(express.static("public", {\n    index: false\n}));';

if (!codigo.includes(alvo)) {
    console.error('Ponto de inserção da proteção não encontrado no server.js.');
    process.exit(1);
}

codigo = codigo.replace(alvo, bloco + '\n' + alvo);
fs.writeFileSync(arquivo, codigo, 'utf8');
console.log('Proteção de páginas e rota /api/sessao adicionadas ao server.js durante o build.');

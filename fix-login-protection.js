const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
const marker = '// === PROTECAO DE PAGINAS INJETADA ===';
const alvo = 'app.use(express.static("public", {\n    index: false\n}));';

if (!fs.existsSync(serverPath)) {
    console.error('server.js não encontrado.');
    process.exit(1);
}

let codigo = fs.readFileSync(serverPath, 'utf8');

if (codigo.includes(marker)) {
    // A proteção já foi instalada em um build anterior. Garante que a rota
    // /api/sessao também exista para as páginas que precisam identificar o admin.
    if (!codigo.includes("app.get('/api/sessao'")) {
        const sessao = `
// Retorna a sessão atual para o frontend, sem expor a senha.
app.get('/api/sessao', (req, res) => {
    if (!req.session?.usuario) {
        return res.json({ sucesso: true, logado: false });
    }

    res.json({
        sucesso: true,
        logado: true,
        usuario: req.session.usuario.usuario,
        tipo: req.session.usuario.tipo
    });
});
`;
        codigo = codigo.replace(marker, `${marker}\n${sessao}`);
        fs.writeFileSync(serverPath, codigo, 'utf8');
        console.log('Rota /api/sessao adicionada ao server.js.');
    } else {
        console.log('Proteção de páginas e rota /api/sessao já estão presentes no server.js.');
    }
    process.exit(0);
}

const bloco = `${marker}
// Todas as páginas HTML, exceto o login, exigem sessão autenticada.
// Os arquivos CSS/JS/imagens continuam públicos para que a tela de login funcione.
app.use((req, res, next) => {
    const ehPaginaHtml = req.path.toLowerCase().endsWith('.html');
    const ehLogin = req.path === '/login.html';

    if (ehPaginaHtml && !ehLogin && !req.session?.usuario) {
        return res.redirect('/login.html');
    }

    next();
});

// Retorna a sessão atual para o frontend, sem expor a senha.
app.get('/api/sessao', (req, res) => {
    if (!req.session?.usuario) {
        return res.json({ sucesso: true, logado: false });
    }

    res.json({
        sucesso: true,
        logado: true,
        usuario: req.session.usuario.usuario,
        tipo: req.session.usuario.tipo
    });
});
`;

if (!codigo.includes(alvo)) {
    console.error('Ponto de inserção da proteção não encontrado no server.js.');
    process.exit(1);
}

codigo = codigo.replace(alvo, `${bloco}\n${alvo}`);
fs.writeFileSync(serverPath, codigo, 'utf8');
console.log('Proteção de login e rota /api/sessao adicionadas ao server.js durante o build.');

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
    console.log('Proteção de páginas já está presente no server.js.');
    process.exit(0);
}

const bloco = `${marker}
// Todas as páginas HTML, exceto o login, exigem sessão autenticada.
// Os arquivos CSS/JS/imagens continuam públicos para que a tela de login funcione.
app.use((req, res, next) => {
    const ehPaginaHtml = req.path.toLowerCase().endsWith('.html');
    const ehLogin = req.path === '/login.html';

    if (ehPaginaHtml && !ehLogin && !req.session.usuario) {
        return res.redirect('/login.html');
    }

    next();
});
`;

if (!codigo.includes(alvo)) {
    console.error('Ponto de inserção da proteção não encontrado no server.js.');
    process.exit(1);
}

codigo = codigo.replace(alvo, `${bloco}\n${alvo}`);
fs.writeFileSync(serverPath, codigo, 'utf8');
console.log('Proteção de login adicionada ao server.js durante o build.');

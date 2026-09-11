const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, 'server.js');
const marcador = 'require("./notas")(app, pool, exigirLogin);';

if (!fs.existsSync(arquivo)) process.exit(0);

let conteudo = fs.readFileSync(arquivo, 'utf8');

if (conteudo.includes(marcador)) {
    process.exit(0);
}

// As outras correções do projeto podem alterar a estrutura do server.js.
// Não dependa de um formato específico de app.listen: basta registrar
// o módulo antes de o arquivo terminar de ser carregado.
conteudo = `${conteudo.trimEnd()}\n\n// BACKEND DE NOTAS\n${marcador}\n`;

fs.writeFileSync(arquivo, conteudo);
console.log('Backend de notas registrado no server.js.');

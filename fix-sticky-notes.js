const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, 'server.js');
const marcador = 'require("./sticky-notes")(app, pool, exigirLogin);';

if (!fs.existsSync(arquivo)) process.exit(0);
let conteudo = fs.readFileSync(arquivo, 'utf8');
if (conteudo.includes(marcador)) process.exit(0);
conteudo = `${conteudo.trimEnd()}\n\n// NOTAS PESSOAIS\n${marcador}\n`;
fs.writeFileSync(arquivo, conteudo);
console.log('Backend de notas pessoais registrado no server.js.');

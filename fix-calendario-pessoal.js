const fs = require('fs');
const arquivo = 'server.js';
if (!fs.existsSync(arquivo)) process.exit(0);
let conteudo = fs.readFileSync(arquivo, 'utf8');
const marcador = 'require("./calendario-pessoal")(app, pool, exigirLogin);';
if (conteudo.includes(marcador)) process.exit(0);
conteudo = `${conteudo.trimEnd()}\n\n// BACKEND DO CALENDÁRIO PESSOAL\n${marcador}\n`;
fs.writeFileSync(arquivo, conteudo);
console.log('Calendário pessoal registrado no server.js.');

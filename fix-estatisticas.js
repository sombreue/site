const fs = require('fs');
const arquivo = 'server.js';
if (!fs.existsSync(arquivo)) process.exit(0);
let conteudo = fs.readFileSync(arquivo, 'utf8');
const marcador = 'require("./estatisticas")(app, pool, exigirLogin);';
if (!conteudo.includes(marcador)) {
  conteudo = `${conteudo.trimEnd()}\n\n// BACKEND DE ESTATÍSTICAS\n${marcador}\n`;
  fs.writeFileSync(arquivo, conteudo);
}

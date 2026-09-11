const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, 'server.js');
const marcador = "require(\"./notas\")(app, pool, exigirLogin);";

if (!fs.existsSync(arquivo)) process.exit(0);

let conteudo = fs.readFileSync(arquivo, 'utf8');
if (conteudo.includes(marcador)) process.exit(0);

const alvo = 'app.listen(PORT, () => {';
if (!conteudo.includes(alvo)) {
    console.error('Não foi possível encontrar app.listen em server.js.');
    process.exit(1);
}

conteudo = conteudo.replace(alvo, `${marcador}\n\n${alvo}`);
fs.writeFileSync(arquivo, conteudo);
console.log('Backend de notas registrado no server.js.');

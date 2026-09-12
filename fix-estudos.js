const fs=require('fs');
const arquivo='server.js';
if(!fs.existsSync(arquivo))process.exit(0);
let conteudo=fs.readFileSync(arquivo,'utf8');
const marcador='require("./estudos")(app, pool, exigirLogin);';
if(!conteudo.includes(marcador)){conteudo=`${conteudo.trimEnd()}\n\n// BACKEND DE ESTUDOS\n${marcador}\n`;fs.writeFileSync(arquivo,conteudo)}

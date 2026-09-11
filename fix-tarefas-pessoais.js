const fs = require('fs');
const path = require('path');
const arquivo = path.join(__dirname, 'server.js');
let conteudo = fs.readFileSync(arquivo, 'utf8');
const marcador = 'require("./tarefas-pessoais")(app, pool, exigirLogin);';
if (!conteudo.includes(marcador)) {
    const alvo = 'app.listen(PORT, () => {';
    if (conteudo.includes(alvo)) {
        conteudo = conteudo.replace(alvo, marcador + '\n\n' + alvo);
    } else if (conteudo.includes('app.listen(PORT,()=>')) {
        conteudo = conteudo.replace('app.listen(PORT,()=>', marcador + '\n\napp.listen(PORT,()=>');
    } else {
        conteudo += '\n' + marcador + '\n';
    }
    fs.writeFileSync(arquivo, conteudo);
    console.log('Rotas de tarefas pessoais adicionadas ao server.js.');
}

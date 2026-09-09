const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, 'public', 'agenda.html');
const antigo = 'onchange="mostrarMateriasDoDia"';
const novo = 'onchange="mostrarMateriasDoDia()"';

if (!fs.existsSync(arquivo)) {
    console.error('public/agenda.html não encontrado.');
    process.exit(1);
}

let codigo = fs.readFileSync(arquivo, 'utf8');

if (codigo.includes(antigo)) {
    codigo = codigo.replace(antigo, novo);
    fs.writeFileSync(arquivo, codigo, 'utf8');
    console.log('Correção do formulário de tarefas aplicada.');
} else {
    console.log('Formulário de tarefas já está corrigido.');
}

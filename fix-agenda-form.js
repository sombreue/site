const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, 'public', 'agenda.html');
const antigo = 'onchange="mostrarMateriasDoDia"';
const novo = 'onchange="mostrarMateriasDoDia()"';
const marcadorFiltro = '<!-- FILTRO DE DATA DA AGENDA CORRIGIDO -->';

if (!fs.existsSync(arquivo)) {
    console.error('public/agenda.html não encontrado.');
    process.exit(1);
}

let codigo = fs.readFileSync(arquivo, 'utf8');

if (codigo.includes(antigo)) {
    codigo = codigo.replace(antigo, novo);
}

if (!codigo.includes(marcadorFiltro)) {
    const correcaoFiltro = `
${marcadorFiltro}
<script>
(function () {
    function filtrarAgendaPorDataCorrigido() {
        const campo = document.getElementById('data');
        const lista = document.getElementById('lista-tarefas');
        if (!campo || !lista) return;

        const dataSelecionada = campo.value;
        const dias = Array.from(lista.querySelectorAll('.dia'));
        const mensagemAnterior = document.getElementById('mensagem-sem-tarefas-data');
        if (mensagemAnterior) mensagemAnterior.remove();

        if (!dataSelecionada) {
            dias.forEach(dia => { dia.style.display = ''; });
            return;
        }

        let encontrou = false;
        dias.forEach(dia => {
            const corresponde = dia.dataset.data === dataSelecionada;
            dia.style.display = corresponde ? '' : 'none';
            if (corresponde) encontrou = true;
        });

        if (!encontrou) {
            const mensagem = document.createElement('p');
            mensagem.id = 'mensagem-sem-tarefas-data';
            mensagem.textContent = 'Não existem tarefas para esse dia.';
            lista.appendChild(mensagem);
        }
    }

    window.filtrarPorData = filtrarAgendaPorDataCorrigido;

    window.limparFiltro = function () {
        const campo = document.getElementById('data');
        if (campo) campo.value = '';
        filtrarAgendaPorDataCorrigido();
    };
})();
</script>
`;

    codigo = codigo.replace('</body>', correcaoFiltro + '\n</body>');
}

fs.writeFileSync(arquivo, codigo, 'utf8');
console.log('Correções do formulário e do filtro da agenda aplicadas.');

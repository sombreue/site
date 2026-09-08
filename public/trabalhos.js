const trabalhos = [
    { titulo: "Exemplo de trabalho", materia: "Organizar", prazo: "2026-12-31", status: "pendente", descricao: "Este cartão é um modelo. Depois podemos ligar esta página ao painel administrativo e ao banco de dados." }
];

const lista = document.getElementById('listaTrabalhos');
const busca = document.getElementById('busca');
const filtroMateria = document.getElementById('filtroMateria');
const filtroStatus = document.getElementById('filtroStatus');

function formatarData(data){
    if(!data) return 'Sem prazo';
    return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function normalizarStatus(status){
    return status || 'pendente';
}

function renderizar(){
    const termo = busca.value.trim().toLowerCase();
    const materia = filtroMateria.value;
    const status = filtroStatus.value;
    const filtrados = trabalhos.filter(t => {
        const texto = `${t.titulo} ${t.materia} ${t.descricao}`.toLowerCase();
        return (!termo || texto.includes(termo)) && (!materia || t.materia === materia) && (!status || normalizarStatus(t.status) === status);
    });

    document.getElementById('total').textContent = trabalhos.length;
    document.getElementById('pendentes').textContent = trabalhos.filter(t => normalizarStatus(t.status) !== 'concluido').length;
    document.getElementById('proximos').textContent = trabalhos.filter(t => normalizarStatus(t.status) !== 'concluido').length;

    if(!filtrados.length){
        lista.innerHTML = '<div class="vazio">Nenhum trabalho encontrado com esses filtros.</div>';
        return;
    }

    lista.innerHTML = filtrados.map(t => {
        const s = normalizarStatus(t.status);
        const nomeStatus = s === 'em-andamento' ? 'Em andamento' : s === 'concluido' ? 'Concluído' : 'Pendente';
        return `<article class="trabalho">
            <div class="trabalho-topo"><div><div class="materia">${t.materia}</div><h2>${t.titulo}</h2></div><span class="status status-${s}">${nomeStatus}</span></div>
            <p class="descricao">${t.descricao || ''}</p>
            <div class="meta"><span class="tag">Prazo: ${formatarData(t.prazo)}</span><span class="tag">Vale ponto</span></div>
        </article>`;
    }).join('');
}

[busca, filtroMateria, filtroStatus].forEach(el => el.addEventListener('input', renderizar));

[...new Set(trabalhos.map(t => t.materia).filter(Boolean))].sort().forEach(materia => {
    const option = document.createElement('option');
    option.value = materia;
    option.textContent = materia;
    filtroMateria.appendChild(option);
});

renderizar();

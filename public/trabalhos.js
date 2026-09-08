let trabalhos = [];
let usuarioSessao = null;

const lista = document.getElementById('listaTrabalhos');
const busca = document.getElementById('busca');
const filtroMateria = document.getElementById('filtroMateria');
const filtroStatus = document.getElementById('filtroStatus');
const painelAdmin = document.getElementById('painel-trabalhos-admin');
const conteudoAdmin = document.getElementById('conteudo-trabalhos-admin');
const botaoMinAdmin = document.getElementById('botao-minimizar-trabalhos-admin');
const formAdmin = document.getElementById('form-trabalho-admin');
const statusAdmin = document.getElementById('status-admin-trabalhos');

function formatarData(data){
    if(!data) return 'Sem prazo';
    return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function normalizarStatus(status){
    return status || 'pendente';
}

function escaparHtml(valor){
    return String(valor ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function atualizarMaterias(){
    const atual = filtroMateria.value;
    const materias = [...new Set(trabalhos.map(t => t.materia).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    filtroMateria.innerHTML = '<option value="">Todas as matérias</option>';
    materias.forEach(materia => {
        const option = document.createElement('option');
        option.value = materia;
        option.textContent = materia;
        filtroMateria.appendChild(option);
    });
    if(materias.includes(atual)) filtroMateria.value = atual;
}

function renderizar(){
    const termo = busca.value.trim().toLowerCase();
    const materia = filtroMateria.value;
    const status = filtroStatus.value;
    const filtrados = trabalhos.filter(t => {
        const texto = `${t.titulo} ${t.materia} ${t.descricao || ''}`.toLowerCase();
        return (!termo || texto.includes(termo)) && (!materia || t.materia === materia) && (!status || normalizarStatus(t.status) === status);
    });

    document.getElementById('total').textContent = trabalhos.length;
    document.getElementById('pendentes').textContent = trabalhos.filter(t => normalizarStatus(t.status) !== 'concluido').length;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    document.getElementById('proximos').textContent = trabalhos.filter(t => normalizarStatus(t.status) !== 'concluido' && t.prazo && new Date(`${t.prazo}T12:00:00`) >= hoje).length;

    if(!filtrados.length){
        lista.innerHTML = '<div class="vazio">Nenhum trabalho encontrado com esses filtros.</div>';
        return;
    }

    lista.innerHTML = filtrados.map(t => {
        const s = normalizarStatus(t.status);
        const nomeStatus = s === 'em-andamento' ? 'Em andamento' : s === 'concluido' ? 'Concluído' : 'Pendente';
        const controles = usuarioSessao?.tipo === 'admin' ? `<div class="controles-trabalho"><button type="button" data-editar="${t.id}">Editar</button><button type="button" class="excluir" data-excluir="${t.id}">Excluir</button></div>` : '';
        return `<article class="trabalho">
            <div class="trabalho-topo"><div><div class="materia">${escaparHtml(t.materia)}</div><h2>${escaparHtml(t.titulo)}</h2></div><span class="status status-${escaparHtml(s)}">${nomeStatus}</span></div>
            <p class="descricao">${escaparHtml(t.descricao || '')}</p>
            <div class="meta"><span class="tag">Prazo: ${formatarData(t.prazo)}</span><span class="tag">Vale ponto</span></div>
            ${controles}
        </article>`;
    }).join('');
}

async function carregarTrabalhos(){
    try{
        const resposta = await fetch('/api/trabalhos');
        const dados = await resposta.json();
        if(!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || 'Falha ao carregar trabalhos.');
        trabalhos = dados.trabalhos || [];
        atualizarMaterias();
        renderizar();
    }catch(erro){
        console.error(erro);
        lista.innerHTML = '<div class="vazio">Não foi possível carregar os trabalhos.</div>';
    }
}

function preencherFormulario(trabalho){
    document.getElementById('trabalho-id').value = trabalho?.id || '';
    document.getElementById('admin-titulo').value = trabalho?.titulo || '';
    document.getElementById('admin-materia').value = trabalho?.materia || '';
    document.getElementById('admin-prazo').value = trabalho?.prazo || '';
    document.getElementById('admin-status').value = normalizarStatus(trabalho?.status);
    document.getElementById('admin-descricao').value = trabalho?.descricao || '';
    document.getElementById('botao-salvar-trabalho').textContent = trabalho ? 'Salvar alterações' : 'Criar trabalho';
    document.getElementById('botao-cancelar-trabalho').hidden = !trabalho;
}

formAdmin.addEventListener('submit', async evento => {
    evento.preventDefault();
    const id = document.getElementById('trabalho-id').value;
    const payload = {
        titulo: document.getElementById('admin-titulo').value.trim(),
        materia: document.getElementById('admin-materia').value.trim(),
        prazo: document.getElementById('admin-prazo').value,
        status: document.getElementById('admin-status').value,
        descricao: document.getElementById('admin-descricao').value.trim()
    };
    statusAdmin.textContent = id ? 'Salvando...' : 'Criando...';
    try{
        const resposta = await fetch(id ? `/api/trabalhos/${id}` : '/api/trabalhos', {
            method: id ? 'PUT' : 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });
        const dados = await resposta.json();
        if(!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || 'Não foi possível salvar.');
        statusAdmin.textContent = id ? 'Trabalho atualizado.' : 'Trabalho criado.';
        preencherFormulario(null);
        await carregarTrabalhos();
    }catch(erro){
        statusAdmin.textContent = erro.message;
    }
});

document.getElementById('botao-cancelar-trabalho').addEventListener('click', () => {
    preencherFormulario(null);
    statusAdmin.textContent = '';
});

lista.addEventListener('click', async evento => {
    const editar = evento.target.closest('[data-editar]');
    const excluir = evento.target.closest('[data-excluir]');
    if(editar){
        const trabalho = trabalhos.find(t => String(t.id) === editar.dataset.editar);
        if(trabalho){
            preencherFormulario(trabalho);
            painelAdmin.scrollIntoView({behavior:'smooth', block:'start'});
        }
    }
    if(excluir){
        const id = excluir.dataset.excluir;
        if(!confirm('Tem certeza que deseja excluir este trabalho?')) return;
        try{
            const resposta = await fetch(`/api/trabalhos/${id}`, {method:'DELETE'});
            const dados = await resposta.json();
            if(!resposta.ok || !dados.sucesso) throw new Error(dados.mensagem || 'Não foi possível excluir.');
            statusAdmin.textContent = 'Trabalho excluído.';
            await carregarTrabalhos();
        }catch(erro){
            statusAdmin.textContent = erro.message;
        }
    }
});

botaoMinAdmin.addEventListener('click', () => {
    const minimizado = conteudoAdmin.hidden;
    conteudoAdmin.hidden = !minimizado;
    botaoMinAdmin.textContent = minimizado ? '−' : '+';
    botaoMinAdmin.setAttribute('aria-expanded', String(minimizado));
});

[busca, filtroMateria, filtroStatus].forEach(el => el.addEventListener('input', renderizar));

async function inicializar(){
    try{
        const resposta = await fetch('/api/sessao');
        const sessao = await resposta.json();
        usuarioSessao = sessao.logado ? sessao : null;
        if(usuarioSessao?.tipo === 'admin'){
            painelAdmin.hidden = false;
            preencherFormulario(null);
        }
    }catch(erro){
        usuarioSessao = null;
    }
    await carregarTrabalhos();
}

inicializar();

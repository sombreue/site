const estado = { notas: [], editando: null };
const $ = id => document.getElementById(id);

async function api(url, opcoes = {}) {
    const resposta = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opcoes });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok || dados.sucesso === false) throw new Error(dados.mensagem || 'Não foi possível concluir a operação.');
    return dados;
}

async function carregar() {
    try {
        const dados = await api('/api/notas-pessoais');
        estado.notas = dados.notas || [];
        renderizar();
    } catch (erro) {
        $('status').textContent = erro.message;
    }
}

function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function renderizar() {
    const termo = $('busca').value.trim().toLowerCase();
    const notas = estado.notas.filter(n => `${n.titulo} ${n.conteudo}`.toLowerCase().includes(termo));
    $('contador').textContent = `${estado.notas.length} ${estado.notas.length === 1 ? 'nota' : 'notas'}`;
    $('notas').innerHTML = notas.map(n => `
        <article class="nota ${escapar(n.cor)} ${n.fixada ? 'fixada' : ''}" data-id="${n.id}">
            ${n.fixada ? '<span class="selo-fixada">📌</span>' : ''}
            <div class="nota-cabecalho"><h2>${escapar(n.titulo) || 'Sem título'}</h2><button class="menu-nota" data-editar="${n.id}" aria-label="Editar">⋮</button></div>
            <p>${escapar(n.conteudo).replace(/\n/g, '<br>')}</p>
            <div class="nota-rodape"><small>${n.atualizada_em ? new Date(n.atualizada_em).toLocaleDateString('pt-BR') : ''}</small><div><button data-fixar="${n.id}" title="Fixar/desafixar">${n.fixada ? '📌' : '📍'}</button><button data-excluir="${n.id}" title="Excluir">🗑️</button></div></div>
        </article>`).join('');
    $('vazio').classList.toggle('escondido', notas.length > 0);
    $('notas').classList.toggle('escondido', notas.length === 0);
}

function abrir(id = null) {
    estado.editando = id;
    const nota = estado.notas.find(n => n.id === id);
    $('modalTitulo').textContent = nota ? 'Editar nota' : 'Nova nota';
    $('titulo').value = nota?.titulo || '';
    $('conteudo').value = nota?.conteudo || '';
    $('cor').value = nota?.cor || 'amarela';
    $('fixada').checked = Boolean(nota?.fixada);
    $('modal').classList.remove('escondido'); $('modal').setAttribute('aria-hidden', 'false');
    $('titulo').focus();
}
function fechar() { $('modal').classList.add('escondido'); $('modal').setAttribute('aria-hidden', 'true'); estado.editando = null; }

async function salvar() {
    const payload = { titulo: $('titulo').value, conteudo: $('conteudo').value, cor: $('cor').value, fixada: $('fixada').checked };
    if (!payload.titulo.trim() && !payload.conteudo.trim()) return alert('Escreva um título ou conteúdo para a nota.');
    try {
        const url = estado.editando ? `/api/notas-pessoais/${estado.editando}` : '/api/notas-pessoais';
        const dados = await api(url, { method: estado.editando ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        if (estado.editando) estado.notas = estado.notas.map(n => n.id === estado.editando ? dados.nota : n);
        else estado.notas.unshift(dados.nota);
        fechar(); renderizar();
    } catch (erro) { alert(erro.message); }
}

$('novaNotaTopo').onclick = () => abrir(); $('novaNotaVazia').onclick = () => abrir(); $('fechar').onclick = fechar; $('cancelar').onclick = fechar; $('salvar').onclick = salvar; $('busca').oninput = renderizar;
$('modal').onclick = e => { if (e.target === $('modal')) fechar(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').classList.contains('escondido')) fechar(); });
$('notas').addEventListener('click', async e => {
    const editar = e.target.closest('[data-editar]');
    const excluir = e.target.closest('[data-excluir]');
    const fixar = e.target.closest('[data-fixar]');
    if (editar) abrir(Number(editar.dataset.editar));
    if (excluir) {
        const id = Number(excluir.dataset.excluir);
        if (!confirm('Excluir esta nota? Essa ação não pode ser desfeita.')) return;
        try { await api(`/api/notas-pessoais/${id}`, { method: 'DELETE' }); estado.notas = estado.notas.filter(n => n.id !== id); renderizar(); } catch (erro) { alert(erro.message); }
    }
    if (fixar) {
        const id = Number(fixar.dataset.fixar); const nota = estado.notas.find(n => n.id === id); if (!nota) return;
        try { const dados = await api(`/api/notas-pessoais/${id}`, { method: 'PUT', body: JSON.stringify({ ...nota, fixada: !nota.fixada }) }); estado.notas = estado.notas.map(n => n.id === id ? dados.nota : n); renderizar(); } catch (erro) { alert(erro.message); }
    }
});
carregar();

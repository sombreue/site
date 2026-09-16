let notas = [];
let editandoId = null;

const $ = id => document.getElementById(id);
const periodoOrdem = {'1º bimestre':1,'2º bimestre':2,'3º bimestre':3,'4º bimestre':4};
const catalogoMaterias = Array.isArray(window.MATERIAS_AGENDA) ? window.MATERIAS_AGENDA : [];

function formatarNota(valor){
    return Number(valor).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}

function media(itens){
    if(!itens.length) return null;
    return itens.reduce((s,n)=>s+Number(n.nota),0)/itens.length;
}

function preencherCatalogoMaterias(valorAtual=''){
    const select = $('materia');
    if(!select) return;
    const materiasDasNotas = notas.map(n=>n.materia).filter(Boolean);
    const materias = [...new Set([...catalogoMaterias, ...materiasDasNotas])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    if(valorAtual && !materias.includes(valorAtual)) materias.push(valorAtual);
    select.innerHTML = '<option value="">Selecione a matéria</option>' + materias.map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
    if(valorAtual) select.value = valorAtual;
}

function abrirForm(nota=null){
    editandoId = nota?.id || null;
    $('titulo-form').textContent = nota ? 'Editar nota' : 'Adicionar nota';
    preencherCatalogoMaterias(nota?.materia || '');
    $('periodo').value = nota?.periodo || '1º bimestre';
    $('nota').value = nota?.nota ?? '';
    $('descricao').value = nota?.descricao || '';
    $('mensagem').textContent = '';
    $('painel').hidden = false;
    $('materia').focus();
}

function fecharForm(){ editandoId=null; $('painel').hidden=true; $('form-nota').reset(); }

function atualizarFiltros(){
    const atual = $('filtro-materia').value;
    const materiasDasNotas = notas.map(n=>n.materia).filter(Boolean);
    const materias = [...new Set([...catalogoMaterias, ...materiasDasNotas])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
    $('filtro-materia').innerHTML = '<option value="">Todas as matérias</option>' + materias.map(m=>`<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
    if(materias.includes(atual)) $('filtro-materia').value=atual;
}

function atualizarResumo(){
    const materias = [...new Set(notas.map(n=>n.materia))];
    const geral = media(notas);
    $('media-geral').textContent = geral === null ? '—' : formatarNota(geral);
    $('materias').textContent = materias.length;
    $('lancamentos').textContent = notas.length;
    let melhor = null, melhorValor = -1;
    materias.forEach(m=>{ const valor=media(notas.filter(n=>n.materia===m)); if(valor>melhorValor){melhorValor=valor;melhor=m;} });
    $('melhor-media').textContent = melhor ? `${melhor} (${formatarNota(melhorValor)})` : '—';
}

function render(){
    atualizarFiltros();
    atualizarResumo();
    const materiaFiltro=$('filtro-materia').value;
    const periodoFiltro=$('filtro-periodo').value;
    const filtradas=notas.filter(n=>(!materiaFiltro||n.materia===materiaFiltro)&&(!periodoFiltro||n.periodo===periodoFiltro));
    if(!filtradas.length){ $('lista').innerHTML='<div class="vazio"><h2>Nenhuma nota encontrada</h2><p>Adicione sua primeira nota ou altere os filtros.</p></div>'; return; }
    const grupos={};
    filtradas.forEach(n=>(grupos[n.materia]??=[]).push(n));
    $('lista').innerHTML=Object.entries(grupos).sort(([a],[b])=>a.localeCompare(b,'pt-BR')).map(([materia,itens])=>{
        itens.sort((a,b)=>(periodoOrdem[a.periodo]||5)-(periodoOrdem[b.periodo]||5)||Number(b.id)-Number(a.id));
        return `<article class="materia-bloco"><div class="materia-cabecalho"><h2>${escapeHtml(materia)}</h2><span class="media-materia">Média: ${formatarNota(media(itens))}</span></div>${itens.map(n=>`<div class="nota"><div class="valor-nota">${formatarNota(n.nota)}</div><div class="periodo">${escapeHtml(n.periodo)}</div><div class="obs">${escapeHtml(n.descricao||'Sem observação')}</div><div class="acoes"><button class="secundario editar" data-id="${n.id}">Editar</button><button class="perigo excluir" data-id="${n.id}">Excluir</button></div></div>`).join('')}</article>`;
    }).join('');
    document.querySelectorAll('.editar').forEach(b=>b.onclick=()=>abrirForm(notas.find(n=>n.id==b.dataset.id)));
    document.querySelectorAll('.excluir').forEach(b=>b.onclick=()=>excluirNota(Number(b.dataset.id)));
}

function escapeHtml(text){ return String(text??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }

async function carregar(){
    const r=await fetch('/api/notas');
    if(r.status===401){location.href='/login.html';return;}
    const dados=await r.json();
    if(!dados.sucesso) throw new Error(dados.mensagem||'Não foi possível carregar as notas.');
    notas=dados.notas||[];
    preencherCatalogoMaterias();
    render();
}

async function excluirNota(id){
    const nota=notas.find(n=>n.id===id);
    if(!nota || !confirm(`Excluir a nota ${formatarNota(nota.nota)} de ${nota.materia}?`)) return;
    const r=await fetch(`/api/notas/${id}`,{method:'DELETE'});
    const dados=await r.json();
    if(!dados.sucesso){alert(dados.mensagem||'Não foi possível excluir.');return;}
    await carregar();
}

$('nova-nota').onclick=()=>abrirForm();
$('cancelar').onclick=fecharForm;
$('filtro-materia').onchange=render;
$('filtro-periodo').onchange=render;
$('sair').onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.href='/login.html';};
$('form-nota').onsubmit=async e=>{
    e.preventDefault();
    $('mensagem').textContent='Salvando...';
    const corpo={materia:$('materia').value,periodo:$('periodo').value,nota:Number($('nota').value),descricao:$('descricao').value};
    const url=editandoId?`/api/notas/${editandoId}`:'/api/notas';
    const r=await fetch(url,{method:editandoId?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corpo)});
    const dados=await r.json();
    if(!dados.sucesso){$('mensagem').textContent=dados.mensagem||'Não foi possível salvar.';return;}
    fecharForm();
    await carregar();
};

carregar().catch(e=>{$('lista').innerHTML=`<div class="vazio"><h2>Não foi possível carregar</h2><p>${escapeHtml(e.message)}</p></div>`;});

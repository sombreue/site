const materiasEl=document.getElementById('materias');
const sessoesEl=document.getElementById('sessoes');
const modal=document.getElementById('modal');
const modalMateria=document.getElementById('modal-materia');
const mensagem=document.getElementById('mensagem');
let materias=[];
let sessoes=[];

async function respostaJson(res){
    const texto=await res.text();
    let dados={};
    try{dados=texto?JSON.parse(texto):{};}catch(e){throw new Error('Resposta inválida do servidor.');}
    if(!res.ok) throw new Error(dados.mensagem||'Não foi possível concluir a operação.');
    return dados;
}
function avisar(texto){mensagem.textContent=texto;mensagem.classList.add('visivel');setTimeout(()=>mensagem.classList.remove('visivel'),3000);}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function renderMaterias(){
    if(!materias.length){materiasEl.innerHTML='<p>Nenhuma matéria cadastrada.</p>';return;}
    materiasEl.innerHTML=materias.map(m=>`
        <article class="materia-card">
            <div class="materia-info">
                <h3>${escapeHtml(m.nome)}</h3>
                ${m.descricao?`<p>${escapeHtml(m.descricao)}</p>`:''}
                <small>${Number(m.total_conteudos||0)} conteúdo(s)</small>
            </div>
            <div class="materia-acoes">
                <button type="button" class="botao-excluir-materia" data-excluir-materia="${m.id}" title="Excluir matéria">Excluir</button>
            </div>
        </article>`).join('');
}

async function carregarMaterias(){
    const r=await fetch('/api/estudos/materias',{cache:'no-store'});
    const d=await respostaJson(r);
    materias=d.materias||[];
    renderMaterias();
    const select=document.getElementById('materia');
    if(select) select.innerHTML=materias.map(m=>`<option value="${m.id}">${escapeHtml(m.nome)}</option>`).join('');
}

async function excluirMateria(id){
    const materia=materias.find(m=>Number(m.id)===Number(id));
    if(!materia)return;
    const ok=confirm(`Excluir a matéria "${materia.nome}"?\n\nIsso também excluirá os conteúdos e sessões de estudo ligados a ela.`);
    if(!ok)return;
    try{
        const r=await fetch(`/api/estudos/materias/${encodeURIComponent(id)}`,{method:'DELETE',headers:{'Accept':'application/json'},cache:'no-store'});
        await respostaJson(r);
        avisar('Matéria excluída com sucesso.');
        await Promise.all([carregarMaterias(),carregarSessoes()]);
    }catch(e){avisar(e.message);}
}

materiasEl.addEventListener('click',e=>{
    const botao=e.target.closest('[data-excluir-materia]');
    if(botao) excluirMateria(botao.dataset.excluirMateria);
});

async function carregarSessoes(){
    try{
        const r=await fetch('/api/estudos/sessoes',{cache:'no-store'});
        const d=await respostaJson(r);
        sessoes=d.sessoes||[];
        renderSessoes();
    }catch(e){sessoesEl.innerHTML=`<p>${escapeHtml(e.message)}</p>`;}
}
function renderSessoes(){
    if(!sessoes.length){sessoesEl.innerHTML='<p>Nenhuma sessão planejada.</p>';return;}
    sessoesEl.innerHTML=sessoes.map(s=>`<article class="sessao-card"><strong>${escapeHtml(s.materia_nome||s.materia||'Matéria')}</strong><span>${escapeHtml(s.conteudo_nome||s.conteudo||'Sem conteúdo específico')}</span><time>${escapeHtml(s.data||'')}</time></article>`).join('');
}

document.getElementById('nova-materia')?.addEventListener('click',()=>modalMateria.hidden=false);
document.getElementById('fechar-materia')?.addEventListener('click',()=>modalMateria.hidden=true);
document.getElementById('cancelar-materia')?.addEventListener('click',()=>modalMateria.hidden=true);
document.getElementById('form-materia')?.addEventListener('submit',async e=>{
    e.preventDefault();
    try{
        const r=await fetch('/api/estudos/materias',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:document.getElementById('nome-materia').value.trim(),descricao:document.getElementById('desc-materia').value.trim()})});
        await respostaJson(r);
        e.target.reset();modalMateria.hidden=true;avisar('Matéria criada com sucesso.');await carregarMaterias();
    }catch(err){avisar(err.message);}
});

async function inicializar(){
    try{await carregarMaterias();await carregarSessoes();}catch(e){materiasEl.innerHTML=`<p>${escapeHtml(e.message)}</p>`;}
}
inicializar();

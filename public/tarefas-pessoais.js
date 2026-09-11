(() => {
let tarefas=[], editando=null;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function md(text){
 let s=esc(text).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/^### (.*)$/gm,'<h4>$1</h4>').replace(/^## (.*)$/gm,'<h3>$1</h3>').replace(/^# (.*)$/gm,'<h2>$1</h2>').replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/^- (.*)$/gm,'<li>$1</li>').replace(/(<li>.*<\/li>\n?)+/g,m=>'<ul>'+m+'</ul>').replace(/\n/g,'<br>');
 return s;
}
function data(d){if(!d)return '—'; const [a,m,dia]=d.split('-');return `${dia}/${m}/${a}`;}
function prioridade(p){return p==='alta'?'Alta':p==='baixa'?'Baixa':'Média';}
function status(s){return s==='concluida'?'Concluída':s==='em-andamento'?'Em andamento':'A fazer';}
function render(){
 const fs=$('filtro-status').value, fp=$('filtro-prioridade').value;
 const vis= tarefas.filter(t=>(!fs||t.status===fs)&&(!fp||t.prioridade===fp));
 $('lista').innerHTML=vis.length?vis.map(t=>`<article class="tarefa ${t.status==='concluida'?'concluida':''}">
  <div class="tarefa-topo"><div><h2>${esc(t.titulo)}</h2>${t.materia?`<span class="materia">${esc(t.materia)}</span>`:''}</div><span class="prioridade ${t.prioridade}">${prioridade(t.prioridade)}</span></div>
  <div class="datas">${t.prazo?`<span>Entrega: <b>${data(t.prazo)}</b></span>`:''}${t.data_planejada?`<span>Planejada: <b>${data(t.data_planejada)}</b></span>`:''}</div>
  <div class="status">${status(t.status)}</div>
  ${t.descricao?`<div class="descricao">${md(t.descricao)}</div>`:''}
  <div class="acoes"><button data-editar="${t.id}">Editar</button><button data-concluir="${t.id}">${t.status==='concluida'?'Reabrir':'Concluir'}</button><button class="perigo" data-excluir="${t.id}">Excluir</button></div>
 </article>`).join(''):'<div class="vazio"><h2>Nenhuma tarefa aqui</h2><p>Crie uma tarefa pessoal para começar a se organizar.</p></div>';
 $('total').textContent=tarefas.length; $('pendentes').textContent=tarefas.filter(t=>t.status!=='concluida').length; $('planejadas').textContent=tarefas.filter(t=>t.data_planejada&&t.status!=='concluida').length; $('concluidas').textContent=tarefas.filter(t=>t.status==='concluida').length;
}
async function carregar(){const r=await fetch('/api/tarefas-pessoais');const d=await r.json();if(!r.ok||!d.sucesso){location.href='/login.html';return;}tarefas=d.tarefas;render();}
function abrir(t=null){editando=t?.id||null;$('titulo-form').textContent=t?'Editar tarefa':'Nova tarefa';$('titulo').value=t?.titulo||'';$('materia').value=t?.materia||'';$('prazo').value=t?.prazo||'';$('planejada').value=t?.data_planejada||'';$('prioridade').value=t?.prioridade||'media';$('status').value=t?.status||'a-fazer';$('descricao').value=t?.descricao||'';$('formulario').hidden=false;$('titulo').focus();}
$('nova').onclick=()=>abrir();$('cancelar').onclick=()=>{$('formulario').hidden=true;editando=null};$('filtro-status').onchange=render;$('filtro-prioridade').onchange=render;
$('form').onsubmit=async e=>{e.preventDefault();$('mensagem').textContent='Salvando...';const body={titulo:$('titulo').value,materia:$('materia').value,prazo:$('prazo').value,data_planejada:$('planejada').value,prioridade:$('prioridade').value,status:$('status').value,descricao:$('descricao').value};const r=await fetch(editando?`/api/tarefas-pessoais/${editando}`:'/api/tarefas-pessoais',{method:editando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok||!d.sucesso){$('mensagem').textContent=d.mensagem||'Erro ao salvar.';return;}$('formulario').hidden=true;editando=null;carregar();};
$('lista').onclick=async e=>{const ed=e.target.closest('[data-editar]'),co=e.target.closest('[data-concluir]'),ex=e.target.closest('[data-excluir]');if(ed){abrir(tarefas.find(t=>t.id==ed.dataset.editar));return}if(co){const t=tarefas.find(t=>t.id==co.dataset.concluir);await fetch(`/api/tarefas-pessoais/${t.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...t,status:t.status==='concluida'?'a-fazer':'concluida'})});carregar();return}if(ex&&confirm('Excluir esta tarefa?')){await fetch(`/api/tarefas-pessoais/${ex.dataset.excluir}`,{method:'DELETE'});carregar();}};
$('sair').onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.href='/login.html'};
carregar();
})();

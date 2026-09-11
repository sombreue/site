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
function render(){
 const fp=$('filtro-prioridade').value;
 const vis=tarefas.filter(t=>!fp||t.prioridade===fp);
 $('lista').innerHTML=vis.length?vis.map(t=>`<article class="tarefa">
  <div class="tarefa-topo"><div><h2>${esc(t.titulo)}</h2>${t.materia?`<span class="materia">${esc(t.materia)}</span>`:''}</div><span class="prioridade ${t.prioridade}">${prioridade(t.prioridade)}</span></div>
  <div class="datas">${t.prazo?`<span>Entrega: <b>${data(t.prazo)}</b></span>`:''}${t.data_planejada?`<span>Planejada: <b>${data(t.data_planejada)}</b></span>`:''}</div>
  ${t.descricao?`<div class="descricao">${md(t.descricao)}</div>`:''}
  <div class="acoes"><button data-editar="${t.id}">Editar</button><button class="feito" data-feito="${t.id}">Feito</button><button class="perigo" data-excluir="${t.id}">Excluir</button></div>
 </article>`).join(''):'<div class="vazio"><h2>Nenhuma tarefa aqui</h2><p>Crie uma tarefa pessoal para começar a se organizar.</p></div>';
 $('total').textContent=tarefas.length; $('pendentes').textContent=tarefas.length; $('planejadas').textContent=tarefas.filter(t=>t.data_planejada).length;
}
async function carregar(){const r=await fetch('/api/tarefas-pessoais');const d=await r.json();if(!r.ok||!d.sucesso){location.href='/login.html';return;}tarefas=d.tarefas;render();}
function abrir(t=null){editando=t?.id||null;$('titulo-form').textContent=t?'Editar tarefa':'Nova tarefa';$('titulo').value=t?.titulo||'';$('materia').value=t?.materia||'';$('prazo').value=t?.prazo||'';$('planejada').value=t?.data_planejada||'';$('prioridade').value=t?.prioridade||'media';$('descricao').value=t?.descricao||'';$('formulario').hidden=false;$('titulo').focus();}
$('nova').onclick=()=>abrir();$('cancelar').onclick=()=>{$('formulario').hidden=true;editando=null};$('filtro-prioridade').onchange=render;
$('form').onsubmit=async e=>{e.preventDefault();$('mensagem').textContent='Salvando...';const body={titulo:$('titulo').value,materia:$('materia').value,prazo:$('prazo').value,data_planejada:$('planejada').value,prioridade:$('prioridade').value,descricao:$('descricao').value};const r=await fetch(editando?`/api/tarefas-pessoais/${editando}`:'/api/tarefas-pessoais',{method:editando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok||!d.sucesso){$('mensagem').textContent=d.mensagem||'Erro ao salvar.';return;}$('formulario').hidden=true;editando=null;carregar();};
$('lista').onclick=async e=>{const ed=e.target.closest('[data-editar]'),fe=e.target.closest('[data-feito]'),ex=e.target.closest('[data-excluir]');if(ed){abrir(tarefas.find(t=>t.id==ed.dataset.editar));return}if(fe){if(!confirm('Marcar esta tarefa como feita? Ela será removida.'))return;await fetch(`/api/tarefas-pessoais/${fe.dataset.feito}`,{method:'DELETE'});carregar();return}if(ex&&confirm('Excluir esta tarefa?')){await fetch(`/api/tarefas-pessoais/${ex.dataset.excluir}`,{method:'DELETE'});carregar();}};
carregar();
})();

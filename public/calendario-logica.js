(() => {
const $=id=>document.getElementById(id); const hoje=new Date(); let ano=hoje.getFullYear(), mes=hoje.getMonth(), filtro='tudo', eventos=[], tarefas=[], escola=[], editando=null;
const nomesMes=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function visivel(tipo){return filtro==='tudo'||filtro===tipo}
function dataLocal(y,m,d){const dt=new Date(y,m,d);return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`}
async function carregar(){
 const sess=await (await fetch('/api/sessao')).json(); if(!sess.logado){location.href='/login.html';return;}
 const respostas=await Promise.all([fetch('/api/calendario-pessoal'),fetch('/api/tarefas-pessoais'),fetch('/api/tarefas')]);
 const [ed,td,sd]=await Promise.all(respostas.map(r=>r.json()));
 if(!ed.sucesso||!td.sucesso)throw new Error('Não foi possível carregar o calendário.');
 eventos=ed.eventos||[]; tarefas=td.tarefas||[]; escola=sd.sucesso?(sd.tarefas||[]):[]; render();
}
function render(){
 $('mes-atual').textContent=`${nomesMes[mes]} de ${ano}`; const grade=$('grade'); grade.innerHTML=''; const primeiro=new Date(ano,mes,1).getDay(), total=new Date(ano,mes+1,0).getDate(), anterior=new Date(ano,mes,0).getDate();
 for(let i=primeiro-1;i>=0;i--){const dt=new Date(ano,mes-1,anterior-i);grade.appendChild(dia(dt.getDate(),true,dt.getFullYear(),dt.getMonth()))}
 for(let d=1;d<=total;d++)grade.appendChild(dia(d,false,ano,mes));
 const resto=42-grade.children.length; for(let d=1;d<=resto;d++){const dt=new Date(ano,mes+1,d);grade.appendChild(dia(dt.getDate(),true,dt.getFullYear(),dt.getMonth()))}
}
function dia(d,out,y,m){const el=document.createElement('div');el.className='dia'+(out?' outro':'');const data=dataLocal(y,m,d);el.innerHTML=`<div class="dia-num">${d}</div><div class="eventos"></div>`; if(data===dataLocal(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()))el.classList.add('hoje');
 const lista=el.querySelector('.eventos');
 if(visivel('escola')) escola.filter(t=>t.data===data).slice(0,4).forEach(t=>addEvento(lista,'escola',t.descricao||t.materia||'Tarefa escolar'));
 if(visivel('tarefas')) tarefas.filter(t=>(t.data_planejada||t.prazo)===data).slice(0,4).forEach(t=>{const e=document.createElement('div');e.className='evento tarefa';e.title=t.titulo;e.innerHTML=`<span>✓</span>${esc(t.titulo)}`;e.onclick=ev=>{ev.stopPropagation();location.href='/tarefas-pessoais.html'};lista.appendChild(e)});
 if(visivel('pessoal'))eventos.filter(e=>e.data===data).slice(0,5).forEach(x=>{const e=document.createElement('div');e.className=`evento ${x.categoria}`;e.title=x.descricao||x.titulo;e.innerHTML=`${x.hora_inicio?`<small>${esc(x.hora_inicio)}</small> `:''}${esc(x.titulo)}`;e.onclick=ev=>{ev.stopPropagation();abrir(x)};lista.appendChild(e)});
 const itens=[...lista.children];if(itens.length>5){itens.slice(5).forEach(x=>x.remove());const mais=document.createElement('div');mais.className='mais';mais.textContent=`+${itens.length-5} mais`;lista.appendChild(mais)}
 el.onclick=()=>{if(!out)abrirNovo(data)};return el;
}
function addEvento(lista,tipo,titulo){const e=document.createElement('div');e.className=`evento ${tipo}`;e.title=titulo;e.textContent=titulo;lista.appendChild(e)}
function abrirNovo(data){editando=null;$('modal-titulo').textContent='Novo evento';$('form').reset();$('data').value=data;$('excluir').hidden=true;$('modal').hidden=false;$('titulo').focus()}
function abrir(x){editando=x;$('modal-titulo').textContent='Editar evento';$('titulo').value=x.titulo;$('data').value=x.data;$('inicio').value=x.hora_inicio||'';$('fim').value=x.hora_fim||'';$('categoria').value=x.categoria;$('descricao').value=x.descricao||'';$('excluir').hidden=false;$('modal').hidden=false}
function fechar(){$('modal').hidden=true;editando=null}
$('anterior').onclick=()=>{mes--;if(mes<0){mes=11;ano--}render()};$('proximo').onclick=()=>{mes++;if(mes>11){mes=0;ano++}render()};$('hoje').onclick=()=>{ano=hoje.getFullYear();mes=hoje.getMonth();render()};$('novo').onclick=()=>abrirNovo(dataLocal(ano,mes,hoje.getDate()));
$('fechar').onclick=fechar;$('cancelar').onclick=fechar;$('modal').onclick=e=>{if(e.target===$('modal'))fechar()};
document.querySelectorAll('.filtro').forEach(b=>b.onclick=()=>{filtro=b.dataset.filtro;document.querySelectorAll('.filtro').forEach(x=>x.classList.toggle('ativo',x===b));render()});
$('form').onsubmit=async e=>{e.preventDefault();const body={titulo:$('titulo').value.trim(),data:$('data').value,hora_inicio:$('inicio').value,hora_fim:$('fim').value,categoria:$('categoria').value,descricao:$('descricao').value};const r=await fetch(editando?`/api/calendario-pessoal/${editando.id}`:'/api/calendario-pessoal',{method:editando?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!d.sucesso){alert(d.mensagem||'Não foi possível salvar.');return}fechar();carregar().catch(e=>alert(e.message))};
$('excluir').onclick=async()=>{if(!editando||!confirm('Excluir este evento?'))return;const r=await fetch(`/api/calendario-pessoal/${editando.id}`,{method:'DELETE'}),d=await r.json();if(!d.sucesso){alert(d.mensagem||'Não foi possível excluir.');return}fechar();carregar().catch(e=>alert(e.message))};
$('sair').onclick=async()=>{try{await fetch('/api/logout',{method:'POST'})}finally{location.href='/login.html'}};
carregar().catch(e=>{$('mensagem').textContent=e.message});
})();

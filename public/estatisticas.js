(() => {
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=n=>n==null?'—':Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
async function carregar(){
 const sessao=await (await fetch('/api/sessao')).json();
 if(!sessao.logado){location.href='/login.html';return;}
 const r=await fetch('/api/estatisticas');
 if(r.status===401){location.href='/login.html';return;}
 const d=await r.json(); if(!d.sucesso) throw new Error(d.mensagem||'Não foi possível carregar as estatísticas.');
 const x=d.resumo;
 $('media-geral').textContent=fmt(x.mediaGeral); $('concluidas').textContent=x.concluidas; $('atrasadas').textContent=x.atrasadas; $('percentual').textContent=`${Math.round(x.percentualConclusao)}%`; $('concluidas-semana').textContent=x.concluidasSemana; $('criadas-semana').textContent=x.criadasSemana; $('pendentes').textContent=x.pendentes;
 $('bimestres').innerHTML=d.bimestres.map(b=>`<div class="bimestre"><div class="bimestre-top"><span>${esc(b.periodo)}</span><strong>${fmt(b.media)}</strong></div><div class="barra"><i style="width:${b.media==null?0:Math.max(0,Math.min(100,b.media*10))}%"></i></div></div>`).join('');
 $('materias').innerHTML=d.materias.length?d.materias.map((m,i)=>`<div class="materia"><div><strong>${esc(m.materia)}</strong><small>${m.lancamentos} ${m.lancamentos===1?'avaliação':'avaliações'}</small></div><strong>${fmt(m.media)}</strong></div>`).join(''):'<div class="vazio">Ainda não há notas cadastradas.</div>';
 const insights=[];
 if(x.atrasadas>0) insights.push(`<strong>Você tem ${x.atrasadas} tarefa${x.atrasadas===1?' atrasada':'s atrasadas'}.</strong> Vale a pena resolver isso antes de acumular mais pendências.`);
 if(d.melhorMateria) insights.push(`<strong>Melhor matéria: ${esc(d.melhorMateria.materia)} (${fmt(d.melhorMateria.media)}).</strong> Continue mantendo esse ritmo.`);
 if(d.piorMateria && d.materias.length>1) insights.push(`<strong>Matéria que merece atenção: ${esc(d.piorMateria.materia)} (${fmt(d.piorMateria.media)}).</strong> Ela é a menor média entre as matérias cadastradas.`);
 if(!x.atrasadas && x.totalTarefas) insights.push('<strong>Sem tarefas atrasadas.</strong> Sua organização está em dia.');
 if(!x.totalTarefas && !x.materiasLancadas) insights.push('<strong>Comece registrando suas tarefas e notas.</strong> Assim esta página poderá mostrar sua evolução.');
 $('mensagem-tarefas').textContent=x.totalTarefas?`${x.pendentes} pendente${x.pendentes===1?'':'s'} no total.`:'Nenhuma tarefa cadastrada ainda.';
 $('insights').innerHTML=insights.map(t=>`<div class="insight-card">${t}</div>`).join('');
}
$('sair').onclick=async()=>{try{await fetch('/api/logout',{method:'POST'});}finally{location.href='/login.html';}};
carregar().catch(e=>{document.querySelector('main').insertAdjacentHTML('beforeend',`<section class="erro">${esc(e.message)}</section>`);});
})();

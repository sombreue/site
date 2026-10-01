(() => {
    const temas = [
        { id: "ruby", nome: "Ruby", icone: "◆", cor: "#ef3340", grupo: "Escuros" },
        { id: "batman", nome: "Batman", icone: "🦇", cor: "#f2c300", grupo: "Super temas" },
        { id: "spider-man", nome: "Homem-Aranha", icone: "🕷", cor: "#e52521", grupo: "Super temas" },
        { id: "doctor-doom", nome: "Doutor Destino", icone: "☠", cor: "#3fae49", grupo: "Super temas" },
        { id: "iron-man", nome: "Homem de Ferro", icone: "◈", cor: "#e21b23", grupo: "Super temas" },
        { id: "hulk", nome: "Hulk", icone: "✊", cor: "#7bbf35", grupo: "Super temas" },
        { id: "superman", nome: "Superman", icone: "S", cor: "#e52521", grupo: "Super temas" },
        { id: "captain-america", nome: "Capitão América", icone: "★", cor: "#2f6fbd", grupo: "Super temas" },
        { id: "wolverine", nome: "Wolverine", icone: "✕", cor: "#fdb300", grupo: "Claros" },
        { id: "deadpool", nome: "Deadpool", icone: "☠", cor: "#d71920", grupo: "Super temas" },
        { id: "sonic", nome: "Sonic", icone: "⚡", cor: "#1261c9", grupo: "Super temas" },
        { id: "ocean", nome: "Ocean", icone: "●", cor: "#2196f3", grupo: "Escuros" },
        { id: "violet", nome: "Violet", icone: "◆", cor: "#9c5cff", grupo: "Escuros" },
        { id: "midnight", nome: "Midnight", icone: "✦", cor: "#6875ff", grupo: "Especiais" },
        { id: "bordeaux", nome: "Bordeaux", icone: "◆", cor: "#9e1638", grupo: "Especiais" },
        { id: "ancient", nome: "Ancient", icone: "◈", cor: "#c9a227", grupo: "Especiais" },
        { id: "forest", nome: "Forest", icone: "❖", cor: "#4caf72", grupo: "Especiais" },
        { id: "sakura", nome: "Sakura", icone: "✿", cor: "#ef78a5", grupo: "Especiais" },
        { id: "arctic", nome: "Arctic", icone: "❄", cor: "#62d9ff", grupo: "Especiais" },
        { id: "turkey", nome: "Turkey", icone: "☾", cor: "#e30a17", grupo: "Especiais" },
        { id: "quarta-feira", nome: "Quarta-feira", icone: "🐸", cor: "#8fe52f", grupo: "Especiais" },
        { id: "segunda-feira", nome: "Segunda-feira", icone: "🐸", cor: "#ff0000", grupo: "Especiais" },
        { id: "ruby-light", nome: "Ruby Light", icone: "◆", cor: "#d92838", grupo: "Claros" },
        { id: "ocean-light", nome: "Ocean Light", icone: "●", cor: "#0878c9", grupo: "Claros" },
        { id: "violet-light", nome: "Violet Light", icone: "◆", cor: "#7c3dcc", grupo: "Claros" },
        { id: "system", nome: "Sistema", icone: "◐", cor: "#888", grupo: "Automático" }
    ];

    const temasClaros = {
        "wolverine": { bg:"#CA9603",surface:"#FEC602",surface2:"#FBE59A",surface3:"#FDECB0",border:"#D5AE35",borderHover:"#315D9B",text:"#164A7A",muted:"#28659A",accent:"#FDB300",accentHover:"#FFD76B",accentDark:"#C68A00",input:"#F4D263",header:"#EBC34F",header2:"#D5A82A",button:"#0072da",buttonHover:"#000000" },
        "ruby-light": { bg:"#f6f6f7",surface:"#ffffff",surface2:"#f1f1f3",surface3:"#e9e9ec",border:"#d7d7dc",borderHover:"#b8b8c0",text:"#18181b",muted:"#666670",accent:"#d92838",accentHover:"#ef3340",accentDark:"#a71925",input:"#ffffff",header:"#ffffff",header2:"#f5f5f6",button:"#e7e7ea",buttonHover:"#dcdce0" },
        "ocean-light": { bg:"#f3f8fb",surface:"#ffffff",surface2:"#eaf3f8",surface3:"#dfeef5",border:"#cbdde7",borderHover:"#aac5d3",text:"#15232b",muted:"#60747f",accent:"#0878c9",accentHover:"#1595ec",accentDark:"#07588f",input:"#ffffff",header:"#ffffff",header2:"#eef6fa",button:"#e4f0f6",buttonHover:"#d5e7ef" },
        "violet-light": { bg:"#f7f4fa",surface:"#ffffff",surface2:"#f0eaf6",surface3:"#e8dff0",border:"#dacde3",borderHover:"#bea9cb",text:"#21192a",muted:"#75667e",accent:"#7c3dcc",accentHover:"#9553e8",accentDark:"#5d249f",input:"#ffffff",header:"#ffffff",header2:"#f5f0f8",button:"#ede5f3",buttonHover:"#e1d5e9" }
    };

    const chave = "agenda-auruda-tema";
    const ehQuartaFeira = () => new Date().getDay() === 3;
    const temaSalvo = localStorage.getItem(chave) || "ruby";
    const temaInicial = ehQuartaFeira() ? "quarta-feira" : (temas.some(t => t.id === temaSalvo) ? temaSalvo : "ruby");
    document.documentElement.dataset.theme = temaInicial;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "themes.css?v=20261001";
    document.head.appendChild(link);

    const estilo = document.createElement("style");
    estilo.textContent = `
        html[data-theme$="-light"], html[data-theme$="-light"] body { background:var(--theme-bg)!important; color:var(--theme-text)!important; }
        html[data-theme$="-light"] header { background:linear-gradient(180deg,var(--theme-header),var(--theme-header-2))!important; color:var(--theme-text)!important; border-color:var(--theme-border)!important; }
        html[data-theme$="-light"] main,html[data-theme$="-light"] section,html[data-theme$="-light"] .filtro,html[data-theme$="-light"] .painel-admin,html[data-theme$="-light"] .formulario,html[data-theme$="-light"] .tarefa,html[data-theme$="-light"] .conteudo-modal,html[data-theme$="-light"] .contador-feira,html[data-theme$="-light"] .equipe,html[data-theme$="-light"] .card-equipe { color:var(--theme-text)!important; border-color:var(--theme-border)!important; }
        html[data-theme$="-light"] .filtro,html[data-theme$="-light"] .painel-admin,html[data-theme$="-light"] .formulario,html[data-theme$="-light"] .conteudo-modal,html[data-theme$="-light"] .contador-feira,html[data-theme$="-light"] .equipe,html[data-theme$="-light"] .card-equipe { background:var(--theme-surface)!important; }
        html[data-theme$="-light"] .tarefa { background:linear-gradient(145deg,var(--theme-surface-2),var(--theme-surface))!important; }
        html[data-theme$="-light"] input,html[data-theme$="-light"] textarea,html[data-theme$="-light"] select { background:var(--theme-input)!important; color:var(--theme-text)!important; border-color:var(--theme-border)!important; color-scheme:light!important; }
        html[data-theme$="-light"] .dia h2,html[data-theme$="-light"] .tarefa p,html[data-theme$="-light"] .filtro label,html[data-theme$="-light"] .formulario label,html[data-theme$="-light"] #usuario-logado { color:var(--theme-text)!important; }
        html[data-theme$="-light"] #botao-logout,html[data-theme$="-light"] .cancelar,html[data-theme$="-light"] .botao-imagem,html[data-theme$="-light"] .botao-voltar { background:var(--theme-button)!important; color:var(--theme-text)!important; border-color:var(--theme-border)!important; }
        html[data-theme$="-light"] .seletor-tema-botao,html[data-theme$="-light"] .seletor-tema-lista { background:var(--theme-surface)!important; color:var(--theme-text)!important; border-color:var(--theme-border)!important; }
        html[data-theme="quarta-feira"] { --theme-bg:#071006;--theme-surface:#0d1a0a;--theme-surface-2:#13260d;--theme-surface-3:#1a3210;--theme-border:#2e541a;--theme-border-hover:#467b24;--theme-text:#efffe8;--theme-muted:#a8bf96;--theme-accent:#8fe52f;--theme-accent-hover:#adf653;--theme-accent-dark:#4f8f16;--theme-input:#091408;--theme-header:#12250b;--theme-header-2:#091708;--theme-button:#1d3511;--theme-button-hover:#29491a; }
        html[data-theme="quarta-feira"] body::before { content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;opacity:.42;background:radial-gradient(circle at 50% -8%,rgba(143,229,47,.20),transparent 38%),radial-gradient(circle at 15% 75%,rgba(91,181,24,.09),transparent 32%),linear-gradient(135deg,rgba(111,197,24,.025),transparent 42%); }
        html[data-theme="quarta-feira"] header { box-shadow:inset 0 -1px 0 rgba(143,229,47,.22),0 12px 38px rgba(0,0,0,.28); }
        html[data-theme="quarta-feira"] .seletor-tema-botao,html[data-theme="quarta-feira"] .seletor-tema-lista { border-color:#3d6820!important;box-shadow:0 12px 34px rgba(0,0,0,.32),0 0 22px rgba(143,229,47,.06); }
        html[data-theme="quarta-feira"] .logo,html[data-theme="quarta-feira"] .home-logo { object-fit:contain;filter:drop-shadow(0 5px 14px rgba(0,0,0,.32)); }
        html.quarta-feira-forcada .tema-opcao:not([data-tema="quarta-feira"]) { opacity:.45;cursor:not-allowed;pointer-events:none; }
        html.quarta-feira-forcada .seletor-tema-botao { cursor:not-allowed; }
    `;
    document.head.appendChild(estilo);

    function limparVariaveisForcadas() {
        const root=document.documentElement;
        ["--theme-bg","--theme-surface","--theme-surface-2","--theme-surface-3","--theme-border","--theme-border-hover","--theme-text","--theme-muted","--theme-accent","--theme-accent-hover","--theme-accent-dark","--theme-input","--theme-header","--theme-header-2","--theme-button","--theme-button-hover","--bg","--surface","--surface-2","--surface-3","--border","--border-hover","--text","--muted","--accent","--accent-hover","--accent-dark"].forEach(nome=>root.style.removeProperty(nome));
        root.style.removeProperty("color-scheme");
    }

    function forcarVariaveisClaras(id) {
        const cores=temasClaros[id], root=document.documentElement;
        if(!cores){ limparVariaveisForcadas(); return; }
        const vars={"--theme-bg":cores.bg,"--theme-surface":cores.surface,"--theme-surface-2":cores.surface2,"--theme-surface-3":cores.surface3,"--theme-border":cores.border,"--theme-border-hover":cores.borderHover,"--theme-text":cores.text,"--theme-muted":cores.muted,"--theme-accent":cores.accent,"--theme-accent-hover":cores.accentHover,"--theme-accent-dark":cores.accentDark,"--theme-input":cores.input,"--theme-header":cores.header,"--theme-header-2":cores.header2,"--theme-button":cores.button,"--theme-button-hover":cores.buttonHover,"--bg":cores.bg,"--surface":cores.surface,"--surface-2":cores.surface2,"--surface-3":cores.surface3,"--border":cores.border,"--border-hover":cores.borderHover,"--text":cores.text,"--muted":cores.muted,"--accent":cores.accent,"--accent-hover":cores.accentHover,"--accent-dark":cores.accentDark};
        Object.entries(vars).forEach(([nome,valor])=>root.style.setProperty(nome,valor,"important"));
        root.style.setProperty("color-scheme","light","important");
    }

    function atualizarLogos(id) {
        const logosEspeciais={"quarta-feira":"/imagens/quarta-feira.jpg","segunda-feira":"/imagens/segunda-feira.jpg"};
        document.querySelectorAll(".logo, .home-logo").forEach(logo=>{
            if(!logo.dataset.logoOriginal) logo.dataset.logoOriginal=logo.getAttribute("src")||"";
            const logoEspecial=logosEspeciais[id];
            logo.src=logoEspecial||logo.dataset.logoOriginal;
            logo.alt=logoEspecial?(id==="segunda-feira"?"Segunda-feira":"Quarta-feira"):"Logo";
        });
    }

    function atualizarBloqueioQuarta() {
        document.documentElement.classList.toggle("quarta-feira-forcada", ehQuartaFeira());
    }

    function aplicarTema(id) {
        if(ehQuartaFeira()) id="quarta-feira";
        if(!temas.some(t=>t.id===id)) return;
        document.documentElement.classList.add("trocando-tema");
        document.documentElement.dataset.theme=id;
        forcarVariaveisClaras(id);
        atualizarLogos(id);
        localStorage.setItem(chave,id);
        atualizarBloqueioQuarta();
        document.querySelectorAll(".tema-opcao").forEach(botao=>botao.classList.toggle("ativo",botao.dataset.tema===id));
        const tema=temas.find(t=>t.id===id), nome=document.querySelector(".seletor-tema-nome");
        if(nome&&tema) nome.textContent=tema.nome;
        window.setTimeout(()=>document.documentElement.classList.remove("trocando-tema"),260);
    }

    function criarSeletor() {
        if(document.querySelector(".seletor-tema")) return;
        const wrapper=document.createElement("div"); wrapper.className="seletor-tema";
        const botao=document.createElement("button"); botao.type="button";botao.className="seletor-tema-botao";botao.setAttribute("aria-expanded","false");botao.setAttribute("aria-label","Escolher tema");
        botao.innerHTML=`<span class="seletor-tema-atual"><span class="seletor-tema-icone">🎨</span><span class="seletor-tema-nome"></span></span><span class="seletor-tema-seta" aria-hidden="true">⌄</span>`;
        const lista=document.createElement("div");lista.className="seletor-tema-lista";lista.hidden=true;lista.setAttribute("role","menu");
        ["Super temas","Automático","Especiais","Escuros","Claros"].forEach(grupo=>{
            const itens=temas.filter(tema=>tema.grupo===grupo); if(!itens.length)return;
            const titulo=document.createElement("div");titulo.className="tema-grupo-titulo";titulo.textContent=grupo;lista.appendChild(titulo);
            const grade=document.createElement("div");grade.className="tema-grupo-grade";
            itens.forEach(tema=>{
                const opcao=document.createElement("button");opcao.type="button";opcao.className="tema-opcao";opcao.dataset.tema=tema.id;opcao.setAttribute("role","menuitem");
                opcao.innerHTML=`<span class="tema-bolinha" style="--cor-tema: ${tema.cor}"></span><span class="tema-opcao-texto"><span class="tema-opcao-icone">${tema.icone}</span>${tema.nome}</span>`;
                opcao.addEventListener("click",()=>{ if(ehQuartaFeira()&&tema.id!=="quarta-feira")return;aplicarTema(tema.id);lista.hidden=true;botao.setAttribute("aria-expanded","false"); });
                grade.appendChild(opcao);
            });
            lista.appendChild(grade);
        });
        botao.addEventListener("click",event=>{
            event.stopPropagation();
            if(ehQuartaFeira()){ aplicarTema("quarta-feira"); return; }
            lista.hidden=!lista.hidden;botao.setAttribute("aria-expanded",String(!lista.hidden));
        });
        document.addEventListener("click",event=>{if(!wrapper.contains(event.target)){lista.hidden=true;botao.setAttribute("aria-expanded","false");}});
        document.addEventListener("keydown",event=>{if(event.key==="Escape"){lista.hidden=true;botao.setAttribute("aria-expanded","false");}});
        wrapper.append(botao,lista);document.body.appendChild(wrapper);aplicarTema(document.documentElement.dataset.theme);
    }

    function verificarQuarta() {
        if(ehQuartaFeira()) aplicarTema("quarta-feira");
        atualizarBloqueioQuarta();
    }

    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",criarSeletor); else criarSeletor();
    setInterval(verificarQuarta,60000);
})();

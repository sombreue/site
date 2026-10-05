from pathlib import Path

# Rode este script na raiz do repositório agenda-de-casa.

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"

RENAMES = {
    # Início
    "home.css": "inicio-estilos.css",
    "index-admin.js": "inicio-admin.js",
    "sugestoes.css": "inicio-sugestoes-estilos.css",
    "sugestoes.js": "inicio-sugestoes.js",

    # Agenda
    "script.js": "agenda-logica.js",
    "style.css": "agenda-estilos.css",
    "admin-panel.js": "agenda-painel-admin.js",
    "admin-panel.css": "agenda-painel-admin-estilos.css",
    "horario-aulas.js": "agenda-horarios.js",
    "horario-aulas.css": "agenda-horarios-estilos.css",
    "light-theme-fix.css": "agenda-tema-claro-correcao.css",
    "light-theme-hard-fix.css": "agenda-tema-claro-correcao-extra.css",
    "theme-bridge.js": "agenda-temas-integracao.js",

    # Área do aluno
    "area-do-aluno.html": "area-aluno.html",
    "area-do-aluno.css": "area-aluno-estilos.css",
    "area-do-aluno.js": "area-aluno-logica.js",

    # Calendário
    "calendario.css": "calendario-estilos.css",
    "calendario.js": "calendario-logica.js",

    # Estatísticas
    "estatisticas.css": "estatisticas-estilos.css",
    "estatisticas.js": "estatisticas-logica.js",

    # Estudos
    "estudos.css": "estudos-estilos.css",
    "estudos.js": "estudos-logica.js",

    # Expectativas
    "expec.js": "expec-logica.js",
    "expec-light-fix.css": "expec-tema-claro-correcao.css",

    # Notas
    "notas.css": "notas-estilos.css",
    "notas.js": "notas-logica.js",

    # Notas pessoais
    "notas-pessoais.css": "notas-pessoais-estilos.css",
    "notas-pessoais.js": "notas-pessoais-logica.js",

    # Tarefas pessoais
    "tarefas-pessoais.css": "tarefas-pessoais-estilos.css",
    "tarefas-pessoais.js": "tarefas-pessoais-logica.js",

    # Trabalhos
    "trabalhos.css": "trabalhos-estilos.css",
    "trabalhos.js": "trabalhos-logica.js",

    # Admin de sugestões
    "admin-sugestoes.css": "admin-sugestoes-estilos.css",
    "admin-sugestoes.js": "admin-sugestoes-logica.js",

    # Arquivos globais
    "temas.js": "global-temas.js",
    "themes.css": "global-temas-estilos.css",
    "materias.js": "global-materias.js",
    "notificacoes.js": "global-notificacoes.js",
}

# ---------------------------------------------------------------------
# Verificações iniciais
# ---------------------------------------------------------------------

if not PUBLIC.exists():
    raise SystemExit(
        "ERRO: a pasta 'public' não foi encontrada.\n"
        "Execute este script na raiz do repositório."
    )

print("=" * 70)
print("RENOMEAÇÃO DO AGENDA-DE-CASA")
print("=" * 70)
print()

# ---------------------------------------------------------------------
# 1. Renomear arquivos
# ---------------------------------------------------------------------

renamed = []
missing = []
conflicts = []

for old_name, new_name in RENAMES.items():
    old = PUBLIC / old_name
    new = PUBLIC / new_name

    if not old.exists():
        missing.append(old_name)
        continue

    if new.exists():
        conflicts.append((old_name, new_name))
        continue

    old.rename(new)
    renamed.append((old_name, new_name))

print("ARQUIVOS RENOMEADOS")
print("-" * 70)

for old_name, new_name in renamed:
    print(f"  {old_name} -> {new_name}")

if not renamed:
    print("  Nenhum arquivo foi renomeado.")

print()

# ---------------------------------------------------------------------
# 2. Atualizar referências em todo o projeto
# ---------------------------------------------------------------------

# Também atualizamos referências que possam estar fora de /public,
# principalmente server.js ou outros arquivos da raiz.

TEXT_EXTENSIONS = {
    ".html",
    ".css",
    ".js",
    ".json",
    ".md",
    ".txt",
    ".mjs",
    ".cjs",
}

# O mapa é mantido separado para permitir que referências sejam
# atualizadas mesmo quando um arquivo antigo não existia.
REPLACEMENTS = dict(RENAMES)

changed_files = []

for path in ROOT.rglob("*"):
    if not path.is_file():
        continue

    # Ignora o .git e dependências
    if ".git" in path.parts:
        continue

    if "node_modules" in path.parts:
        continue

    if path.suffix.lower() not in TEXT_EXTENSIONS:
        continue

    try:
        content = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue

    original = content

    for old_name, new_name in REPLACEMENTS.items():
        content = content.replace(old_name, new_name)

    if content != original:
        path.write_text(content, encoding="utf-8")
        changed_files.append(path.relative_to(ROOT))

print("REFERÊNCIAS ATUALIZADAS")
print("-" * 70)

for path in changed_files:
    print(f"  {path}")

if not changed_files:
    print("  Nenhuma referência adicional encontrada.")

print()

# ---------------------------------------------------------------------
# 3. Procurar referências antigas que sobraram
# ---------------------------------------------------------------------

print("VERIFICAÇÃO DE REFERÊNCIAS ANTIGAS")
print("-" * 70)

remaining = []

for path in ROOT.rglob("*"):
    if not path.is_file():
        continue

    if ".git" in path.parts:
        continue

    if "node_modules" in path.parts:
        continue

    if path.suffix.lower() not in TEXT_EXTENSIONS:
        continue

    try:
        content = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        continue

    for old_name in RENAMES:
        if old_name in content:
            remaining.append((path.relative_to(ROOT), old_name))

if remaining:
    print("ATENÇÃO: foram encontradas referências antigas:")

    for path, old_name in remaining:
        print(f"  {path}: {old_name}")

else:
    print("  OK! Nenhuma referência antiga foi encontrada.")

print()

# ---------------------------------------------------------------------
# 4. Relatório de arquivos que não existiam
# ---------------------------------------------------------------------

if missing:
    print("ARQUIVOS ANTIGOS NÃO ENCONTRADOS")
    print("-" * 70)

    for name in missing:
        print(f"  {name}")

    print()

# ---------------------------------------------------------------------
# 5. Relatório de conflitos
# ---------------------------------------------------------------------

if conflicts:
    print("CONFLITOS — NÃO RENOMEADOS")
    print("-" * 70)

    for old_name, new_name in conflicts:
        print(f"  {old_name} -> {new_name}")
        print(f"  O destino '{new_name}' já existe.")

    print()

# ---------------------------------------------------------------------
# Final
# ---------------------------------------------------------------------

print("=" * 70)
print("CONCLUÍDO")
print("=" * 70)
print()
print(f"Arquivos renomeados:       {len(renamed)}")
print(f"Arquivos com referências:  {len(changed_files)}")
print(f"Referências restantes:     {len(remaining)}")
print()

if remaining:
    print(
        "Revise as referências listadas acima antes de fazer o commit."
    )
else:
    print(
        "Tudo certo. Agora confira com:"
    )
    print()
    print("    git status")
    print()
    print("e depois faça o commit normalmente.")

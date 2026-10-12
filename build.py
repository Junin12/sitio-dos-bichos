#!/usr/bin/env python3
"""Gera os HTMLs do jogo juntando src/template.html com src/logic.js.

Uso:
  python3 build.py            gera sitio-dos-bichos.html (offline, jogadores simulados)
  python3 build.py --online   gera também docs/index.html (conectado ao Supabase; vai para o GitHub Pages)

A versão online usa config.online.json (URL e chave pública do projeto Supabase).
"""
import json
import sys
from pathlib import Path

raiz = Path(__file__).parent
ler = lambda *p: (raiz.joinpath(*p)).read_text(encoding="utf-8")
template = ler("src", "template.html")
logica = ler("src", "logic.js")

for nome, texto in (("src/logic.js", logica), ("src/api.js", ler("src", "api.js")), ("src/online.js", ler("src", "online.js"))):
    if "</script>" in texto:
        raise SystemExit(f"{nome} não pode conter </script>")
if "/*LOGIC*/" not in template or "/*ONLINE*/" not in template:
    raise SystemExit("src/template.html precisa dos marcadores /*LOGIC*/ e /*ONLINE*/")

base = template.replace("/*LOGIC*/", logica)

saida = raiz / "sitio-dos-bichos.html"
saida.write_text(base.replace("/*ONLINE*/", ""), encoding="utf-8")
print(f"Gerado {saida.name} ({saida.stat().st_size} bytes)")

if "--online" in sys.argv:
    cfg = json.loads(ler("config.online.json"))
    api = ler("src", "api.js").replace("export const", "const").replace("export function", "function")
    online = f"window.SITIO_CONFIG = {json.dumps(cfg)};\n{api}\n{ler('src', 'online.js')}"
    html = base.replace("/*ONLINE*/", online)
    cdn = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>\n'
    if "<script>" not in html:
        raise SystemExit("template sem <script>")
    # a biblioteca precisa carregar antes do script do jogo
    html = html.replace("<script>", cdn + "<script>", 1)
    (raiz / "docs").mkdir(exist_ok=True)
    (raiz / "docs" / "index.html").write_text(html, encoding="utf-8")
    (raiz / "docs" / ".nojekyll").write_text("", encoding="utf-8")
    print(f"Gerado docs/index.html ({len(html)} bytes)")

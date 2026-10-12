#!/usr/bin/env python3
"""Gera sitio-dos-bichos.html juntando src/template.html com src/logic.js.

Uso: python3 build.py
"""
from pathlib import Path

raiz = Path(__file__).parent
template = (raiz / "src" / "template.html").read_text(encoding="utf-8")
logica = (raiz / "src" / "logic.js").read_text(encoding="utf-8")

if "</script>" in logica:
    raise SystemExit("src/logic.js não pode conter </script>")
if "/*LOGIC*/" not in template:
    raise SystemExit("src/template.html precisa do marcador /*LOGIC*/")

saida = raiz / "sitio-dos-bichos.html"
saida.write_text(template.replace("/*LOGIC*/", logica), encoding="utf-8")
print(f"Gerado {saida.name} ({saida.stat().st_size} bytes)")

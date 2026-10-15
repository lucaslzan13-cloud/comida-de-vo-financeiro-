from pathlib import Path
p=Path('clientes.html')
s=p.read_text()
s=s.replace("let state={clients:[],events:[]},selectedId=null,deferredPrompt=null,db=null;", "let state={clients:[],events:[]},selectedId=null,deferredPrompt=null,db=null,dialogResolve=null;")
p.write_text(s)

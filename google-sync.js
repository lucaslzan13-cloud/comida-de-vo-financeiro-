/* Comida de Vó — conexão Google (interface central compartilhada)
   A conexão real é feita por uma URL de backend Google configurada uma única vez.
   Nunca peça nem armazene senha do Google dentro do aplicativo. */
(function(){
  if(window.__CDV_GOOGLE_SYNC__) return; window.__CDV_GOOGLE_SYNC__=true;
  const KEY='cdv_google_sync_v1';
  const old=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}})();
  const css=`#cdvGoogleBtn{position:fixed;top:12px;right:12px;z-index:99999;border:0;border-radius:999px;padding:9px 13px;background:#fff;color:#111827;box-shadow:0 3px 14px rgba(0,0,0,.14);font:600 13px system-ui;cursor:pointer}#cdvGoogleShade{position:fixed;inset:0;background:rgba(17,24,39,.48);z-index:100000;display:none;align-items:center;justify-content:center;padding:18px}#cdvGoogleCard{width:min(430px,100%);background:#fff;border-radius:22px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:system-ui;color:#111827}#cdvGoogleCard h3{margin:0 0 6px;font-size:20px}#cdvGoogleCard p{margin:7px 0 16px;color:#6b7280;font-size:14px;line-height:1.45}#cdvGoogleCard input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #d1d5db;border-radius:12px;font-size:15px;margin:5px 0 10px}#cdvGoogleCard button{border:0;border-radius:12px;padding:12px 15px;font-weight:700;font-size:14px;cursor:pointer;margin:4px 4px 0 0}#cdvGoogleConnect{background:#111827;color:#fff}#cdvGoogleClose{background:#f3f4f6;color:#111827}#cdvGoogleStatus{margin-top:12px;padding:10px;border-radius:10px;background:#f9fafb;font-size:13px}#cdvGoogleStatus.ok{background:#ecfdf5;color:#065f46}`;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  const btn=document.createElement('button');btn.id='cdvGoogleBtn';btn.textContent=old.email?'Google conectado':'Conectar Google';document.body.appendChild(btn);
  const shade=document.createElement('div');shade.id='cdvGoogleShade';shade.innerHTML=`<div id="cdvGoogleCard"><h3>Conectar Google</h3><p>Use a mesma conta Google no seu celular, no celular da funcionária e depois no computador. A senha do Google nunca é salva aqui.</p><label>Conta Google</label><input id="cdvGoogleEmail" type="email" autocomplete="email" placeholder="seunegocio@gmail.com"><label>Endereço de conexão</label><input id="cdvGoogleUrl" type="url" placeholder="URL fornecida na configuração do Google"><div id="cdvGoogleStatus"></div><button id="cdvGoogleConnect">Conectar</button><button id="cdvGoogleClose">Fechar</button></div>`;document.body.appendChild(shade);
  const email=shade.querySelector('#cdvGoogleEmail'),url=shade.querySelector('#cdvGoogleUrl'),status=shade.querySelector('#cdvGoogleStatus');email.value=old.email||'';url.value=old.url||'';
  function showStatus(){if(old.email){status.className='ok';status.textContent='Conta configurada: '+old.email+'. Use a mesma conta nos outros aparelhos.'}else status.textContent='Ainda não conectado. Primeiro configure a conta Google.'}
  btn.onclick=()=>{shade.style.display='flex';showStatus()};shade.querySelector('#cdvGoogleClose').onclick=()=>shade.style.display='none';shade.onclick=e=>{if(e.target===shade)shade.style.display='none'};
  shade.querySelector('#cdvGoogleConnect').onclick=()=>{
    const e=email.value.trim(),u=url.value.trim();
    if(!e||!e.includes('@')){status.className='';status.textContent='Digite o e-mail da conta Google.';return}
    if(!u){status.className='';status.textContent='A conexão Google ainda precisa ser configurada. O aplicativo não guarda sua senha.';return}
    try{localStorage.setItem(KEY,JSON.stringify({email:e,url:u,connectedAt:new Date().toISOString()}));Object.assign(old,{email:e,url:u});btn.textContent='Google conectado';status.className='ok';status.textContent='Conta configurada. Agora use esta mesma conta e esta conexão nos outros aparelhos.'}catch(_){status.textContent='Não foi possível salvar a configuração neste aparelho.'}
  };
})();

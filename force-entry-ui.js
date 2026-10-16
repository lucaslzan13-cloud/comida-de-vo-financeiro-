/* Força a separação visual de Entrada/Gasto no Financeiro. */
(function(){
  const ENTRY=['Dinheiro','Cartão','Pix','Pix Online','iFood'];
  let lastMode='';

  function isEntry(){
    const b=document.getElementById('inBtn');
    return !!b && b.classList.contains('active');
  }
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
  function forceEntry(){
    if(!isEntry())return;
    const chips=document.getElementById('chips');
    const select=document.getElementById('categorySelect');
    if(!chips||!select)return;
    let selected='Dinheiro';
    try{if(ENTRY.includes(window.__cdvEntryMethod))selected=window.__cdvEntryMethod;else if(typeof currentCategory!=='undefined'&&ENTRY.includes(currentCategory))selected=currentCategory;else currentCategory='Dinheiro'}catch(_){ }
    try{currentCategory=selected}catch(_){ }
    chips.innerHTML=ENTRY.map(m=>`<button type="button" class="chip ${m===selected?'selected':''}" data-force-entry="${escAttr(m)}">${esc(m)}</button>`).join('');
    select.innerHTML=ENTRY.map(m=>`<option value="${escAttr(m)}" ${m===selected?'selected':''}>${esc(m)}</option>`).join('');
    const label=select.parentElement&&select.parentElement.querySelector('label');
    if(label)label.textContent='Forma de recebimento';
    lastMode='in';
  }
  function restoreOut(){
    if(isEntry())return;
    if(lastMode==='in'){
      try{if(typeof renderCats==='function')renderCats()}catch(_){ }
      const select=document.getElementById('categorySelect');
      const label=select?.parentElement?.querySelector('label');
      if(label)label.textContent='Categoria escolhida';
    }
    lastMode='out';
  }
  function enforce(){if(isEntry())forceEntry();else restoreOut()}

  document.addEventListener('click',function(e){
    const entryMethod=e.target.closest('[data-force-entry]');
    if(entryMethod&&isEntry()){
      const m=entryMethod.getAttribute('data-force-entry');
      window.__cdvEntryMethod=m;
      try{currentCategory=m}catch(_){ }
      e.preventDefault();e.stopImmediatePropagation();forceEntry();return;
    }
    const inBtn=e.target.closest('#inBtn');
    const outBtn=e.target.closest('#outBtn');
    if(inBtn||outBtn)setTimeout(enforce,0);
  },true);

  const obs=new MutationObserver(()=>{if(isEntry())forceEntry()});
  function start(){
    obs.observe(document.getElementById('chips')||document.body,{childList:true,subtree:true});
    enforce();
    setTimeout(enforce,50);setTimeout(enforce,250);setTimeout(enforce,700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

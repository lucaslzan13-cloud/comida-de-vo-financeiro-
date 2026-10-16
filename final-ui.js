/* Correção final da interface — Comida de Vó Financeiro. */
(function(){
  const ENTRY=['Dinheiro','Cartão','Pix','Pix Online','iFood'];
  const originalSetType=window.setType;
  const originalSelectCategory=window.selectCategory;
  const originalRenderCats=window.renderCats;

  function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#039;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

  function renderEntry(){
    const chips=document.getElementById('chips');
    const select=document.getElementById('categorySelect');
    if(!chips||!select)return;
    let selected='Dinheiro';
    try{selected=ENTRY.includes(currentCategory)?currentCategory:'Dinheiro';currentCategory=selected}catch(_){ }
    chips.innerHTML=ENTRY.map(m=>`<button type="button" class="chip ${m===selected?'selected':''}" data-entry-method="${escAttr(m)}">${esc(m)}</button>`).join('');
    select.innerHTML=ENTRY.map(m=>`<option value="${escAttr(m)}" ${m===selected?'selected':''}>${esc(m)}</option>`).join('');
    const label=select.parentElement?.querySelector('label');
    if(label)label.textContent='Forma de recebimento';
  }

  function renderOut(){
    try{originalRenderCats?.()}catch(_){ }
    const select=document.getElementById('categorySelect');
    const label=select?.parentElement?.querySelector('label');
    if(label)label.textContent='Categoria escolhida';
  }

  window.__cdvRefreshEntryUI=function(){
    let isEntry=false;
    try{isEntry=currentType==='in'}catch(_){isEntry=document.getElementById('inBtn')?.classList.contains('active')===true}
    if(isEntry)renderEntry();else renderOut();
  };

  window.__cdvSelectEntryMethod=function(method){
    if(!ENTRY.includes(method))return;
    try{currentCategory=method}catch(_){ }
    renderEntry();
  };

  window.setType=function(type){
    originalSetType(type);
    if(type==='in')renderEntry();else renderOut();
  };

  window.selectCategory=function(cat){
    let isEntry=false;
    try{isEntry=currentType==='in'}catch(_){ }
    if(isEntry){
      if(ENTRY.includes(cat)){try{currentCategory=cat}catch(_){ }renderEntry();}
      return;
    }
    originalSelectCategory(cat);
  };

  document.addEventListener('click',function(e){
    const btn=e.target.closest('[data-entry-method]');
    if(!btn)return;
    const method=btn.getAttribute('data-entry-method');
    try{currentCategory=method}catch(_){ }
    renderEntry();
  },true);

  function hardRefresh(){
    try{
      if(document.getElementById('inBtn')?.classList.contains('active'))renderEntry();
      else renderOut();
    }catch(_){ }
  }

  window.addEventListener('load',hardRefresh);
  setTimeout(hardRefresh,50);
  setTimeout(hardRefresh,250);
})();

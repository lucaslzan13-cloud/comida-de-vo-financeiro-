(function(){
  const ENTRY_METHODS=['Dinheiro','Cartão','Pix','Pix Online','iFood'];
  const originalSetType=window.setType;
  const originalSelectCategory=window.selectCategory;
  const originalRenderCats=window.renderCats;
  const esc=s=>String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const escAttr=s=>String(s).replace(/&/g,'&amp;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

  function renderEntry(){
    const chips=document.getElementById('chips');
    const select=document.getElementById('categorySelect');
    if(!chips||!select)return;
    if(!ENTRY_METHODS.includes(currentCategory)) currentCategory='Dinheiro';
    chips.innerHTML=ENTRY_METHODS.map(m=>`<button class="chip ${m===currentCategory?'selected':''}" onclick="selectCategory('${escAttr(m)}')">${esc(m)}</button>`).join('');
    select.innerHTML=ENTRY_METHODS.map(m=>`<option value="${escAttr(m)}" ${m===currentCategory?'selected':''}>${esc(m)}</option>`).join('');
    const label=select.parentElement&&select.parentElement.querySelector('label');
    if(label)label.textContent='Forma de recebimento';
  }

  window.setType=function(type){
    originalSetType(type);
    if(type==='in'){
      currentCategory=ENTRY_METHODS.includes(currentCategory)?currentCategory:'Dinheiro';
      renderEntry();
    }else{
      const label=document.getElementById('categorySelect')?.parentElement?.querySelector('label');
      if(label)label.textContent='Categoria escolhida';
      originalRenderCats();
    }
  };

  window.selectCategory=function(cat){
    if(currentType==='in'){
      if(ENTRY_METHODS.includes(cat)){currentCategory=cat;renderEntry();}
      return;
    }
    originalSelectCategory(cat);
  };

  if(currentType==='in') renderEntry();
})();

/* Comida de Vó — interface simplificada e edição do histórico. */
(function(){
  const css=document.createElement('style');
  css.textContent=`
    .clean-fields{display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px}
    .clean-fields label{font-size:11px;color:#6b7280;display:block;margin:0 0 4px 2px}
    .clean-fields input{width:100%;padding:11px;border:1px solid #d1d5db;border-radius:11px;background:#fff;outline:none}
    .clean-fields input:focus{border-color:#111827}
    .editing-note{display:none;margin-top:8px;padding:8px 10px;border-radius:10px;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:700;text-align:center}
    .editing-note.show{display:block}
    .history-edit{padding:4px 7px;margin-top:4px;font-size:10px;border:0;border-radius:8px;background:#e5e7eb;color:#111827;font-weight:800;margin-right:4px}
    .history-delete{margin-left:0}
    #lastBox{display:none!important}
  `;
  document.head.appendChild(css);

  let editingId=null;
  const ENTRY_METHODS=['Dinheiro','Cartão','Pix','Pix Online','iFood'];

  function setup(){
    const quick=document.querySelector('.quick');
    const details=document.querySelector('.details');
    if(!quick||!details)return;

    const date=document.getElementById('date');
    const desc=document.getElementById('desc');
    const dateWrap=date?.parentElement;
    const fields=document.createElement('div');
    fields.className='clean-fields';
    if(dateWrap){
      const label=dateWrap.querySelector('label');
      if(label)label.textContent='Data';
      fields.appendChild(dateWrap);
    }
    if(desc){
      const descWrap=document.createElement('div');
      const label=document.createElement('label');
      label.textContent='Descrição (opcional)';
      descWrap.appendChild(label);
      descWrap.appendChild(desc);
      fields.appendChild(descWrap);
    }
    const save=document.querySelector('.save');
    if(save)quick.insertBefore(fields,save);
    details.remove();
    document.querySelector('.hint')?.remove();
    // Keep the original element in the DOM: the existing save routine refers to it.
    const lastBox=document.getElementById('lastBox');
    if(lastBox)lastBox.style.display='none';

    const note=document.createElement('div');
    note.id='editingNote';
    note.className='editing-note';
    note.textContent='Editando lançamento';
    if(save)save.parentNode.insertBefore(note,save);

    if(date&&!date.value)date.value=new Date().toISOString().slice(0,10);

    // Install hooks after the inline page scripts and the Google-sync module.
    window.__cdvEdit=function(id){
      const item=(typeof data!=='undefined'?data:[]).find(x=>String(x.id)===String(id));
      if(!item)return;
      editingId=id;
      if(item.type==='in'){
        const method=ENTRY_METHODS.includes(item.category)?item.category:'Dinheiro';
        try{localStorage.setItem('cdv_financeiro_entry_method',method)}catch(_){}
        window.setType?.('in');
        window.__cdvSelectEntryMethod?.(method);
      }else{
        window.setType?.('out');
        window.selectCategory?.(item.category);
      }
      if(typeof currentCategory!=='undefined'&&item.type!=='in')currentCategory=item.category;

      const amount=document.getElementById('amount');
      const dateInput=document.getElementById('date');
      const descInput=document.getElementById('desc');
      if(amount)amount.value=String(item.amount).replace('.',',');
      if(dateInput)dateInput.value=item.date||new Date().toISOString().slice(0,10);
      if(descInput)descInput.value=item.desc===item.category?'':(item.desc||'');
      note.classList.add('show');
      if(save)save.textContent='Salvar alteração';
      window.__cdvRefreshEntryUI?.();
      quick.scrollIntoView({behavior:'smooth',block:'start'});
      amount?.focus();
    };

    const originalAdd=window.add;
    window.add=async function(){
      if(!editingId)return originalAdd?.();

      const amountEl=document.getElementById('amount');
      const raw=String(amountEl?.value||'').replace(/R\$\s?/gi,'').trim();
      const normalized=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
      const amount=Number(normalized)||0;
      if(!amount||amount<0){amountEl?.focus();window.showToast?.('Digite um valor válido');return}

      const item=(typeof data!=='undefined'?data:[]).find(x=>String(x.id)===String(editingId));
      if(!item)return;

      const isEntry=document.getElementById('inBtn')?.classList.contains('active');
      item.type=isEntry?'in':'out';
      item.amount=amount;
      item.date=document.getElementById('date')?.value||new Date().toISOString().slice(0,10);
      if(isEntry){
        const method=localStorage.getItem('cdv_financeiro_entry_method');
        item.category=ENTRY_METHODS.includes(method)?method:'Dinheiro';
      }else{
        item.category=typeof currentCategory!=='undefined'?currentCategory:(document.getElementById('categorySelect')?.value||'Outros');
      }
      const description=document.getElementById('desc')?.value.trim()||'';
      item.desc=description||item.category;
      item.updatedAt=Date.now();

      try{
        await persist();
        editingId=null;
        note.classList.remove('show');
        if(save)save.textContent='Salvar lançamento';
        amountEl.value='';
        document.getElementById('desc').value='';
        document.getElementById('date').value=new Date().toISOString().slice(0,10);
        window.__cdvRefreshEntryUI?.();
        window.showToast?.('Alteração salva');
        amountEl.focus();
        refreshHistory();
      }catch(e){
        window.showToast?.('Não foi possível salvar a alteração');
      }
    };

    function refreshHistory(){
      setTimeout(()=>{
        const rows=typeof filtered==='function'?filtered():[];
        document.querySelectorAll('.item').forEach((el,i)=>{
          const row=rows[i];
          if(!row||el.querySelector('.history-edit'))return;
          const del=el.querySelector('.delete');
          if(del){
            del.classList.add('history-delete');
            const edit=document.createElement('button');
            edit.className='history-edit';
            edit.textContent='Editar';
            edit.onclick=()=>window.__cdvEdit(row.id);
            del.parentNode.insertBefore(edit,del);
          }
        });
      },30);
    }

    const originalRender=window.render;
    window.render=function(){originalRender?.();refreshHistory()};
    refreshHistory();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});
  else setup();
})();

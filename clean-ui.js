/* Comida de Vó — limpeza da interface e edição do histórico. */
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
  `;
  document.head.appendChild(css);

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
      label.textContent='Descrição';
      descWrap.appendChild(label);descWrap.appendChild(desc);
      fields.appendChild(descWrap);
    }
    const save=document.querySelector('.save');
    if(save)quick.insertBefore(fields,save);
    details.remove();
    document.querySelector('.hint')?.remove();
    document.getElementById('lastBox')?.remove();
    const note=document.createElement('div');
    note.id='editingNote';note.className='editing-note';note.textContent='Editando lançamento';
    if(save)save.parentNode.insertBefore(note,save);
    if(date && !date.value)date.value=new Date().toISOString().slice(0,10);
    refreshHistory();
  }

  let editingId=null;
  window.__cdvEdit=function(id){
    const item=(typeof data!=='undefined'?data:[]).find(x=>String(x.id)===String(id));
    if(!item)return;
    editingId=id;
    if(typeof setType==='function')setType(item.type);
    if(typeof currentCategory!=='undefined')currentCategory=item.category;
    const amount=document.getElementById('amount'),date=document.getElementById('date'),desc=document.getElementById('desc');
    if(amount)amount.value=String(item.amount).replace('.',',');
    if(date)date.value=item.date||new Date().toISOString().slice(0,10);
    if(desc)desc.value=item.desc===item.category?'':(item.desc||'');
    document.getElementById('editingNote')?.classList.add('show');
    const save=document.querySelector('.save');if(save)save.textContent='Salvar alteração';
    window.__cdvRefreshEntryUI?.();
    document.querySelector('.quick')?.scrollIntoView({behavior:'smooth',block:'start'});
    amount?.focus();
  };

  const oldAdd=window.add;
  window.add=async function(){
    if(!editingId)return oldAdd?.();
    const amountEl=document.getElementById('amount');
    const raw=String(amountEl?.value||'').replace(/R\$\s?/gi,'').trim();
    const normalized=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
    const amount=Number(normalized)||0;
    if(!amount){amountEl?.focus();window.showToast?.('Digite o valor');return}
    const item=(typeof data!=='undefined'?data:[]).find(x=>String(x.id)===String(editingId));
    if(!item)return;
    item.type=document.getElementById('inBtn')?.classList.contains('active')?'in':'out';
    item.amount=amount;
    item.date=document.getElementById('date')?.value||new Date().toISOString().slice(0,10);
    item.category=typeof currentCategory!=='undefined'?currentCategory:(document.getElementById('categorySelect')?.value||'Outros');
    const d=document.getElementById('desc')?.value.trim()||'';
    item.desc=d||item.category;
    item.updatedAt=Date.now();
    await persist();
    editingId=null;
    document.getElementById('editingNote')?.classList.remove('show');
    const save=document.querySelector('.save');if(save)save.textContent='Salvar lançamento';
    amountEl.value='';document.getElementById('desc').value='';document.getElementById('date').value=new Date().toISOString().slice(0,10);
    window.__cdvRefreshEntryUI?.();
    window.showToast?.('Alteração salva');
    amountEl.focus();
    refreshHistory();
  };

  function refreshHistory(){
    setTimeout(()=>{
      const rows=typeof filtered==='function'?filtered():[];
      document.querySelectorAll('.item').forEach((el,i)=>{
        const row=rows[i];if(!row)return;
        if(el.querySelector('.history-edit'))return;
        const del=el.querySelector('.delete');
        if(del){
          del.classList.add('history-delete');
          const edit=document.createElement('button');
          edit.className='history-edit';edit.textContent='Editar';edit.onclick=()=>window.__cdvEdit(row.id);
          del.parentNode.insertBefore(edit,del);
        }
      });
    },30);
  }

  const oldRender=window.render;
  window.render=function(){oldRender?.();refreshHistory()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();

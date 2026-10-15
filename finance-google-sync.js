/* Comida de Vó — sincronização do Financeiro com Google/Firebase. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence, onAuthStateChanged, signInWithRedirect, getRedirectResult, signInWithCredential, signOut } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js';

const firebaseConfig={apiKey:'AIza'+'SyB7MMqSiB60cx68s6u8tfxk3CFjQWuCsY8',authDomain:'symmetric-curve-475011-h8.firebaseapp.com',projectId:'symmetric-curve-475011-h8',storageBucket:'symmetric-curve-475011-h8.firebasestorage.app',messagingSenderId:'684260435515',appId:'1:684260435515:web:b67441528fde0229fc5e1e',measurementId:'G-1VX25P67PM'};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
const LOCAL='cdv_financeiro_v2',META='cdv_financeiro_sync_meta',CONNECTED='cdv_financeiro_google_connected';
let lastLocal='',writingRemote=false,ready=false,watchStarted=false,authResolved=false;
function localState(){try{const s=localStorage.getItem(LOCAL);return s?JSON.parse(s):[]}catch(_){return []}}
function readMeta(){try{return JSON.parse(localStorage.getItem(META)||'{}')}catch(_){return {}}}
function writeMeta(updatedAt){try{localStorage.setItem(META,JSON.stringify({updatedAt:Number(updatedAt)||Date.now()}))}catch(_) {}}
function setStatus(t,kind=''){const e=document.getElementById('status');if(e){e.textContent=t;e.className='status '+kind}}
function applyState(s){if(!Array.isArray(s))return;window.__cdvFinanceApplyingSync=true;window.__cdvFinanceSetData?.(s);window.__cdvFinanceApplyingSync=false}
function saveLocal(s,updatedAt=Date.now()){try{localStorage.setItem(LOCAL,JSON.stringify(s));lastLocal=JSON.stringify(s);writeMeta(updatedAt)}catch(_) {}}
function ui(){if(document.getElementById('cdvGoogleSync'))return;const wrap=document.createElement('div');wrap.id='cdvGoogleSync';wrap.style.cssText='margin-top:9px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap';wrap.innerHTML='<button id="cdvGoogleSyncBtn" class="secondary" style="width:auto;padding:9px 13px">Conectar Google</button><button id="cdvGoogleLogout" class="secondary danger" style="display:none;width:auto;padding:9px 13px">Desconectar</button>';const status=document.getElementById('status');if(status?.parentElement)status.parentElement.insertBefore(wrap,status.nextSibling);const b=document.getElementById('cdvGoogleSyncBtn'),logout=document.getElementById('cdvGoogleLogout');b.onclick=async()=>{try{setStatus('Abrindo a conta Google...');if(window.AndroidGoogle?.signInGoogle){window.AndroidGoogle.signInGoogle()}else{await signInWithRedirect(auth,provider)}}catch(e){setStatus('Não foi possível iniciar o Google: '+(e.code||e.message),'warn')}};logout.onclick=async()=>{try{await signOut(auth);localStorage.removeItem(CONNECTED);setStatus('Conta Google desconectada. Os dados locais continuam neste aparelho.','warn');updateUI(null)}catch(e){setStatus('Não foi possível desconectar.','warn')}}}
function updateUI(u){const b=document.getElementById('cdvGoogleSyncBtn'),logout=document.getElementById('cdvGoogleLogout');if(!b||!logout)return;if(u){localStorage.setItem(CONNECTED,'1');b.textContent='Google conectado';b.disabled=true;logout.style.display='inline-block'}else{b.textContent='Conectar Google';b.disabled=false;logout.style.display='none'}}
async function push(u,s,updatedAt=Date.now()){if(!u||writingRemote)return;const stamp=Number(updatedAt)||Date.now();await setDoc(doc(db,'users',u.uid),{financeiroState:s,financeiroUpdatedAt:stamp,financeiroEmail:u.email||null},{merge:true});lastLocal=JSON.stringify(s);writeMeta(stamp);setStatus('Sincronização Google ativa. Última alteração enviada.','ok')}
async function pull(u){const ref=doc(db,'users',u.uid),snap=await getDoc(ref),local=localState(),meta=readMeta(),localUpdated=Number(meta.updatedAt)||0;if(!snap.exists()){if(local.length)await push(u,local,localUpdated||Date.now());return local}const remote=Array.isArray(snap.data().financeiroState)?snap.data().financeiroState:[],remoteUpdated=Number(snap.data().financeiroUpdatedAt)||0,remoteJson=JSON.stringify(remote),localJson=JSON.stringify(local);if(remoteUpdated>localUpdated){writingRemote=true;saveLocal(remote,remoteUpdated);writingRemote=false;applyState(remote);setStatus('Dados financeiros sincronizados do Google.','ok');return remote}if(localUpdated>remoteUpdated){await push(u,local,localUpdated);return local}if(remoteJson!==localJson&&remote.length){writingRemote=true;saveLocal(remote,remoteUpdated||Date.now());writingRemote=false;applyState(remote);setStatus('Dados financeiros sincronizados do Google.','ok');return remote}lastLocal=localJson;return local}
function watch(u){if(watchStarted)return;watchStarted=true;onSnapshot(doc(db,'users',u.uid),async snap=>{if(!snap.exists()||writingRemote)return;const remote=snap.data().financeiroState;if(!Array.isArray(remote))return;const remoteUpdated=Number(snap.data().financeiroUpdatedAt)||0,local=localState(),localUpdated=Number(readMeta().updatedAt)||0;if(remoteUpdated<=localUpdated)return;if(JSON.stringify(remote)===JSON.stringify(local)){writeMeta(remoteUpdated);lastLocal=JSON.stringify(local);return}writingRemote=true;saveLocal(remote,remoteUpdated);writingRemote=false;applyState(remote);setStatus('Atualização financeira recebida do Google.','ok')})}
window.__nativeGoogleLogin=async function(idToken){try{setStatus('Confirmando sua conta Google...');const credential=GoogleAuthProvider.credential(idToken);await signInWithCredential(auth,credential);localStorage.setItem(CONNECTED,'1');setStatus('Google conectado. Sincronizando...','ok')}catch(e){setStatus('Erro ao conectar Google: '+(e.code||e.message),'warn')}};
window.__nativeGoogleError=function(message){setStatus(message||'Não foi possível entrar com o Google.','warn')};
function monitorLocal(){setInterval(async()=>{if(!ready||writingRemote||!auth.currentUser||window.__cdvFinanceApplyingSync)return;const s=localState(),j=JSON.stringify(s);if(j!==lastLocal){const stamp=Date.now();lastLocal=j;writeMeta(stamp);try{await push(auth.currentUser,s,stamp)}catch(_){setStatus('Aguardando conexão para sincronizar.','warn')}}},1200)}

/* Correção da tela de Entradas: Entrada usa somente a forma de recebimento. */
(function(){
  const ENTRY_METHODS=['Dinheiro','Cartão','Pix','Pix Online','iFood'];
  const ENTRY_KEY='cdv_financeiro_entry_method';
  const originalSetType=window.setType;
  const originalAdd=window.add;
  let entryMode=document.getElementById('inBtn')?.classList.contains('active')||false;

  function esc(s){return String(s).replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]))}
  function escAttr(s){return String(s).replace(/&/g,'&amp;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;')}

  function renderEntryOptions(){
    const chips=document.getElementById('chips'),select=document.getElementById('categorySelect');
    if(!chips||!select)return;
    const saved=ENTRY_METHODS.includes(localStorage.getItem(ENTRY_KEY))?localStorage.getItem(ENTRY_KEY):'Dinheiro';
    localStorage.setItem(ENTRY_KEY,saved);
    chips.innerHTML=ENTRY_METHODS.map(m=>`<button class="chip ${m===saved?'selected':''}" onclick="window.__cdvSelectEntryMethod('${escAttr(m)}')">${esc(m)}</button>`).join('');
    select.innerHTML=ENTRY_METHODS.map(m=>`<option value="${escAttr(m)}" ${m===saved?'selected':''}>${esc(m)}</option>`).join('');
    const label=select.parentElement?.querySelector('label');
    if(label)label.textContent='Forma de recebimento';
    select.onchange=()=>window.__cdvSelectEntryMethod(select.value);
  }

  function restoreExpenseOptions(){
    const label=document.getElementById('categorySelect')?.parentElement?.querySelector('label');
    if(label)label.textContent='Categoria escolhida';
    window.renderCats?.();
  }

  window.__cdvSelectEntryMethod=function(method){
    if(!ENTRY_METHODS.includes(method))return;
    localStorage.setItem(ENTRY_KEY,method);
    renderEntryOptions();
  };

  window.setType=function(type){
    entryMode=type==='in';
    originalSetType?.(type);
    if(entryMode)renderEntryOptions();else restoreExpenseOptions();
  };

  window.add=async function(){
    if(!entryMode){return originalAdd?.();}
    const input=document.getElementById('amount'),dateEl=document.getElementById('date'),descEl=document.getElementById('desc');
    const raw=String(input?.value||'').trim().replace(/R\$\s?/gi,'');
    const normalized=raw.includes(',')?raw.replace(/\./g,'').replace(',','.'):raw;
    const amount=Number(normalized)||0;
    if(!amount||amount<=0){input?.focus();setStatus('Digite o valor');return;}
    const method=ENTRY_METHODS.includes(localStorage.getItem(ENTRY_KEY))?localStorage.getItem(ENTRY_KEY):'Dinheiro';
    const date=dateEl?.value||new Date().toISOString().slice(0,10);
    const desc=String(descEl?.value||'').trim();
    const data=localState();
    const item={id:crypto.randomUUID(),type:'in',amount,category:method,date,desc:desc||method,createdAt:Date.now()};
    data.unshift(item);
    window.__cdvFinanceSetData?.(data);
    input.value='';if(descEl)descEl.value='';if(dateEl)dateEl.value=date;
    renderEntryOptions();
    setStatus('Entrada salva','ok');
    const toast=document.getElementById('toast');if(toast){toast.textContent='Entrada salva';toast.classList.add('show');clearTimeout(window.__cdvEntryToast);window.__cdvEntryToast=setTimeout(()=>toast.classList.remove('show'),1400)}
    input.focus();
  };

  window.__cdvRefreshEntryUI=function(){
    entryMode=document.getElementById('inBtn')?.classList.contains('active')||false;
    if(entryMode)renderEntryOptions();
  };

  if(entryMode)renderEntryOptions();
})();

async function init(){ui();try{await setPersistence(auth,browserLocalPersistence)}catch(_){}if(!window.AndroidGoogle){try{await getRedirectResult(auth)}catch(e){setStatus('Login Google: '+(e.code||e.message),'warn')}}onAuthStateChanged(auth,async u=>{if(u){authResolved=true;updateUI(u);ready=true;try{await pull(u);watch(u);setStatus('Sincronização Google ativa.','ok')}catch(e){setStatus('Erro na sincronização: '+(e.code||e.message),'warn')}}else{authResolved=true;ready=false;updateUI(null);if(localStorage.getItem(CONNECTED)==='1')setStatus('Conectando à conta Google...')}});monitorLocal()}
init();

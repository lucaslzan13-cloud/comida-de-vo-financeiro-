/* Comida de Vó — sincronização Google/Firebase entre aparelhos.
   Sincronização por merge/transação: adições, edições e exclusões de um aparelho
   não apagam alterações feitas pelo outro aparelho. */
if (window.__CDV_GOOGLE_SYNC_LOADED) {
  // O Android não deve carregar este módulo duas vezes.
} else {
  window.__CDV_GOOGLE_SYNC_LOADED = true;

  import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js').then(async ({initializeApp})=>{
    const authMod = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js');
    const {getAuth,GoogleAuthProvider,browserLocalPersistence,setPersistence,onAuthStateChanged,signInWithRedirect,getRedirectResult,signInWithCredential,signOut}=authMod;
    const {getFirestore,doc,getDoc,setDoc,onSnapshot,runTransaction}=fsMod;

    const firebaseConfig={apiKey:'AIza'+'SyB7MMqSiB60cx68s6u8tfxk3CFjQWuCsY8',authDomain:'symmetric-curve-475011-h8.firebaseapp.com',projectId:'symmetric-curve-475011-h8',storageBucket:'symmetric-curve-475011-h8.firebasestorage.app',messagingSenderId:'684260435515',appId:'1:684260435515:web:b67441528fde0229fc5e1e',measurementId:'G-1VX25P67PM'};
    const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider();
    const LOCAL='cdv_clientes_v2',DB_NAME='cdv_clientes_db',STORE='state',CONNECTED='cdv_google_connected',META='cdv_clientes_sync_meta';
    let syncBase={clients:[],events:[]},ready=false,writingRemote=false,watchStarted=false,authResolved=false,pushQueue=Promise.resolve();

    const empty=()=>({clients:[],events:[]});
    function localState(){try{const s=localStorage.getItem(LOCAL);return s?JSON.parse(s):empty()}catch(_){return empty()}}
    function clone(s){return JSON.parse(JSON.stringify(s||empty()))}
    function key(x){return String(x?.id||'')}
    function readMeta(){try{return JSON.parse(localStorage.getItem(META)||'{}')}catch(_){return {}}}
    function writeMeta(m){try{localStorage.setItem(META,JSON.stringify(m))}catch(_){} }
    function saveMetaPatch(p){const m=readMeta();writeMeta({...m,...p})}
    function addTombstones(kind,ids){if(!ids.length)return;const m=readMeta();const k=kind==='clients'?'deletedClients':'deletedEvents';const old=Array.isArray(m[k])?m[k]:[];writeMeta({...m,[k]:[...new Set([...old,...ids])]})}
    function saveLocal(s){try{localStorage.setItem(LOCAL,JSON.stringify(s))}catch(_){};return idbPut(s)}
    function idbPut(s){return new Promise(resolve=>{try{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>{const d=r.result,tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id:'app',data:s,updatedAt:Date.now()});tx.oncomplete=()=>{d.close();resolve()};tx.onerror=()=>{d.close();resolve()}};r.onerror=()=>resolve()}catch(_){resolve()}})}
    function applyTombstones(s,m=readMeta()){const c=new Set(m.deletedClients||[]),e=new Set(m.deletedEvents||[]);return {clients:(s.clients||[]).filter(x=>!c.has(key(x))),events:(s.events||[]).filter(x=>!e.has(key(x)))} }
    function mergeState(a,b){const out={clients:[],events:[]};for(const k of ['clients','events']){const map=new Map();for(const x of (a?.[k]||[]))if(key(x))map.set(key(x),x);for(const x of (b?.[k]||[]))if(key(x))map.set(key(x),x);out[k]=[...map.values()]}return out}
    function diff(base,current){const out={clients:[],events:[],deletedClients:[],deletedEvents:[]};for(const k of ['clients','events']){const old=new Map((base?.[k]||[]).map(x=>[key(x),JSON.stringify(x)]));const now=new Map((current?.[k]||[]).map(x=>[key(x),x]));for(const [id,x] of now)if(!old.has(id)||old.get(id)!==JSON.stringify(x))out[k].push(x);for(const id of old.keys())if(!now.has(id))(k==='clients'?out.deletedClients:out.deletedEvents).push(id)}return out}

    function ui(){if(document.getElementById('cdvSyncBtn'))return;const st=document.createElement('style');st.textContent='#cdvSyncBtn{position:fixed;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);z-index:99999;border:0;border-radius:999px;padding:11px 15px;background:#fff;color:#111827;box-shadow:0 4px 18px #0003;font:800 13px system-ui;max-width:calc(100vw - 32px)}#cdvSyncShade{position:fixed;inset:0;background:#0008;display:none;align-items:center;justify-content:center;z-index:100000;padding:18px}#cdvSyncCard{width:min(390px,100%);background:#fff;border-radius:20px;padding:20px;font-family:system-ui;color:#111827;box-sizing:border-box}#cdvSyncCard h3{margin:0 0 7px;font-size:20px}#cdvSyncCard p{color:#6b7280;font-size:14px;line-height:1.45}#cdvSyncCard button{width:100%;padding:13px;border:0;border-radius:12px;margin-top:8px;font-weight:800;font-size:14px}#cdvGoogleLogin{background:#111827;color:#fff}#cdvGoogleClose{background:#f3f4f6;color:#111827}#cdvGoogleLogout{background:#fee2e2;color:#991b1b}#cdvSyncStatus{margin-top:10px;padding:10px;border-radius:10px;background:#f3f4f6;font-size:13px;line-height:1.35}';document.head.appendChild(st);const b=document.createElement('button');b.id='cdvSyncBtn';b.textContent='Conectar Google';b.style.display='none';document.body.appendChild(b);const shade=document.createElement('div');shade.id='cdvSyncShade';shade.innerHTML='<div id="cdvSyncCard"><h3>Sincronizar entre aparelhos</h3><p>Entre com a mesma conta Google neste celular e no outro aparelho. Depois do primeiro acesso, o aplicativo mantém a sessão e sincroniza as alterações automaticamente.</p><div id="cdvSyncStatus"></div><button id="cdvGoogleLogin">Entrar com Google</button><button id="cdvGoogleLogout">Sair da conta</button><button id="cdvGoogleClose">Fechar</button></div>';document.body.appendChild(shade);b.onclick=()=>{shade.style.display='flex';updateUI(auth.currentUser)};shade.querySelector('#cdvGoogleClose').onclick=()=>shade.style.display='none';shade.onclick=e=>{if(e.target===shade)shade.style.display='none'};shade.querySelector('#cdvGoogleLogin').onclick=async()=>{try{if(window.AndroidGoogle?.signInGoogle){setStatus('Abrindo a conta Google...');window.AndroidGoogle.signInGoogle()}else{await signInWithRedirect(auth,provider)}}catch(e){setStatus('Não foi possível iniciar o Google: '+(e.code||e.message))}};shade.querySelector('#cdvGoogleLogout').onclick=async()=>{localStorage.removeItem(CONNECTED);await signOut(auth);setStatus('Conta desconectada. Os dados locais continuam neste aparelho.');updateUI(null)}}
    function setStatus(t){const e=document.getElementById('cdvSyncStatus');if(e)e.textContent=t}
    function updateUI(u){const b=document.getElementById('cdvSyncBtn');if(!b)return;if(u){localStorage.setItem(CONNECTED,'1');b.style.display='none'}else{b.style.display='block';b.textContent='Conectar Google'}}

    async function transactionalMerge(u,change){
      const ref=doc(db,'clientes',u.uid);
      const result=await runTransaction(db,async tx=>{
        const snap=await tx.get(ref);
        const remote=snap.exists()?snap.data():{};
        let state=mergeState(remote.state||empty(),syncBase||empty());
        const deletedClients=new Set([...(remote.deletedClients||[]),...(change.deletedClients||[])]);
        const deletedEvents=new Set([...(remote.deletedEvents||[]),...(change.deletedEvents||[])]);
        for(const x of change.clients||[])state.clients=state.clients.filter(y=>key(y)!==key(x)).concat(x);
        for(const x of change.events||[])state.events=state.events.filter(y=>key(y)!==key(x)).concat(x);
        state=applyTombstones(state,{deletedClients:[...deletedClients],deletedEvents:[...deletedEvents]});
        const payload={state,deletedClients:[...deletedClients],deletedEvents:[...deletedEvents],updatedAt:Date.now(),email:u.email||null};
        tx.set(ref,payload,{merge:true});return state;
      });
      syncBase=clone(result);await saveLocal(result);return result;
    }
    function enqueueChange(u,current){const snapshot=clone(current),change=diff(syncBase,snapshot);addTombstones('clients',change.deletedClients);addTombstones('events',change.deletedEvents);pushQueue=pushQueue.then(async()=>{if(!auth.currentUser||auth.currentUser.uid!==u.uid)return;try{setStatus('Sincronizando alterações...');const canonical=await transactionalMerge(u,change);syncBase=clone(canonical);setStatus('Sincronização ativa.')}catch(e){setStatus('Aguardando conexão para sincronizar.')}});return pushQueue}

    async function initialSync(u){const ref=doc(db,'clientes',u.uid),snap=await getDoc(ref),local=applyTombstones(localState());if(!snap.exists()){syncBase=clone(local);if(local.clients.length||local.events.length)await transactionalMerge(u,{clients:local.clients,events:local.events,deletedClients:readMeta().deletedClients||[],deletedEvents:readMeta().deletedEvents||[]});return}
      const remote=snap.data().state||empty();const merged=applyTombstones(mergeState(remote,local));
      const changed=JSON.stringify(merged)!==JSON.stringify(remote);
      syncBase=clone(remote);if(changed){const d=diff(remote,merged);addTombstones('clients',d.deletedClients);addTombstones('events',d.deletedEvents);await transactionalMerge(u,d)}else{await saveLocal(remote);syncBase=clone(remote)}
      window.__applySyncedState?.(merged);
    }
    function watch(u){if(watchStarted)return;watchStarted=true;onSnapshot(doc(db,'clientes',u.uid),async snap=>{if(!snap.exists()||writingRemote)return;const remote=applyTombstones(snap.data().state||empty());if(JSON.stringify(remote)===JSON.stringify(localState())){syncBase=clone(remote);return}writingRemote=true;syncBase=clone(remote);await saveLocal(remote);writingRemote=false;window.__applySyncedState?.(remote);setStatus('Atualização recebida de outro aparelho.')})}

    window.__nativeGoogleLogin=async function(idToken){try{setStatus('Confirmando sua conta Google...');await signInWithCredential(auth,GoogleAuthProvider.credential(idToken));localStorage.setItem(CONNECTED,'1')}catch(e){setStatus('Erro ao conectar Google: '+(e.code||e.message))}};
    window.__nativeGoogleError=function(message){setStatus(message||'Não foi possível entrar com o Google.')};

    async function init(){
      ui();
      window.addEventListener('cdv-local-save',e=>{if(ready&&!writingRemote&&auth.currentUser)enqueueChange(auth.currentUser,e.detail||localState())});
      await setPersistence(auth,browserLocalPersistence);
      if(!window.AndroidGoogle){try{await getRedirectResult(auth)}catch(e){setStatus('Login Google: '+(e.code||e.message))}}
      onAuthStateChanged(auth,async u=>{if(u){authResolved=true;updateUI(u);ready=false;try{await initialSync(u);ready=true;watch(u);setStatus('Sincronização ativa.')}catch(e){setStatus('Erro na sincronização: '+(e.code||e.message))}}else{authResolved=true;ready=false;updateUI(null)}});
    }
    init();
  }).catch(e=>{console.error(e);const s=document.getElementById('status');if(s)s.textContent='Erro ao carregar sincronização: '+e.message});
}
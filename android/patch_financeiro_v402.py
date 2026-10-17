from pathlib import Path
import re

# Compatibilidade e dependências modernas do Credential Manager.
p = Path('financeiro/build.gradle')
s = p.read_text(encoding='utf-8')
s = s.replace("implementation 'androidx.credentials:credentials:1.3.0'", "implementation 'androidx.credentials:credentials:1.6.0'")
s = s.replace("implementation 'androidx.credentials:credentials-play-services-auth:1.3.0'", "implementation 'androidx.credentials:credentials-play-services-auth:1.6.0'")
s = s.replace("implementation 'com.google.android.libraries.identity.googleid:googleid:1.1.1'", "implementation 'com.google.android.libraries.identity.googleid:googleid:1.2.1'")
s = re.sub(r"versionCode\s+\d+", "versionCode 31", s, count=1)
s = re.sub(r"versionName\s+'[^']+'", "versionName '5.0.1'", s, count=1)
p.write_text(s, encoding='utf-8')

jp = Path('financeiro/src/main/java/br/com/comidadevo/financeiro/MainActivity.java')
j = jp.read_text(encoding='utf-8')
if 'import com.google.android.gms.common.GoogleApiAvailability;' not in j:
    j = j.replace('import com.google.firebase.FirebaseApp;', 'import com.google.android.gms.common.ConnectionResult;\nimport com.google.android.gms.common.GoogleApiAvailability;\nimport com.google.firebase.FirebaseApp;')
j = j.replace('import com.google.android.libraries.identity.googleid.GetGoogleIdOption;', 'import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;')

new_signin = '''static void signIn(Activity a){
            init(a);
            if(auth==null){show(a,"Não foi possível preparar a conexão Google.");return;}
            try{
                int gms=GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(a);
                if(gms!=ConnectionResult.SUCCESS){
                    show(a,"Google Play Services indisponível (código "+gms+"). Atualize os Serviços do Google Play e tente novamente.");
                    return;
                }
                CredentialManager cm=CredentialManager.create(a);
                GetSignInWithGoogleOption opt=new GetSignInWithGoogleOption.Builder(WEB_CLIENT_ID)
                        .setNonce(UUID.randomUUID().toString())
                        .build();
                GetCredentialRequest req=new GetCredentialRequest.Builder().addCredentialOption(opt).build();
                cm.getCredentialAsync(a,req,new CancellationSignal(),a.getMainExecutor(),new CredentialManagerCallback<GetCredentialResponse,GetCredentialException>(){
                    @Override public void onResult(@NonNull GetCredentialResponse r){
                        try{
                            Credential c=r.getCredential();
                            if(!(c instanceof CustomCredential)||!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())){
                                show(a,"O Google não retornou uma credencial de login válida.");return;
                            }
                            GoogleIdTokenCredential g=GoogleIdTokenCredential.createFrom(((CustomCredential)c).getData());
                            AuthCredential fc=GoogleAuthProvider.getCredential(g.getIdToken(),null);
                            auth.signInWithCredential(fc)
                                .addOnSuccessListener(v->{Toast.makeText(a,"Google conectado. Sincronização ativada.",Toast.LENGTH_LONG).show();a.recreate();})
                                .addOnFailureListener(e->{String m=e.getMessage()==null?e.getClass().getSimpleName():e.getMessage();show(a,"Firebase recusou o login Google: "+m);});
                        }catch(Exception e){show(a,"Não foi possível concluir o login Google: "+e.getClass().getSimpleName());}
                    }
                    @Override public void onError(@NonNull GetCredentialException e){
                        String m=e.getMessage()==null?"sem detalhes":e.getMessage();
                        show(a,"Credential Manager: "+e.getClass().getSimpleName()+" — "+m);
                    }
                });
            }catch(Exception e){show(a,"Erro ao abrir o Google: "+e.getClass().getSimpleName()+" — "+(e.getMessage()==null?"sem detalhes":e.getMessage()));}
        }
'''
pattern = r'static void signIn\(Activity a\)\{.*?\n        private static void show'
if not re.search(pattern,j,re.S):
    raise SystemExit('Método signIn não encontrado')
j = re.sub(pattern,new_signin+'\n        private static void show',j,count=1,flags=re.S)
jp.write_text(j,encoding='utf-8')

# Cria um arquivo com a impressão digital que deve ser cadastrada no Google/Firebase.
print('Financeiro Google patch aplicado com Credential Manager 1.6.0 + Google ID 1.2.1')

from pathlib import Path

p = Path('financeiro/src/main/java/br/com/comidadevo/financeiro/MainActivity.java')
s = p.read_text()
start = s.rfind('    static class GoogleSync {')
end = s.rfind('}')
if start < 0 or end <= start:
    raise SystemExit('GoogleSync não encontrado')

helper = r'''    static class GoogleSync {
        private static final String WEB_CLIENT_ID="684260435515-ijo5egmulann3o6hl2u79400cv09h1sl.apps.googleusercontent.com";
        private static final String API_KEY="AIzaSyBne-T-nOC6oLYc96jhd-tpYQxja8lNhG4";
        private static final String PROJECT_ID="symmetric-curve-475011-h8";
        private static final String AUTH_URL="https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key="+API_KEY;
        private static final String REFRESH_URL="https://securetoken.googleapis.com/v1/token?key="+API_KEY;
        private static final String DOC_BASE="https://firestore.googleapis.com/v1/projects/"+PROJECT_ID+"/databases/(default)/documents/users/";
        private static android.content.SharedPreferences sp;
        private static String idToken="",refreshToken="",uid="",email="";
        private static long expiresAt=0;
        private static boolean initialized=false;

        static void init(Activity a){
            if(sp==null)sp=a.getSharedPreferences("google_sync",Activity.MODE_PRIVATE);
            loadPrefs();
            if(!initialized){initialized=true;if(connected())pull(a);}
        }

        private static void loadPrefs(){
            if(sp==null)return;
            idToken=sp.getString("idToken","");refreshToken=sp.getString("refreshToken","");
            uid=sp.getString("uid","");email=sp.getString("email","");expiresAt=sp.getLong("expiresAt",0);
        }

        private static void savePrefs(){
            if(sp==null)return;
            sp.edit().putString("idToken",idToken).putString("refreshToken",refreshToken).putString("uid",uid).putString("email",email).putLong("expiresAt",expiresAt).apply();
        }

        static boolean connected(){return !uid.isEmpty()&&!refreshToken.isEmpty();}

        static void signIn(Activity a){
            try{
                CredentialManager cm=CredentialManager.create(a);
                GetGoogleIdOption opt=new GetGoogleIdOption.Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setAutoSelectEnabled(false)
                        .setServerClientId(WEB_CLIENT_ID)
                        .build();
                GetCredentialRequest req=new GetCredentialRequest.Builder().addCredentialOption(opt).build();
                cm.getCredentialAsync(a,req,new CancellationSignal(),a.getMainExecutor(),new CredentialManagerCallback<GetCredentialResponse,GetCredentialException>(){
                    @Override public void onResult(@NonNull GetCredentialResponse r){
                        try{
                            Credential c=r.getCredential();
                            if(!(c instanceof CustomCredential)||!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())){show(a,"Nenhuma conta Google foi selecionada.");return;}
                            GoogleIdTokenCredential g=GoogleIdTokenCredential.createFrom(((CustomCredential)c).getData());
                            final String googleToken=g.getIdToken();
                            Executors.newSingleThreadExecutor().execute(()->{
                                try{
                                    JSONObject auth=signInWithGoogle(googleToken);
                                    idToken=auth.optString("idToken","");refreshToken=auth.optString("refreshToken","");uid=auth.optString("localId","");email=auth.optString("email","");
                                    long sec=auth.optLong("expiresIn",3600);expiresAt=System.currentTimeMillis()+sec*1000L-60000L;savePrefs();
                                    pull(a);
                                    a.runOnUiThread(()->{Toast.makeText(a,"Google conectado. Sincronização ativada.",Toast.LENGTH_LONG).show();a.recreate();});
                                }catch(Exception e){show(a,"Google: "+friendly(e));}
                            });
                        }catch(Exception e){show(a,"Google: "+friendly(e));}
                    }
                    @Override public void onError(@NonNull GetCredentialException e){show(a,"Google: não foi possível abrir as contas. "+e.getMessage());}
                });
            }catch(Exception e){show(a,"Google: erro ao iniciar conexão. "+friendly(e));}
        }

        private static JSONObject signInWithGoogle(String googleToken)throws Exception{
            String post="id_token="+java.net.URLEncoder.encode(googleToken,"UTF-8")+"&providerId=google.com";
            JSONObject body=new JSONObject();body.put("postBody",post);body.put("requestUri","http://localhost");body.put("returnIdpCredential",true);body.put("returnSecureToken",true);
            return new JSONObject(http("POST",AUTH_URL,body.toString(),null,"application/json"));
        }

        private static synchronized boolean ensureToken()throws Exception{
            if(!connected())return false;
            if(idToken!=null&&!idToken.isEmpty()&&System.currentTimeMillis()<expiresAt)return true;
            String form="grant_type=refresh_token&refresh_token="+java.net.URLEncoder.encode(refreshToken,"UTF-8");
            JSONObject o=new JSONObject(http("POST",REFRESH_URL,form,null,"application/x-www-form-urlencoded"));
            idToken=o.optString("id_token","");String r=o.optString("refresh_token","");if(!r.isEmpty())refreshToken=r;
            uid=o.optString("user_id",uid);long sec=o.optLong("expires_in",3600);expiresAt=System.currentTimeMillis()+sec*1000L-60000L;savePrefs();return !idToken.isEmpty();
        }

        static void push(Activity a,JSONArray state){
            if(!connected())return;final String json=state.toString();
            Executors.newSingleThreadExecutor().execute(()->{try{if(!ensureToken())return;String doc=java.net.URLEncoder.encode(uid,"UTF-8").replace("+","%20");String url=DOC_BASE+doc+"?updateMask.fieldPaths=state&updateMask.fieldPaths=email&updateMask.fieldPaths=updatedAt";JSONObject fields=new JSONObject();fields.put("state",new JSONObject().put("stringValue",json));fields.put("email",new JSONObject().put("stringValue",email));fields.put("updatedAt",new JSONObject().put("integerValue",String.valueOf(System.currentTimeMillis())));JSONObject body=new JSONObject().put("fields",fields);http("PATCH",url,body.toString(),idToken,"application/json");}catch(Exception e){show(a,"Sincronização: "+friendly(e));}});
        }

        static void pull(Activity a){
            if(!connected())return;
            Executors.newSingleThreadExecutor().execute(()->{try{if(!ensureToken())return;String doc=java.net.URLEncoder.encode(uid,"UTF-8").replace("+","%20");String raw=http("GET",DOC_BASE+doc,null,idToken,null);JSONObject o=new JSONObject(raw);JSONObject fields=o.optJSONObject("fields");if(fields==null)return;JSONObject st=fields.optJSONObject("state");if(st==null)return;String state=st.optString("stringValue","");if(state.isEmpty())return;JSONArray ar=new JSONArray(state);a.runOnUiThread(()->{try{MainActivity m=(MainActivity)a;m.data.clear();for(int i=0;i<ar.length();i++){JSONObject z=ar.getJSONObject(i);Tx x=new Tx();x.id=z.optString("id",UUID.randomUUID().toString());x.type=z.optString("type","out");x.amount=z.optDouble("amount",0);x.category=z.optString("category","Mercado");x.date=z.optString("date",m.today());x.desc=z.optString("desc","");m.data.add(x);}m.persist();m.refresh();}catch(Exception ignored){}});}catch(Exception e){if(!(e.getMessage()!=null&&e.getMessage().contains("HTTP 404")))show(a,"Sincronização: "+friendly(e));}});
        }

        private static String http(String method,String url,String body,String bearer,String contentType)throws Exception{
            java.net.HttpURLConnection c=(java.net.HttpURLConnection)new java.net.URL(url).openConnection();c.setRequestMethod(method);c.setConnectTimeout(15000);c.setReadTimeout(20000);c.setUseCaches(false);c.setRequestProperty("Accept","application/json");if(bearer!=null&&!bearer.isEmpty())c.setRequestProperty("Authorization","Bearer "+bearer);if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type",contentType==null?"application/json":contentType);c.getOutputStream().write(body.getBytes("UTF-8"));}int code=c.getResponseCode();java.io.InputStream in=code>=400?c.getErrorStream():c.getInputStream();if(in==null)return "";java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream();byte[] b=new byte[4096];int n;while((n=in.read(b))>0)out.write(b,0,n);String resp=new String(out.toByteArray(),"UTF-8");if(code<200||code>=300)throw new java.io.IOException("HTTP "+code+" "+resp);return resp;
        }

        private static String friendly(Exception e){
            String s=e.getMessage()==null?e.toString():e.getMessage();
            try{if(s.contains("{")&&s.contains("error")){JSONObject o=new JSONObject(s);JSONObject er=o.optJSONObject("error");if(er!=null){String m=er.optString("message","");if(!m.isEmpty())return m;}}}catch(Exception ignored){}
            return s.length()>180?s.substring(0,180):s;
        }

        private static void show(Activity a,String s){a.runOnUiThread(()->Toast.makeText(a,s,Toast.LENGTH_LONG).show());}
    }
'''

p.write_text(s[:start] + helper + s[end:])

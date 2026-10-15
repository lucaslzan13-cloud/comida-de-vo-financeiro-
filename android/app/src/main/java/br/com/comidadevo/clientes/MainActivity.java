package br.com.comidadevo.clientes;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;

import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONObject;

import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    // Versão na URL evita que o WebView reutilize uma versão antiga do HTML/sincronização.
    private static final String APP_URL = "https://lucaslzan13-cloud.github.io/comida-de-vo-financeiro-/clientes.html?v=13";
    private WebView webView;
    private CredentialManager credentialManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(17, 24, 39));
        getWindow().setNavigationBarColor(Color.rgb(243, 244, 246));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(17, 24, 39));
        webView = new WebView(this);
        ProgressBar progress = new ProgressBar(this);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(72, 72);
        progressParams.gravity = android.view.Gravity.CENTER;

        int statusBarHeight = 0;
        int statusBarId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (statusBarId > 0) statusBarHeight = getResources().getDimensionPixelSize(statusBarId);
        root.setPadding(0, statusBarHeight, 0, 0);

        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        root.addView(progress, progressParams);
        setContentView(root);

        credentialManager = CredentialManager.create(this);
        webView.addJavascriptInterface(new GoogleBridge(this), "AndroidGoogle");

        webView.setBackgroundColor(Color.rgb(243, 244, 246));
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setSaveEnabled(true);
        webView.setHapticFeedbackEnabled(true);
        webView.setWebChromeClient(new WebChromeClient());

        android.webkit.WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);
        // Não deixa o WebView manter a versão antiga do app/sync em cache.
        settings.setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE);
        settings.setMediaPlaybackRequiresUserGesture(true);
        if (android.os.Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return false; }
            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(android.view.View.GONE);
                // A página clientes.html já carrega google-sync.js.
                // Não injetar o módulo novamente: duas instâncias causavam concorrência
                // entre listeners do Firebase e podiam fazer um aparelho sobrescrever o outro.
                view.evaluateJavascript("(function(){document.documentElement.style.webkitUserSelect='none';document.documentElement.style.userSelect='none';document.documentElement.style.webkitTouchCallout='none';document.addEventListener('contextmenu',function(e){var t=e.target;if(!t.matches('input,textarea,select,[contenteditable=true]'))e.preventDefault();},{passive:false});document.addEventListener('selectstart',function(e){var t=e.target;if(!t.matches('input,textarea,select,[contenteditable=true]'))e.preventDefault();},{passive:false});})();", null);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) { progress.setVisibility(android.view.View.GONE); }
        });

        if (savedInstanceState == null) webView.loadUrl(APP_URL);
        else { webView.restoreState(savedInstanceState); progress.setVisibility(android.view.View.GONE); }
    }

    private void sendToWeb(String function, String value) {
        String safe = JSONObject.quote(value == null ? "" : value);
        runOnUiThread(() -> {
            if (webView != null) webView.evaluateJavascript("window." + function + " && window." + function + "(" + safe + ")", null);
        });
    }

    private final class GoogleBridge {
        private final Context context;
        GoogleBridge(Context context) { this.context = context; }

        @JavascriptInterface
        public void signInGoogle() {
            runOnUiThread(() -> {
                String webClientId = getString(R.string.google_web_client_id);
                if (webClientId.startsWith("COLOQUE_AQUI")) {
                    sendToWeb("__nativeGoogleError", "Falta configurar o Client ID Web do Google.");
                    return;
                }

                GetSignInWithGoogleOption googleOption = new GetSignInWithGoogleOption.Builder(webClientId).build();
                GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(googleOption).build();
                credentialManager.getCredentialAsync(context, request, new CancellationSignal(), Executors.newSingleThreadExecutor(), new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override public void onResult(@NonNull GetCredentialResponse result) {
                        try {
                            Credential credential = result.getCredential();
                            if (credential instanceof CustomCredential && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                                GoogleIdTokenCredential googleCredential = GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
                                sendToWeb("__nativeGoogleLogin", googleCredential.getIdToken());
                            } else sendToWeb("__nativeGoogleError", "A conta escolhida não retornou uma credencial Google válida.");
                        } catch (Exception e) { sendToWeb("__nativeGoogleError", "Não foi possível ler a conta Google."); }
                    }
                    @Override public void onError(@NonNull GetCredentialException e) { sendToWeb("__nativeGoogleError", e.getLocalizedMessage() == null ? "Não foi possível entrar com o Google." : e.getLocalizedMessage()); }
                });
            });
        }
    }

    @Override protected void onSaveInstanceState(Bundle outState) { webView.saveState(outState); super.onSaveInstanceState(outState); }
    @Override public void onBackPressed() { if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { if (webView != null) { webView.stopLoading(); webView.loadUrl("about:blank"); webView.destroy(); } super.onDestroy(); }
}

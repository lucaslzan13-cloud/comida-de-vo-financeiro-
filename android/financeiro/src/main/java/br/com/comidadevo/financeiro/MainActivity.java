package br.com.comidadevo.financeiro;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://lucaslzan13-cloud.github.io/comida-de-vo-financeiro-/";
    private WebView webView;

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(17,24,39));
        getWindow().setNavigationBarColor(Color.rgb(243,244,246));

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        ProgressBar progress = new ProgressBar(this);
        FrameLayout.LayoutParams pp = new FrameLayout.LayoutParams(72,72);
        pp.gravity = android.view.Gravity.CENTER;
        root.addView(webView, new FrameLayout.LayoutParams(-1,-1));
        root.addView(progress, pp);
        setContentView(root);

        webView.setBackgroundColor(Color.rgb(243,244,246));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setSaveEnabled(true);
        webView.setHapticFeedbackEnabled(true);
        webView.setWebChromeClient(new WebChromeClient());

        android.webkit.WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);
        settings.setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
        if (android.os.Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return false; }
            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                view.evaluateJavascript("(function(){document.documentElement.style.webkitUserSelect='none';document.documentElement.style.userSelect='none';document.documentElement.style.webkitTouchCallout='none';document.addEventListener('contextmenu',function(e){var t=e.target;if(!t.matches('input,textarea,select,[contenteditable=true]'))e.preventDefault();},{passive:false});document.addEventListener('selectstart',function(e){var t=e.target;if(!t.matches('input,textarea,select,[contenteditable=true]'))e.preventDefault();},{passive:false});})();", null);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) { progress.setVisibility(View.GONE); }
        });

        if (savedInstanceState == null) webView.loadUrl(APP_URL);
        else { webView.restoreState(savedInstanceState); progress.setVisibility(View.GONE); }
    }

    @Override protected void onSaveInstanceState(Bundle outState) { webView.saveState(outState); super.onSaveInstanceState(outState); }
    @Override public void onBackPressed() { if (webView != null && webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { if (webView != null) { webView.stopLoading(); webView.loadUrl("about:blank"); webView.destroy(); } super.onDestroy(); }
}

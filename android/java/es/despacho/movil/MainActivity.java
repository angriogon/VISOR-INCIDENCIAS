package es.despacho.movil;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

// ATGO en una ventana. Al cargar cada página se inyecta cargador.js, que abre Despacho móvil cuando hay sesión.
// La app no lee ni guarda la sesión: todo ocurre dentro de la página de ATGO, igual que en el navegador.
// Lo que no es de ATGO (teléfono, correo, WhatsApp, Maps) se abre fuera, en su app.
public class MainActivity extends Activity {
    private static final String ATGO = "https://atgo.tier1.es/";
    private WebView web;
    private String cargador = "";

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        cargador = leerAsset("cargador.js");
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setUserAgentString(s.getUserAgentString() + " DespachoApp/1");
        CookieManager.getInstance().setAcceptCookie(true);

        web.setWebChromeClient(new WebChromeClient());   // avisos y confirmaciones de la página
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("https".equals(u.getScheme()) && "atgo.tier1.es".equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* sin app para abrirlo */ }
                return true;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                if (url != null && url.startsWith(ATGO)) v.evaluateJavascript(cargador, null);
            }
        });

        if (estado != null) web.restoreState(estado);
        if (web.getUrl() == null) web.loadUrl(ATGO);
    }

    @Override
    protected void onSaveInstanceState(Bundle salida) {
        super.onSaveInstanceState(salida);
        web.saveState(salida);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    // Atrás: primero dentro de la página (cierra la ficha de Despacho móvil); si no queda nada, sale de la app
    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    private String leerAsset(String nombre) {
        try (InputStream in = getAssets().open(nombre); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] b = new byte[8192];
            int n;
            while ((n = in.read(b)) > 0) out.write(b, 0, n);
            return out.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) {
            return "";
        }
    }
}

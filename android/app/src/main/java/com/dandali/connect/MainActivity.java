package com.dandali.connect;

import android.os.Bundle;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long lastBackPressTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() == null || getBridge().getWebView() == null) {
                    finish();
                    return;
                }

                final WebView webView = getBridge().getWebView();
                webView.evaluateJavascript(
                    "(function() { if (window.__zaureHandleBack) { return window.__zaureHandleBack(); } return 'unhandled'; })()",
                    value -> {
                        if ("\"handled\"".equals(value)) {
                            return;
                        }
                        if (webView.canGoBack()) {
                            webView.goBack();
                            return;
                        }
                        long now = System.currentTimeMillis();
                        if (now - lastBackPressTime < 2000) {
                            finish();
                        } else {
                            lastBackPressTime = now;
                            Toast.makeText(MainActivity.this, "Press back again to exit", Toast.LENGTH_SHORT).show();
                        }
                    }
                );
            }
        });
    }
}


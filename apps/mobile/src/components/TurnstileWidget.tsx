import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors } from '../theme/colors';

/**
 * Cloudflare Turnstile widget for React Native.
 *
 * Renders the Turnstile challenge inside a WebView. The WebView loads a
 * minimal HTML page that dynamically loads the Turnstile script and
 * renders the widget via the explicit JavaScript API (turnstile.render).
 *
 * The site key is read from EXPO_PUBLIC_TURNSTILE_SITE_KEY. When unset,
 * the widget is not rendered and `onToken` is never called — callers
 * should treat captcha as optional in that case.
 *
 * The WebView's baseUrl is set to the app's production URL so that
 * window.location.hostname matches the Cloudflare Turnstile widget's
 * allowed hostnames.
 */
interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: (code?: string) => void;
  /** testID prefix — renders a hidden sentinel element "{prefix}_ready" when token is set */
  testIDPrefix?: string;
}

function turnstileErrorMessage(code?: string): string {
  switch (code) {
    case '110200':
      return 'This domain is not authorized for the Turnstile site key.';
    case '110100':
    case '110110':
    case '400020':
      return 'The Turnstile site key is invalid or does not match your widget.';
    case '400070':
      return 'This Turnstile widget is disabled in Cloudflare.';
    case 'script_load_failed':
      return 'Could not load the verification script. Check your network connection.';
    case 'render_failed':
      return 'Verification widget failed to render.';
    case 'timeout':
      return 'Verification timed out. Please try again.';
    default:
      return 'Verification could not load. Please try again.';
  }
}

export function TurnstileWidget({ onToken, onExpire, onError, testIDPrefix = 'captcha' }: TurnstileWidgetProps) {
  const siteKey = useMemo(
    () => process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
    [],
  );
  const appUrl = useMemo(
    () =>
      process.env.EXPO_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      'https://hanapkalinga.com',
    [],
  );
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const { width: screenWidth } = useWindowDimensions();

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          type: 'success' | 'expire' | 'error' | 'log';
          token?: string;
          code?: string;
          message?: string;
        };
        if (data.type === 'log') {
          // Forward WebView console logs to the RN console for debugging
          console.log(`[TurnstileWebView] ${data.message}`);
          return;
        }
        if (data.type === 'success' && data.token) {
          setErrorCode(null);
          setTokenReady(true);
          onToken(data.token);
        } else if (data.type === 'expire') {
          setTokenReady(false);
          onExpire?.();
        } else if (data.type === 'error') {
          setErrorCode(data.code || 'unknown');
          setTokenReady(false);
          onError?.(data.code);
        }
      } catch {
        // Ignore malformed messages
      }
    },
    [onToken, onExpire, onError],
  );

  const handleWebViewError = useCallback(
    (e: { nativeEvent: { description?: string; code?: number } }) => {
      const desc = e.nativeEvent.description || `WebView error (code: ${e.nativeEvent.code})`;
      console.error('[TurnstileWidget] WebView error:', desc);
      setErrorCode('render_failed');
      setTokenReady(false);
      onError?.('render_failed');
    },
    [onError],
  );

  const handleWebViewHttpError = useCallback(
    (e: { nativeEvent: { description?: string; statusCode?: number } }) => {
      const desc = e.nativeEvent.description || `HTTP ${e.nativeEvent.statusCode}`;
      console.error('[TurnstileWidget] WebView HTTP error:', desc);
    },
    [],
  );

  if (!siteKey) {
    return null;
  }

  if (errorCode) {
    return (
      <View style={styles.errorContainer} testID={`${testIDPrefix}_error`}>
        <TurnstileErrorText code={errorCode} />
      </View>
    );
  }

  const html = buildTurnstileHtml(siteKey);

  return (
    <View style={styles.container} testID={`${testIDPrefix}_widget`}>
      <WebView
        source={{ html, baseUrl: `${appUrl}/turnstile` }}
        style={[styles.webview, { width: Math.min(screenWidth - 48, 300) }]}
        onMessage={handleMessage}
        onError={handleWebViewError}
        onHttpError={handleWebViewHttpError}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        injectedJavaScript={INJECTED_JS}
        // Allow mixed content (HTTPS page loading HTTP resources if needed)
        allowsMixedContent
        // Don't block network requests from the WebView
        allowsBackForwardNavigationGestures={false}
      />
      <View
        testID={`${testIDPrefix}_ready`}
        style={[styles.sentinel, { opacity: tokenReady ? 1 : 0 }]}
        pointerEvents="none"
      />
    </View>
  );
}

function TurnstileErrorText({ code }: { code: string }) {
  return <Text style={styles.errorText}>{turnstileErrorMessage(code)}</Text>;
}

/**
 * Build the HTML page for the Turnstile widget.
 *
 * Uses the explicit Turnstile JavaScript API (turnstile.render) instead of
 * the auto-render approach (data-callback attributes). This gives us more
 * control over error handling and ensures the callback functions are
 * properly scoped.
 *
 * The script is loaded dynamically (not via a <script async defer> tag) so
 * we can detect load failures and report them to React Native.
 */
function buildTurnstileHtml(siteKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: transparent;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 65px;
      overflow: hidden;
    }
    #turnstile-container { width: 100%; min-height: 65px; }
  </style>
</head>
<body>
  <div id="turnstile-container"></div>
  <script>
    // Console log interceptor — forwards logs to React Native for debugging
    var originalLog = console.log;
    var originalError = console.error;
    console.log = function() {
      var args = Array.prototype.slice.call(arguments);
      var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ');
      try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg })); } catch(e) {}
      originalLog.apply(console, args);
    };
    console.error = function() {
      var args = Array.prototype.slice.call(arguments);
      var msg = args.map(function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' ');
      try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: 'ERROR: ' + msg })); } catch(e) {}
      originalError.apply(console, args);
    };

    // Report initial state
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: 'WebView HTML loaded, hostname: ' + window.location.hostname })); } catch(e) {}

    function postMsg(data) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); } catch(e) {
        // If postMessage fails, try again with a simpler payload
        try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: 'postmessage_failed' })); } catch(e2) {}
      }
    }

    // Load the Turnstile script dynamically
    var script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;

    script.onload = function() {
      postMsg({ type: 'log', message: 'Turnstile script loaded successfully' });

      // Wait for the turnstile global to be available
      var renderAttempts = 0;
      function tryRender() {
        renderAttempts++;
        if (typeof turnstile === 'undefined') {
          if (renderAttempts < 50) {
            setTimeout(tryRender, 100);
          } else {
            postMsg({ type: 'error', code: 'render_failed' });
          }
          return;
        }

        postMsg({ type: 'log', message: 'turnstile global available, rendering widget' });

        try {
          turnstile.render('#turnstile-container', {
            sitekey: '${siteKey}',
            theme: 'auto',
            size: 'normal',
            callback: function(token) {
              postMsg({ type: 'log', message: 'Turnstile success, token length: ' + (token ? token.length : 0) });
              postMsg({ type: 'success', token: token });
            },
            'expired-callback': function() {
              postMsg({ type: 'log', message: 'Turnstile expired' });
              postMsg({ type: 'expire' });
            },
            'error-callback': function(code) {
              postMsg({ type: 'log', message: 'Turnstile error callback: ' + code });
              postMsg({ type: 'error', code: String(code || '') });
            },
            'timeout-callback': function() {
              postMsg({ type: 'log', message: 'Turnstile timeout' });
              postMsg({ type: 'error', code: 'timeout' });
            },
            'unsupported-callback': function() {
              postMsg({ type: 'log', message: 'Turnstile unsupported' });
              postMsg({ type: 'error', code: 'unsupported' });
            }
          });
          postMsg({ type: 'log', message: 'turnstile.render() called' });
        } catch(err) {
          postMsg({ type: 'log', message: 'turnstile.render() threw: ' + (err && err.message ? err.message : String(err)) });
          postMsg({ type: 'error', code: 'render_failed' });
        }
      }
      tryRender();
    };

    script.onerror = function() {
      postMsg({ type: 'log', message: 'Failed to load Turnstile script from challenges.cloudflare.com' });
      postMsg({ type: 'error', code: 'script_load_failed' });
    };

    // Set a 20-second timeout — if the script hasn't loaded, report an error
    setTimeout(function() {
      if (typeof turnstile === 'undefined') {
        postMsg({ type: 'log', message: 'Turnstile script did not load within 20 seconds' });
        postMsg({ type: 'error', code: 'script_load_failed' });
      }
    }, 20000);

    document.head.appendChild(script);
    postMsg({ type: 'log', message: 'Turnstile script tag appended to DOM' });
  </script>
</body>
</html>`;
}

/** Injected JS: prevent focus theft + forward window errors to RN */
const INJECTED_JS = `
  (function() {
    // Prevent focus theft from inputs
    document.addEventListener('focusin', function(e) {
      e.preventDefault();
      e.target.blur();
    }, true);

    // Catch uncaught errors and forward to RN
    window.addEventListener('error', function(e) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'log',
          message: 'Uncaught error: ' + (e.message || 'unknown') + ' at ' + (e.filename || '') + ':' + (e.lineno || 0)
        }));
      } catch(err) {}
    });
  })();
`;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 65,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: {
    height: 65,
    backgroundColor: 'transparent',
    opacity: 0.99,
  },
  errorContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.semantic.error + '15',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  sentinel: {
    position: 'absolute' as const,
    width: 1,
    height: 1,
    top: 0,
    left: 0,
  },
});

/** Helper hook: returns true when captcha is required (site key is set). */
export function useTurnstileRequired(): boolean {
  return useMemo(() => {
    const key = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
    return Boolean(key);
  }, []);
}

import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors } from '../theme/colors';

/**
 * Cloudflare Turnstile widget for React Native.
 *
 * Renders the Turnstile challenge inside a WebView (the official
 * @marsidev/react-turnstile library is web-only). The WebView loads a
 * minimal HTML page that includes the Turnstile script and posts the
 * resulting token back to React Native via onMessage.
 *
 * The site key is read from EXPO_PUBLIC_TURNSTILE_SITE_KEY. When unset,
 * the widget is not rendered and `onToken` is never called — callers
 * should treat captcha as optional in that case (matching the web app's
 * `turnstileRequired = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)`
 * pattern).
 *
 * For E2E testing, use Cloudflare's invisible test site key
 * `2x00000000000000000000AB` (auto-passes without user interaction)
 * and configure the staging Supabase project with the test secret key
 * `1x0000000000000000000000000000000AA` (always validates).
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
    default:
      return 'Verification could not load. Please try again.';
  }
}

export function TurnstileWidget({ onToken, onExpire, onError, testIDPrefix = 'captcha' }: TurnstileWidgetProps) {
  const siteKey = useMemo(
    () => process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
    [],
  );
  // App URL used as the WebView baseUrl so Turnstile sees an authorized
  // hostname (window.location.hostname must match Cloudflare's allowed
  // hostnames for the site key). Falls back to the production domain.
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

  // Stable callbacks so WebView re-renders don't reset the challenge
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          type: 'success' | 'expire' | 'error';
          token?: string;
          code?: string;
        };
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

  if (!siteKey) {
    // Captcha not configured — render nothing.
    // Callers check `turnstileRequired` to decide whether to enforce.
    return null;
  }

  if (errorCode) {
    return (
      <View style={styles.errorContainer} testID={`${testIDPrefix}_error`}>
        <TurnstileErrorText code={errorCode} />
      </View>
    );
  }

  // Build the HTML page with the Turnstile widget.
  // The page is designed to be minimal and auto-size to the widget.
  const html = TURNSTILE_HTML_TEMPLATE.replace('__SITE_KEY__', siteKey);

  return (
    <View style={styles.container} testID={`${testIDPrefix}_widget`}>
      <WebView
        // baseUrl makes the WebView's window.location.hostname return
        // the app's domain (e.g. hanapkalinga.com) so Cloudflare Turnstile
        // authorizes the widget. Without this, the origin is about:blank
        // and Turnstile rejects with error 110200 ("domain not authorized").
        // No actual network request is made to this URL — the HTML is
        // loaded from the `html` string above.
        source={{ html, baseUrl: `${appUrl}/turnstile` }}
        style={[styles.webview, { width: Math.min(screenWidth - 48, 300) }]}
        onMessage={handleMessage}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        // Turnstile loads scripts from challenges.cloudflare.com
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        // Prevent the WebView from capturing focus on mount
        injectedJavaScript={INJECTED_JS}
      />
      {/* Sentinel element for Maestro E2E: visible only when captcha token is set.
          Maestro flows wait for this element before tapping submit. */}
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

/** Minimal HTML page that loads Turnstile and posts messages to RN. */
const TURNSTILE_HTML_TEMPLATE = `<!DOCTYPE html>
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
    .cf-turnstile {
      transform-origin: top left;
    }
  </style>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body>
  <div class="cf-turnstile"
       data-sitekey="__SITE_KEY__"
       data-theme="auto"
       data-size="normal"
       data-callback="onTurnstileSuccess"
       data-expired-callback="onTurnstileExpire"
       data-error-callback="onTurnstileError">
  </div>
  <script>
    function onTurnstileSuccess(token) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', token: token }));
    }
    function onTurnstileExpire() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'expire' }));
    }
    function onTurnstileError(code) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', code: String(code || '') }));
    }
  </script>
</body>
</html>`;

/** Prevent the WebView from auto-scrolling to the Turnstile iframe. */
const INJECTED_JS = `
  (function() {
    // Prevent focus theft
    document.addEventListener('focusin', function(e) {
      e.preventDefault();
      e.target.blur();
    }, true);
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
    opacity: 0.99, // force GPU layer for transparent background
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
  // Sentinel element for Maestro E2E detection — 1x1 pixel, opacity controlled inline
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

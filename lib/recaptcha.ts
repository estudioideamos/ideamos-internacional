const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
type Recaptcha = {
  ready: (callback: () => void) => void;
  execute: (key: string, options: { action: string }) => Promise<string>;
};
declare global { interface Window { grecaptcha?: Recaptcha } }
let loading: Promise<Recaptcha> | undefined;

/** Download only when someone interacts with the form; share one script across forms. */
export function loadRecaptcha(): Promise<Recaptcha> {
  if (!SITE_KEY) return Promise.reject(new Error('Verification not configured'));
  if (loading) return loading;
  loading = new Promise<Recaptcha>((resolve, reject) => {
    const script = document.createElement('script');
    let settled = false;
    const timeout = window.setTimeout(() => finish(), 12_000);
    function finish(api?: Recaptcha) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (api) resolve(api);
      else {
        script.remove();
        reject(new Error('Verification unavailable'));
      }
    }
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}&hl=es`;
    script.async = true;
    script.onerror = () => finish();
    script.onload = () => {
      const api = window.grecaptcha;
      if (!api) { finish(); return; }
      api.ready(() => finish(api));
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}

/** Fresh, short-lived token for each submission; never cache a token. */
export async function getRecaptchaToken(): Promise<string> {
  const api = await loadRecaptcha();
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Verification timed out')), 8_000);
    api.execute(SITE_KEY, { action: 'contact_submit' }).then((token) => {
      if (!token) throw new Error('Empty verification');
      resolve(token);
    }).catch(reject).finally(() => window.clearTimeout(timeout));
  });
}

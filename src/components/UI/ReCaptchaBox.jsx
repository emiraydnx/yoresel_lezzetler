import { useEffect, useRef } from 'react';

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-script';
const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js?render=explicit';

let recaptchaScriptPromise = null;

const loadRecaptchaScript = () => {
  if (window.grecaptcha?.render) {
    return Promise.resolve(window.grecaptcha);
  }

  if (recaptchaScriptPromise) {
    return recaptchaScriptPromise;
  }

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.grecaptcha), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = RECAPTCHA_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = reject;

    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
};

const ReCaptchaBox = ({ onChange, resetKey, siteKey }) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') {
      return undefined;
    }

    let isMounted = true;

    loadRecaptchaScript()
      .then((grecaptcha) => {
        if (!isMounted || !containerRef.current || widgetIdRef.current !== null) {
          return;
        }

        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onChange(token),
          'expired-callback': () => onChange(''),
          'error-callback': () => onChange(''),
        });
      })
      .catch(() => {
        if (isMounted) {
          onChange('');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onChange, siteKey]);

  useEffect(() => {
    if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(widgetIdRef.current);
      onChange('');
    }
  }, [onChange, resetKey]);

  if (!siteKey) {
    return (
      <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">
        reCAPTCHA site key eksik. REACT_APP_RECAPTCHA_SITE_KEY degerini ekleyin.
      </p>
    );
  }

  return <div className="min-h-[78px]" ref={containerRef} />;
};

export default ReCaptchaBox;

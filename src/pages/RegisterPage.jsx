import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReCaptchaBox from '../components/UI/ReCaptchaBox';
import { useAuth } from '../context/AuthContext';
import { verifyRegistrationCaptcha } from '../firebase/recaptcha';

const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const RegisterPage = () => {
  const navigate = useNavigate();
  const { loginGoogle, register } = useAuth();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleCaptchaChange = useCallback((token) => {
    setCaptchaToken(token);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Lutfen reCAPTCHA dogrulamasini tamamlayin.');
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyRegistrationCaptcha(captchaToken);
      await register(form);
      navigate('/');
    } catch (err) {
      setCaptchaResetKey((current) => current + 1);
      setError(err.message || 'Kayit olusturulurken bir hata olustu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await loginGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google ile kayit olunurken bir hata olustu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mx-auto max-w-md space-y-4 rounded border bg-white p-6" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold">Kayıt Ol</h1>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button
        className="w-full rounded border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
        disabled={isSubmitting}
        onClick={handleGoogleRegister}
        type="button"
      >
        Google ile Kayit Ol
      </button>
      <div className="flex items-center gap-3 text-xs uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        veya
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <label className="block text-sm font-medium">
        Ad Soyad
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          name="displayName"
          onChange={handleChange}
          required
          type="text"
          value={form.displayName}
        />
      </label>
      <label className="block text-sm font-medium">
        E-posta
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          name="email"
          onChange={handleChange}
          required
          type="email"
          value={form.email}
        />
      </label>
      <label className="block text-sm font-medium">
        Şifre
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          minLength={6}
          name="password"
          onChange={handleChange}
          required
          type="password"
          value={form.password}
        />
      </label>
      <ReCaptchaBox onChange={handleCaptchaChange} resetKey={captchaResetKey} siteKey={recaptchaSiteKey} />
      <button
        className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting || !captchaToken}
        type="submit"
      >
        {isSubmitting ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
      </button>
    </form>
  );
};

export default RegisterPage;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mx-auto max-w-md space-y-4 rounded border bg-white p-6" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold">Kayıt Ol</h1>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
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
      <button className="w-full rounded bg-slate-900 px-4 py-2 text-white" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
      </button>
    </form>
  );
};

export default RegisterPage;

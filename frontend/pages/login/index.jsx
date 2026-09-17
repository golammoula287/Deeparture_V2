import { useState } from 'react';
import { useRouter } from 'next/router';
import { baseUrl } from '@/src/config/serverConfig';

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.message || 'Login failed');
      localStorage.setItem('access-token', `Bearer ${json.data.token}`);
      localStorage.setItem('deeparture-user', JSON.stringify(json.data.user));
      router.push('/dashboard/v2');
    } catch (error) { setMessage(error.message); } finally { setLoading(false); }
  };
  return <main className="max-w-md mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Operator / Admin login</h1><form onSubmit={submit} className="mt-8 rounded-xl border bg-white p-6 space-y-4"><input required type="email" className="border rounded-lg p-3 w-full" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/><input required type="password" className="border rounded-lg p-3 w-full" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/><button disabled={loading} className="rounded-lg bg-green-700 text-white px-5 py-3 font-semibold disabled:opacity-50">{loading ? 'Signing in…' : 'Sign in'}</button>{message ? <p className="text-sm">{message}</p> : null}</form></main>;
}

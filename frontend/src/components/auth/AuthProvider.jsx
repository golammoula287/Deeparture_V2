import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { baseUrl } from '@/src/config/serverConfig';
import SiteHeader from '@/src/components/layout/SiteHeader';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const router = useRouter();
  const [session, setSession] = useState({ user: null, checkedPath: null, error: '' });
  const [revision, setRevision] = useState(0);
  const adminPage = router.pathname.startsWith('/admin');
  const protectedPage = router.pathname.startsWith('/dashboard') || adminPage;
  const clearCredentials = () => {
    localStorage.removeItem('access-token');
    localStorage.removeItem('deeparture-user');
  };
  const logout = () => {
    clearCredentials();
    setSession({ user: null, checkedPath: null, error: '' });
    setRevision(value => value + 1);
    router.replace('/login');
  };

  useEffect(() => {
    const controller = new AbortController();
    const validate = async () => {
      const token = localStorage.getItem('access-token');
      if (!token) {
        setSession({ user: null, checkedPath: router.pathname, error: '' });
        if (protectedPage) router.replace('/login');
        return;
      }
      try {
        const response = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: token }, signal: controller.signal });
        if (response.status === 401 || response.status === 403) {
          clearCredentials();
          setSession({ user: null, checkedPath: router.pathname, error: '' });
          if (protectedPage) router.replace('/login');
          return;
        }
        const json = await response.json();
        if (!response.ok || !json.success || !json.data) throw new Error('Unable to verify your session. Please retry.');
        if (!controller.signal.aborted) setSession({ user: json.data, checkedPath: router.pathname, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) setSession({ user: null, checkedPath: router.pathname, error: 'Unable to verify your session. Please retry.' });
      }
    };
    validate();
    const changed = event => {
      if (event.key === 'access-token' || event.key === null) {
        controller.abort();
        setSession({ user: null, checkedPath: null, error: '' });
        setRevision(value => value + 1);
      }
    };
    window.addEventListener('storage', changed);
    return () => { controller.abort(); window.removeEventListener('storage', changed); };
  }, [router.pathname, revision]);

  const allowed = adminPage ? session.user?.role === 'admin' : ['operator', 'admin'].includes(session.user?.role);
  let content = children;
  if (protectedPage) {
    if (session.checkedPath !== router.pathname || (!session.user && !session.error)) {
      content = <main className="p-8" role="status">Checking your session...</main>;
    } else if (session.error) {
      content = <main className="p-8"><p role="alert">{session.error}</p><button onClick={() => setRevision(value => value + 1)} className="mt-4 underline">Retry</button></main>;
    } else if (!allowed) {
      content = <main className="p-8" role="alert">{adminPage ? 'An admin account is required.' : 'An operator or admin account is required.'}</main>;
    }
  }
  return <AuthContext.Provider value={{ user: session.user, logout }}><SiteHeader />{content}</AuthContext.Provider>;
}

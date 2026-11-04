import '@/styles/globals.css';
import AuthProvider from '@/src/components/auth/AuthProvider';

export default function App({ Component, pageProps }) {
  return <AuthProvider hideHeader={Component.designPreview === true}><Component {...pageProps} /></AuthProvider>;
}

import '@/styles/globals.css';
import SiteHeader from '@/src/components/layout/SiteHeader';

export default function App({ Component, pageProps }) {
  return <><SiteHeader /><Component {...pageProps} /></>;
}

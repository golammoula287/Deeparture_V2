import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import HomeIcon from './HomeIcon';
import useSavedTrips from './useSavedTrips';
import styles from './CustomerShell.module.css';
import design from './CustomerDesign.module.css';

const navigation = [
  { href: '/', label: 'Home' },
  { href: '/about-us', label: 'About us' },
  { href: '/contact', label: 'Contact' },
];

const homeNavigation = [
  { href: '/explore/liveaboards', label: 'Liveaboards' },
  { href: '/explore/resorts', label: 'Resorts' },
  { href: '/#special-offers', label: 'Special Offers' },
  { href: '/#destinations', label: 'Destinations' },
  { href: '/#why-deeparture', label: 'Why Deeparture' },
];

export default function CustomerShell({ children, title = 'Dive beyond the everyday', description = 'Explore liveaboard journeys and dive resorts with Deeparture. Find the trip that feels right for you.', hero = false, homepage = false, homePalette = 'coral' }) {
  const { pathname } = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef(null);
  const favourites = useRef(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const { saved } = useSavedTrips();
  useEffect(() => { if (!savedOpen) return; const previous = document.activeElement; const overflow = document.body.style.overflow; const element = favourites.current; element.showModal(); document.body.style.overflow = 'hidden'; return () => { element.close(); document.body.style.overflow = overflow; previous?.focus(); }; }, [savedOpen]);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const element = menu.current;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, [menuOpen]);
  const links = className => <nav className={className} aria-label={className === styles.mobileNavigation ? 'Mobile navigation' : 'Main navigation'}>{(homepage ? homeNavigation : navigation).map(({ href, label }) => <Link key={href} href={href} className={pathname === href ? styles.active : undefined} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>;
  return <div className={`${styles.shell} ${design.system} ${hero ? styles.withHero : ''} ${homepage ? styles.clientHome : ''}`} data-home-palette={homepage ? homePalette : undefined}>
    <Head><title>{`${title} | Deeparture`}</title><meta name="description" content={description} /><meta name="theme-color" content={homepage ? homePalette === 'midnight' ? '#101d34' : '#0b3038' : '#123749'} /></Head>
    <a className={styles.skip} href="#customer-content">Skip to content</a>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.logo} href="/" aria-label="Deeparture home"><img src="/brand/logo.svg" alt="Deeparture" width="240" height="39" /></Link>
        {links(styles.desktopNavigation)}
        {homepage && <div className={styles.headerUtilities}><Link href="/#find-your-trip" aria-label="Search trips"><HomeIcon name="search" size={20} /></Link><button type="button" aria-label="Favourites" aria-haspopup="dialog" onClick={() => setSavedOpen(true)}><HomeIcon name="heart" size={20} />{saved.length > 0 && <span>{saved.length}</span>}</button><Link href="/login" aria-label="Account sign in"><HomeIcon name="user" size={20} /></Link></div>}
        <Link className={styles.findTrip} href={homepage ? '/contact' : '/explore/liveaboards'}>{homepage ? 'Contact us' : 'Find a trip'}</Link>
        {homepage && <button className={styles.homeMenuButton} aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><HomeIcon name="menu" /></button>}
      </div>
    </header>
    <div id="customer-content" className={styles.content} tabIndex={-1}>{children}</div>
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerIdentity}><Link className={styles.logo} href="/" aria-label="Deeparture home"><img src="/brand/logo.svg" alt="Deeparture" width="240" height="39" /></Link><p>For the ocean in you.<br />And the adventures still to come.</p></div>
        <nav aria-label="Explore"><h2>Find your adventure</h2><Link href="/explore/liveaboards">Liveaboards</Link><Link href="/explore/resorts">Dive resorts</Link></nav>
        <nav aria-label="Deeparture"><h2>Get to know us</h2><Link href="/about-us">About us</Link><Link href="/contact">Contact</Link></nav>
        <nav aria-label="Operator access"><h2>For operators</h2><Link href="/login">Sign in</Link><Link href="/operator/v2">Operator portal</Link></nav>
      </div>
      <div className={styles.footerBottom}><span>Deeparture · Thoughtfully explored.</span><span>Liveaboards & dive resorts</span></div>
    </footer>
    {homepage && <dialog ref={favourites} className={styles.homeMenu} aria-labelledby="saved-title" onCancel={event => { event.preventDefault(); setSavedOpen(false); }}><div><h2 id="saved-title">Favourites</h2><button type="button" aria-label="Close favourites" onClick={() => setSavedOpen(false)}><HomeIcon name="close" /></button></div><p>Saved on this browser.</p>{saved.length ? <nav aria-label="Saved trips">{saved.map(trip => <Link key={trip.href} href={trip.href} onClick={() => setSavedOpen(false)}>{trip.name}<HomeIcon /></Link>)}</nav> : <p>Tap the heart on a featured trip to save it here.</p>}</dialog>}
    {homepage ? <dialog ref={menu} className={styles.homeMenu} aria-labelledby="home-menu-title" onCancel={event => { event.preventDefault(); setMenuOpen(false); }} onClick={event => { if (event.target === menu.current) setMenuOpen(false); }}>
      <div><h2 id="home-menu-title">Explore Deeparture</h2><button aria-label="Close menu" onClick={() => setMenuOpen(false)}><HomeIcon name="close" /></button></div>
      <nav aria-label="Mobile navigation">{[...homeNavigation, { href: '/about-us', label: 'About us' }, { href: '/contact', label: 'Contact us' }].map(({ href, label }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<HomeIcon size={18} /></Link>)}</nav>
    </dialog> : links(styles.mobileNavigation)}
  </div>;
}

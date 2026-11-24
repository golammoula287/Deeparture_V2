import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { allowIndexing, canonicalPath, searchPaths, siteOrigin } from '@/src/lib/customer/siteSeo';
import { contactLinks, socialLinks } from '@/src/lib/customer/contactLinks';
import HomeIcon from './HomeIcon';
import styles from './CustomerShell.module.css';
import design from './CustomerDesign.module.css';

const exploreNavigation = [
  { href: '/explore/liveaboards', label: 'Liveaboards' },
  { href: '/explore/resorts', label: 'Resorts' },
  { href: '/special-offers', label: 'Special Offers' },
  { href: '/destinations', label: 'Destinations' },
];
const whyDeeparture = { href: '/why-deeparture', label: 'Why Deeparture' };
const mainNavigation = [...exploreNavigation, whyDeeparture];
const logoSrc = '/brand/logo.svg';

export default function CustomerShell({ children, title = 'Dive beyond the everyday', description = 'Explore liveaboard journeys and dive resorts with Deeparture. Find the trip that feels right for you.', hero = false, homepage = false, homePalette = 'coral', noIndex = false }) {
  const { pathname, query } = useRouter();
  const canonical = canonicalPath(pathname, query.slug);
  const filteredSearch = searchPaths.includes(pathname) && Object.keys(query).length > 0;
  const hideFromSearch = noIndex || filteredSearch || !canonical || !allowIndexing;
  const [menuOpen, setMenuOpen] = useState(false);
  const menu = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const element = menu.current;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, [menuOpen]);
  useEffect(() => {
    if (!canonical || !navigator.serviceWorker) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Online navigation remains available if registration fails.
    });
  }, [canonical]);
  const currentSection = pathname.replace('/destinations/[slug]', '/destinations').replace(/^\/(liveaboards|resorts)\/\[slug\]$/, '/explore/$1');
  const navigationLink = ({ href, label }, mobile = false) => (
    <Link
      key={href}
      href={href}
      aria-current={pathname === href ? 'page' : undefined}
      className={currentSection === href ? styles.active : undefined}
      onClick={mobile ? () => setMenuOpen(false) : undefined}
    >
      {label}{mobile && <HomeIcon size={18} />}
    </Link>
  );
  return <div className={`${styles.shell} ${styles.unifiedNavigation} ${design.system} ${hero ? styles.withHero : ''} ${homepage ? styles.clientHome : ''}`} data-home-palette={homePalette}>
    <Head>
      <title>{`${title} | Deeparture`}</title>
      <meta name="description" content={description} />
      <meta name="theme-color" content={homepage ? homePalette === 'midnight' ? '#101d34' : '#0b3038' : '#123749'} />
      {canonical && siteOrigin && <link rel="canonical" href={siteOrigin + canonical} />}
      {canonical && <link rel="manifest" href="/manifest.webmanifest" />}
      {hideFromSearch && <meta name="robots" content="noindex,follow" />}
    </Head>
    <a className={styles.skip} href="#customer-content">Skip to content</a>
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <Link className={styles.logo} href="/" aria-label="Deeparture home"><img src={logoSrc} alt="Deeparture" width="240" height="39" /></Link>
        <nav className={styles.desktopNavigation} aria-label="Main navigation">
          {mainNavigation.map(item => navigationLink(item))}
        </nav>
        <Link className={styles.searchLink} href="/#find-your-trip" aria-label="Search trips"><HomeIcon name="search" size={20} /></Link>
        <Link className={styles.findTrip} href="/contact" aria-current={pathname === '/contact' ? 'page' : undefined}>Contact us</Link>
        <button className={styles.homeMenuButton} type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><HomeIcon name="menu" /></button>
      </div>
    </header>
    <div id="customer-content" className={styles.content} tabIndex={-1}>{children}</div>
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerIdentity}>
          <Link className={styles.logo} href="/" aria-label="Deeparture home"><img src={logoSrc} alt="Deeparture" width="240" height="39" /></Link>
          <p>Dive travel for everyone.</p>
        </div>
        <nav aria-label="Explore">
          <h2>Explore</h2>
          {exploreNavigation.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/featured-trips">Featured Trips</Link>
          <a href={contactLinks.groups}>Groups or Charters</a>
        </nav>
        <nav aria-label="About">
          <h2>About</h2>
          <Link href={whyDeeparture.href}>{whyDeeparture.label}</Link>
          <Link href="/about-us">About us</Link>
          <Link href="/contact">Contact us</Link>
        </nav>
        <nav aria-label="Contact">
          <h2>Contact</h2>
          <a href={contactLinks.email.href}>{contactLinks.email.label}</a>
          <a href={contactLinks.whatsapp.href}>WhatsApp {contactLinks.whatsapp.label}</a>
          <a href={contactLinks.phone.href}>Phone {contactLinks.phone.label}</a>
        </nav>
        <div className={styles.footerAccess}>
          <nav aria-label="Follow">
            <h2>Follow</h2>
            <div className={styles.socialLinks}>
              {socialLinks.map(({ href, label, icon }) => (
                <a key={href} href={href} aria-label={label}>
                  <img src={`/brand/social/${icon}.svg`} alt="" width="24" height="24" />
                </a>
              ))}
            </div>
          </nav>
          <nav aria-label="Operator login">
            <h2>Operator login</h2>
            <Link href="/login">Sign in / Sign up</Link>
          </nav>
        </div>
      </div>
      <div className={styles.footerBottom}>© Deeparture. All rights reserved.</div>
    </footer>
    <a className={styles.whatsapp} href={contactLinks.whatsapp.href} aria-label="Chat with Deeparture on WhatsApp">
      <HomeIcon name="whatsapp" size={32} />
    </a>
    <dialog ref={menu} className={styles.homeMenu} aria-labelledby="home-menu-title" onCancel={event => { event.preventDefault(); setMenuOpen(false); }} onClick={event => { if (event.target === menu.current) setMenuOpen(false); }}>
      <div><h2 id="home-menu-title">Explore Deeparture</h2><button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><HomeIcon name="close" /></button></div>
      <nav aria-label="Mobile navigation">
        {[...mainNavigation, { href: '/about-us', label: 'About us' }, { href: '/contact', label: 'Contact us' }].map(item => navigationLink(item, true))}
      </nav>
    </dialog>
  </div>;
}

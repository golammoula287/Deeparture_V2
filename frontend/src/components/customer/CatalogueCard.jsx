import Link from 'next/link';
import { useState } from 'react';
import { dateLabel, mediaUrl, priceLabel, productHref, words } from '@/src/lib/customer/format';
import styles from './Marketplace.module.css';

export default function CatalogueCard({ item, type = 'vessel', departure, horizontal = false, returnTo }) {
  const image = mediaUrl(item.featuredImage);
  const [failedImage, setFailedImage] = useState(null);
  const query = new URLSearchParams();
  if (departure?._id) query.set('departure', departure._id);
  if (returnTo) query.set('returnTo', returnTo);
  const href = `${productHref(item, type)}${query.size ? `?${query}` : ''}`;
  const attributes = [...(item.dietary || []), ...(item.divingFeatures || []), ...(item.accessibility || [])].slice(0, 3);
  return <article className={`${styles.card} ${horizontal ? styles.horizontalCard : ''}`}>
    <Link href={href} className={styles.cardImage} aria-hidden="true" tabIndex={-1}>
      {image && failedImage !== image ? <img src={image} alt="" loading="lazy" width="700" height="460" onError={() => setFailedImage(image)} /> : <span>Images on request</span>}
      <span className={styles.productLabel}>{type === 'resort' ? 'Dive resort' : 'Liveaboard'}</span>
    </Link>
    <div className={styles.cardContent}>
      <p className={styles.location}>{(item.destinationSlugs || []).map(words).join(' · ') || 'Discover the journey'}</p>
      <h3><Link href={href}>{item.name}</Link></h3>
      {departure ? <p className={styles.cardDates}>{dateLabel(departure.startDate)}{departure.itinerary?.numberOfNights ? ` · ${departure.itinerary.numberOfNights} nights` : ''}</p> : item.summary ? <p className={styles.summary}>{item.summary}</p> : null}
      <div className={styles.attributes}>{Number.isFinite(item.veganRating) ? <span>Vegan Rating {item.veganRating}/5</span> : null}{attributes.map((value, index) => <span key={`${value}-${index}`}>{words(value)}</span>)}</div>
      <div className={styles.cardFoot}>
        <div>{departure ? <><small>Starting departure price</small><strong>{priceLabel(departure.effectiveMinPrice, departure.effectiveCurrency)}</strong><small>Confirm cabin pricing & availability</small></> : <small>See trip details, dates & enquiry options</small>}</div>
        <Link href={href} className={styles.textLink}>{type === 'resort' ? 'View resort' : 'View liveaboard'}</Link>
      </div>
    </div>
  </article>;
}

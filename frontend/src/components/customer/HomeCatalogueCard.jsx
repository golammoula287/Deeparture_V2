import Link from 'next/link';
import { useState } from 'react';
import { dateLabel, mediaUrl, priceLabel, productHref, words } from '@/src/lib/customer/format';
import HomeIcon from './HomeIcon';
import styles from './HomePage.module.css';

export default function HomeCatalogueCard({ item, departure, type = 'vessel', offer = null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = mediaUrl(item.featuredImage);
  const href = `${productHref(item, type)}${departure?._id ? `?departure=${encodeURIComponent(departure._id)}` : ''}`;
  return <article className={styles.catalogueCard}>
    <div className={styles.cardVisual}><Link href={href} className={styles.catalogueImage} aria-hidden="true" tabIndex={-1}>{image && !imageFailed ? <img src={image} alt="" width="600" height="400" loading="lazy" onError={() => setImageFailed(true)} /> : <span>Photos on request</span>}<span className={styles.cardType}>{offer ? `${item.metadata?.synthetic ? 'Sample · ' : ''}Save ${offer.percent}%` : type === 'resort' ? 'Dive resort' : 'Liveaboard'}</span></Link>{Number.isFinite(item.veganRating) && <span className={styles.imageBadge}>Vegan Rating {'★'.repeat(Math.max(0, Math.min(5, Math.floor(item.veganRating))))}</span>}</div>
    {offer && <p className={styles.offerTerms}>{offer.validUntil ? `Offer ends ${dateLabel(offer.validUntil)}` : offer.name}</p>}
    <div className={styles.catalogueContent}><p className={styles.cardLocation}><HomeIcon name="pin" size={14} />{(item.destinationSlugs || []).map(words).join(' · ') || 'Explore the details'}</p><h3><Link href={href}>{item.name}</Link></h3>
      {departure ? <p className={styles.cardDates}><HomeIcon name="calendar" size={13} />{dateLabel(departure.startDate)} – {dateLabel(departure.endDate)}{departure.itinerary?.numberOfNights ? ` · ${departure.itinerary.numberOfNights} nights` : ''}{departure.itinerary?.name ? ` · ${departure.itinerary.name}` : ''}</p> : <p className={styles.cardDates}>Explore {type === 'resort' ? 'rooms, packages & stay options' : 'itineraries & departure dates'}</p>}
      <div className={styles.cardPrice}><div><small>{departure ? 'From' : 'Pricing'}</small>{offer && <del>{priceLabel(offer.originalPrice, departure.effectiveCurrency)}</del>}<strong>{departure ? priceLabel(departure.effectiveMinPrice, departure.effectiveCurrency) : 'On request'}</strong><span>Confirm by enquiry</span></div><Link href={href} aria-label={`View ${item.name}`}><HomeIcon size={18} /></Link></div>
    </div>
  </article>;
}

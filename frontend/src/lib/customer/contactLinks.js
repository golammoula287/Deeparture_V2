const email = 'info@deeparture.travel';

export const contactLinks = {
  email: { label: email, href: `mailto:${email}` },
  whatsapp: { label: '+63 917 907 8121', href: 'https://wa.me/639179078121' },
  phone: { label: '+64 21 024 13170', href: 'tel:+642102413170' },
  groups: `mailto:${email}?subject=${encodeURIComponent('Groups or Charters enquiry')}`,
};

// Profile URLs published in the existing deeparture.travel footer.
export const socialLinks = [
  { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/deeparture_dive/' },
  { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/Deeparture.dive/' },
  { label: 'X (Twitter)', icon: 'twitter', href: 'https://twitter.com/Deeparture_dive/' },
];

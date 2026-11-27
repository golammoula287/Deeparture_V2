import CustomerShell from './CustomerShell';
import styles from './LegalPage.module.css';

export default function LegalPage({ title, description, children }) {
  return <CustomerShell title={title} description={description} noIndex>
    <main className={styles.document}>
      <h1>{title}</h1>
      <p className={styles.notice}>Draft for review. This page is pending approval by Deeparture.</p>
      {children}
    </main>
  </CustomerShell>;
}

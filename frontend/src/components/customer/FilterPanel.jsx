import { useEffect, useId, useRef } from 'react';
import HomeIcon from './HomeIcon';
import styles from './SearchFilters.module.css';

export default function FilterPanel({ open, onClose, onClear, onApply, error, children }) {
  const titleId = useId();
  const dialog = useRef(null);

  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement;
    const overflow = document.body.style.overflow;
    const panel = dialog.current;
    panel.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      panel.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [open]);

  return <dialog ref={dialog} className={styles.panel} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.panelHeader}>
      <h2 id={titleId}>All Filters</h2>
      <button type="button" aria-label="Close filters" onClick={onClose}><HomeIcon name="close" size={21} /></button>
    </div>
    <form className={styles.panelForm} noValidate onSubmit={onApply}>
      <div className={styles.panelBody}>{children}</div>
      {error && <p className={styles.panelError} role="alert">{error}</p>}
      <div className={styles.panelActions}>
        <button type="button" onClick={onClear}>Clear filters</button>
        <button type="submit">Apply filters<HomeIcon name="arrow" size={18} /></button>
      </div>
    </form>
  </dialog>;
}

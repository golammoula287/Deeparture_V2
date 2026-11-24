import { useId, useRef, useState } from 'react';
import HomeIcon from './HomeIcon';
import styles from './DepartureWindow.module.css';

const monthLabel = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateLabel = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const isoDay = date => date.toISOString().slice(0, 10);

function monthChoices(first) {
  return Array.from({ length: 12 }, (_, index) => {
    const year = first.getUTCFullYear();
    const month = first.getUTCMonth() + index;
    const start = new Date(Date.UTC(year, month, 1));
    return {
      label: monthLabel.format(start),
      startDate: isoDay(start),
      endDate: isoDay(new Date(Date.UTC(year, month + 1, 0))),
    };
  });
}

export default function DepartureWindow({ label, startDate = '', endDate = '', onChange, className }) {
  const titleId = useId();
  const helpId = useId();
  const dialog = useRef(null);
  const [draft, setDraft] = useState({ startDate, endDate });
  const [months, setMonths] = useState([]);
  const [error, setError] = useState('');
  const summary = [startDate, endDate].filter(Boolean).map(value => dateLabel.format(new Date(value))).join(' – ');

  function open() {
    setDraft({ startDate, endDate });
    setMonths(monthChoices(startDate ? new Date(startDate) : new Date()));
    setError('');
    dialog.current.showModal();
  }

  function apply() {
    if (Boolean(draft.startDate) !== Boolean(draft.endDate) || (draft.startDate && draft.endDate < draft.startDate)) {
      setError('Choose a start and end date in order.');
      return;
    }
    onChange(draft);
    dialog.current.close();
  }

  function choose(next) {
    setDraft(next);
    setError('');
  }

  return <div className={className}>
    <span><HomeIcon name="calendar" size={20} />{label}</span>
    <button type="button" className={styles.trigger} aria-label={`${label}: ${summary || 'Any dates'}`} aria-haspopup="dialog" onClick={open}>{summary || 'Any dates'}</button>
    <input type="hidden" name="startDate" value={startDate} />
    <input type="hidden" name="endDate" value={endDate} />
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={titleId} aria-describedby={helpId} onClick={event => { if (event.target === event.currentTarget) dialog.current.close(); }} onKeyDown={event => { if (event.key === 'Enter' && event.target.type === 'date') event.preventDefault(); }}>
      <div className={styles.panel}>
        <div className={styles.heading}>
          <h2 id={titleId}>{label}</h2>
          <button className={styles.close} type="button" aria-label="Close date picker" onClick={() => dialog.current.close()}><HomeIcon name="close" /></button>
        </div>
        <p id={helpId}>Show trips departing within this date range. Return date may fall outside the selected dates.</p>
        <div className={styles.dates}>
          <label>Start date<input type="date" value={draft.startDate} onChange={event => choose({ ...draft, startDate: event.target.value })} /></label>
          <label>End date<input type="date" value={draft.endDate} onChange={event => choose({ ...draft, endDate: event.target.value })} /></label>
        </div>
        <div className={styles.months} aria-label="Full calendar months" role="group">
          {months.map(({ label: month, ...range }) => <button type="button" key={month} aria-pressed={draft.startDate === range.startDate && draft.endDate === range.endDate} onClick={() => choose(range)}>{month}</button>)}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className={styles.actions}>
          <button type="button" onClick={() => choose({ startDate: '', endDate: '' })}>Clear</button>
          <button type="button" onClick={apply}>Apply</button>
        </div>
      </div>
    </dialog>
  </div>;
}

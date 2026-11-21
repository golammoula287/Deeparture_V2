import HomeIcon from './HomeIcon';
import styles from './SearchFilters.module.css';

const groups = {
  dietary: 'Dietary needs',
  accessibility: 'Accessibility',
  facility: 'Facilities & services',
  diving: 'Diving preferences',
  accommodation: 'Accommodation',
  sustainability: 'Sustainability',
  other: 'Other preferences',
};

export function FilterGroup({ title, count = 0, initiallyOpen, children }) {
  return <details className={styles.group} open={initiallyOpen}>
    <summary>
      {title}
      <span className={styles.groupIndicators}>
        {count > 0 && <span className={styles.groupCount} aria-label={`${count} selected`}>{count}</span>}
        <HomeIcon name="chevron" size={18} />
      </span>
    </summary>
    <div className={styles.groupBody}>{children}</div>
  </details>;
}

export function withAttribute(attributes, definition, value) {
  const other = attributes.filter(item => item.key !== definition.key);
  if (value === '' || value === false || (Array.isArray(value) && !value.length)) return other;
  return [...other, { key: definition.key, op: Array.isArray(value) ? 'all' : 'eq', value }];
}

export default function PreferenceGroups({ definitions, attributes, onChange }) {
  const eligible = definitions.filter(def => def.active !== false && def.filterable !== false);
  return Object.entries(groups).map(([key, title]) => {
    const entries = eligible.filter(def => (Object.hasOwn(groups, def.group) ? def.group : 'other') === key);
    if (!entries.length) return null;
    const count = entries.filter(def => attributes.some(item => item.key === def.key)).length;
    return <FilterGroup key={key} title={title} count={count}>
      {entries.map(def => {
        const selected = attributes.find(item => item.key === def.key)?.value;
        if (def.dataType === 'boolean') {
          return <label key={def.key} className={styles.check}><input type="checkbox" checked={selected === true} onChange={event => onChange(def, event.target.checked)} />{def.label}</label>;
        }
        if (def.dataType === 'multi_select') {
          const selectedOptions = Array.isArray(selected) ? selected : [];
          return <fieldset className={styles.options} key={def.key}>
            <legend>{def.label}</legend>
            {(def.options || []).map(option => <label key={option} className={styles.check}>
              <input type="checkbox" checked={selectedOptions.includes(option)} onChange={event => onChange(def, event.target.checked ? [...selectedOptions, option] : selectedOptions.filter(value => value !== option))} />{option}
            </label>)}
          </fieldset>;
        }
        return <label key={def.key} className={styles.attribute}>
          {def.label}
          {def.dataType === 'select'
            ? <select value={selected ?? ''} onChange={event => onChange(def, event.target.value)}><option value="">Any</option>{(def.options || []).map(option => <option key={option}>{option}</option>)}</select>
            : <input type={def.dataType === 'number' ? 'number' : 'text'} value={selected ?? ''} onChange={event => onChange(def, def.dataType === 'number' && event.target.value !== '' ? Number(event.target.value) : event.target.value)} />}
        </label>;
      })}
    </FilterGroup>;
  });
}

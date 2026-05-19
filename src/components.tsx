// @ts-nocheck
import React from 'react';
import { Icon } from './icons';
import { useT } from './lang';

export function SearchableGroupSelect({ value, onChange, groups, placeholder }) {
  const I = Icon;
  const { t } = useT();
  const defaultPlaceholder = t('students_all_groups');
  const ph = placeholder ?? defaultPlaceholder;
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  const filtered = groups.filter(g => !q || g.name.toLowerCase().includes(q.toLowerCase()));
  const selectedGroup = groups.find(g => String(g.id) === String(value));
  React.useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(''); } }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ height: 38, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 180, justifyContent: 'space-between', whiteSpace: 'nowrap' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedGroup ? selectedGroup.name : ph}</span>
        <I.ChevronDown size={14} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', width: 'max-content', maxWidth: 300, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', zIndex: 300 }}>
          <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-2)', borderRadius: 6, padding: '4px 8px' }}>
              <I.Search size={13} color="var(--muted)" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t('search_placeholder')} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12.5, flex: 1, color: 'var(--text)' }} />
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {[{ id: 'all', name: ph }, ...filtered].map(g => {
              const isSelected = g.id === 'all' ? (!value || value === 'all' || value === '') : String(value) === String(g.id);
              return (
                <div key={g.id} onClick={() => { onChange(g.id === 'all' ? '' : String(g.id)); setOpen(false); setQ(''); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, background: isSelected ? 'var(--selected)' : 'transparent' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                  {isSelected ? <I.Check size={13} color="var(--brand-red)" /> : <span style={{ width: 13, display: 'inline-block' }} />}
                  <span>{g.name}</span>
                </div>
              );
            })}
            {filtered.length === 0 && <div style={{ padding: '10px 12px', fontSize: 12.5, color: 'var(--muted)' }}>{t('not_found')}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

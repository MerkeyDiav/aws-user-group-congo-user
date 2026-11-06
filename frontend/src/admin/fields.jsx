import { useId, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { adminApi } from './adminApi.js';
import { prepareImage } from './image.js';

export function Field({ label, hint, children, id }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <small className="adm-hint">{hint}</small>}
    </div>
  );
}

export function TextField({ label, hint, value, onChange, multiline, rows = 4, ...rest }) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <Field label={label} hint={hint} id={id}>
      <Tag
        id={id}
        className={multiline ? 'textarea' : 'input'}
        rows={multiline ? rows : undefined}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </Field>
  );
}

export function SelectField({ label, value, onChange, options }) {
  const id = useId();
  return (
    <Field label={label} id={id}>
      <select id={id} className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Liste de textes saisie « une ligne = un élément » (ou paragraphes séparés par une ligne vide). */
export function LinesField({ label, hint, value = [], onChange, paragraphs, rows = 4 }) {
  const sep = paragraphs ? '\n\n' : '\n';
  const [text, setText] = useState(() => value.join(sep));
  return (
    <TextField
      label={label}
      hint={hint}
      multiline
      rows={rows}
      value={text}
      onChange={(t) => {
        setText(t);
        onChange(
          t
            .split(paragraphs ? /\n\s*\n/ : '\n')
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }}
    />
  );
}

/** Image : envoi d'une photo (redimensionnée) ou saisie d'une adresse. */
export function ImageField({ label, hint, value, onChange, compact }) {
  const id = useId();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const { contentType, data } = await prepareImage(file);
      const { url } = await adminApi.upload(contentType, data);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`field adm-image ${compact ? 'adm-image--compact' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="adm-image__row">
        <div className="adm-image__preview">
          {value ? <img src={value} alt="" /> : <Icon name="image" size={22} />}
        </div>
        <div className="adm-image__controls">
          <div className="adm-image__buttons">
            <button type="button" className="btn btn--ghost btn--xs" onClick={() => input.current.click()} disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner spinner--dark spinner--sm" /> Envoi…
                </>
              ) : (
                <>
                  <Icon name="upload" size={15} /> {value ? 'Remplacer' : 'Envoyer une photo'}
                </>
              )}
            </button>
            {value && (
              <button type="button" className="btn btn--ghost btn--xs" onClick={() => onChange('')} disabled={busy}>
                Retirer
              </button>
            )}
          </div>
          <input
            id={id}
            className="input input--sm"
            placeholder="ou collez une adresse https://…"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onFile} />
      {hint && <small className="adm-hint">{hint}</small>}
      {error && <small className="adm-error">{error}</small>}
    </div>
  );
}

/** Liste d'éléments modifiables : ajouter, supprimer, réordonner. */
export function ListEditor({ label, hint, items = [], onChange, newItem, renderItem, itemLabel = 'Élément', addLabel }) {
  const update = (i, patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i, d) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <fieldset className="adm-list">
      <legend>{label}</legend>
      {hint && <p className="adm-hint">{hint}</p>}
      {items.length === 0 && <p className="adm-empty">Aucun élément pour l’instant.</p>}
      {items.map((item, i) => (
        <div key={i} className="adm-list__item">
          <div className="adm-list__head">
            <strong>
              {itemLabel} {i + 1}
            </strong>
            <div className="adm-list__actions">
              <button type="button" className="adm-icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">
                ↑
              </button>
              <button
                type="button"
                className="adm-icon-btn"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="Descendre"
              >
                ↓
              </button>
              <button
                type="button"
                className="adm-icon-btn adm-icon-btn--danger"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="adm-list__body">{renderItem(item, (patch) => update(i, patch), i)}</div>
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--xs" onClick={() => onChange([...items, newItem()])}>
        + {addLabel || `Ajouter ${itemLabel.toLowerCase()}`}
      </button>
    </fieldset>
  );
}

export function SaveBar({ dirty, saving, onSave, message, error }) {
  return (
    <div className="adm-savebar">
      <div className="adm-savebar__status" role="status">
        {error ? (
          <span className="adm-error">{error}</span>
        ) : message ? (
          <span className="adm-ok">{message}</span>
        ) : dirty ? (
          'Modifications non enregistrées'
        ) : (
          'Tout est enregistré'
        )}
      </div>
      <button type="button" className="btn btn--primary btn--sm" onClick={onSave} disabled={saving || !dirty}>
        {saving ? (
          <>
            <span className="spinner" /> Enregistrement…
          </>
        ) : (
          'Enregistrer'
        )}
      </button>
    </div>
  );
}

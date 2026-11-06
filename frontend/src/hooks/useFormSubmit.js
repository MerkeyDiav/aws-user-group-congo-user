import { useState } from 'react';
import { submitForm } from '../services/api.js';

/** Gère l'envoi d'un formulaire : collecte des champs, état, erreurs. */
export function useFormSubmit(type) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (key.endsWith('[]')) {
        const k = key.slice(0, -2);
        payload[k] = [...(payload[k] || []), value];
      } else {
        payload[key] = typeof value === 'string' ? value.trim() : value;
      }
    }

    setStatus('loading');
    setError('');
    try {
      await submitForm(type, payload);
      form.reset();
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return { status, error, onSubmit, reset: () => setStatus('idle') };
}

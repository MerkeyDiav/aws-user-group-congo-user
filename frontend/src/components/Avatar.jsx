import { useState } from 'react';
import { initials } from '../utils/events.js';

export default function Avatar({ name, photo, size = 40, className = '' }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={`avatar ${className}`} style={{ '--size': `${size}px` }} title={name}>
      {photo && !broken ? (
        <img src={photo} alt={name} loading="lazy" onError={() => setBroken(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

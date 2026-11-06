import Icon from './Icon.jsx';
import { formatDate, formatTime } from '../utils/events.js';

export default function EventMeta({ event, className = '' }) {
  return (
    <ul className={`meta ${className}`}>
      <li>
        <Icon name="calendar" size={17} />
        {formatDate(event.start)}
      </li>
      <li>
        <Icon name="clock" size={17} />
        {formatTime(event.start)}
        {event.end && ` – ${formatTime(event.end)}`} (heure de Kinshasa)
      </li>
      <li>
        <Icon name={event.format === 'online' ? 'video' : 'pin'} size={17} />
        {event.location}
      </li>
    </ul>
  );
}

/**
 * Champ piège anti-robots : invisible pour les humains, souvent rempli par les robots.
 * Si l'API le reçoit non vide, elle ignore la soumission.
 */
export default function Honeypot() {
  return (
    <div className="honeypot" aria-hidden="true">
      <label htmlFor="hp-website">Site web</label>
      <input id="hp-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
    </div>
  );
}

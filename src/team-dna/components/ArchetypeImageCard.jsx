/**
 * Intro image card for deterministic role imagery.
 *
 * What: shows the generated placeholder image associated with the member's
 * fallback role combination. For duos, it crossfades the two solo images until
 * pair-specific art exists.
 * How: receives resolved image URLs from the adapter; this component stays dumb
 * so production can swap image storage/CDN mechanics without touching the panel
 * renderer.
 */
export function ArchetypeImageCard({ image }) {
  const images = image?.images?.length ? image.images : image ? [image] : [];

  if (!images.length) {
    return null;
  }
  const isDuo = images.length > 1;
  const isTeam = image?.key === 'team-shape';

  return (
    <figure
      className={[
        'archetype-image-card',
        isDuo ? 'archetype-image-card--duo' : '',
        isTeam ? 'archetype-image-card--team' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="archetype-image-card-window">
        {images.map((entry, index) => (
          <img
            alt={entry.alt ?? ''}
            className="archetype-image-card-image"
            data-layer={index}
            key={entry.slug ?? entry.imageUrl}
            src={entry.imageUrl}
          />
        ))}
      </div>
    </figure>
  );
}

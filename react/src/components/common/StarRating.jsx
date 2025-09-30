export default function StarRating({ value = 0, size = 12, color = '#f59e0b', count = 5 }) {
  // value: numeric rating (e.g. 4.5). Renders up to `count` stars with full/half/empty fills.
  const raw = typeof value === 'string' ? Number(value) : value;
  const rating = Number.isFinite(raw) ? Math.max(0, Math.min(count, raw)) : 0;
  const px = typeof size === 'number' ? `${size}px` : size;
  const uid = 'sr' + Math.random().toString(36).slice(2);

  const starPath = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.538 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.783.57-1.838-.196-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z';

  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} yıldız`}>
      {Array.from({ length: count }).map((_, i) => {
        // compute exact fill percent for this star: 0..1 (e.g. remaining=0.2 -> 0.2)
        const starIndex = i; // 0-based
        const remaining = rating - starIndex;
        const fillPercent = Math.max(0, Math.min(1, remaining));
        const gradId = `${uid}-grad-${i}`;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            width={px}
            height={px}
            aria-hidden="true"
            className="shrink-0"
          >
            <defs>
              {/* Use a linear gradient with two stops at the exact fillPercent to make a sharp edge */}
              {fillPercent > 0 && fillPercent < 1 ? (
                <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0" gradientUnits="objectBoundingBox">
                  <stop offset={`${fillPercent * 100}%`} stopColor={color} />
                  <stop offset={`${fillPercent * 100}%`} stopColor="#E5E7EB" />
                </linearGradient>
              ) : null}
            </defs>
            {/* fill with gradient when partial, solid color when full, gray when empty */}
            <path d={starPath} fill={fillPercent === 0 ? '#E5E7EB' : fillPercent === 1 ? color : `url(#${gradId})`} />
          </svg>
        );
      })}
    </div>
  );
}

export default function StarRating({ size = 12, color = '#f59e0b', count = 5 }) {
  // Render fixed filled stars for now
  const stars = Array.from({ length: count });
  const px = typeof size === 'number' ? `${size}px` : size;
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${count} yıldız`}>
      {stars.map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
          width={px}
          height={px}
          aria-hidden="true"
          className="shrink-0"
          style={{ color }}
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.036a1 1 0 00-.364 1.118l1.07 3.292c.3.922-.755 1.688-1.538 1.118l-2.802-2.036a1 1 0 00-1.176 0l-2.802 2.036c-.783.57-1.838-.196-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

import React, { useEffect, forwardRef } from 'react';

// Renders an element using background-image so mobile browsers don't show
// the native "save image" UI on long-press. Preserves a lightweight onLoad
// callback by preloading the image and forwarding naturalWidth/Height.
const ProtectedImage = forwardRef(function ProtectedImage({ src, alt = '', className = '', style = {}, onClick, onLoad }, ref) {
  useEffect(() => {
    if (!src) return;
    let img = new Image();
    img.src = src;
    img.onload = () => {
      if (onLoad) {
        // simulate a minimal event with currentTarget.naturalWidth/Height
        try { onLoad({ currentTarget: { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight } }); } catch (e) { /* ignore */ }
      }
    };
    return () => { if (img) img.onload = null; img = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const baseStyle = {
    backgroundImage: src ? `url(${src})` : 'none',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: (className && (className.includes('object-contain') || className.includes('product-image'))) ? 'contain' : 'cover',
    backgroundOrigin: 'content-box',
    backgroundColor: 'transparent',
    display: 'block',
    width: '100%',
    height: '100%'
  };

  return (
    <div
      ref={ref}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      className={className}
      style={{ ...baseStyle, ...style }}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
});

export default ProtectedImage;

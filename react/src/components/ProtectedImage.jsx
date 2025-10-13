import React, { useEffect, forwardRef } from 'react';
import { normalizeImageUrl } from '../lib/normalize.js';

// Renders an element using background-image so mobile browsers don't show
// the native "save image" UI on long-press. Preserves a lightweight onLoad
// callback by preloading the image and forwarding naturalWidth/Height.
const ProtectedImage = forwardRef(function ProtectedImage({ src, alt = '', className = '', style = {}, onClick, onLoad, allowNativeOnMobile = false }, ref) {
  const normSrc = normalizeImageUrl(src);
  useEffect(() => {
    if (!normSrc) return;
    let img = new Image();
    img.src = normSrc;
    img.onload = () => {
      if (onLoad) {
        // simulate a minimal event with currentTarget.naturalWidth/Height
        try { onLoad({ currentTarget: { naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight } }); } catch (e) { /* ignore */ }
      }
    };
    return () => { if (img) img.onload = null; img = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normSrc]);

  const baseStyle = {
    backgroundImage: normSrc ? `url(${normSrc})` : 'none',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: (className && (className.includes('object-contain') || className.includes('product-image'))) ? 'contain' : 'cover',
    backgroundOrigin: 'content-box',
    backgroundColor: 'transparent',
    display: 'block',
    width: '100%',
    height: '100%'
  };

  // Detect touch / coarse pointer devices
  const isTouchDevice = typeof window !== 'undefined' && (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

  // If allowed and running on touch device, render a native <img> so mobile long-press/open and native behaviors work.
  if (allowNativeOnMobile && isTouchDevice) {
    // remove no-download marker from className so global contextmenu blocker doesn't interfere
    const imgClass = String(className || '').replace(/\bno-download\b/g, '').trim();
    return (
      <img
        ref={ref}
        src={normSrc}
        alt={alt}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        className={imgClass}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: (className && (className.includes('object-contain') || className.includes('product-image'))) ? 'contain' : 'cover', ...style }}
        onClick={onClick}
        onLoad={(e) => { if (onLoad) try { onLoad({ currentTarget: e.currentTarget }); } catch (ee) {} }}
      />
    );
  }

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

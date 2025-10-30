import React, { useEffect, forwardRef } from 'react';
import { normalizeImageUrl } from '../lib/normalize.js';

// Simple image wrapper — renders a native <img> so users can use browser-native
// actions (download / open in new tab). Keeps a compatible API with previous
// ProtectedImage props but removes long-press/contextmenu blocking.
const ProtectedImage = forwardRef(function ProtectedImage({ src, alt = '', className = '', style = {}, onClick, onLoad, allowNativeOnMobile = false, ...rest }, ref) {
  const normSrc = normalizeImageUrl(src);

  const objectFit = (className && (className.includes('object-contain') || className.includes('product-image'))) ? 'contain' : 'cover';

  const imgStyle = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    width: undefined,
    height: undefined,
    objectFit,
    ...style
  };

  return (
    <img
      ref={ref}
      src={normSrc}
      alt={alt}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      className={String(className || '').trim()}
      style={imgStyle}
      draggable={false}
      onDragStart={(e) => { try { e.preventDefault(); } catch (err) {} }}
      {...rest}
      onClick={onClick}
      onLoad={(e) => { if (onLoad) try { onLoad({ currentTarget: e.currentTarget }); } catch (ee) {} }}
    />
  );
});

export default ProtectedImage;

import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/useLanguage';

type PhotoZoomProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

export function PhotoZoom({ src, alt, priority = false }: PhotoZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) return;

    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  const lightbox = isOpen ? createPortal(<div className="photo-lightbox" onClick={() => setIsOpen(false)}>
    <div className="photo-lightbox-panel" role="dialog" aria-modal="true" aria-label={alt} onClick={(event) => event.stopPropagation()}>
      <button ref={closeRef} className="photo-lightbox-close" type="button" aria-label={t('closePhoto')} onClick={() => setIsOpen(false)}><X size={23} /></button>
      <img src={src} alt={alt} />
    </div>
  </div>, document.body) : null;

  return <>
    <button
      ref={triggerRef}
      className="photo-zoom-trigger"
      type="button"
      aria-label={`${t('viewPhoto')}: ${alt}`}
      aria-haspopup="dialog"
      onClick={() => setIsOpen(true)}
    >
      <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} />
      <span className="photo-zoom-indicator" aria-hidden="true"><ZoomIn size={18} /></span>
    </button>
    {lightbox}
  </>;
}

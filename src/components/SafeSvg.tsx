import { useMemo } from 'react';
import { sanitizeSvg } from '../lib/svgSanitizer';

interface SafeSvgProps {
  svg?: string;
  imageUrl?: string;
  alt?: string;
  fallbackEmoji?: string;
  className?: string;
}

export function SafeSvg({
  svg,
  imageUrl,
  alt = 'Illustration',
  fallbackEmoji = '📖',
  className = '',
}: SafeSvgProps) {
  const cleanSvg = useMemo(() => sanitizeSvg(svg), [svg]);

  if (imageUrl) {
    return (
      <div className={`svg-stage overflow-hidden ${className}`}>
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (!cleanSvg) {
    return (
      <div
        className={`svg-stage flex flex-col items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-center p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-5xl mb-2" aria-hidden="true">
          {fallbackEmoji}
        </span>
        <span className="text-xs font-semibold text-[var(--text-muted)]">
          Bilderbuch-Szene
        </span>
      </div>
    );
  }

  return (
    <div
      className={`svg-stage overflow-hidden [&>svg]:h-full [&>svg]:w-full [&>svg]:block ${className}`}
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: cleanSvg }}
    />
  );
}

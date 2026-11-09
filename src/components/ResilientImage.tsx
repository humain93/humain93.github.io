import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { resolveAssetUrl } from '../utils/imageAssets';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveAssetUrl(src);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 bg-engineering-grid text-slate-600 p-6 border border-slate-200 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Cpu className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
        <span className="text-xs font-mono text-center text-slate-500 max-w-xs">
          {fallbackLabel || alt || 'Technical System Visualization'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};

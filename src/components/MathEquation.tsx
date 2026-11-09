import React, { useMemo } from 'react';
import katex from 'katex';

interface MathEquationProps {
  latex: string;
  block?: boolean;
  className?: string;
}

export const MathEquation: React.FC<MathEquationProps> = ({
  latex,
  block = false,
  className = '',
}) => {
  const renderedHtml = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        trust: true,
      });
    } catch {
      return '';
    }
  }, [latex, block]);

  if (!renderedHtml) {
    return (
      <code className={`font-mono text-xs text-slate-700 ${className}`}>
        {latex}
      </code>
    );
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

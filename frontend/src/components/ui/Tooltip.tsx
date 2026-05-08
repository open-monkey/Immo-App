import type { PropsWithChildren } from 'react';

type TooltipProps = PropsWithChildren<{
  content: string;
}>;

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="tooltip-wrapper">
      {children}
      <div className="tooltip-content" role="tooltip">
        {content}
      </div>
    </span>
  );
}

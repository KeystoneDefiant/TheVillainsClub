import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  /** The content to display in the tooltip */
  content: string;
  /** The element to attach the tooltip to */
  children: React.ReactNode;
  /** Position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Tooltip component for displaying helpful information on hover
 * 
 * Provides accessible tooltips with ARIA support, keyboard navigation,
 * and customizable positioning.
 * 
 * @example
 * <Tooltip content="This will increase your chances of getting a Devil's Deal">
 *   <button>Devil's Deal Chance</button>
 * </Tooltip>
 */
export function Tooltip({ content, children, position = 'top', className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + 8;
        break;
    }

    // Ensure tooltip stays within viewport
    const maxLeft = window.innerWidth - tooltipRect.width - 8;
    const maxTop = window.innerHeight - tooltipRect.height - 8;
    left = Math.max(8, Math.min(left, maxLeft));
    top = Math.max(8, Math.min(top, maxTop));

    setTooltipStyle({ top, left, position: 'fixed' });
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      aria-describedby={isVisible ? 'tooltip' : undefined}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          className="z-[9999] px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs pointer-events-none"
          style={tooltipStyle}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'bottom-[-4px] left-1/2 -translate-x-1/2'
                : position === 'bottom'
                ? 'top-[-4px] left-1/2 -translate-x-1/2'
                : position === 'left'
                ? 'right-[-4px] top-1/2 -translate-y-1/2'
                : 'left-[-4px] top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
}

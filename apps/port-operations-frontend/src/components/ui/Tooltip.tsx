import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip: React.FC<TooltipProps> = ({ content, children, open, onOpenChange }) => {
  return (
    <TooltipPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="z-50 overflow-hidden rounded-md bg-bg-secondary px-3 py-1.5 text-sm text-text-primary border border-border-color shadow-lg"
          sideOffset={5}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-bg-secondary" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};

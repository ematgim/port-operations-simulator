import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  className = '',
  ...props
}) => {
  return (
    <button
      aria-label={label}
      className={`w-10 h-10 flex items-center justify-center rounded-lg bg-bg-secondary text-text-primary border border-border-color hover:bg-bg-tertiary hover:scale-110 hover:border-accent-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};

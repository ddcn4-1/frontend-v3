'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';
import type { CSSProperties } from 'react';

const toasterStyles = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
} as CSSProperties;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const resolvedTheme: ToasterProps['theme'] =
    theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';

  return (
    <Sonner theme={resolvedTheme} className="toaster group" style={toasterStyles} {...props} />
  );
};

export { Toaster };

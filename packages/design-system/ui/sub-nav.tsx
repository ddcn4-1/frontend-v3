import type { HTMLAttributes } from 'react';
import { cn } from '../lib/utils';

type SubNavState = 'active' | 'inactive';

export interface SubNavItemVariants {
  readonly state?: SubNavState;
}

export function subNavItemVariants({ state = 'inactive' }: SubNavItemVariants = {}) {
  return cn(
    'inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium transition-colors',
    state === 'active'
      ? 'border-primary text-primary'
      : 'text-muted-foreground hover:text-primary hover:border-primary/50',
  );
}

export function SubNav({ className, ...props }: Readonly<HTMLAttributes<HTMLElement>>) {
  return (
    <nav
      className={cn(
        'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className,
      )}
      {...props}
    />
  );
}

export function SubNavList({ className, ...props }: Readonly<HTMLAttributes<HTMLUListElement>>) {
  return (
    <ul
      className={cn('container mx-auto flex items-center gap-1 overflow-x-auto text-sm', className)}
      {...props}
    />
  );
}

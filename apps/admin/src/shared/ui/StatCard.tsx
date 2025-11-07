/**
 * StatCard Component
 * Reusable statistics card for displaying metrics
 */

import { ReactNode } from 'react';
import { Card, CardContent } from '@packages/design-system';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({
  icon: Icon,
  iconColor = 'text-blue-500',
  label,
  value,
  className = '',
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-medium">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

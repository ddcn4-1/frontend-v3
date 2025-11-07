/**
 * Shared loading skeleton component
 * FSD v2.1: Shared - UI Layer
 */

import { Card, CardContent, Skeleton } from '@packages/design-system';

interface LoadingSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
}

/**
 * Standard loading skeleton for admin pages
 */
export function LoadingSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="space-y-2">
            {[...Array(rows)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Animated pulse loading skeleton
 */
export function PulseLoadingSkeleton({ rows = 5 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[...Array(rows)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

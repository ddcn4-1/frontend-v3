import { ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent, CardTitle } from '@packages/design-system';

import type { ReactNode } from 'react';

interface SeatSelectionLayoutProps {
  performanceTitle: string;
  performanceVenue?: string | null;
  onBack: () => void;
  workspaceSlot: ReactNode;
  sidebarSlot: ReactNode;
}

export function SeatSelectionLayout({
  performanceTitle,
  performanceVenue,
  onBack,
  workspaceSlot,
  sidebarSlot,
}: SeatSelectionLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-8 lg:px-6">
      <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span role="img" aria-hidden="true">
                🎫
              </span>
              좌석 선택 단계
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              {performanceTitle}
            </CardTitle>
            {performanceVenue && <p className="text-sm text-gray-500">{performanceVenue}</p>}
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Button variant="outline" onClick={onBack} className="rounded-full px-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> 뒤로가기
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="min-w-0">{workspaceSlot}</div>
          {sidebarSlot && <div className="flex flex-col gap-4 lg:gap-6">{sidebarSlot}</div>}
        </div>
      </div>
    </div>
  );
}

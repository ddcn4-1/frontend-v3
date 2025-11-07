import { type ReactNode } from 'react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import { Button } from '@packages/design-system';
import { SeatMap } from './SeatMap';
import type { SeatMapSection } from '@packages/shared';

interface SeatMapWorkspaceProps {
  sections: SeatMapSection[];
  selectedCodes: Set<string>;
  occupiedCodes: Set<string>;
  gradePrices: Record<string, number>;
  onSeatClick: (seatId: string) => void;
  getSectionIdentifier: (section: SeatMapSection, index: number) => string;
  generateRowLabel: (from: string, rowIndex: number) => string;
  buildSeatCode: (params: {
    zone?: string | null;
    rowLabel: string;
    seatNumber: string | number;
  }) => string;
  zoomLevel: number;
  zoomPercentage: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  selectedCount: number;
  selectionLimit?: number;
  stageLabel?: string;
  stageDescription?: string;
}

export function SeatMapWorkspace({
  sections,
  selectedCodes,
  occupiedCodes,
  gradePrices,
  onSeatClick,
  getSectionIdentifier,
  generateRowLabel,
  buildSeatCode,
  zoomLevel,
  zoomPercentage,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  selectedCount,
  selectionLimit = 4,
  stageLabel = '무대 (STAGE)',
  stageDescription = '모든 좌석에서 무대를 확인할 수 있어요.',
}: SeatMapWorkspaceProps) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">좌석 선택</h3>
            <p className="text-sm text-gray-500">무대를 기준으로 원하는 좌석을 선택하세요.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-gray-500">선택 좌석</span>
              <span className="text-base font-semibold text-gray-900">{selectedCount}석</span>
              <span className="text-sm text-gray-400">/ 최대 {selectionLimit}석</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomOut}
                disabled={!canZoomOut}
                aria-label="좌석 축소"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600 w-14 text-center">
                {zoomPercentage}%
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={onZoomIn}
                disabled={!canZoomIn}
                aria-label="좌석 확대"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onZoomReset}
                disabled={Math.abs(zoomLevel - 1) < 0.01}
                aria-label="확대 비율 초기화"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
          <div className="rounded-xl bg-white px-6 py-3 font-semibold text-gray-800 inline-flex items-center gap-2 shadow-sm">
            <span role="img" aria-hidden="true">
              🎭
            </span>
            {stageLabel}
          </div>
          <p className="mt-3 text-xs text-gray-500">{stageDescription}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6 min-h-[420px]">
          <div className="overflow-auto max-h-[70vh]">
            <div className="flex justify-center min-w-full">
              <div
                className="inline-block transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center top',
                  willChange: 'transform',
                }}
              >
                <SeatMap
                  sections={sections}
                  selectedCodes={selectedCodes}
                  occupiedCodes={occupiedCodes}
                  gradePrices={gradePrices}
                  onSeatClick={onSeatClick}
                  getSectionIdentifier={getSectionIdentifier}
                  generateRowLabel={generateRowLabel}
                  buildSeatCode={buildSeatCode}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-gray-200 bg-white/60 p-4">
          <LegendChip
            label="선택 가능"
            className="bg-gray-100 text-gray-700 border-gray-200"
            icon="1"
          />
          <LegendChip
            label="선택됨"
            className="bg-indigo-100 text-indigo-700 border-indigo-200"
            icon="2"
          />
          <LegendChip
            label="예매완료"
            className="bg-gray-200 text-gray-600 border-gray-300"
            icon={<X className="w-3 h-3" />}
          />
        </div>
      </div>
    </div>
  );
}

function LegendChip({
  label,
  className,
  icon,
}: {
  label: string;
  className: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium ${className}`}
      >
        {icon}
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

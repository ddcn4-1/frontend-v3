import React, { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@packages/design-system';
import type { SeatMapSection } from '@packages/shared';

interface SeatMapProps {
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
}

export function SeatMap({
  sections,
  selectedCodes,
  occupiedCodes,
  gradePrices,
  onSeatClick,
  getSectionIdentifier,
  generateRowLabel,
  buildSeatCode,
}: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const renderSection = useCallback(
    (section: SeatMapSection, sectionIndex: number) => {
      const nodes: React.ReactNode[] = [];
      const seatStart = section.seatStart ?? 1;
      const grade = section.grade ?? 'A';

      for (let row = 0; row < section.rows; row++) {
        const rowLabel = generateRowLabel(section.rowLabelFrom, row);
        const rowSeats: React.ReactNode[] = [];

        for (let col = 0; col < section.cols; col++) {
          const seatNumber = seatStart + col;
          const zoneKey = getSectionIdentifier(section, sectionIndex);
          const seatId = buildSeatCode({ zone: zoneKey, rowLabel, seatNumber });
          const isSelected = selectedCodes.has(seatId);
          const isOccupied = occupiedCodes.has(seatId);

          const baseClasses =
            'relative w-8 h-8 m-1 rounded-md border transition-colors text-xs font-medium flex items-center justify-center';
          let seatClasses;
          if (isOccupied) {
            seatClasses = `${baseClasses} bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed`;
          } else if (isSelected) {
            seatClasses = `${baseClasses} bg-blue-600 border-blue-600 text-white`;
          } else {
            seatClasses = `${baseClasses} bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200`;
          }

          rowSeats.push(
            <Tooltip key={seatId}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSeatClick(seatId)}
                  onMouseEnter={() => setHoveredSeat(seatId)}
                  onMouseLeave={() => setHoveredSeat(null)}
                  disabled={isOccupied}
                  className={seatClasses}
                >
                  {isOccupied ? (
                    <X className="w-4 h-4 text-gray-600" />
                  ) : (
                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : ''}`}>
                      {seatNumber}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {section.zone || section.name ? `${section.zone || section.name} · ` : ''}
                {`${rowLabel}-${seatNumber}`} · {grade}석 · ₩
                {(gradePrices[grade] ?? 0).toLocaleString()}
              </TooltipContent>
            </Tooltip>,
          );
        }

        nodes.push(
          <div key={rowLabel} className="flex items-center justify-center mb-1">
            <span className="text-xs font-medium w-8 text-center mr-2 rounded-sm py-0.5 px-1 border border-gray-300 text-black">
              {rowLabel}
            </span>
            <div className="flex gap-1">{rowSeats}</div>
          </div>,
        );
      }

      return (
        <div key={sectionIndex} className="mb-6">
          {(section.name || section.grade) && (
            <div className="w-full flex justify-center mt-2 mb-4">
              <div className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {section.name ?? 'Section'}
                  {section.grade ? ` (${section.grade}석)` : ''}
                </span>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center">{nodes}</div>
        </div>
      );
    },
    [
      selectedCodes,
      occupiedCodes,
      gradePrices,
      getSectionIdentifier,
      generateRowLabel,
      buildSeatCode,
      onSeatClick,
    ],
  );

  return (
    <div className="space-y-4">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  );
}

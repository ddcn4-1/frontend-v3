import { Card, CardHeader, CardContent, CardTitle } from '@packages/design-system';
import type { SeatMapSection } from '@packages/shared';

interface BookingFormProps {
  selectedCodes: Set<string>;
  gradePrices: Record<string, number>;
  seatMapSections: SeatMapSection[];
  gradeSwatchClass: Record<string, string>;
  resolveSeatGrade: (seatId: string, sections: SeatMapSection[]) => string | null;
}

export function BookingForm({
  selectedCodes,
  gradePrices,
  seatMapSections,
  gradeSwatchClass,
  resolveSeatGrade,
}: BookingFormProps) {
  return (
    <Card className="rounded-3xl border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">좌석 등급 & 현황</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            좌석 등급 (요금)
          </h3>
          <div className="mt-3 space-y-2">
            {Object.entries(gradePrices).map(([grade, price]) => (
              <div key={grade} className="flex items-center justify-between text-xs text-gray-700">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block h-3 w-3 rounded-sm ${gradeSwatchClass[grade] ?? 'bg-orange-600'}`}
                  />
                  {grade}석
                </span>
                <span className="text-gray-900">₩{Number(price).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            선택한 좌석
          </h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {selectedCodes.size > 0 ? (
              Array.from(selectedCodes).map((seatId) => {
                const grade = resolveSeatGrade(seatId, seatMapSections) || 'A';
                const price = gradePrices[grade] ?? 0;
                return (
                  <div
                    key={seatId}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <span>
                      {seatId} · {grade}석
                    </span>
                    <span className="font-medium text-gray-900">₩{price.toLocaleString()}</span>
                  </div>
                );
              })
            ) : (
              <div className="flex h-12 items-center justify-center rounded-xl bg-white text-sm text-gray-400">
                좌석을 선택하면 목록이 채워집니다.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

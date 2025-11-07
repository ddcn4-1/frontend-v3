import { Button, Card, CardContent, CardHeader, CardTitle } from '@packages/design-system';

interface BookingSummaryProps {
  selectedCount: number;
  totalPrice: number;
  loading: boolean;
  onBooking: () => void;
  onReset: () => void;
  selectionLimit?: number;
}

export function BookingSummary({
  selectedCount,
  totalPrice,
  loading,
  onBooking,
  onReset,
  selectionLimit = 4,
}: BookingSummaryProps) {
  return (
    <Card className="sticky top-4 rounded-3xl border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">선택 내역</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              최대 {selectionLimit}석까지 선택할 수 있어요.
            </p>
          </div>
          <div className="rounded-xl bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
            {selectedCount}석 선택됨
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>총 금액</span>
            <span className="text-xl font-bold text-gray-900">₩{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid gap-3">
          <Button
            disabled={selectedCount === 0 || loading}
            onClick={onBooking}
            className="w-full py-5 text-base font-semibold"
            variant={selectedCount === 0 ? 'secondary' : 'default'}
          >
            예매하기 {selectedCount > 0 && `(${selectedCount})`}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            className="w-full py-5"
            disabled={selectedCount === 0}
          >
            선택 초기화
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

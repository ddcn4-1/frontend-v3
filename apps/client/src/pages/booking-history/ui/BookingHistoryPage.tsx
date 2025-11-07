import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/design-system';

import { Calendar, MapPin, Users, CreditCard, AlertTriangle } from 'lucide-react';

import { bookingService } from '@/entities/booking';
import type {
  BookingDto,
  GetBookingDetail200ResponseDto,
  CancelBookingRequestDto,
} from '@packages/shared';

interface BookingHistoryProps {
  userId?: number;
}

export default function BookingHistoryPage({ userId }: BookingHistoryProps) {
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'bookedDesc' | 'bookedAsc' | 'showAsc' | 'showDesc'>(
    'bookedDesc',
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'CONFIRMED' | 'CANCELLED'>('all');
  const [cancellingBooking, setCancellingBooking] = useState<BookingDto | null>(null);
  const [bookingDetails, setBookingDetails] = useState<GetBookingDetail200ResponseDto | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [processingCancellation, setProcessingCancellation] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<BookingDto | null>(null);
  const [viewingBookingDetails, setViewingBookingDetails] =
    useState<GetBookingDetail200ResponseDto | null>(null);
  const fetchGuardRef = useRef<string | null>(null);

  // Local seat codes captured at booking time
  const [localSeatCodesMap, setLocalSeatCodesMap] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      const rawCodes = localStorage.getItem('bookingSeatCodes');
      if (rawCodes) {
        const parsedCodes = JSON.parse(rawCodes);
        if (parsedCodes && typeof parsedCodes === 'object') setLocalSeatCodesMap(parsedCodes);
      }
    } catch (e) {
      console.warn('Failed to load local booking seat codes', e);
      setLocalSeatCodesMap({});
    }
  }, []);

  useEffect(() => {
    const userKey = userId != null ? `user-${userId}` : 'anonymous';
    if (fetchGuardRef.current === userKey) {
      return;
    }

    fetchGuardRef.current = userKey;
    setLoading(true);

    const fetchBookings = async () => {
      try {
        console.log('Fetching bookings for user:', userId);
        const response = await bookingService.getBookings();
        console.log('Bookings response:', response);
        setBookings(response.bookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        if (fetchGuardRef.current === userKey) {
          fetchGuardRef.current = null;
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchBookings();
  }, [userId]);

  const handleCancelBooking = async (booking: BookingDto) => {
    setCancellingBooking(booking);
    setCancellationReason('');
    setSelectedCancelReason('');

    // 예약 상세 정보 로드 (좌석 정보가 필요한 경우만)
    try {
      const details = await bookingService.getBookingDetail(booking.bookingId);
      setBookingDetails(details);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    }
  };

  const processCancellation = async () => {
    if (!cancellingBooking || !selectedCancelReason) return;

    setProcessingCancellation(true);

    try {
      const reason = selectedCancelReason === 'other' ? cancellationReason : selectedCancelReason;

      const cancelRequest: CancelBookingRequestDto = {
        reason: reason,
      };

      const response = await bookingService.cancelBooking(
        cancellingBooking.bookingId,
        cancelRequest,
      );

      console.log('Booking cancelled successfully:', response);

      // 예약 목록 새로고침
      const updatedBookings = await bookingService.getBookings();
      setBookings(updatedBookings.bookings);

      alert('예약이 성공적으로 취소되었습니다.');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('예약 취소에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessingCancellation(false);
      setCancellingBooking(null);
      setBookingDetails(null);
    }
  };

  const handleViewBookingDetail = async (booking: BookingDto) => {
    setViewingBooking(booking);
    setViewingBookingDetails(null);

    // 예약 상세 정보 로드
    try {
      const details = await bookingService.getBookingDetail(booking.bookingId);
      setViewingBookingDetails(details);
    } catch (error) {
      console.error('Failed to fetch booking details:', error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateRefundAmount = (booking: BookingDto) => {
    // BookingDto에는 show_datetime이 없으므로 전체 금액 반환
    // 실제로는 스케줄 정보를 가져와서 계산해야 함
    return booking.totalAmount;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
  };

  const canCancelBooking = (booking: BookingDto) => {
    // BookingDto에는 show_datetime이 없으므로 상태만으로 판단
    // 실제로는 스케줄 정보를 가져와서 시간을 확인해야 함
    return booking.status === 'CONFIRMED';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCancellationFee = (_booking: BookingDto) => {
    // BookingDto에는 show_datetime이 없으므로 기본값 반환
    // 실제로는 스케줄 정보를 가져와서 계산해야 함
    return 0; // No fee for now
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PROCESSING':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No booking history found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your booking history will appear here after you make your first booking.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2>Booking History</h2>
        <div className="flex items-center gap-2 ml-auto">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'all' | 'CONFIRMED' | 'CANCELLED')}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filter status">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortBy}
            onValueChange={(v) =>
              setSortBy(v as 'bookedDesc' | 'bookedAsc' | 'showAsc' | 'showDesc')
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bookedDesc">Booked • Newest first</SelectItem>
              <SelectItem value="bookedAsc">Booked • Oldest first</SelectItem>
              <SelectItem value="showAsc">Show • Earliest first</SelectItem>
              <SelectItem value="showDesc">Show • Latest first</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline">{bookings.length} bookings</Badge>
        </div>
      </div>

      {bookings
        .filter((b) => (statusFilter === 'all' ? true : b.status === statusFilter))
        .slice()
        .sort((a, b) => {
          const aBooked = new Date(a.bookedAt || '').getTime();
          const bBooked = new Date(b.bookedAt || '').getTime();
          const aShow = a.showDate ? new Date(a.showDate).getTime() : NaN;
          const bShow = b.showDate ? new Date(b.showDate).getTime() : NaN;

          switch (sortBy) {
            case 'bookedAsc':
              return aBooked - bBooked;
            case 'showAsc':
              if (isNaN(aShow) && isNaN(bShow)) return 0;
              if (isNaN(aShow)) return 1; // push missing showDate to end
              if (isNaN(bShow)) return -1;
              return aShow - bShow;
            case 'showDesc':
              if (isNaN(aShow) && isNaN(bShow)) return 0;
              if (isNaN(aShow)) return 1; // push missing showDate to end
              if (isNaN(bShow)) return -1;
              return bShow - aShow;
            case 'bookedDesc':
            default:
              return bBooked - aBooked;
          }
        })
        .map((booking) => (
          <Card key={booking.bookingId}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        className="font-medium cursor-pointer hover:text-primary transition-colors text-left border-0 bg-transparent p-0"
                        onClick={() => handleViewBookingDetail(booking)}
                      >
                        {booking.performanceTitle ||
                          booking.venueName ||
                          `Schedule #${booking.scheduleId}`}
                      </button>
                      <Badge variant={getStatusColor(booking.status || '')}>{booking.status}</Badge>
                    </div>
                    {booking.venueName && booking.performanceTitle && (
                      <p className="text-sm text-muted-foreground">{booking.venueName}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Booking: {booking.bookingNumber}
                    </p>
                    {booking.userName && (
                      <p className="text-sm text-muted-foreground">User: {booking.userName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(booking.totalAmount || 0)}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.seatCount || 0} seat{(booking.seatCount || 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.venueName || `Schedule ID: ${booking.scheduleId}`}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {(() => {
                        if (booking.status === 'CANCELLED') {
                          const label = booking.cancelledAt
                            ? formatDate(booking.cancelledAt)
                            : 'Unknown';
                          return `Cancelled: ${label}`;
                        }
                        if (booking.showDate) {
                          return `Scheduled: ${formatDate(booking.showDate)}`;
                        }
                        return `Booked: ${formatDate(booking.bookedAt || '')}`;
                      })()}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-sm">
                    <Users className="w-4 h-4 mt-0.5" />
                    <div className="flex-1">
                      <div className="mb-1">
                        {booking.seatCount || 0} seat{(booking.seatCount || 0) > 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const seatCount = booking.seatCount || 0;
                          // 1) Prefer booking.seats with per-seat zone/rowLabel/colNum
                          if (booking.seats && booking.seats.length > 0) {
                            const labels = booking.seats.map((s: any, i: number) => {
                              const code = `${s?.rowLabel ?? ''}${s?.colNum ?? ''}`.trim();
                              const zone = s?.zone ? String(s.zone) : '';
                              const label = code
                                ? zone
                                  ? `${zone}-${code}`
                                  : code
                                : s?.seatId
                                  ? `Seat ${s.seatId}`
                                  : `Seat ${i + 1}`;
                              return label;
                            });
                            const missing = Math.max(0, seatCount - labels.length);
                            const placeholders = Array.from({ length: missing }).map(
                              (_, i) => `Seat ${labels.length + i + 1}`,
                            );
                            return [...labels, ...placeholders].map((label, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {label}
                              </Badge>
                            ));
                          }
                          // 2) Fallback to locally captured codes
                          const localCodes = localSeatCodesMap[booking.bookingNumber] || [];
                          if (localCodes.length > 0) {
                            const labels = localCodes;
                            const missing = Math.max(0, seatCount - labels.length);
                            const placeholders = Array.from({ length: missing }).map(
                              (_, i) => `Seat ${labels.length + i + 1}`,
                            );
                            return [...labels, ...placeholders].map((label, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {label}
                              </Badge>
                            ));
                          }
                          // 3) Plain placeholders
                          return Array.from({ length: seatCount }).map((_, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {`Seat ${i + 1}`}
                            </Badge>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {booking.status === 'CONFIRMED' && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4" />
                      <span>Booked: {formatDate(booking.bookedAt || '')}</span>
                    </div>
                  )}
                </div>

                {bookingDetails && bookingDetails.seats && bookingDetails.seats.length > 0 && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Seat Details:</p>
                    <div className="grid gap-2 text-xs">
                      {bookingDetails.seats.map((seat: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>Seat ID: {seat.seatId}</span>
                          <span>{formatPrice(seat.seatPrice)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {booking.status === 'CANCELLED' && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p>
                          Booking cancelled on{' '}
                          {booking.cancelledAt ? formatDate(booking.cancelledAt) : 'Unknown'}
                        </p>
                        {booking.cancellationReason && (
                          <p className="text-xs">Reason: {booking.cancellationReason}</p>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 justify-end">
                  {canCancelBooking(booking) && (
                    <Button variant="destructive" onClick={() => handleCancelBooking(booking)}>
                      Cancel Booking
                    </Button>
                  )}

                  {booking.status === 'CONFIRMED' && !canCancelBooking(booking) && (
                    <Button variant="outline" disabled>
                      Cannot Cancel
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => handleViewBookingDetail(booking)}>
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Cancellation Dialog */}
      <Dialog
        open={!!cancellingBooking}
        onOpenChange={(open) => {
          if (!open) {
            setCancellingBooking(null);
            setCancellationReason('');
            setSelectedCancelReason('');
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>

          {cancellingBooking && (
            <div className="space-y-6">
              {/* Booking Details */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Booking Details</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Booking Number:</strong> {cancellingBooking.bookingNumber}
                  </p>
                  {cancellingBooking.venueName && (
                    <p>
                      <strong>Venue:</strong> {cancellingBooking.venueName}
                    </p>
                  )}
                  {cancellingBooking.showDate && (
                    <p>
                      <strong>Show Date:</strong> {formatDate(cancellingBooking.showDate)}
                    </p>
                  )}
                  {cancellingBooking.userName && (
                    <p>
                      <strong>User:</strong> {cancellingBooking.userName}
                      {cancellingBooking.userPhone && ` (${cancellingBooking.userPhone})`}
                    </p>
                  )}
                  <p>
                    <strong>Schedule ID:</strong> {cancellingBooking.scheduleId}
                  </p>
                  <p>
                    <strong>Seats:</strong> {cancellingBooking.seatCount} seats
                    {bookingDetails && bookingDetails.seats && (
                      <span>
                        {' '}
                        (IDs: {bookingDetails.seats.map((s: any) => s.seatId).join(', ')})
                      </span>
                    )}
                  </p>
                  <p>
                    <strong>Amount:</strong> {formatPrice(cancellingBooking.totalAmount || 0)}
                  </p>
                </div>
              </div>

              {/* Refund Information - Commented out as requested, uncomment when needed */}
              {/*
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  Refund Policy
                </h4>
                <div className="space-y-1 text-sm text-yellow-800">
                  <p>• More than 48 hours: 100% refund</p>
                  <p>• 24-48 hours: 80% refund (20% cancellation fee)</p>
                  <p>• 12-24 hours: 50% refund (50% cancellation fee)</p>
                  <p>• Less than 12 hours: No refund</p>
                </div>
                <div className="mt-3 p-2 bg-white rounded border">
                  <p className="text-sm">
                    <strong>Your refund amount: {formatPrice(calculateRefundAmount(cancellingBooking))}</strong>
                    {getCancellationFee(cancellingBooking) > 0 && (
                      <span className="text-red-600 ml-2">
                        ({getCancellationFee(cancellingBooking)}% cancellation fee)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              */}

              {/* Cancellation Reason */}
              <div className="space-y-3">
                <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
                <Select value={selectedCancelReason} onValueChange={setSelectedCancelReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Please select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal_emergency">Personal Emergency</SelectItem>
                    <SelectItem value="illness">Illness</SelectItem>
                    <SelectItem value="schedule_conflict">Schedule Conflict</SelectItem>
                    <SelectItem value="travel_issues">Travel Issues</SelectItem>
                    <SelectItem value="event_concerns">Event-related Concerns</SelectItem>
                    <SelectItem value="financial_reasons">Financial Reasons</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                {selectedCancelReason === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-reason">Please specify</Label>
                    <Textarea
                      id="custom-reason"
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Please provide details about your cancellation reason..."
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Terms and Conditions - Commented out as requested, uncomment when needed */}
              {/*
              <div className="text-xs text-muted-foreground space-y-1">
                <p>By cancelling this booking, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>The refund policy terms stated above</li>
                  <li>Refund processing may take 5-7 business days</li>
                  <li>Refunds will be processed to your original payment method</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
              */}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setCancellingBooking(null)}
                  disabled={processingCancellation}
                >
                  Keep Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={processCancellation}
                  disabled={
                    !selectedCancelReason ||
                    processingCancellation ||
                    (selectedCancelReason === 'other' && !cancellationReason.trim())
                  }
                >
                  {processingCancellation ? 'Processing...' : 'Confirm Cancellation'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Detail View Dialog */}
      <Dialog
        open={!!viewingBooking}
        onOpenChange={(open) => {
          if (!open) {
            setViewingBooking(null);
            setViewingBookingDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>

          {viewingBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Booking Number</p>
                  <p className="font-medium">{viewingBooking.bookingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(viewingBooking.status || '')}>
                    {viewingBooking.status}
                  </Badge>
                </div>

                {viewingBooking.performanceTitle && (
                  <div>
                    <p className="text-sm text-muted-foreground">Performance</p>
                    <p className="font-medium">{viewingBooking.performanceTitle}</p>
                  </div>
                )}

                {viewingBooking.venueName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Venue</p>
                    <p className="font-medium">{viewingBooking.venueName}</p>
                  </div>
                )}

                {viewingBooking.showDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Show Date</p>
                    <p className="font-medium">{formatDate(viewingBooking.showDate)}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">
                    Seats ({viewingBooking.seatCount || 0})
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(() => {
                      const seatCount = viewingBooking.seatCount || 0;
                      // 1) Prefer viewingBooking.seats with per-seat info
                      if (viewingBooking.seats && viewingBooking.seats.length > 0) {
                        const labels = (viewingBooking.seats as any[]).map((s: any, i: number) => {
                          const code = `${s?.rowLabel ?? ''}${s?.colNum ?? ''}`.trim();
                          const zone = s?.zone ? String(s.zone) : '';
                          const label = code
                            ? zone
                              ? `${zone}-${code}`
                              : code
                            : s?.seatId
                              ? `Seat ${s.seatId}`
                              : `Seat ${i + 1}`;
                          return label;
                        });
                        const missing = Math.max(0, seatCount - labels.length);
                        const placeholders = Array.from({ length: missing }).map(
                          (_, i) => `Seat ${labels.length + i + 1}`,
                        );
                        return [...labels, ...placeholders].map((label, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ));
                      }
                      // 2) Local captured codes
                      const localCodes = localSeatCodesMap[viewingBooking.bookingNumber] || [];
                      if (localCodes.length > 0) {
                        const labels = localCodes;
                        const missing = Math.max(0, seatCount - labels.length);
                        const placeholders = Array.from({ length: missing }).map(
                          (_, i) => `Seat ${labels.length + i + 1}`,
                        );
                        return [...labels, ...placeholders].map((label, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ));
                      }
                      // 3) Plain placeholders
                      return Array.from({ length: seatCount }).map((_, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {`Seat ${i + 1}`}
                        </Badge>
                      ));
                    })()}
                  </div>
                </div>

                {viewingBooking.userName && (
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-medium">
                      {viewingBooking.userName}
                      {viewingBooking.userPhone && (
                        <span className="text-muted-foreground"> ({viewingBooking.userPhone})</span>
                      )}
                    </p>
                  </div>
                )}

                {viewingBooking.status === 'CONFIRMED' && (
                  <div>
                    <p className="text-sm text-muted-foreground">Booked At</p>
                    <p className="font-medium">{formatDate(viewingBooking.bookedAt || '')}</p>
                  </div>
                )}
              </div>

              {viewingBookingDetails &&
                viewingBookingDetails.seats &&
                viewingBookingDetails.seats.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Seat Details</p>
                    <div className="bg-muted rounded-lg p-3">
                      {viewingBookingDetails.seats.map((seat: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>Seat ID: {seat.seatId}</span>
                          <span>{formatPrice(seat.seatPrice)}</span>
                        </div>
                      ))}
                      <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatPrice(viewingBooking.totalAmount || 0)}</span>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

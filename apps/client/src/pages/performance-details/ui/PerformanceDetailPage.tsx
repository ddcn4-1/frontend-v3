import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardTitle, Button, Badge } from '@packages/design-system';

import { ArrowLeft, Calendar, Clock, MapPin, Users, Star, Info, Ticket } from 'lucide-react';
import type { Performance, PerformanceSchedule } from '@/entities/performance';
import { performanceService } from '@/entities/performance';
import { QueuePopup } from '@/features/queue';
import { commonConfig } from '@/shared/config';
import { useClientAuth } from '@/features/client-auth';

interface PerformanceDetailProps {
  performance?: Performance;
  onBack?: () => void;
  onBookNow?: (performance: Performance, schedule?: PerformanceSchedule) => void;
}

export default function PerformanceDetailPage({
  performance: propPerformance,
  onBack,
  onBookNow,
}: PerformanceDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useClientAuth();
  const [performance, setPerformance] = useState<Performance | null>(propPerformance || null);
  const [loading, setLoading] = useState(!propPerformance);
  const [selectedSchedule, setSelectedSchedule] = useState<PerformanceSchedule | null>(null);
  const [queueSchedule, setQueueSchedule] = useState<PerformanceSchedule | null>(null);
  const [isQueuePopupOpen, setQueuePopupOpen] = useState(false);
  const fetchedPerformanceIdRef = useRef<number | null>(null);

  useEffect(() => {
    // If performance is passed as prop, no need to fetch
    if (propPerformance) {
      setLoading(false);
      fetchedPerformanceIdRef.current = null;
      return;
    }

    // If no ID is provided, stop loading
    if (!id) {
      console.error('No performance ID provided');
      setLoading(false);
      fetchedPerformanceIdRef.current = null;
      return;
    }

    const performanceId = Number(id);

    // Validate that the ID is a valid number
    if (Number.isNaN(performanceId) || performanceId <= 0) {
      console.error('Invalid performance ID:', id);
      setLoading(false);
      fetchedPerformanceIdRef.current = null;
      return;
    }

    if (fetchedPerformanceIdRef.current === performanceId) {
      return;
    }

    fetchedPerformanceIdRef.current = performanceId;
    setLoading(true);

    const fetchPerformance = async () => {
      try {
        const data = await performanceService.getPerformanceById(performanceId);
        setPerformance(data);
      } catch (error) {
        console.error('Failed to fetch performance:', error);
        if (fetchedPerformanceIdRef.current === performanceId) {
          fetchedPerformanceIdRef.current = null;
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchPerformance();
  }, [id, propPerformance]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!performance) {
    return <div className="container mx-auto px-4 py-8">공연 정보를 찾을 수 없습니다.</div>;
  }

  const totalSeats =
    performance.schedules?.reduce(
      (sum: number, schedule: PerformanceSchedule) => sum + (schedule.totalSeats || 0),
      0,
    ) || 0;

  const availableSeats =
    performance.schedules?.reduce(
      (sum: number, schedule: PerformanceSchedule) => sum + (schedule.availableSeats || 0),
      0,
    ) || 0;

  const bookedSeats = totalSeats - availableSeats;
  const occupancyRate = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;

  const getTotalSeats = (schedule?: PerformanceSchedule | null) => schedule?.totalSeats ?? 0;
  const getAvailableSeats = (schedule?: PerformanceSchedule | null) =>
    schedule?.availableSeats ?? 0;

  const selectedTotalSeats = getTotalSeats(selectedSchedule);
  const selectedAvailableSeats = getAvailableSeats(selectedSchedule);
  const selectedBookedSeats = Math.max(selectedTotalSeats - selectedAvailableSeats, 0);
  const selectedOccupancyRate =
    selectedTotalSeats > 0 ? (selectedBookedSeats / selectedTotalSeats) * 100 : 0;
  const runningTime = performance.runningTime ?? null;
  const basePrice = performance.basePrice ?? null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '날짜 미정';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '날짜 오류';
    }
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return '시간 미정';
    try {
      return new Date(dateString).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '시간 오류';
    }
  };

  const formatPrice = (price?: number | null) => {
    if (price == null || price === 0) return '가격 미정';
    return `${new Intl.NumberFormat('ko-KR').format(price)}원`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'default';
      case 'UPCOMING': // 새로 추가
        return 'default';
      case 'ONGOING':
        return 'default';
      case 'ENDED': // COMPLETED → ENDED
        return 'secondary';
      case 'CLOSED':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      case 'SOLDOUT':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status?: string) => {
    const statusLabels: Record<string, string> = {
      OPEN: 'Available',
      UPCOMING: 'Upcoming', // 새로 추가
      ONGOING: 'In Progress',
      ENDED: 'Ended', // COMPLETED → ENDED
      CLOSED: 'Closed',
      CANCELLED: 'Cancelled',
      SOLDOUT: 'Sold Out',
    };
    const normalizedStatus = status?.toUpperCase();
    return (normalizedStatus && statusLabels[normalizedStatus]) || status || 'Unknown';
  };

  // Helper: 로그인 페이지로 리다이렉트
  const redirectToLogin = () => {
    const loginUrl = `${commonConfig.urls.accounts}${commonConfig.routes.accountsLogin}`;
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${loginUrl}?returnUrl=${returnUrl}`;
  };

  // Helper: 서버 인증 확인
  const verifyServerAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.ddcn41.com/v2/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Auth verification failed');
      }

      const authData = await response.json();

      if (!authData.authenticated) {
        console.warn('[Queue] Server auth check failed:', authData.error || authData.message);
        return false;
      }

      console.log('[Queue] Auth verified, user:', authData.user.username);
      return true;
    } catch (error) {
      console.error('[Queue] Auth verification error:', error);
      return false;
    }
  };

  const handleBookingClick = async () => {
    if (!performance || !selectedSchedule) {
      return;
    }

    // 클라이언트 측 인증 확인
    if (!user) {
      redirectToLogin();
      return;
    }

    // 서버 측 인증 확인
    const isAuthenticated = await verifyServerAuth();
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }

    // 대기열 진입
    console.log(
      'Starting queue process for performance:',
      performance.performanceId,
      'schedule:',
      selectedSchedule.scheduleId,
    );

    setQueueSchedule(selectedSchedule);
    setQueuePopupOpen(true);
  };

  const handleQueueClose = () => {
    setQueuePopupOpen(false);
    setQueueSchedule(null);
  };

  const handleQueueComplete = (
    queuePerformance: Performance,
    queueSelectedSchedule?: PerformanceSchedule,
  ) => {
    const targetSchedule = queueSelectedSchedule ?? queueSchedule ?? selectedSchedule;

    setQueuePopupOpen(false);
    setQueueSchedule(null);
    if (targetSchedule) {
      setSelectedSchedule(targetSchedule);
    }

    if (onBookNow) {
      onBookNow(queuePerformance, targetSchedule ?? undefined);
      return;
    }

    if (targetSchedule) {
      navigate(
        `/seat-selection/${targetSchedule.scheduleId}?performanceId=${queuePerformance.performanceId}`,
      );
    }
  };

  const handleQueueExpired = () => {
    setQueuePopupOpen(false);
    setQueueSchedule(null);
  };

  console.log('PerformanceDetail - Received performance data:', performance);

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={onBack || (() => navigate('/'))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Performances
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-48 h-72 flex-shrink-0">
                    <img
                      src={
                        performance.posterUrl ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'
                      }
                      alt={performance.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-3xl font-medium">{performance.title}</h1>
                        <Badge variant={getStatusColor(performance.status)}>
                          {getStatusLabel(performance.status)}
                        </Badge>
                      </div>
                      <p className="text-lg text-muted-foreground">{performance.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{performance.venueName}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Ticket className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{formatPrice(basePrice)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{performance.theme}</Badge>
                      {performance.theme && <Badge variant="secondary">{performance.theme}</Badge>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Available Schedules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Available Show Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {performance.schedules && performance.schedules.length > 0 ? (
                    performance.schedules.map((schedule: PerformanceSchedule) => {
                      const scheduleAvailableSeats = getAvailableSeats(schedule);
                      const scheduleTotalSeats = getTotalSeats(schedule);
                      const isSoldOut =
                        scheduleAvailableSeats === 0 || schedule.status === 'SOLDOUT';

                      return (
                        <button
                          type="button"
                          key={schedule.scheduleId}
                          className={`p-4 rounded-lg border cursor-pointer transition-all w-full text-left ${
                            selectedSchedule?.scheduleId === schedule.scheduleId
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          } ${isSoldOut ? 'opacity-60 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (!isSoldOut) {
                              setSelectedSchedule(schedule);
                            }
                          }}
                          disabled={isSoldOut}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">{formatDate(schedule.showDatetime)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatTime(schedule.showDatetime)}
                                </p>
                              </div>
                              <Badge variant={getStatusColor(schedule.status)} className="text-xs">
                                {getStatusLabel(schedule.status)}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Price:</span>
                                <span className="font-medium">{formatPrice(basePrice)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Available:</span>
                                <span
                                  className={
                                    scheduleAvailableSeats > 0 ? 'text-green-600' : 'text-red-600'
                                  }
                                >
                                  {scheduleAvailableSeats} / {scheduleTotalSeats}
                                </span>
                              </div>
                            </div>
                            {isSoldOut && (
                              <Badge variant="destructive" className="w-full justify-center">
                                Sold Out
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No schedules available for this performance.
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Select a show time to view details and book tickets for that specific performance.
                </p>
              </CardContent>
            </Card>

            {/* Performance Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Performance Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">About This Performance</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {performance.description ||
                      "This is an exciting performance that promises to deliver an unforgettable experience. Join us for an evening of world-class entertainment featuring talented performers and stunning production values. Don't miss this opportunity to be part of something truly special."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium mb-2">Duration</h4>
                    <p className="text-muted-foreground">
                      {runningTime && runningTime > 0 ? `${runningTime} minutes` : '시간 미정'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Theme</h4>
                    <p className="text-muted-foreground">{performance.theme}</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Status</h4>
                    <Badge variant={getStatusColor(performance.status)}>
                      {getStatusLabel(performance.status)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Venue Information */}
            <Card>
              <CardHeader>
                <CardTitle>Venue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">{performance.venueName || performance.venue}</h3>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    {/* 선택된 스케줄이 있으면 해당 스케줄 정보, 없으면 전체 정보 */}
                    {selectedSchedule ? (
                      <>
                        <p>Total Capacity: {selectedTotalSeats} seats</p>
                        <p>Available: {selectedAvailableSeats} seats</p>
                        <p>Booked: {selectedBookedSeats} seats</p>
                        <p>
                          Occupancy: {selectedTotalSeats > 0 ? selectedOccupancyRate.toFixed(1) : 0}
                          %
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Total Shows: {performance.schedules?.length || 0}</p>
                        <p>Total Available Seats: {availableSeats} seats</p>
                        <p>Average Occupancy: {occupancyRate.toFixed(1)}%</p>
                      </>
                    )}
                  </div>
                </div>

                {performance.venueAddress && (
                  <div>
                    <h4 className="font-medium mb-2">Address</h4>
                    <p className="text-sm text-muted-foreground">{performance.venueAddress}</p>
                  </div>
                )}

                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">Getting There</h4>
                  <p className="text-sm text-muted-foreground">
                    Please arrive at least 30 minutes before the performance begins. Late arrivals
                    may not be admitted until a suitable break in the performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar - 대기열 로직 추가 */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Seats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 선택된 스케줄 정보 표시 */}
                {selectedSchedule ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-medium mb-1">
                        {formatPrice(selectedSchedule.basePrice ?? basePrice)}
                      </div>
                      <p className="text-sm text-muted-foreground">per seat</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Selected Show:</span>
                        <span className="font-medium">
                          {formatDate(selectedSchedule.showDatetime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Show Time:</span>
                        <span className="font-medium">
                          {formatTime(selectedSchedule.showDatetime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Available Seats:</span>
                        <span
                          className={`font-medium ${
                            selectedAvailableSeats > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {selectedAvailableSeats}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <Badge
                          variant={getStatusColor(selectedSchedule.status)}
                          className="text-xs"
                        >
                          {getStatusLabel(selectedSchedule.status)}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleBookingClick}
                      disabled={
                        selectedAvailableSeats === 0 ||
                        selectedSchedule.status === 'SOLDOUT' ||
                        selectedSchedule.status === 'COMPLETED' ||
                        selectedSchedule.status === 'CANCELLED'
                      }
                    >
                      {selectedAvailableSeats === 0 || selectedSchedule.status === 'SOLDOUT'
                        ? 'Sold Out'
                        : selectedSchedule.status === 'COMPLETED'
                          ? 'Show Ended'
                          : selectedSchedule.status === 'CANCELLED'
                            ? 'Cancelled'
                            : 'Join Queue'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-medium mb-1">{formatPrice(basePrice)}</div>
                      <p className="text-sm text-muted-foreground">per seat (starting from)</p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-center py-4 text-muted-foreground">
                        Please select a show time above
                      </div>
                    </div>

                    <Button className="w-full" size="lg" disabled={true} variant="outline">
                      Select Show Time First
                    </Button>
                  </>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  대기열 시스템을 통해 공정한 좌석 선택 기회를 제공합니다
                </p>
              </CardContent>
            </Card>

            {/* Occupancy Indicator - 선택된 스케줄 기준으로 업데이트 */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">
                  Seat Availability
                  {selectedSchedule && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({formatDate(selectedSchedule.showDatetime)})
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {selectedSchedule ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Booked</span>
                        <span>{selectedBookedSeats} seats</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${selectedTotalSeats > 0 ? selectedOccupancyRate : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedTotalSeats > 0 ? selectedOccupancyRate.toFixed(1) : 0}% booked
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Total Available</span>
                        <span>{availableSeats} seats</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${occupancyRate}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select a show time to see detailed availability
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {performance && queueSchedule && (
        <QueuePopup
          isOpen={isQueuePopupOpen}
          performance={performance}
          selectedSchedule={queueSchedule}
          onClose={handleQueueClose}
          onQueueComplete={handleQueueComplete}
          onQueueExpired={handleQueueExpired}
        />
      )}
    </>
  );
}

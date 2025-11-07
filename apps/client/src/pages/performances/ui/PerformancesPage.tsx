import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@packages/design-system';
import { Calendar, Clock, MapPin, Users, Search, Filter, X } from 'lucide-react';
import { performanceService } from '@/entities/performance';
import type { Performance, PerformanceSchedule } from '@/entities/performance';
import { QueuePopup } from '@/features/queue';
import { commonConfig } from '@/shared/config';
import { useClientAuth } from '@/features/client-auth';

export interface PerformancesPageProps {
  onSelectPerformance?: (performance: Performance) => void;
  onViewDetails?: (performance: Performance) => void;
}

export default function PerformancesPage({
  onSelectPerformance,
  onViewDetails,
}: PerformancesPageProps) {
  const navigate = useNavigate();
  const { user } = useClientAuth();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [queuePerformance, setQueuePerformance] = useState<Performance | null>(null);
  const [queueSchedule, setQueueSchedule] = useState<PerformanceSchedule | null>(null);
  const [isQueuePopupOpen, setQueuePopupOpen] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [searchVenue, setSearchVenue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [currentSearchParams, setCurrentSearchParams] = useState({
    name: '',
    venue: '',
    status: 'all',
  });

  const fetchPerformances = useCallback(
    async (searchParams?: { name?: string; venue?: string; status?: string }) => {
      setLoading(true);
      try {
        const performanceData = await performanceService.searchPerformances({
          name: searchParams?.name || '',
          venue: searchParams?.venue || '',
          status: searchParams?.status === 'all' ? '' : searchParams?.status || '',
        });

        setPerformances(performanceData);
        console.log('PerformancesPage - Received performances:', performanceData);
        if (performanceData.length > 0) {
          console.log('PerformancesPage - First performance sample:', {
            performanceId: performanceData[0].performanceId,
            title: performanceData[0].title,
            startDate: performanceData[0].startDate,
            endDate: performanceData[0].endDate,
            schedules: performanceData[0].schedules,
          });
        }

        if (searchParams) {
          setCurrentSearchParams({
            name: searchParams.name || '',
            venue: searchParams.venue || '',
            status: searchParams.status || 'all',
          });
        }
      } catch (error) {
        console.error('Failed to fetch performances:', error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const hasInitialLoad = useRef(false);

  useEffect(() => {
    if (hasInitialLoad.current) {
      return;
    }
    hasInitialLoad.current = true;
    void fetchPerformances();
  }, [fetchPerformances]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      await fetchPerformances({
        name: searchName,
        venue: searchVenue,
        status: statusFilter,
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    setSearchName('');
    setSearchVenue('');
    setStatusFilter('all');
    void fetchPerformances();
    setCurrentSearchParams({ name: '', venue: '', status: 'all' });
  };

  const hasActiveFilters = searchName !== '' || searchVenue !== '' || statusFilter !== 'all';
  const hasUnsavedChanges =
    searchName !== currentSearchParams.name ||
    searchVenue !== currentSearchParams.venue ||
    statusFilter !== currentSearchParams.status;
  const hasAppliedFilters =
    currentSearchParams.name !== '' ||
    currentSearchParams.venue !== '' ||
    currentSearchParams.status !== 'all';

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '날짜 미정';
    const parsed = new Date(dateString);
    return Number.isNaN(parsed.getTime()) ? '날짜 오류' : parsed.toLocaleDateString('ko-KR');
  };

  const formatPrice = (price?: number | null) => {
    if (price == null || price === 0) return '가격 미정';
    return `${new Intl.NumberFormat('ko-KR').format(price)}원`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'default';
      case 'SOLDOUT':
        return 'destructive';
      case 'CLOSED':
        return 'secondary';
      case 'UPCOMING':
        return 'default';
      default:
        return 'outline';
    }
  };

  const isScheduleBookable = (schedule?: PerformanceSchedule): boolean => {
    if (!schedule) {
      return false;
    }
    const status = (schedule.status || '').toUpperCase();
    if (['CANCELLED', 'CLOSED', 'COMPLETED', 'ENDED'].includes(status)) {
      return false;
    }
    if (typeof schedule.availableSeats === 'number' && schedule.availableSeats <= 0) {
      return false;
    }
    return true;
  };

  const openQueueForPerformance = (performance: Performance) => {
    if (!user) {
      const loginUrl = `${commonConfig.urls.accounts}${commonConfig.routes.accountsLogin}`;
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `${loginUrl}?returnUrl=${returnUrl}`;
      return;
    }

    const candidateSchedule =
      performance.schedules?.find(isScheduleBookable) || performance.schedules?.[0];

    if (candidateSchedule) {
      setQueuePerformance(performance);
      setQueueSchedule(candidateSchedule);
      setQueuePopupOpen(true);
    } else if (onSelectPerformance) {
      onSelectPerformance(performance);
    } else {
      navigate(`/performances/${performance.performanceId}`);
    }
  };

  const closeQueuePopup = () => {
    setQueuePopupOpen(false);
    setQueuePerformance(null);
    setQueueSchedule(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-4 border-b border-gray-200 px-6 py-5 md:grid-cols-2">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">공연 탐색</h1>
              <p className="mt-1 text-sm text-gray-500">
                공연을 검색하고 예매 가능한 좌석을 확인하세요.
              </p>
            </div>
            <div className="flex items-start justify-end gap-2">
              <Button
                variant={hasActiveFilters ? 'default' : 'secondary'}
                onClick={clearFilters}
                disabled={!hasActiveFilters && !hasAppliedFilters}
              >
                필터 초기화
              </Button>
              <Button onClick={handleSearch} disabled={!hasUnsavedChanges || searching}>
                <Search className="mr-2 h-4 w-4" />
                검색하기
              </Button>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-5 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="공연명을 입력하세요"
                  value={searchName}
                  onChange={(event) => setSearchName(event.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Input
                  placeholder="공연장을 입력하세요"
                  value={searchVenue}
                  onChange={(event) => setSearchVenue(event.target.value)}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>

            <div className="space-y-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="공연 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">필터</SelectItem>
                  <SelectItem value="UPCOMING">예정</SelectItem>
                  <SelectItem value="ONGOING">예매 가능</SelectItem>
                  <SelectItem value="ENDED">매진</SelectItem>
                  <SelectItem value="CANCELLED">취소</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="rounded-2xl">
                  <CardContent className="space-y-4 p-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : performances.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <Filter className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">검색 결과가 없습니다</h3>
              <p className="mt-2 text-sm text-gray-500">
                다른 검색어를 입력하거나 필터를 조정해 보세요.
              </p>
              {hasAppliedFilters && (
                <Button className="mt-4" variant="outline" onClick={clearFilters}>
                  필터 초기화
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {performances.map((performance) => (
                <Card
                  key={performance.performanceId}
                  className="rounded-3xl border-gray-200 overflow-hidden"
                >
                  {/* Poster Image */}
                  {performance.posterUrl && (
                    <div className="relative w-full h-48 bg-gray-100">
                      <img
                        src={performance.posterUrl}
                        alt={performance.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{performance.title}</h2>
                        <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {performance.venue ?? '미정'}
                        </p>
                      </div>
                      <Badge variant={getStatusColor(performance.status)}>
                        {performance.status ?? 'UNKNOWN'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                      <div>
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          시작일
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {formatDate(performance.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                          <Clock className="h-4 w-4 text-gray-400" />
                          종료일
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {formatDate(performance.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-gray-400" />
                          예매 가능한 스케줄
                        </div>
                        <Badge variant="outline" className="font-medium text-gray-700">
                          {performance.schedules?.length ?? 0}개
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {(performance.schedules ?? []).slice(0, 2).map((schedule) => (
                          <div
                            key={schedule.scheduleId}
                            className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600"
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {formatDate(schedule.showDatetime)}{' '}
                                {new Date(schedule.showDatetime).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <Badge
                                variant={getStatusColor(schedule.status)}
                                className="px-2 py-0.5 text-[10px]"
                              >
                                {schedule.status ?? 'UNKNOWN'}
                              </Badge>
                            </div>
                            <div className="mt-1 text-gray-500">
                              잔여 좌석: {schedule.availableSeats ?? 0}
                            </div>
                          </div>
                        ))}
                        {(performance.schedules ?? []).length > 2 && (
                          <button
                            type="button"
                            onClick={() => onViewDetails?.(performance)}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />더 많은 일정 보기
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      <Button
                        className="w-full rounded-2xl"
                        onClick={() => openQueueForPerformance(performance)}
                      >
                        예매하기
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl"
                        onClick={() => {
                          if (onViewDetails) {
                            onViewDetails(performance);
                          } else {
                            navigate(`/performances/${performance.performanceId}`);
                          }
                        }}
                      >
                        상세 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {isQueuePopupOpen && queuePerformance && queueSchedule && (
        <QueuePopup
          isOpen={isQueuePopupOpen}
          onClose={closeQueuePopup}
          performance={queuePerformance}
          selectedSchedule={queueSchedule}
          onQueueComplete={(performance, schedule) => {
            setQueuePopupOpen(false);
            setQueuePerformance(null);
            setQueueSchedule(null);
            onSelectPerformance?.(performance);

            if (schedule) {
              navigate(
                `/seat-selection/${schedule.scheduleId}?performanceId=${performance.performanceId}`,
              );
              return;
            }

            navigate(`/performances/${performance.performanceId}`);
          }}
          onQueueExpired={() => {
            setQueuePopupOpen(false);
            setQueuePerformance(null);
            setQueueSchedule(null);
          }}
        />
      )}
    </>
  );
}

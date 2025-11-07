import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, Button } from '@packages/design-system';
import { toast } from 'sonner';

import { BookingForm } from './BookingForm';
import { BookingSummary } from './BookingSummary';
import { seatService } from '../api/seatService';
import { queueService } from '@/entities/queue';
import { bookingService } from '@/entities/booking';
import { performanceService } from '@/entities/performance';
import { API_CONFIG, commonConfig } from '@/shared/config';
import { venueService } from '@packages/shared';
import { useClientAuth } from '@/features/client-auth';
import type {
  SeatDto,
  CreateBookingRequestDto,
  Performance,
  PerformanceSchedule,
  UserInfo,
  SeatMapJson,
  SeatMapSection,
} from '@packages/shared';
import { useSeatZoom } from '@/pages/seat-selection/lib/useSeatZoom';
import { ScheduleStepCard } from './ScheduleStepCard';
import { SeatSelectionLayout } from './SeatSelectionLayout';
import { SeatMapWorkspace } from './SeatMapWorkspace';

interface SeatSelectionProps {
  performanceId?: number;
  user?: UserInfo;
  onBack?: () => void;
  onComplete?: () => void;
}

export default function SeatSelectionPage({
  performanceId: propPerformanceId,
  user: propUser,
  onBack,
  onComplete,
}: Readonly<SeatSelectionProps>) {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading, login } = useClientAuth();

  // performanceId will be fetched from schedule
  const [performanceId, setPerformanceId] = useState<number>(propPerformanceId || 0);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [schedules, setSchedules] = useState<PerformanceSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(
    scheduleId ? Number(scheduleId) : null,
  );
  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedSeatCodes, setSelectedSeatCodes] = useState<string[]>([]);
  const [occupiedSeatCodes, setOccupiedSeatCodes] = useState<Set<string>>(new Set());
  const [selectorTotal, setSelectorTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<'schedule' | 'seats' | 'confirm'>('schedule');
  const [venueId, setVenueId] = useState<number | null>(null);

  // User computation - must be declared BEFORE any conditional returns
  const user = useMemo<UserInfo | null>(() => {
    if (propUser) {
      return propUser;
    }

    if (!authUser) {
      return null;
    }

    // Support both numeric IDs (legacy) and UUID strings (Cognito)
    const userId = authUser.id;

    // Try to convert to number for backward compatibility
    const numericId = Number(userId);
    const finalUserId = Number.isFinite(numericId) ? numericId : userId;

    return {
      userId: finalUserId,
      username: authUser.username,
      email: authUser.email,
      name: authUser.username,
    };
  }, [propUser, authUser]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [onBack, navigate]);

  // 1) (추가) ref & 준비 플래그
  const queueSessionRef = useRef<string | null>(null);
  const selectedScheduleRef = useRef<number | null>(null);
  const performanceLoadIdRef = useRef<number | null>(null);
  const queuePrefetchKeyRef = useRef<string | null>(null);
  const seatMapVenueGuardRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const [sessionReady, setSessionReady] = useState(false);

  // Auth redirect effect - use auth provider's login method
  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) {
      return;
    }

    // If no user after loading, redirect to login
    if (!user) {
      console.log('[SeatSelection] No authenticated user - redirecting to login');
      login();
    }
  }, [user, authLoading, login]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 2) Load performanceId from scheduleId if not provided
  useEffect(() => {
    if (!propPerformanceId && scheduleId) {
      // For now, we need to get performanceId from the schedule
      // This is a workaround - ideally backend should provide this
      const loadPerformanceFromSchedule = () => {
        try {
          // We'll need to implement a way to get performance from schedule
          // For now, try to get it from the performance detail page navigation
          const searchParams = new URLSearchParams(window.location.search);
          const perfId = searchParams.get('performanceId');
          if (perfId) {
            setPerformanceId(Number(perfId));
          }
        } catch (error) {
          console.error('Failed to load performanceId:', error);
        }
      };
      loadPerformanceFromSchedule();
    }
  }, [scheduleId, propPerformanceId]);

  // 3) (유지/추가) selectedSchedule → ref 동기화
  useEffect(() => {
    selectedScheduleRef.current = selectedSchedule ?? null;
  }, [selectedSchedule]);

  // 3) "세션 선발급" useEffect
  //    (마운트/스케줄 준비되면 즉시 발급)
  useEffect(() => {
    if (!selectedSchedule || !performanceId) {
      queuePrefetchKeyRef.current = null;
    }

    if (!selectedSchedule || sessionReady || !performanceId) {
      return;
    }

    const prefetchKey = `${performanceId}-${selectedSchedule}`;
    if (queuePrefetchKeyRef.current === prefetchKey) {
      return;
    }

    queuePrefetchKeyRef.current = prefetchKey;

    let cancelled = false;
    let timeoutId: NodeJS.Timeout | undefined;

    const fetchQueueSession = async () => {
      try {
        const resp = await queueService.checkQueueRequirement(performanceId, selectedSchedule);
        const sessionId: string | null = resp?.data?.sessionId ?? null;

        if (sessionId && !cancelled) {
          queueSessionRef.current = sessionId;
          setSessionReady(true);
          console.warn('[QUEUE] sessionId pre-fetched:', sessionId);
        } else {
          console.warn('[QUEUE] sessionId not provided - redirecting...');

          // sessionId가 없으면 3초 후 performance detail 페이지로 리다이렉트
          timeoutId = setTimeout(() => {
            if (!cancelled) {
              toast.error(
                'Queue session is required. Please start from the performance detail page.',
              );
              navigate(`/performances/${performanceId}`);
            }
          }, 3000);
        }
      } catch (e) {
        console.error('[QUEUE] prefetch error:', e);
        if (!cancelled && queuePrefetchKeyRef.current === prefetchKey) {
          queuePrefetchKeyRef.current = null;
        }
        // 에러 발생 시에도 리다이렉트
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            toast.error(
              'Failed to check queue requirement. Please try again from the performance detail page.',
            );
            navigate(`/performances/${performanceId}`);
          }
        }, 3000);
      }
    };

    void fetchQueueSession();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [performanceId, selectedSchedule, sessionReady, navigate]);

  // 4) releaseSession 리스너 (세션 준비 이후에만 등록)
  useEffect(() => {
    if (!sessionReady || !user) return;

    const releaseSession = () => {
      const sessionId = queueSessionRef.current;
      const scheduleId = selectedScheduleRef.current;
      if (!sessionId || !scheduleId) {
        console.warn('⏭️ 큐 세션 또는 스케줄 없음 — release-session 전송 생략');
        return;
      }
      const payload = {
        performanceId: Number(performanceId),
        scheduleId: Number(scheduleId), // ✅ 숫자로 보장
        userId: Number(user.userId),
        sessionId,
      };
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.QUEUE}/release-session`;
      const ok = navigator.sendBeacon(
        url,
        new Blob([JSON.stringify(payload)], { type: 'application/json; charset=UTF-8' }),
      );
      console.warn('📡 release-session beacon:', ok ? '성공' : '실패', payload);
    };

    window.addEventListener('beforeunload', releaseSession);
    window.addEventListener('pagehide', releaseSession);
    (window as any).releaseQueueSession = releaseSession; // 디버깅용

    return () => {
      window.removeEventListener('beforeunload', releaseSession);
      window.removeEventListener('pagehide', releaseSession);
      if (sessionReady) releaseSession(); // 언마운트 시도
    };
  }, [sessionReady, performanceId, user]);

  type GradeKey = string;

  const gradeSwatchClass: Record<string, string> = {
    VIP: 'bg-fuchsia-600',
    R: 'bg-blue-600',
    S: 'bg-emerald-600',
    A: 'bg-orange-600',
  };

  const defaultGradePrices: Record<GradeKey, number> = {
    VIP: 150000,
    R: 120000,
    S: 90000,
    Premium: 95000,
    A: 60000,
  };

  // Seat map state must be declared before any hooks that reference it
  const [seatMapLoading, setSeatMapLoading] = useState(false);
  const [seatMap, setSeatMap] = useState<SeatMapJson | null>(null);
  const [rowRemap, setRowRemap] = useState<Map<string, string>>(new Map());
  const [selectorSelectedCodes, setSelectorSelectedCodes] = useState<Set<string>>(new Set());
  const selectionLimit = 4;
  const {
    zoomLevel,
    zoomPercentage,
    canZoomIn,
    canZoomOut,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
  } = useSeatZoom();

  // Helper functions moved up for useMemo access
  const normalizeZoneValue = useCallback((value?: string | null) => {
    if (value === undefined || value === null) return undefined;
    const trimmed = String(value).trim();
    return trimmed ? trimmed.toUpperCase() : undefined;
  }, []);

  const getSectionIdentifier = useCallback((section: SeatMapSection, index: number) => {
    const normalizedZone =
      section.zone !== undefined && section.zone !== null
        ? String(section.zone).trim().toUpperCase() || undefined
        : undefined;
    const normalizedName =
      section.name !== undefined && section.name != null
        ? String(section.name).trim().toUpperCase() || undefined
        : undefined;
    return normalizedZone || normalizedName || `SECTION-${index + 1}`;
  }, []);

  const generateRowLabel = useCallback(
    (startLabel: string, offset: number): string => {
      const alphabetSource = seatMap?.metadata?.alphabet;
      const alphabet =
        typeof alphabetSource === 'string'
          ? alphabetSource.toUpperCase()
          : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const startIndex = alphaToIndex(startLabel, alphabet);
      const targetIndex = startIndex + offset;
      return indexToAlpha(targetIndex, alphabet);
    },
    [seatMap?.metadata?.alphabet],
  );

  // Performance optimization: Cache for section-seat mapping using useMemo
  const sectionCache = useMemo(() => {
    if (!seatMap?.sections) return { rowToSection: new Map(), zoneToSections: new Map() };

    const rowToSection = new Map<
      string,
      { section: SeatMapSection; index: number; grade: string }
    >();
    const zoneToSections = new Map<string, { section: SeatMapSection; index: number }[]>();

    seatMap.sections.forEach((section, sectionIndex) => {
      const grade = (section.grade as GradeKey) || 'A';
      const zoneId = getSectionIdentifier(section, sectionIndex);

      // Cache zone to sections mapping
      const zoneSections = zoneToSections.get(zoneId);
      if (!zoneSections) {
        zoneToSections.set(zoneId, [{ section, index: sectionIndex }]);
      } else {
        zoneSections.push({ section, index: sectionIndex });
      }

      // Cache all row labels for this section
      for (let r = 0; r < section.rows; r++) {
        const rowLabel = generateRowLabel(section.rowLabelFrom, r);
        const cacheKey = zoneId ? `${zoneId}:${rowLabel}` : rowLabel;

        if (!rowToSection.has(cacheKey)) {
          rowToSection.set(cacheKey, { section, index: sectionIndex, grade });
        }
      }
    });

    return { rowToSection, zoneToSections };
  }, [seatMap?.sections, getSectionIdentifier, generateRowLabel]);

  // Reset all seat selection-related states
  const resetSelection = useCallback(() => {
    setSelectedSeats([]);
    setSelectedSeatCodes([]);
    setSelectorSelectedCodes(new Set<string>());
    setSelectorTotal(0);
  }, []);

  const gradePrices = useMemo(() => {
    // Prefer pricing from seatMap if available
    const pricing = seatMap?.pricing ?? undefined;
    if (pricing && typeof pricing === 'object') {
      return { ...defaultGradePrices, ...pricing } as Record<string, number>;
    }
    return defaultGradePrices;
  }, [seatMap]);

  // Excel-style alpha increment with optional custom alphabet (e.g., skip I/O)
  function alphaToIndex(label: string, alphabet: string): number {
    const up = label.toUpperCase();
    const base = alphabet.length;
    let v = 0;
    for (let i = 0; i < up.length; i++) {
      const ch = up.charAt(i);
      const pos = alphabet.indexOf(ch);
      if (pos < 0) throw new Error(`Invalid row label: ${label}`);
      v = v * base + (pos + 1);
    }
    return v - 1; // zero-based
  }

  function indexToAlpha(index: number, alphabet: string): string {
    const base = alphabet.length;
    let v = index + 1; // one-based
    let out = '';
    while (v > 0) {
      const rem = (v - 1) % base;
      out = alphabet.charAt(rem) + out;
      v = Math.floor((v - 1) / base);
    }
    return out;
  }

  const resolveSeatGrade = useCallback(
    (seatId: string, sections: SeatMapSection[]): GradeKey | null => {
      const { rowLabel, seatNumber, zone } = parseSeatCode(seatId);
      if (!rowLabel) return null;

      const normalizedZone = normalizeZoneValue(zone);
      const numericSeat = parseInt(seatNumber, 10);

      // Try cache first
      const cacheKey = normalizedZone ? `${normalizedZone}:${rowLabel}` : rowLabel;
      const cached = sectionCache.rowToSection.get(cacheKey);

      if (cached) {
        // Validate seat number range if numeric
        if (!isNaN(numericSeat)) {
          const start = cached.section.seatStart ?? 1;
          const end = start + cached.section.cols - 1;
          if (numericSeat >= start && numericSeat <= end) {
            return cached.grade;
          }
        } else {
          return cached.grade;
        }
      }

      // Fallback to original logic if cache miss
      for (let idx = 0; idx < sections.length; idx++) {
        const sec = sections[idx];
        if (normalizedZone && getSectionIdentifier(sec, idx) !== normalizedZone) continue;
        for (let r = 0; r < sec.rows; r++) {
          const label = generateRowLabel(sec.rowLabelFrom, r);
          if (label !== rowLabel) continue;
          if (!isNaN(numericSeat)) {
            const start = sec.seatStart ?? 1;
            const end = start + sec.cols - 1;
            if (numericSeat < start || numericSeat > end) continue;
          }
          return (sec.grade as GradeKey) || 'A';
        }
      }
      return null;
    },
    [sectionCache],
  );

  const findSectionForSeat = useCallback(
    (
      rowLabel: string,
      col: number,
      zone: string | undefined,
      sections: SeatMapSection[],
    ):
      | {
          section: SeatMapSection;
          index: number;
        }
      | undefined => {
      const normalizedZone = normalizeZoneValue(zone);
      const numericCol = typeof col === 'number' ? col : Number(col);

      // Try cache first
      const cacheKey = normalizedZone ? `${normalizedZone}:${rowLabel}` : rowLabel;
      const cached = sectionCache.rowToSection.get(cacheKey);

      if (cached) {
        // Validate seat number range if numeric
        if (!isNaN(numericCol)) {
          const start = cached.section.seatStart ?? 1;
          const end = start + cached.section.cols - 1;
          if (numericCol >= start && numericCol <= end) {
            return { section: cached.section, index: cached.index };
          }
        } else {
          return { section: cached.section, index: cached.index };
        }
      }

      // Fallback to original logic if cache miss
      for (let idx = 0; idx < sections.length; idx++) {
        const sec = sections[idx];
        if (normalizedZone && getSectionIdentifier(sec, idx) !== normalizedZone) continue;
        for (let r = 0; r < sec.rows; r++) {
          const label = generateRowLabel(sec.rowLabelFrom, r);
          if (label !== rowLabel) continue;
          if (!isNaN(numericCol)) {
            const start = sec.seatStart ?? 1;
            const end = start + sec.cols - 1;
            if (numericCol < start || numericCol > end) continue;
          }
          return { section: sec, index: idx };
        }
      }
      return undefined;
    },
    [sectionCache],
  );

  // Fetch seat map when venueId becomes available
  useEffect(() => {
    if (!venueId) {
      seatMapVenueGuardRef.current = null;
      return;
    }

    if (seatMapVenueGuardRef.current === venueId) {
      return;
    }

    seatMapVenueGuardRef.current = venueId;

    const fetchSeatMap = async () => {
      setSeatMapLoading(true);
      try {
        // Accept both wrapped response ({ seatMapJson }) and plain seatmap JSON
        const data: unknown = await venueService.getSeatMap(venueId);
        let resolved: unknown = data;
        if (data && typeof data === 'object') {
          if ('seatMapJson' in data) {
            resolved = (data as { seatMapJson: unknown }).seatMapJson;
          } else if (
            'data' in data &&
            (data as { data?: { seatMapJson?: unknown } }).data?.seatMapJson
          ) {
            resolved = (data as { data: { seatMapJson: unknown } }).data.seatMapJson;
          } else if (
            'data' in data &&
            (data as { data?: { sections?: unknown[] } }).data?.sections
          ) {
            resolved = (data as { data: unknown }).data;
          }
        }

        if (
          resolved &&
          typeof resolved === 'object' &&
          'sections' in resolved &&
          Array.isArray((resolved as { sections: unknown[] }).sections)
        ) {
          if (isMountedRef.current) {
            setSeatMap(resolved as SeatMapJson);
          }
        } else if (isMountedRef.current) {
          setSeatMap({ sections: [] });
        }
      } catch (e) {
        console.error('Failed to load seatmap', e);
        if (isMountedRef.current) {
          setSeatMap({ sections: [] });
        }
        if (seatMapVenueGuardRef.current === venueId) {
          seatMapVenueGuardRef.current = null;
        }
      } finally {
        if (isMountedRef.current) {
          setSeatMapLoading(false);
        }
      }
    };

    void fetchSeatMap();
  }, [venueId]);

  // Build row remap between backend rows and seatmap labels
  useEffect(() => {
    try {
      if (!seatMap || !seatMap.sections || seats.length === 0) return;
      const labels: string[] = [];
      for (const sec of seatMap.sections) {
        for (let r = 0; r < sec.rows; r++) labels.push(generateRowLabel(sec.rowLabelFrom, r));
      }
      const uniqueSeatRows: string[] = Array.from(
        new Set(seats.map((s) => String(s.seatRow).trim().toUpperCase())),
      );
      const numericRows = uniqueSeatRows
        .map((v) => (/^\d+$/.test(v) ? Number(v) : NaN))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);
      const remap = new Map<string, string>();
      if (numericRows.length > 0) {
        numericRows.forEach((num, idx) => {
          const label = labels[idx];
          if (label) remap.set(String(num), label);
        });
      }
      setRowRemap(remap);
    } catch (e) {
      console.warn('Failed to compute row remap', e);
      setRowRemap(new Map());
    }
  }, [seatMap, seats]);

  // Convert backend seat to unique code including zone/section when available
  const seatToCode = useCallback(
    (s: SeatDto) => {
      const rawRow = String(s.seatRow).trim().toUpperCase();
      const mapped = rowRemap.get(rawRow);
      const rowLabel =
        mapped ??
        (() => {
          const letters = rawRow.match(/[A-Z]+/g);
          const digitsInRow = rawRow.match(/\d+/g);

          if (letters && letters.length > 0) {
            return letters[letters.length - 1];
          }

          if (digitsInRow) {
            return String(parseInt(digitsInRow[0], 10));
          }

          return rawRow;
        })();
      const parsedNumber = parseInt(String(s.seatNumber).trim(), 10);
      const numLabel = isNaN(parsedNumber) ? String(s.seatNumber).trim() : String(parsedNumber);

      let zoneKey = normalizeZoneValue(s.seatZone);
      const numericSeat = isNaN(parsedNumber) ? NaN : parsedNumber;
      if (!zoneKey && seatMap?.sections?.length) {
        const match = findSectionForSeat(rowLabel, numericSeat, undefined, seatMap.sections);
        if (match) {
          zoneKey = getSectionIdentifier(match.section, match.index);
        }
      }

      return buildSeatCode({ zone: zoneKey, rowLabel, seatNumber: numLabel });
    },
    [rowRemap, seatMap, findSectionForSeat],
  );

  // Keep occupied codes in sync when seats or remap change
  useEffect(() => {
    try {
      const occ = new Set<string>();
      for (const s of seats) {
        const status = s.status?.toString().toUpperCase();
        if (status && status !== 'AVAILABLE') occ.add(seatToCode(s));
      }
      setOccupiedSeatCodes(occ);
    } catch (e) {
      console.warn('Failed to compute occupied seats', e);
      setOccupiedSeatCodes(new Set());
    }
  }, [seats, seatToCode]);

  const handleSelectorSeatClick = (seatId: string) => {
    if (occupiedSeatCodes.has(seatId)) return;
    const next = new Set(selectorSelectedCodes);
    if (next.has(seatId)) {
      next.delete(seatId);
    } else {
      if (next.size >= selectionLimit) {
        toast.warning(`최대 ${selectionLimit}개의 좌석까지 선택 가능합니다.`);
        return;
      }
      next.add(seatId);
    }
    setSelectorSelectedCodes(next);
  };

  // Keep external selected codes and totals in sync with selector state
  useEffect(() => {
    const selectedSeatsArray = Array.from(selectorSelectedCodes);
    const amount = selectedSeatsArray.reduce((sum: number, seatId: string) => {
      const grade = resolveSeatGrade(seatId, seatMap?.sections ?? []);
      return sum + (grade ? (gradePrices[grade] ?? 0) : 0);
    }, 0);
    setSelectedSeatCodes(selectedSeatsArray);
    setSelectorTotal(amount);
  }, [selectorSelectedCodes, seatMap, resolveSeatGrade, gradePrices]);

  //     const renderSection = useCallback((section: SeatMapSection, sectionIndex: number) => {
  //         const nodes: React.ReactNode[] = [];
  //         const seatStart = section.seatStart ?? 1;
  //         const grade = section.grade ?? 'A';
  //
  //         for (let row = 0; row < section.rows; row++) {
  //             const rowLabel = generateRowLabel(section.rowLabelFrom, row);
  //             const rowSeats: React.ReactNode[] = [];
  //             for (let col = 0; col < section.cols; col++) {
  //                 const seatNumber = seatStart + col;
  //                 const zoneKey = getSectionIdentifier(section, sectionIndex);
  //                 const seatId = buildSeatCode({zone: zoneKey, rowLabel, seatNumber});
  //                 const isSelected = selectorSelectedCodes.has(seatId);
  //                 const isOccupied = occupiedSeatCodes.has(seatId);
  //                 const isHovered = hoveredSeat === seatId;
  //
  //                 const baseClasses = 'relative w-8 h-8 m-1 rounded-md border transition-colors text-xs font-medium flex items-center justify-center';
  //                 let seatClasses;
  //                 if (isOccupied) {
  //                     seatClasses = `${baseClasses} bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed`;
  //                 } else if (isSelected) {
  //                     seatClasses = `${baseClasses} bg-blue-600 border-blue-600 text-white`;
  //                 } else {
  //                     seatClasses = `${baseClasses} bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200`;
  //                 }
  //
  //                 rowSeats.push(
  //                     <Tooltip key={seatId}>
  //                         <TooltipTrigger asChild>
  //                             <button
  //                                 onClick={() => handleSelectorSeatClick(seatId)}
  //                                 onMouseEnter={() => setHoveredSeat(seatId)}
  //                                 onMouseLeave={() => setHoveredSeat(null)}
  //                                 disabled={isOccupied}
  //                                 className={seatClasses}
  //                             >
  //                                 {isOccupied ? (
  //                                     <X className="w-4 h-4 text-gray-600"/>
  //                                 ) : (
  //                                     <span className={`text-xs font-medium ${isSelected ? 'text-white' : ''}`}>
  //                     {seatNumber}
  //                   </span>
  //                                 )}
  //                             </button>
  //                         </TooltipTrigger>
  //                         <TooltipContent>
  //                             {section.zone || section.name ? `${section.zone || section.name} · ` : ''}
  //                             {`${rowLabel}-${seatNumber}`} · {grade}석 · ₩{(gradePrices[grade] ?? 0).toLocaleString()}
  //                         </TooltipContent>
  //                     </Tooltip>
  //                 );
  //             }
  //
  //             nodes.push(
  //                 <div key={rowLabel} className="flex items-center justify-center mb-1">
  //           <span
  //               className={`text-xs font-medium w-8 text-center mr-2 rounded-sm py-0.5 px-1 border border-gray-300 text-black`}>
  //             {rowLabel}
  //           </span>
  //                     <div className="flex gap-1">{rowSeats}</div>
  //                 </div>
  //             );
  //         }
  //
  //         return (
  //             <div key={sectionIndex} className="mb-6">
  //                 {(section.name || section.grade) && (
  //                     <div className="w-full flex justify-center mt-2 mb-4">
  //                         <div className="px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200">
  //               <span className="text-sm font-medium text-gray-700">
  //                 {section.name ?? 'Section'}{section.grade ? ` (${section.grade}석)` : ''}
  //               </span>
  //                         </div>
  //                     </div>
  //                 )}
  //                 <div className="flex flex-col items-center">{nodes}</div>
  //             </div>
  //         );
  //     }, [selectorSelectedCodes, occupiedSeatCodes, hoveredSeat, gradePrices, getSectionIdentifier, generateRowLabel]);

  // Load performance data and schedules on component mount
  useEffect(() => {
    if (!performanceId) {
      performanceLoadIdRef.current = null;
      return;
    }

    if (performanceLoadIdRef.current === performanceId) {
      return;
    }

    performanceLoadIdRef.current = performanceId;

    const runLoad = async () => {
      try {
        await loadPerformanceData();
      } catch {
        if (performanceLoadIdRef.current === performanceId) {
          performanceLoadIdRef.current = null;
        }
      }
    };

    void runLoad();
  }, [performanceId]);

  const loadPerformanceData = async () => {
    if (!performanceId) {
      console.error('Performance ID is required');
      return;
    }

    setLoading(true);
    try {
      // Load performance details
      const performanceData = await performanceService.getPerformanceById(performanceId);
      setPerformance(performanceData);

      // Try resolve venueId from performance or venue list
      try {
        const maybeVenueId = performanceData.venueId;
        if (maybeVenueId) {
          setVenueId(Number(maybeVenueId));
        } else if (performanceData.venueName || performanceData.venue) {
          const venueName = performanceData.venueName || performanceData.venue;
          const venues = await venueService.getAllVenues();
          const matched = venues.find(
            (v: { venueName: string; venueId: number }) => v.venueName === venueName,
          );
          if (matched?.venueId) {
            setVenueId(matched.venueId);
          } else {
            console.warn('❌ No matching venue found for:', venueName);
          }
        } else {
          console.warn('❌ No venue information in performance data');
        }
      } catch (e) {
        console.error('❌ Failed to resolve venueId:', e);
      }

      // Load schedules for this performance
      try {
        const schedulesData = await performanceService.getPerformanceSchedules(performanceId);
        setSchedules(schedulesData.schedules || []);
      } catch (scheduleError: unknown) {
        console.error('Failed to load schedules:', scheduleError);

        // Check if performance data already includes schedules
        if (performanceData.schedules && performanceData.schedules.length > 0) {
          setSchedules(performanceData.schedules ?? []);
        } else {
          setSchedules([]);
          toast.error('스케줄 정보를 불러올 수 없습니다. 서버에서 문제가 발생했습니다.');
        }
      }
    } catch (error: unknown) {
      console.error('Failed to load performance data:', error);

      // Show specific error message if available
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (error as { message?: string })?.message ||
        '공연 정보를 불러올 수 없습니다.';
      toast.error(errorMessage);
      if (performanceLoadIdRef.current === performanceId) {
        performanceLoadIdRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const SEAT_ZONE_SEPARATOR = '::';

  const buildSeatCode = ({
    zone,
    rowLabel,
    seatNumber,
  }: {
    zone?: string | null;
    rowLabel: string;
    seatNumber: string | number;
  }) => {
    const normalizedRow = String(rowLabel).trim();
    const normalizedSeat = String(seatNumber).trim();
    const zoneKey = normalizeZoneValue(zone);
    const base = `${normalizedRow}-${normalizedSeat}`;
    return zoneKey ? `${zoneKey}${SEAT_ZONE_SEPARATOR}${base}` : base;
  };

  const parseSeatCode = (code: string) => {
    const raw = String(code ?? '');
    const sepIndex = raw.indexOf(SEAT_ZONE_SEPARATOR);
    let zone: string | undefined;
    let remainder = raw;
    if (sepIndex >= 0) {
      zone = raw.slice(0, sepIndex).trim() || undefined;
      remainder = raw.slice(sepIndex + SEAT_ZONE_SEPARATOR.length);
    }
    const [rowLabelRaw = '', seatRaw = ''] = remainder.split('-');
    return {
      zone,
      rowLabel: rowLabelRaw.trim(),
      seatNumber: seatRaw.trim(),
    };
  };

  const normalizeSeatCode = (row: string | number, num: string | number, zone?: string | null) => {
    const rawRow = String(row).trim().toUpperCase();
    const letters = rawRow.match(/[A-Z]+/g);
    const digitsInRow = rawRow.match(/\d+/g);
    // Prefer the last letter group as the row label (e.g., "VIP-A" -> "A", "ROW A" -> "A")
    const rowLabel =
      letters && letters.length > 0
        ? letters[letters.length - 1]
        : digitsInRow
          ? String(parseInt(digitsInRow[0], 10))
          : rawRow;

    const rawNum = String(num).trim();
    const parsed = parseInt(rawNum, 10);
    const numLabel = isNaN(parsed) ? rawNum : String(parsed);
    return buildSeatCode({ zone, rowLabel, seatNumber: numLabel });
  };

  const loadSeats = async (scheduleId: number) => {
    setLoading(true);
    try {
      // Clear any previous selection when loading seats for a new schedule
      resetSelection();
      // Get seat availability for the selected schedule
      const seatResponse = await seatService.getScheduleSeats(scheduleId);
      const seatData = seatResponse.data;
      if (!seatData?.seats) {
        console.warn('Seat response missing seats payload:', seatResponse);
        setSeats([]);
        setOccupiedSeatCodes(new Set());
        return;
      }
      setSeats(seatData.seats);
      // Build occupied code set for seat map selector
      try {
        const occ = new Set<string>();
        for (const s of seatData.seats) {
          const status = s.status?.toString().toUpperCase();
          if (status && status !== 'AVAILABLE') {
            occ.add(normalizeSeatCode(s.seatRow, s.seatNumber, s.seatZone));
          }
        }
        setOccupiedSeatCodes(occ);
      } catch (e) {
        console.warn('Failed to compute occupied seats', e);
        setOccupiedSeatCodes(new Set());
      }
      setBookingStep('seats');
    } catch (error) {
      console.error('Failed to load seats:', error);
      const errorMessage = (error as { message?: string })?.message || '';
      toast.error('좌석 정보를 불러올 수 없습니다: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = (scheduleId: string) => {
    const id = parseInt(scheduleId);
    resetSelection();
    setSelectedSchedule(id);
    loadSeats(id);
  };

  const handleSeatClick = useCallback(
    (seatId: number) => {
      const seat = seats.find((s) => s.seatId === seatId);

      if (!seat) {
        console.warn('Seat not found:', seatId);
        return;
      }

      if (seat.status !== 'AVAILABLE') {
        return;
      }

      setSelectedSeats((prev: number[]) => {
        if (prev.includes(seatId)) {
          return prev.filter((id: number) => id !== seatId);
        } else {
          if (prev.length < selectionLimit) {
            return [...prev, seatId];
          } else {
            if (prev.length === selectionLimit) {
              toast.warning(`최대 ${selectionLimit}개의 좌석까지만 선택할 수 있습니다.`);
            }
            return prev;
          }
        }
      });
    },
    [seats, selectionLimit],
  );

  const totalPrice = useMemo(() => {
    // Prefer selectorTotal if using new selector
    if (selectedSeatCodes.length > 0) return selectorTotal;
    if (selectedSeats.length > 0) {
      return selectedSeats.reduce((total: number, seatId: number) => {
        const seat = seats.find((s: SeatDto) => s.seatId === seatId);
        return total + (seat?.price || 0);
      }, 0);
    }
    return 0;
  }, [selectedSeats, selectedSeatCodes, selectorTotal, seats]);

  // 좌석 데이터에서 동적으로 행 추출 및 정렬
  const seatRows = useMemo(() => {
    if (!seats || seats.length === 0) return [];

    // 모든 고유한 행을 추출
    const uniqueRows = [...new Set(seats.map((seat: SeatDto) => String(seat.seatRow)))];

    // 행을 알파벳 순으로 정렬 (A, B, C, D... 또는 1, 2, 3, 4...)
    return uniqueRows.sort((a, b) => {
      // 숫자인지 문자인지 확인
      const aIsNumber = !isNaN(Number(a));
      const bIsNumber = !isNaN(Number(b));

      if (aIsNumber && bIsNumber) {
        return Number(a) - Number(b);
      } else {
        return String(a).localeCompare(String(b));
      }
    });
  }, [seats]);

  // 각 행의 좌석을 번호순으로 정렬
  const getSortedSeatsForRow = useCallback(
    (row: string) => {
      return seats
        .filter((seat) => seat.seatRow === row)
        .sort((a: SeatDto, b: SeatDto) => {
          // 좌석 번호가 숫자인지 문자인지 확인
          const aIsNumber = !isNaN(Number(a.seatNumber));
          const bIsNumber = !isNaN(Number(b.seatNumber));

          if (aIsNumber && bIsNumber) {
            return Number(a.seatNumber) - Number(b.seatNumber);
          } else {
            return a.seatNumber.localeCompare(b.seatNumber);
          }
        });
    },
    [seats],
  );

  // 토큰이 활성화될 때까지 대기하는 헬퍼 함수
  const waitForTokenActive = async (token: string): Promise<void> => {
    const maxAttempts = 60; // 최대 1분 대기
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await queueService.getTokenStatus(token);

        if (statusResponse.data?.status === 'ACTIVE') {
          console.log('토큰 활성화 완료:', token);
          return; // 활성화됨
        }

        if (['EXPIRED', 'CANCELLED'].includes(statusResponse.data?.status || '')) {
          throw new Error('토큰이 만료되었습니다. 다시 시도해주세요.');
        }

        console.log(`토큰 활성화 대기 중... (${attempts + 1}/${maxAttempts})`);

        // 1초 대기
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.error('토큰 상태 확인 중 오류:', error);
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error('토큰 활성화 시간이 초과되었습니다. 다시 시도해주세요.');
  };

  // Helper: 예약 전 유효성 검사
  const validateBookingRequest = useCallback(() => {
    // Check auth state
    if (!user) {
      toast.error('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      login();
      return false;
    }

    if (!seatMap || !Array.isArray(seatMap.sections) || seatMap.sections.length === 0) {
      toast.warning('좌석 지도가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return false;
    }

    const codes =
      selectedSeatCodes.length > 0 ? selectedSeatCodes : Array.from(selectorSelectedCodes);
    if (codes.length === 0) {
      toast.info('좌석을 선택해주세요.');
      return false;
    }

    return true;
  }, [user, login, seatMap, selectedSeatCodes, selectorSelectedCodes]);

  // Helper: 대기열 토큰 처리
  const handleQueueToken = useCallback(async (performanceId: number, scheduleId: number) => {
    let queueToken: string | null = null;

    try {
      const queueCheck = await queueService.checkQueueRequirement(performanceId, scheduleId);
      console.log('대기열 체크 결과:', queueCheck.data);

      if (queueCheck.data?.requiresQueue) {
        queueToken = queueCheck.data?.sessionId ?? null;
        if (!queueToken) {
          throw new Error('대기열 토큰 발급에 실패했습니다.');
        }
        console.log('토큰 발급 완료:', queueToken);
        queueSessionRef.current = queueToken;
      } else if (queueCheck.data?.canProceedDirectly) {
        queueToken = queueCheck.data?.sessionId ?? null;
        if (queueToken) {
          queueSessionRef.current = queueToken;
          setSessionReady(true);
          console.log('[QUEUE] 직접입장:', queueSessionRef.current);
        }
      }
    } catch (queueError) {
      console.error('대기열 처리 중 오류:', queueError);
      toast.warning('대기열 확인 중 문제가 발생했지만 예매를 진행합니다.');
    }

    return queueToken;
  }, []);

  // Helper: 좌석 데이터 변환
  const buildSeatsPayload = useCallback(
    (codes: string[]) => {
      const codeToSeat = new Map<string, SeatDto>();
      seats.forEach((s) => codeToSeat.set(seatToCode(s), s));

      return codes.map((code) => {
        const parsed = parseSeatCode(String(code));
        const fromSeat = codeToSeat.get(code);
        return {
          grade: String(fromSeat?.seatGrade ?? ''),
          zone: String(fromSeat?.seatZone ?? parsed.zone ?? ''),
          rowLabel: parsed.rowLabel || '',
          colNum: parsed.seatNumber || '',
        };
      });
    },
    [seats, seatToCode],
  );

  // Helper: 예약 성공 후처리
  const handleBookingSuccess = useCallback(
    (bookingNumber: string) => {
      // Clear booking expiration overrides
      try {
        const key = 'bookingExpiresOverrides';
        const raw = localStorage.getItem(key);
        if (raw) {
          const map = JSON.parse(raw);
          if (map && typeof map === 'object' && bookingNumber in map) {
            delete map[bookingNumber];
            localStorage.setItem(key, JSON.stringify(map));
          }
        }
      } catch (e) {
        console.warn('Failed to clear booking expiration override', e);
      }

      // Persist selected seat codes
      try {
        const key = 'bookingSeatCodes';
        const raw = localStorage.getItem(key);
        const map = raw ? JSON.parse(raw) : {};
        const codesToPersist =
          selectedSeatCodes.length > 0 ? selectedSeatCodes : Array.from(selectorSelectedCodes);
        if (Array.isArray(codesToPersist) && codesToPersist.length > 0) {
          map[bookingNumber] = codesToPersist;
          localStorage.setItem(key, JSON.stringify(map));
        }
      } catch (e) {
        console.warn('Failed to persist booking seat codes', e);
      }

      toast.success(`Booking confirmed! Booking number: ${bookingNumber}`);
      resetSelection();

      if (onComplete) {
        onComplete();
      } else {
        navigate('/booking-history');
      }
    },
    [selectedSeatCodes, selectorSelectedCodes, resetSelection, onComplete, navigate],
  );

  // Helper: 예약 실패 후처리
  const handleBookingError = useCallback(
    async (scheduleId: number) => {
      toast.error('Booking failed. Please try again.');
      resetSelection();

      // 좌석 상태 재조회
      try {
        const seatResponse = await seatService.getScheduleSeats(scheduleId);
        const seatData = seatResponse.data;
        if (seatData?.seats) {
          setSeats(seatData.seats);
        }
      } catch (refreshError) {
        console.error('좌석 상태 재조회 실패:', refreshError);
      }
    },
    [resetSelection],
  );

  const handleBooking = useCallback(async () => {
    if (!selectedSchedule) return;

    // 유효성 검사
    if (!validateBookingRequest()) return;

    setLoading(true);

    try {
      // 대기열 토큰 처리
      const queueToken = await handleQueueToken(performanceId, selectedSchedule);

      // 좌석 데이터 변환
      const codes =
        selectedSeatCodes.length > 0 ? selectedSeatCodes : Array.from(selectorSelectedCodes);
      const seatsPayload = buildSeatsPayload(codes);

      // 예약 요청
      const bookingRequest: CreateBookingRequestDto = {
        scheduleId: selectedSchedule,
        seats: seatsPayload,
        queueToken: queueToken ?? undefined,
      };

      console.log('예약 요청 데이터:', bookingRequest);
      const bookingResponse = await bookingService.createBooking(bookingRequest);
      console.log('예약 응답:', bookingResponse);

      // 예약 성공 처리
      handleBookingSuccess(bookingResponse.bookingNumber);
    } catch (error) {
      console.error('Failed to create booking:', error);

      // Check if it's an authentication error
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as { status: number };
        if (httpError.status === 401 || httpError.status === 403) {
          toast.error('인증이 만료되었습니다. 다시 로그인해주세요.');
          login();
          return;
        }
      }

      await handleBookingError(selectedSchedule);
    } finally {
      setLoading(false);
    }
  }, [
    selectedSchedule,
    performanceId,
    selectedSeatCodes,
    selectorSelectedCodes,
    validateBookingRequest,
    handleQueueToken,
    buildSeatsPayload,
    handleBookingSuccess,
    handleBookingError,
    login,
  ]);

  // Early return if performanceId is invalid
  if (!performanceId || isNaN(performanceId)) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p>Invalid performance ID</p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated after loading, show nothing (will redirect)
  if (!user) {
    return null;
  }

  if (loading && !performance) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!performance) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <p>Performance not found</p>
          <Button onClick={handleBack} className="mt-4">
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (bookingStep === 'schedule') {
    return (
      <ScheduleStepCard
        performance={performance}
        schedules={schedules}
        onBack={handleBack}
        onSelectSchedule={handleScheduleSelect}
      />
    );
  }

  const hasSeatMap = Boolean(seatMap && (seatMap.sections?.length ?? 0) > 0);

  const workspaceSlot = (() => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!venueId) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
          공연장의 좌석 지도를 불러오는 중입니다...
        </div>
      );
    }

    if (seatMapLoading) {
      return (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!hasSeatMap || !seatMap) {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground py-12">
          좌석 지도를 불러오지 못했습니다.
        </div>
      );
    }

    const { metadata, sections } = seatMap;
    const stageLabel = typeof metadata?.stageLabel === 'string' ? metadata.stageLabel : undefined;
    const stageDescription =
      typeof metadata?.stageDescription === 'string' ? metadata.stageDescription : undefined;

    return (
      <SeatMapWorkspace
        sections={sections}
        selectedCodes={selectorSelectedCodes}
        occupiedCodes={occupiedSeatCodes}
        gradePrices={gradePrices}
        onSeatClick={handleSelectorSeatClick}
        getSectionIdentifier={getSectionIdentifier}
        generateRowLabel={generateRowLabel}
        buildSeatCode={buildSeatCode}
        zoomLevel={zoomLevel}
        zoomPercentage={zoomPercentage}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        selectedCount={selectorSelectedCodes.size}
        selectionLimit={selectionLimit}
        stageLabel={stageLabel ?? '무대 (STAGE)'}
        stageDescription={stageDescription ?? '모든 좌석에서 무대를 확인할 수 있어요.'}
      />
    );
  })();

  const sidebarSlot =
    hasSeatMap && seatMap ? (
      <>
        <BookingSummary
          selectedCount={selectorSelectedCodes.size}
          totalPrice={selectorTotal}
          loading={loading}
          onBooking={handleBooking}
          onReset={resetSelection}
          selectionLimit={selectionLimit}
        />
        <BookingForm
          selectedCodes={selectorSelectedCodes}
          gradePrices={gradePrices}
          seatMapSections={seatMap.sections}
          gradeSwatchClass={gradeSwatchClass}
          resolveSeatGrade={resolveSeatGrade}
        />
      </>
    ) : null;

  return (
    <SeatSelectionLayout
      performanceTitle={performance.title}
      performanceVenue={performance.venue}
      onBack={() => setBookingStep('schedule')}
      workspaceSlot={workspaceSlot}
      sidebarSlot={sidebarSlot}
    />
  );
}

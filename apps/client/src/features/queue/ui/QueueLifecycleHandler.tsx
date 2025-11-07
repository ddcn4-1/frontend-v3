import type React from 'react';
import { useEffect, useRef, useCallback } from 'react';
import { queueService } from '@/entities/queue';
import type { Performance, PerformanceSchedule } from '@/entities/performance';

interface QueueLifecycleHandlerProps {
  performance: Performance;
  selectedSchedule?: PerformanceSchedule;
  isActive: boolean;
  isWaiting?: boolean; // 대기 상태 추가
  onSessionLost: () => void;
}

const QueueLifecycleHandler: React.FC<QueueLifecycleHandlerProps> = ({
  performance,
  selectedSchedule,
  isActive,
  isWaiting = false, // 대기 상태
  onSessionLost,
}) => {
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUnmountingRef = useRef(false);
  const lastHeartbeatRef = useRef<{ key: string | null; timestamp: number }>({
    key: null,
    timestamp: 0,
  });

  const sendHeartbeat = useCallback(async () => {
    if (!selectedSchedule || isUnmountingRef.current) return;

    const sessionKey = `${performance.performanceId}-${selectedSchedule.scheduleId}`;
    const now = Date.now();
    const { key: lastKey, timestamp: lastTimestamp } = lastHeartbeatRef.current;

    // 개발 환경 StrictMode 등으로 인한 연속 호출 방지
    if (lastKey === sessionKey && now - lastTimestamp < 1500) {
      console.debug('[QUEUE] Skipping duplicate heartbeat for session:', sessionKey);
      return;
    }

    lastHeartbeatRef.current = { key: sessionKey, timestamp: now };
    try {
      await queueService.updateHeartbeat(performance.performanceId, selectedSchedule.scheduleId);
      console.log('Heartbeat sent successfully');
    } catch (error) {
      console.error('Heartbeat failed:', error);
      // 연속된 heartbeat 실패 시 세션 손실로 처리
      if (error instanceof Error && error.message?.includes('연속된 heartbeat 실패')) {
        onSessionLost();
      }
    }
  }, [performance.performanceId, selectedSchedule?.scheduleId, onSessionLost]);

  // Heartbeat 시작/중지
  useEffect(() => {
    // 활성 상태이거나 대기 상태일 때 heartbeat 전송
    if ((isActive || isWaiting) && selectedSchedule) {
      console.log('Starting heartbeat for session...');

      // 즉시 한 번 전송 (중복 방지를 위해 비동기로 실행)
      void sendHeartbeat();

      // 30초마다 heartbeat 전송
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, 30000);
    } else {
      // heartbeat 중지
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
        console.log('Heartbeat stopped');
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isActive, isWaiting, sendHeartbeat, selectedSchedule]);

  // 세션 변경 시 마지막 하트비트 기록 초기화
  useEffect(() => {
    if (!selectedSchedule) {
      lastHeartbeatRef.current = { key: null, timestamp: 0 };
    }
  }, [selectedSchedule?.scheduleId, performance.performanceId]);
  // 컴포넌트 언마운트 시 세션 해제
  useEffect(() => {
    const handleUnload = async () => {
      if (selectedSchedule && (isActive || isWaiting)) {
        isUnmountingRef.current = true;
        const beaconSent = queueService.sendSessionReleaseBeacon(
          performance.performanceId,
          selectedSchedule.scheduleId,
        );
        if (!beaconSent) {
          try {
            await queueService.releaseSession(
              performance.performanceId,
              selectedSchedule.scheduleId,
              'component_unmount',
            );
          } catch (error) {
            console.error('Failed to release session on unmount:', error);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload); // iOS/Safari 대응
    window.addEventListener('popstate', handleUnload); // 브라우저 뒤로가기

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('popstate', handleUnload);
    };
  }, [performance.performanceId, selectedSchedule, isActive, isWaiting]);

  return null;
};

export default QueueLifecycleHandler;

import { apiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import type {
  ApiResponseQueueCheck,
  ApiResponseQueueStatus,
  ApiResponseQueueStatusList,
  ApiResponseString,
  ApiResponseTokenIssue,
  HeartbeatRequest,
  QueueStatusResponse,
  SessionReleaseRequest,
  TokenActivateRequest,
  TokenIssueRequest,
} from '@packages/shared';

class QueueService {
  private heartbeatRetryCount = 0;
  private maxHeartbeatRetries = 3;
  private readonly queueEndpoint = API_CONFIG.ENDPOINTS.QUEUE;
  private readonly pendingCheckRequests = new Map<string, Promise<ApiResponseQueueCheck>>();
  private readonly pendingHeartbeatRequests = new Map<string, Promise<ApiResponseString>>();
  private readonly lastHeartbeatMeta = new Map<
    string,
    { timestamp: number; response: ApiResponseString }
  >();
  private readonly heartbeatCooldownMs = 2000;

  async checkQueueRequirement(
    performanceId: number,
    scheduleId: number,
  ): Promise<ApiResponseQueueCheck> {
    const requestData = {
      performanceId,
      scheduleId,
    };

    const requestKey = `${performanceId}-${scheduleId}`;
    const existingRequest = this.pendingCheckRequests.get(requestKey);
    if (existingRequest) {
      console.log('[QueueService] Reusing pending check request for', requestKey);
      return existingRequest;
    }

    const pendingRequest = (async () => {
      try {
        const response = await apiClient.post<ApiResponseQueueCheck>(
          `${this.queueEndpoint}/check`,
          requestData,
        );

        console.log('Token received in sessionId:', response.data?.sessionId);
        return response;
      } catch (error: any) {
        console.error('토큰 요청 실패:', error);
        throw error;
      } finally {
        this.pendingCheckRequests.delete(requestKey);
      }
    })();

    this.pendingCheckRequests.set(requestKey, pendingRequest);
    return pendingRequest;
  }

  /**
   * 대기열 토큰 발급 todo .곧 삭제
   */
  async issueToken(performanceId: number): Promise<ApiResponseTokenIssue> {
    console.log('Queue Service - Issuing token for performance:', performanceId);

    const requestData: TokenIssueRequest = { performanceId };

    return apiClient.post<ApiResponseTokenIssue>(`${this.queueEndpoint}/token`, requestData);
  }

  /**
   * 토큰 상태 조회
   */
  async getTokenStatus(token: string): Promise<ApiResponseQueueStatus> {
    console.log('Queue Service - Getting token status:', token);

    return apiClient.get<ApiResponseQueueStatus>(`${this.queueEndpoint}/status/${token}`);
  }

  /**
   * 내 토큰 목록 조회
   */
  async getMyTokens(): Promise<ApiResponseQueueStatusList> {
    console.log('Queue Service - Getting my tokens');

    return apiClient.get<ApiResponseQueueStatusList>(`${this.queueEndpoint}/my-tokens`);
  }

  /**
   * 토큰 취소 (대기열에서 나가기)
   */
  async cancelToken(token: string): Promise<ApiResponseString> {
    console.log('Queue Service - Canceling token:', token);

    return apiClient.delete<ApiResponseString>(`${this.queueEndpoint}/token/${token}`);
  }

  /**
   * 대기열 토큰 활성화 시도
   */
  async activateToken(
    token: string,
    performanceId: number,
    scheduleId: number,
  ): Promise<ApiResponseQueueStatus> {
    console.log(
      'Queue Service - Activating token:',
      token,
      'performance:',
      performanceId,
      'schedule:',
      scheduleId,
    );

    const requestData: TokenActivateRequest = {
      token,
      performanceId,
      scheduleId,
    };

    return apiClient.post<ApiResponseQueueStatus>(`${this.queueEndpoint}/activate`, requestData);
  }

  /**
   * Heartbeat 전송 - 사용자 활성 상태 유지
   */
  async updateHeartbeat(performanceId: number, scheduleId: number): Promise<ApiResponseString> {
    console.log(
      'Queue Service - Sending heartbeat for performance:',
      performanceId,
      'schedule:',
      scheduleId,
    );

    const requestData: HeartbeatRequest = {
      performanceId,
      scheduleId,
    };

    const requestKey = `${performanceId}-${scheduleId}`;
    const now = Date.now();

    const pendingHeartbeat = this.pendingHeartbeatRequests.get(requestKey);
    if (pendingHeartbeat) {
      console.log('[QueueService] Reusing pending heartbeat for', requestKey);
      return pendingHeartbeat;
    }

    const recentHeartbeat = this.lastHeartbeatMeta.get(requestKey);
    if (recentHeartbeat && now - recentHeartbeat.timestamp < this.heartbeatCooldownMs) {
      console.log('[QueueService] Skipping heartbeat (cooldown) for', requestKey);
      return Promise.resolve(recentHeartbeat.response);
    }

    const heartbeatPromise = (async () => {
      try {
        const response = await apiClient.post<ApiResponseString>(
          `${this.queueEndpoint}/heartbeat`,
          requestData,
        );

        // 성공시 재시도 카운트 리셋 및 최근 성공 기록
        this.heartbeatRetryCount = 0;
        this.lastHeartbeatMeta.set(requestKey, { timestamp: Date.now(), response });
        return response;
      } catch (error: any) {
        this.heartbeatRetryCount++;
        console.error(`Heartbeat failed (attempt ${this.heartbeatRetryCount}):`, error);

        if (this.heartbeatRetryCount >= this.maxHeartbeatRetries) {
          throw new Error('연속된 heartbeat 실패로 세션이 만료될 수 있습니다.');
        }

        throw error;
      } finally {
        this.pendingHeartbeatRequests.delete(requestKey);
      }
    })();

    this.pendingHeartbeatRequests.set(requestKey, heartbeatPromise);
    return heartbeatPromise;
  }

  /**
   * 세션 명시적 해제 (페이지 이탈 시)
   */
  async releaseSession(
    performanceId: number,
    scheduleId: number,
    reason?: string,
  ): Promise<ApiResponseString> {
    console.log(
      'Queue Service - Releasing session for performance:',
      performanceId,
      'schedule:',
      scheduleId,
    );

    // 현재 사용자 ID 동적으로 가져오기
    const getCurrentUserId = (): number | null => {
      try {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          return user.userId || user.user_id;
        }
      } catch (error) {
        console.error('Failed to get current user ID:', error);
      }
      return null;
    };

    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('Cannot send beacon: userId not found');
      throw new Error('User not logged in');
    }

    const requestData: SessionReleaseRequest = {
      performanceId,
      scheduleId,
      userId: userId,
      reason: reason || 'user_exit',
    };

    return apiClient.post<ApiResponseString>(`${this.queueEndpoint}/release-session`, requestData);
  }

  /**
   * 세션 정리 (테스트용)
   */
  async clearSessions(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `${this.queueEndpoint}/clear-sessions`,
      );
      return response;
    } catch (error: any) {
      console.error('Clear sessions failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear sessions');
    }
  }

  /**
   * Beacon을 통한 세션 해제 (페이지 언로드 시)
   * 이 메서드는 브라우저가 페이지를 언로드할 때 사용됩니다.
   */
  sendSessionReleaseBeacon(performanceId: number, scheduleId: number): boolean {
    if (!navigator.sendBeacon) {
      console.warn('Beacon API not supported');
      return false;
    }

    // 현재 사용자 ID 동적으로 가져오기
    const getCurrentUserId = (): number | null => {
      try {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          return user.userId || user.user_id;
        }
      } catch (error) {
        console.error('Failed to get current user ID:', error);
      }
      return null;
    };

    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('Cannot send beacon: userId not found');
      return false;
    }

    const data = JSON.stringify({
      performanceId,
      scheduleId,
      userId: userId,
      reason: 'page_unload',
    });

    // API_CONFIG를 사용하여 동적 URL 구성
    const url = `${API_CONFIG.BASE_URL}${this.queueEndpoint}/release-session`;

    try {
      const success = navigator.sendBeacon(url, data);
      console.log('Beacon sent successfully:', success, 'to:', url);
      return success;
    } catch (error) {
      console.error('Beacon send failed:', error);
      return false;
    }
  }

  /**
   * API 응답의 필드명을 UI에서 사용하는 형태로 정규화
   */
  private normalizeQueueStatus(status: any): QueueStatusResponse {
    if (!status) {
      return status as QueueStatusResponse;
    }

    return {
      ...status,
      isActiveForBooking: status.isActiveForBooking ?? status.activeForBooking ?? false,
    } as QueueStatusResponse;
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 대기열 상태를 폴링하는 함수
   */
  async pollQueueStatus(
    token: string,
    onStatusUpdate: (status: QueueStatusResponse) => void,
    pollInterval = 3000,
  ): Promise<() => void> {
    let isPolling = true;

    const poll = async () => {
      while (isPolling) {
        try {
          const response = await this.getTokenStatus(token);
          if (response.success && response.data) {
            const status = this.normalizeQueueStatus(response.data);
            onStatusUpdate(status);

            // ACTIVE 또는 완료 상태면 폴링 중단
            if (['ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'].includes(status.status)) {
              break;
            }
          }
        } catch (error) {
          console.error('Queue polling error:', error);
          // 에러가 발생해도 계속 폴링
        }

        await this.delay(pollInterval);
      }
    };

    // 폴링 시작
    void poll();

    // 폴링 중단 함수 반환
    return () => {
      isPolling = false;
    };
  }

  /**
   * 자동 재연결 기능이 있는 향상된 폴링
   */
  async pollQueueStatusWithRetry(
    token: string,
    onStatusUpdate: (status: QueueStatusResponse) => void,
    onError: (error: string) => void,
    options: {
      pollInterval?: number;
      maxRetries?: number;
      performanceId?: number;
      scheduleId?: number;
    } = {},
  ): Promise<() => void> {
    let isPolling = true;
    let retryCount = 0;
    const { pollInterval = 3000, maxRetries = 5, performanceId, scheduleId } = options;

    const poll = async () => {
      while (isPolling && retryCount < maxRetries) {
        try {
          const response = await this.getTokenStatus(token);
          if (response.success && response.data) {
            let status = this.normalizeQueueStatus(response.data);
            retryCount = 0; // 성공시 재시도 카운트 리셋

            if (
              status.status === 'WAITING' &&
              typeof performanceId === 'number' &&
              typeof scheduleId === 'number'
            ) {
              try {
                const activationResponse = await this.activateToken(
                  token,
                  performanceId,
                  scheduleId,
                );
                if (activationResponse.success && activationResponse.data) {
                  status = this.normalizeQueueStatus(activationResponse.data);
                }
              } catch (activationError) {
                console.warn('Queue activation attempt failed:', activationError);
              }
            }

            onStatusUpdate(status);

            // ACTIVE 또는 완료 상태면 폴링 중단
            if (['ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'].includes(status.status)) {
              break;
            }
          } else {
            retryCount++;
            console.warn(`Queue status check failed (attempt ${retryCount})`);
          }
        } catch (error: any) {
          retryCount++;
          console.error(`Queue polling error (attempt ${retryCount}):`, error);

          if (retryCount >= maxRetries) {
            onError('대기열 상태 확인에 실패했습니다. 페이지를 새로고침해 주세요.');
            break;
          }
        }

        await this.delay(pollInterval * Math.min(retryCount + 1, 3)); // 점진적 백오프
      }
    };

    // 폴링 시작
    void poll();

    // 폴링 중단 함수 반환
    return () => {
      isPolling = false;
    };
  }
}

export const queueService = new QueueService();
export default queueService;

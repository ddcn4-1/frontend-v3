import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from '@packages/design-system';
import { useSelectPage } from '../lib/useSelectPage';
import { appConfig } from '@shared/config';

export function SelectPage() {
  const { auth, handleLogout, hasAdminAccess } = useSelectPage();

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-2">
            <CardTitle>불러오는 중...</CardTitle>
            <CardDescription>인증 정보를 확인하고 있습니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!auth.user) {
    return null;
  }

  const { username, email, groups } = auth.user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle>접근 가능한 앱 선택</CardTitle>
          <CardDescription>권한에 따라 사용할 수 있는 애플리케이션을 선택하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
            <div className="flex flex-col gap-1 text-left">
              <span>
                <strong>사용자:</strong> {username}
              </span>
              <span>
                <strong>이메일:</strong> {email}
              </span>
              <span>
                <strong>권한:</strong> {groups?.join(', ') || 'USER'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-emerald-400/60">
              <CardHeader>
                <CardTitle>클라이언트 앱</CardTitle>
                <CardDescription>
                  일반 사용자 기능을 제공하는 기본 애플리케이션입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="list-disc space-y-1 pl-5">
                  <li>개인화된 대시보드 접근</li>
                  <li>사용자 계정 및 데이터 관리</li>
                  <li>핵심 서비스 기능 이용</li>
                </ul>
                <Button
                  className="w-full"
                  onClick={() => {
                    window.location.href = appConfig.clientUrl;
                  }}
                >
                  클라이언트 앱으로 이동
                </Button>
              </CardContent>
            </Card>

            {hasAdminAccess && (
              <Card className="border-destructive/60">
                <CardHeader>
                  <CardTitle>관리자 앱</CardTitle>
                  <CardDescription>
                    ADMIN 권한 이상에게만 제공되는 고급 관리 도구입니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>사용자 및 권한 관리</li>
                    <li>시스템 설정 및 모니터링</li>
                    <li>통계 · 리포트 열람</li>
                  </ul>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => {
                      window.location.href = appConfig.adminUrl;
                    }}
                  >
                    관리자 앱으로 이동
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                void handleLogout();
              }}
            >
              로그아웃
            </Button>
            <a href="/login" className="text-primary hover:underline">
              로그인 페이지로 돌아가기
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

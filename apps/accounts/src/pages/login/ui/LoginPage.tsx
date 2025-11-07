/**
 * LoginPage Component
 * FSD v2.1: Pages Layer - Login Page
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@packages/design-system';
import { useLoginPage } from '../lib/useLoginPage';
import { appConfig } from '@shared/config';

export function LoginPage() {
  const {
    auth,
    loginState,
    handleUsernameChange,
    handlePasswordChange,
    handleSubmit,
    handleQuickFill,
    errorMessage,
  } = useLoginPage();

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-2">
            <CardTitle>불러오는 중...</CardTitle>
            <CardDescription>인증 상태를 확인하고 있습니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (auth.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle>로그인 완료</CardTitle>
            <CardDescription>인증이 성공적으로 완료되었습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              ✓ 안전한 인증이 확인되었습니다.
            </div>

            <div>
              <h2 className="mb-3 text-base font-semibold">사용자 정보</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">이메일</dt>
                  <dd className="font-medium text-foreground">{auth.user.email}</dd>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-muted-foreground">사용자명</dt>
                  <dd className="max-w-[60%] break-words text-right font-medium text-foreground">
                    {auth.user.username}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">그룹</dt>
                  <dd className="font-medium text-foreground">
                    {auth.user.groups?.join(', ') || 'USER'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  window.location.href = '/select';
                }}
              >
                앱 선택 페이지로 이동
              </Button>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  onClick={() => {
                    window.location.href = appConfig.clientUrl;
                  }}
                >
                  클라이언트 앱으로 이동
                </Button>
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    void auth.logout();
                  }}
                >
                  로그아웃
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle>로그인</CardTitle>
          <CardDescription>이메일 또는 사용자명과 비밀번호로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="space-y-4"
          >
            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">이메일 또는 사용자명</Label>
              <Input
                id="username"
                type="text"
                placeholder="user@example.com 또는 username"
                value={loginState.username}
                onChange={handleUsernameChange}
                disabled={loginState.isLoading}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={loginState.password}
                onChange={handlePasswordChange}
                disabled={loginState.isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginState.isLoading || !loginState.username || !loginState.password}
            >
              {loginState.isLoading ? '로그인 중...' : '로그인'}
            </Button>

            {/* Quick Fill Buttons for Development */}
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm text-muted-foreground text-center">테스트 계정</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFill('user2', 'Password!23')}
                  disabled={loginState.isLoading}
                >
                  일반 유저
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFill('admin', 'Password!23')}
                  disabled={loginState.isLoading}
                >
                  관리자
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

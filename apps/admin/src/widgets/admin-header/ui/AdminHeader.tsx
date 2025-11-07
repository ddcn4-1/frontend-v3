import { useNavigate } from 'react-router-dom';
import { Button, Container, Skeleton } from '@packages/design-system';
import { LogOut, User, Shield } from 'lucide-react';
import { useAdminAuth } from '@/features/admin-auth';

export function AdminHeader() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-14 items-center justify-between gap-6">
        {/* Logo & Title */}
        <button
          type="button"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary cursor-pointer border-0 bg-transparent p-0"
          onClick={() => navigate('/')}
        >
          <Shield className="h-5 w-5" />
          <span className="hidden sm:inline">관리자</span>
        </button>

        {/* User Info & Actions */}
        {loading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 lg:flex">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{user.username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        ) : null}
      </Container>
    </header>
  );
}

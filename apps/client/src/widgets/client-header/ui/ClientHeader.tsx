/**
 * Client Header Widget
 * FSD v2.1: Widgets Layer
 *
 * Integrated header with navigation and user actions
 */

import { NavLink } from 'react-router-dom';
import { Button, Container } from '@packages/design-system';
import { useClientAuth } from '@/features/client-auth';
import { LogOut, User, Ticket, Calendar, History } from 'lucide-react';

const NAV_LINKS = [
  {
    to: '/',
    label: '공연',
    icon: Calendar,
  },
  {
    to: '/booking-history',
    label: '나의 예매',
    icon: History,
  },
];

export function ClientHeader() {
  const { user, loading, login, logout } = useClientAuth();

  if (loading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="flex h-14 items-center justify-center">
          <span className="text-sm text-muted-foreground">불러오는 중...</span>
        </Container>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container className="flex h-14 items-center justify-between gap-6">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
          >
            <Ticket className="h-5 w-5" />
            <span className="hidden sm:inline">티켓 예매</span>
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden items-center gap-2 lg:flex">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{user.username}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={login}>
              로그인
            </Button>
          )}
        </div>
      </Container>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t bg-background/95">
        <Container className="flex items-center gap-1 py-2">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </Container>
      </div>
    </header>
  );
}

/**
 * Admin Sidebar Widget
 * Navigation panel for admin pages
 */

import { NavLink } from 'react-router-dom';
import { Users, Calendar, Ticket, type LucideIcon } from 'lucide-react';
import { cn } from '@packages/design-system';
import { useAdminAuth } from '@/features/admin-auth';
import { canAccess } from '@/shared/lib/permissions';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  permission: 'viewUsers' | 'viewPerformances' | 'viewBookings';
}

export function AdminSidebar() {
  const { user } = useAdminAuth();

  const allNavItems: NavItem[] = [
    { path: '/users', label: '사용자 관리', icon: Users, permission: 'viewUsers' },
    { path: '/performances', label: '공연 관리', icon: Calendar, permission: 'viewPerformances' },
    { path: '/bookings', label: '예매 관리', icon: Ticket, permission: 'viewBookings' },
  ];

  const navItems = allNavItems.filter((item) =>
    canAccess(user?.groups?.at(0)?.toUpperCase(), item.permission),
  );

  return (
    <aside className="w-64 border-r bg-muted/40 flex flex-col">
      <div className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">관리자 메뉴</h2>
        {user?.role && <p className="text-xs text-muted-foreground mt-1">Role: {user.role}</p>}
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.length > 0 ? (
          navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">접근 가능한 메뉴가 없습니다</div>
        )}
      </nav>
    </aside>
  );
}

/**
 * Admin app Layout component
 * Uses AdminHeader widget and provides main layout structure
 */

import { Outlet } from 'react-router-dom';
import { Container } from '@packages/design-system';
import { AdminHeader } from '../../widgets/admin-header';
import { AdminSidebar } from '../../widgets/admin-sidebar';
import { appConfig } from '../config/config';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header Widget */}
      <AdminHeader />

      {/* Body with Sidebar and Main Content */}
      <div className="flex flex-1">
        {/* Sidebar Widget */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto py-8">
          <Container>
            <Outlet />
          </Container>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-4">
        <Container className="text-center text-sm text-muted-foreground">
          관리자 앱 - <code className="font-mono">{appConfig.appUrl.replace('https://', '')}</code>
        </Container>
      </footer>
    </div>
  );
}

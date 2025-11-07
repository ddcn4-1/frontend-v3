/**
 * Admin App Entry Point
 * FSD v2.1: app/index.tsx
 * Domain: admin.ddcn41.com
 */

import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from '@/features/admin-auth';
import { AppRoutes } from './routes';

export function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;

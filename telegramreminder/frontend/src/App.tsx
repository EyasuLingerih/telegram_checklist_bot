import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useTelegram } from './hooks/useTelegram';
import { useAuth } from './hooks/useAuth';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function App() {
  const { initData, isReady, user: telegramUser } = useTelegram();
  const { login, isLoading, isAuthenticated, user, error } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && initData) {
      login(initData).catch((err) => {
        setAuthError(err.message);
      });
    } else if (isReady && !initData) {
      // Development mode - no Telegram context
      setAuthError('Please open this app from Telegram');
    }
  }, [isReady, initData, login]);

  // Loading state
  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen bg-tg-bg flex flex-col items-center justify-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-tg-hint">Loading...</p>
      </div>
    );
  }

  // Error state
  if (authError || error) {
    return (
      <div className="min-h-screen bg-tg-bg flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-tg-text mb-2">Authentication Error</h1>
        <p className="text-tg-hint text-center">{authError || error}</p>
      </div>
    );
  }

  // Not authorized
  if (isAuthenticated && !user?.isAuthorized) {
    return (
      <div className="min-h-screen bg-tg-bg flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-tg-text mb-2">Access Restricted</h1>
        <p className="text-tg-hint text-center">
          You are not authorized to use this app.
          <br />
          Please contact an admin.
        </p>
        {telegramUser && (
          <p className="mt-4 text-sm text-tg-hint">
            Your ID: {telegramUser.id}
          </p>
        )}
      </div>
    );
  }

  // Authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-tg-bg flex flex-col items-center justify-center">
        <LoadingSpinner size="large" />
        <p className="mt-4 text-tg-hint">Authenticating...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-tg-bg pb-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          {user?.isAdmin && <Route path="/admin" element={<AdminPage />} />}
        </Routes>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-tg-bg border-t border-tg-secondary-bg px-4 py-2 safe-area-inset-bottom">
          <div className="flex justify-around">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 ${isActive ? 'text-tg-button' : 'text-tg-hint'}`
              }
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs mt-1">Checklist</span>
            </NavLink>

            {user?.isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex flex-col items-center py-2 px-4 ${isActive ? 'text-tg-button' : 'text-tg-hint'}`
                }
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs mt-1">Admin</span>
              </NavLink>
            )}
          </div>
        </nav>
      </div>
    </BrowserRouter>
  );
}

export default App;

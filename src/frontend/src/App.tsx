import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@store/index';
import Header from '@components/common/Header';
import PrivateRoute from '@components/common/PrivateRoute';

const LoginPage = React.lazy(() => import('@pages/LoginPage'));
const HomePage = React.lazy(() => import('@pages/HomePage'));
const SessionNewPage = React.lazy(() => import('@pages/SessionNewPage'));
const ChatPage = React.lazy(() => import('@pages/ChatPage'));
const FeedbackPage = React.lazy(() => import('@pages/FeedbackPage'));
const HistoryPage = React.lazy(() => import('@pages/HistoryPage'));
const SettingsPage = React.lazy(() => import('@pages/SettingsPage'));

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <>
                    <Header />
                    <HomePage />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/session/new"
              element={
                <PrivateRoute>
                  <>
                    <Header />
                    <SessionNewPage />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/session/:sessionId/chat"
              element={
                <PrivateRoute>
                  <>
                    <Header />
                    <ChatPage />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/session/:sessionId/feedback"
              element={
                <PrivateRoute>
                  <>
                    <Header />
                    <FeedbackPage />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <>
                    <Header />
                    <HistoryPage />
                  </>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <>
                    <Header />
                    <SettingsPage />
                  </>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
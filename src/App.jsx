import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import MapPage from './pages/MapPage';
import SubmitPage from './pages/SubmitPage';
import StreamPage from './pages/StreamPage';
import SettingsPage from './pages/SettingsPage';
import ForumsPage from './pages/ForumsPage';
import ForumCategoryView from './pages/ForumCategoryView';
import ForumThreadView from './pages/ForumThreadView';
import ProtectedRoute from './components/Common/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import ErrorBoundary from './components/Common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<ErrorBoundary><MapPage /></ErrorBoundary>} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/stream" element={<ErrorBoundary><StreamPage /></ErrorBoundary>} />
            <Route path="/forums" element={<ErrorBoundary><ForumsPage /></ErrorBoundary>} />
            <Route path="/forums/:categoryId" element={<ProtectedRoute><ForumCategoryView /></ProtectedRoute>} />
            <Route path="/forums/:categoryId/thread/:threadId" element={<ProtectedRoute><ForumThreadView /></ProtectedRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;

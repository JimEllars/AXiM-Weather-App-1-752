import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import MapPage from './pages/MapPage';
import SubmitPage from './pages/SubmitPage';
import StreamPage from './pages/StreamPage';
import SettingsPage from './pages/SettingsPage';
import ForumsPage from './pages/ForumsPage';
import ForumCategoryView from './pages/ForumCategoryView';
import ProtectedRoute from './components/Common/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/stream" element={<StreamPage />} />
        <Route path="/forums" element={<ForumsPage />} />
        <Route path="/forums/:categoryId" element={<ProtectedRoute><ForumCategoryView /></ProtectedRoute>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
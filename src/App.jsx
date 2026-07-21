import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';
import MapPage from './pages/MapPage';
import SubmitPage from './pages/SubmitPage';
import StreamPage from './pages/StreamPage';
import SettingsPage from './pages/SettingsPage';
import ForumsPage from './pages/ForumsPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/map" replace />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/stream" element={<StreamPage />} />
        <Route path="/forums" element={<ForumsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
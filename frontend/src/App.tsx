import { Route, Routes } from 'react-router-dom';
import  Homepage from './pages/Home/HomePage';
import  AuthCallbackPage from './pages/Auth-Callback/AuthCallbackPage';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import MainLayout from './layout/MainLayout';
import ChatPage from './pages/Chat/ChatPage';
import AlbumPage from './pages/album/AlbumPage';
import AdminPage from './pages/Admin/AdminPage';
import NotFoundPage from './pages/NotFound404/NotFoundPage';
import DJPage from './pages/DJ/DJPage';
import GraphTabs from './pages/Graph/GraphTabs';

import { Toaster } from "react-hot-toast";


function App() {
  return (
    <>
      <Routes>
        <Route 
          path="/sso-callback" 
          element={< AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
        />
        <Route path="/auth-callback" element={< AuthCallbackPage />} />
        <Route path="/admin" element={< AdminPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={< Homepage />} />
          <Route path="/chat" element={< ChatPage />} />
          <Route path="/albums/:albumId" element={< AlbumPage />} />
          <Route path="*" element={< NotFoundPage />} />
          <Route path="/dj" element={<DJPage />} />
          <Route path="/graphs" element={<GraphTabs />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  )
}

export default App

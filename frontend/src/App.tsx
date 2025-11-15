import { Route, Routes } from 'react-router-dom';
import  Homepage from './pages/Home/HomePage';
import  AuthCallbackPage from './pages/Auth-Callback/AuthCallbackPage';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import MainLayout from './layout/MainLayout';
import ChatPage from './pages/Chat/ChatPage';
import AlbumPage from './pages/album/AlbumPage';

function App() {
  return (
    <>
      <Routes>
        <Route 
          path="/sso-callback" 
          element={< AuthenticateWithRedirectCallback signUpForceRedirectUrl={"/auth-callback"} />}
        />
        <Route path="/auth-callback" element={< AuthCallbackPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={< Homepage />} />
          <Route path="/chat" element={< ChatPage />} />
          <Route path="/albums/:albumId" element={< AlbumPage />} />
        </Route>

      </Routes>
    </>
  )
}

export default App

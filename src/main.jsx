import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { router } from './router'
import SplashScreen from './components/SplashScreen'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function Root() {
  const [splashDone, setSplashDone] = useState(false)

  return (
    <>
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
      {/* L'app se charge en arrière-plan pendant le splash */}
      <div style={{ visibility: splashDone ? 'visible' : 'hidden' }}>
        <RouterProvider router={router} />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Root />
    </GoogleOAuthProvider>
  </StrictMode>
)

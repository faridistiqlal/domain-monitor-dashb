import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { injectSpeedInsights } from '@vercel/speed-insights'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"

// Initialize Vercel Speed Insights
injectSpeedInsights()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="kendal-theme">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
        <Toaster position="bottom-right" richColors />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
)

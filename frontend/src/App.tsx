import React from 'react'
import CallInterface from '@/pages/CallInterface'
import ErrorBoundary from '@/components/ErrorBoundary'
import { logger } from '@/lib/logger'
import '@/globals.css'

// Log application startup
logger.info('Armenius Voice Assistant started', {
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent
});

function App() {
  return (
    <ErrorBoundary>
      <CallInterface />
    </ErrorBoundary>
  )
}

export default App
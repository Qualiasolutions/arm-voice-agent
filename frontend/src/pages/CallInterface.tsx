import React, { useState, useEffect, useRef } from 'react'
import Vapi from '@vapi-ai/web'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MariaAvatar from '@/components/call/MariaAvatar'
import CallButton from '@/components/call/CallButton'
import CallStatus from '@/components/call/CallStatus'
import { 
  Building2, 
  Clock,
  MapPin
} from 'lucide-react'

type CallState = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error'
type Language = 'el' | 'en'

const CallInterface: React.FC = () => {
  const [callState, setCallState] = useState<CallState>('idle')
  const [language, setLanguage] = useState<Language>('en')
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVolumeMuted, setIsVolumeMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  
  const vapiRef = useRef<Vapi | null>(null)

  // Initialize Vapi instance on component mount
  useEffect(() => {
    logger.info('Initializing Vapi voice system', {
      apiKey: 'f699458f-0087-435b-8e76-559dac4bf8cc'.substring(0, 8) + '***',
      component: 'CallInterface',
      vapiImported: !!Vapi
    });
    
    try {
      const vapiInstance = new Vapi('f699458f-0087-435b-8e76-559dac4bf8cc')
      vapiRef.current = vapiInstance

      // Set up event listeners with comprehensive logging
      vapiInstance.on('call-start', () => {
        logger.voiceEvent('call-start', { 
          language, 
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
        setCallState('connected')
        setCallStartTime(new Date())
        setError(null)
      })

      vapiInstance.on('call-end', () => {
        const callDuration = callStartTime ? Date.now() - callStartTime.getTime() : 0;
        logger.voiceEvent('call-end', { 
          language,
          duration: callDuration,
          durationFormatted: `${Math.round(callDuration / 1000)}s`
        });
        setCallState('ended')
        setCallStartTime(null)
        setTimeout(() => setCallState('idle'), 3000)
      })

      vapiInstance.on('error', (error) => {
        logger.voiceError('Vapi SDK error occurred', error, {
          language,
          callState,
          userAgent: navigator.userAgent
        });
        setCallState('error')
        setError(error.message || 'Voice call failed')
        setTimeout(() => setCallState('idle'), 5000)
      })

      vapiInstance.on('speech-start', () => {
        logger.voiceEvent('assistant-speech-start', { language });
      })

      vapiInstance.on('speech-end', () => {
        logger.voiceEvent('assistant-speech-end', { language });
      })

      vapiInstance.on('volume-level', (volume) => {
        logger.debug('Voice volume level', { volume, language });
      })

      vapiInstance.on('message', (message) => {
        logger.voiceEvent('message-received', { 
          messageType: message?.type || 'unknown',
          language,
          hasContent: !!message?.content
        });
      })

      logger.info('Vapi voice system initialized successfully', {
        component: 'CallInterface',
        eventsRegistered: ['call-start', 'call-end', 'error', 'speech-start', 'speech-end', 'volume-level', 'message']
      });
      
    } catch (error) {
      logger.error('Failed to initialize Vapi voice system', error, {
        component: 'CallInterface',
        userAgent: navigator.userAgent
      });
      setError('Failed to initialize voice system')
    }

    // Cleanup on unmount
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [])

  // Check microphone permission
  const checkMicrophonePermission = async (): Promise<boolean> => {
    logger.info('Checking microphone permissions', { component: 'CallInterface' });
    
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      
      if (result.state === 'granted') {
        logger.info('Microphone permission granted', { 
          permissionState: result.state,
          browser: navigator.userAgent 
        });
        setPermissionGranted(true)
        return true
      } else if (result.state === 'prompt') {
        logger.info('Microphone permission will be prompted', { 
          permissionState: result.state 
        });
        return true
      } else {
        logger.warn('Microphone permission denied', { 
          permissionState: result.state,
          browser: navigator.userAgent 
        });
        setPermissionGranted(false)
        setError('Microphone access denied. Please allow microphone access to use voice calling.')
        return false
      }
    } catch (error) {
      logger.warn('Permission API not supported, will request permission on call start', error, {
        browser: navigator.userAgent,
        component: 'CallInterface'
      });
      return true
    }
  }

  // Real Vapi integration
  const handleStartCall = async () => {
    logger.info('Starting voice call', { 
      language, 
      component: 'CallInterface',
      assistantId: '89b5d633-974a-4b58-a6b5-cdbba8c2726a' 
    });

    try {
      setError(null)
      setCallState('connecting')
      
      // Check microphone permission first
      const hasPermission = await checkMicrophonePermission()
      if (!hasPermission) {
        logger.warn('Call start aborted: microphone permission denied', { language });
        setCallState('error')
        return
      }

      if (!vapiRef.current) {
        throw new Error('Vapi not initialized')
      }
      
      // Start the call with assistant ID and metadata
      logger.info('Initiating Vapi call with assistant', {
        assistantId: '89b5d633-974a-4b58-a6b5-cdbba8c2726a',
        language,
        metadata: {
          source: 'armenius_store_website',
          store_name: 'Armenius Store Cyprus'
        }
      });

      await vapiRef.current.start('89b5d633-974a-4b58-a6b5-cdbba8c2726a', {
        variableValues: {
          language: language,
          source: 'armenius_store_website',
          store_name: 'Armenius Store Cyprus'
        }
      })
      
      setCallState('ringing')
      logger.voiceEvent('call-ringing', { language });
      
    } catch (error: any) {
      logger.voiceError('Voice call failed to start', error, {
        language,
        assistantId: '89b5d633-974a-4b58-a6b5-cdbba8c2726a',
        errorMessage: error.message
      });
      setCallState('error')
      setError(error.message || 'Failed to start voice call')
      setTimeout(() => setCallState('idle'), 5000)
    }
  }

  const handleEndCall = () => {
    logger.info('Ending voice call manually', { 
      language, 
      callState,
      component: 'CallInterface' 
    });

    // End Vapi call if active
    if (vapiRef.current && callState === 'connected') {
      vapiRef.current.stop()
      logger.voiceEvent('call-ended-manually', { language });
    }
    
    setCallState('ended')
    setCallStartTime(null)
    // Reset to idle after showing end screen
    setTimeout(() => setCallState('idle'), 3000)
  }

  const handleMuteToggle = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    logger.voiceEvent('mute-toggle', { 
      muted: newMutedState, 
      language,
      callState 
    });
    
    // Integrate with Vapi mute functionality
    if (vapiRef.current && callState === 'connected') {
      try {
        vapiRef.current.setMuted(newMutedState)
        logger.info('Vapi mute state updated', { muted: newMutedState });
      } catch (error) {
        logger.error('Failed to update Vapi mute state', error);
      }
    }
  }

  const handleVolumeToggle = () => {
    const newVolumeState = !isVolumeMuted
    setIsVolumeMuted(newVolumeState)
    
    logger.voiceEvent('volume-toggle', { 
      volumeMuted: newVolumeState, 
      language,
      callState 
    });
    
    // Note: Vapi doesn't have setVolume method, this is for UI state only
    // Volume control would be handled by browser/system
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-amber-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Store Logo & Info */}
            <div className="flex items-center space-x-4">
              <div className="bg-white p-2 rounded-xl shadow-lg">
                <img 
                  src="https://armenius.com.cy/themes/technostore/assets/img/share_logo.png" 
                  alt="Armenius Store Logo" 
                  className="h-12 w-auto"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  ARMENIUS STORE
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Cyprus' Premier Computer Store
                </p>
              </div>
            </div>

            {/* Store Status */}
            <div className="hidden md:flex items-center space-x-4">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                🟢 Open Now
              </Badge>
              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="size-4" />
                  <span>Mon-Fri: 9AM-7PM</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="size-4" />
                  <span>171 Makarios Ave, Nicosia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Main Call Interface */}
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-amber-600/10 rounded-3xl blur-3xl" />
                <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-amber-200/20">
                  <MariaAvatar 
                    size="xl" 
                    isActive={callState === 'connected'} 
                    className="mb-8"
                  />
                  
                  {callState === 'idle' && (
                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold text-gray-800">
                        {language === 'el' 
                          ? 'Καλωσήρθατε στο Armenius Store' 
                          : 'Welcome to Armenius Store'
                        }
                      </h2>
                      <p className="text-lg text-gray-600 max-w-md mx-auto">
                        {language === 'el'
                          ? 'Καλέστε τη Μαρία για βοήθεια με προϊόντα, παραγγελίες και τεχνική υποστήριξη'
                          : 'Call Maria for help with products, orders, and technical support'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Call Button */}
              <CallButton
                callState={callState}
                onStartCall={handleStartCall}
                onEndCall={handleEndCall}
                size="xl"
                className="w-full max-w-md mx-auto"
              />
            </div>

            {/* Call Status */}
            {callState !== 'idle' && (
              <CallStatus
                callState={callState}
                startTime={callStartTime}
                onMuteToggle={handleMuteToggle}
                onVolumeToggle={handleVolumeToggle}
                isMuted={isMuted}
                isVolumeMuted={isVolumeMuted}
                language={language}
                className="max-w-md mx-auto"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-white to-gray-100 border-t border-amber-200/30 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Building2 className="size-6 text-amber-700" />
              <span className="text-xl font-bold text-gray-800">ARMENIUS STORE CYPRUS</span>
            </div>
            <p className="text-gray-600">
              {language === 'el' 
                ? 'Το κορυφαίο κατάστημα υπολογιστών και ηλεκτρονικών της Κύπρου'
                : "Cyprus' Premier Computer & Electronics Store"
              }
            </p>
            <div className="border-t border-amber-200/30 pt-4">
              <p className="text-sm text-gray-500">
                Powered by{' '}
                <span className="font-semibold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                  Qualia Solutions
                </span>
                {' '}• Professional AI Voice Assistant
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CallInterface
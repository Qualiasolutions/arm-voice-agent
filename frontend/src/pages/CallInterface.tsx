import React, { useState, useEffect, useRef } from 'react'
import Vapi from '@vapi-ai/web'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import MariaAvatar from '@/components/call/MariaAvatar'
import CallButton from '@/components/call/CallButton'
import CallStatus from '@/components/call/CallStatus'
import LanguageSelector from '@/components/call/LanguageSelector'
import { 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  Monitor,
  Cpu,
  HardDrive,
  Gamepad2,
  Wrench,
  ShoppingCart,
  Calendar,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    // Check if Vapi SDK is loaded
    if (typeof window !== 'undefined' && !window.Vapi) {
      logger.error('Vapi SDK not loaded on window object', null, {
        component: 'CallInterface',
        windowVapi: typeof window.Vapi,
        availableGlobals: Object.keys(window).filter(k => k.toLowerCase().includes('vapi'))
      });
      setError('Voice system not available. Please refresh the page.');
      return;
    }

    logger.info('Initializing Vapi voice system', {
      apiKey: '32b555af-1fbc-4b6c-81c0-c940b07c6da2'.substring(0, 8) + '***',
      component: 'CallInterface',
      vapiAvailable: !!window.Vapi
    });
    
    try {
      const vapiInstance = new window.Vapi('32b555af-1fbc-4b6c-81c0-c940b07c6da2')
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

  const services = {
    en: [
      { icon: ShoppingCart, title: 'Product Search', desc: 'Find computers, components & electronics' },
      { icon: Calendar, title: 'Appointments', desc: 'Book service & consultation appointments' },
      { icon: User, title: 'Order Tracking', desc: 'Track your orders and delivery status' },
      { icon: Wrench, title: 'Technical Support', desc: 'Get help with repairs & troubleshooting' }
    ],
    el: [
      { icon: ShoppingCart, title: 'Αναζήτηση Προϊόντων', desc: 'Βρείτε υπολογιστές, εξαρτήματα & ηλεκτρονικά' },
      { icon: Calendar, title: 'Ραντεβού', desc: 'Κλείστε ραντεβού για υπηρεσίες & συμβουλές' },
      { icon: User, title: 'Παρακολούθηση Παραγγελιών', desc: 'Παρακολουθήστε τις παραγγελίες σας' },
      { icon: Wrench, title: 'Τεχνική Υποστήριξη', desc: 'Λάβετε βοήθεια για επισκευές' }
    ]
  }

  const categories = [
    { icon: Monitor, name: 'Gaming PCs', color: 'from-blue-500 to-purple-600' },
    { icon: Cpu, name: 'Components', color: 'from-green-500 to-teal-600' },
    { icon: HardDrive, name: 'Storage', color: 'from-orange-500 to-red-600' },
    { icon: Gamepad2, name: 'Peripherals', color: 'from-purple-500 to-pink-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Store Logo & Info */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl shadow-lg">
                <Building2 className="size-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Store Info */}
          <div className="space-y-6">
            {/* Language Selector */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {language === 'el' ? 'Επιλογή Γλώσσας' : 'Choose Language'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LanguageSelector
                  selectedLanguage={language}
                  onLanguageChange={setLanguage}
                  variant="pills"
                />
              </CardContent>
            </Card>

            {/* Maria's Capabilities */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>🤖</span>
                  <span>
                    {language === 'el' ? 'Υπηρεσίες της Μαρίας' : 'What Maria Can Help With'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {services[language].map((service, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                      <service.icon className="size-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{service.title}</h4>
                      <p className="text-sm text-gray-600">{service.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Product Categories */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {language === 'el' ? 'Κατηγορίες Προϊόντων' : 'Product Categories'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg text-center text-white font-medium transition-transform duration-200 hover:scale-105 cursor-pointer",
                        `bg-gradient-to-r ${category.color}`
                      )}
                    >
                      <category.icon className="size-6 mx-auto mb-2" />
                      <span className="text-sm">{category.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Main Call Interface */}
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-3xl" />
                <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/50">
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

          {/* Right Sidebar - Store Details */}
          <div className="space-y-6">
            {/* Store Hours */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Clock className="size-5" />
                  <span>
                    {language === 'el' ? 'Ωράριο Λειτουργίας' : 'Store Hours'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { day: language === 'el' ? 'Δευτέρα - Παρασκευή' : 'Monday - Friday', hours: '9:00 AM - 7:00 PM' },
                  { day: language === 'el' ? 'Σάββατο' : 'Saturday', hours: '9:00 AM - 2:00 PM' },
                  { day: language === 'el' ? 'Κυριακή' : 'Sunday', hours: language === 'el' ? 'Κλειστά' : 'Closed' }
                ].map((schedule, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="font-medium text-gray-700">{schedule.day}</span>
                    <span className="text-gray-600">{schedule.hours}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {language === 'el' ? 'Επικοινωνία' : 'Contact Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                    <Phone className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">+357 77-111-104</p>
                    <p className="text-sm text-gray-600">
                      {language === 'el' ? 'Κλήσεις & SMS' : 'Calls & SMS'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2 rounded-lg">
                    <MapPin className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">171 Makarios Avenue</p>
                    <p className="text-sm text-gray-600">Nicosia, Cyprus</p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-2 hover:bg-blue-50 hover:border-blue-300"
                >
                  <MapPin className="size-4 mr-2" />
                  {language === 'el' ? 'Χάρτης & Οδηγίες' : 'View Map & Directions'}
                </Button>
              </CardContent>
            </Card>

            {/* Emergency Support */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">
                  {language === 'el' ? 'Επείγουσα Υποστήριξη' : 'Emergency Support'}
                </h3>
                <p className="text-sm opacity-90 mb-4">
                  {language === 'el' 
                    ? 'Για επείγοντα τεχνικά προβλήματα εκτός ωραρίου'
                    : 'For urgent technical issues outside business hours'
                  }
                </p>
                <Button variant="outline" className="bg-white text-orange-600 hover:bg-orange-50 border-white">
                  <Phone className="size-4 mr-2" />
                  +357 99-888-777
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Building2 className="size-6" />
              <span className="text-xl font-bold">ARMENIUS STORE CYPRUS</span>
            </div>
            <p className="text-gray-300">
              {language === 'el' 
                ? 'Το κορυφαίο κατάστημα υπολογιστών και ηλεκτρονικών της Κύπρου'
                : "Cyprus' Premier Computer & Electronics Store"
              }
            </p>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400">
                Powered by{' '}
                <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Qualia Solutions
                </span>
                {' '}• AI Voice Technology by Vapi.ai • v1.0.0
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default CallInterface
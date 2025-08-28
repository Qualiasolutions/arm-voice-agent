import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Phone, 
  Star,
  MessageSquare,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CallStatusProps {
  callState: 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error'
  startTime?: Date
  onMuteToggle?: () => void
  onVolumeToggle?: () => void
  isMuted?: boolean
  isVolumeMuted?: boolean
  language: 'el' | 'en'
  className?: string
}

const CallStatus: React.FC<CallStatusProps> = ({
  callState,
  startTime,
  onMuteToggle,
  onVolumeToggle,
  isMuted = false,
  isVolumeMuted = false,
  language = 'en',
  className
}) => {
  const [duration, setDuration] = useState(0)

  // Update call duration
  useEffect(() => {
    if (callState === 'connected' && startTime) {
      const interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [callState, startTime])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusContent = () => {
    const content = {
      en: {
        connecting: 'Connecting to Kyriakos...',
        ringing: 'Calling Kyriakos...',
        connected: 'Connected with Kyriakos',
        ended: 'Call Ended',
        error: 'Connection Failed'
      },
      el: {
        connecting: 'Σύνδεση με τον Κυριάκο...',
        ringing: 'Καλείται ο Κυριάκος...',
        connected: 'Συνδεδεμένος με τον Κυριάκο',
        ended: 'Η κλήση τερματίστηκε',
        error: 'Σφάλμα σύνδεσης'
      }
    }
    return content[language] || content.en
  }

  const statusTexts = getStatusContent()

  if (callState === 'idle') {
    return null
  }

  return (
    <Card className={cn("w-full max-w-md mx-auto shadow-xl border-0", className)}>
      <CardContent className="p-6 space-y-6">
        {/* Header with status */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className={cn(
              "size-3 rounded-full",
              callState === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              callState === 'ringing' ? 'bg-blue-400 animate-ping' :
              callState === 'connected' ? 'bg-emerald-400 animate-pulse' :
              callState === 'error' ? 'bg-red-400' :
              'bg-gray-400'
            )} />
            <h3 className="font-semibold text-lg text-gray-800">
              {callState === 'connecting' && statusTexts.connecting}
              {callState === 'ringing' && statusTexts.ringing}
              {callState === 'connected' && statusTexts.connected}
              {callState === 'ended' && statusTexts.ended}
              {callState === 'error' && statusTexts.error}
            </h3>
          </div>
          
          <Badge 
            variant={
              callState === 'connected' ? 'default' :
              callState === 'error' ? 'destructive' :
              'secondary'
            }
            className={cn(
              callState === 'connected' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
              callState === 'ringing' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 animate-pulse' :
              ''
            )}
          >
            {callState.charAt(0).toUpperCase() + callState.slice(1)}
          </Badge>
        </div>

        {/* Call Duration (when connected) */}
        {callState === 'connected' && (
          <div className="flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4">
            <Clock className="size-5 text-amber-600" />
            <span className="text-2xl font-mono font-bold text-gray-800">
              {formatDuration(duration)}
            </span>
          </div>
        )}

        {/* Call Controls (when connected) */}
        {callState === 'connected' && (onMuteToggle || onVolumeToggle) && (
          <div className="flex justify-center space-x-4">
            {onMuteToggle && (
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="lg"
                onClick={onMuteToggle}
                className={cn(
                  "flex-1 h-12",
                  isMuted ? "bg-red-500 hover:bg-red-600" : ""
                )}
              >
                {isMuted ? <MicOff className="size-5 mr-2" /> : <Mic className="size-5 mr-2" />}
                {isMuted ? 
                  (language === 'el' ? 'Σίγαση' : 'Muted') : 
                  (language === 'el' ? 'Μικρόφωνο' : 'Mic')
                }
              </Button>
            )}
            
            {onVolumeToggle && (
              <Button
                variant={isVolumeMuted ? "destructive" : "outline"}
                size="lg"
                onClick={onVolumeToggle}
                className={cn(
                  "flex-1 h-12",
                  isVolumeMuted ? "bg-red-500 hover:bg-red-600" : ""
                )}
              >
                {isVolumeMuted ? <VolumeX className="size-5 mr-2" /> : <Volume2 className="size-5 mr-2" />}
                {isVolumeMuted ? 
                  (language === 'el' ? 'Αθόρυβο' : 'Muted') : 
                  (language === 'el' ? 'Ήχος' : 'Volume')
                }
              </Button>
            )}
          </div>
        )}

        {/* Waveform Visualization (when connected) */}
        {callState === 'connected' && (
          <div className="flex items-center justify-center space-x-1 h-16 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-gradient-to-t from-amber-400 to-yellow-400 rounded-full opacity-60",
                  "animate-pulse"
                )}
                style={{
                  width: '4px',
                  height: `${20 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.8 + Math.random() * 0.4}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Connection Quality Indicator */}
        {callState === 'connected' && (
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="size-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {language === 'el' ? 'Ποιότητα σύνδεσης' : 'Connection Quality'}
              </span>
            </div>
            <div className="flex space-x-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full bg-emerald-400",
                    `h-${2 + i}`
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Call Ended Summary */}
        {callState === 'ended' && (
          <div className="text-center space-y-4 pt-2">
            <CheckCircle className="size-12 text-green-500 mx-auto" />
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">
                {language === 'el' ? 'Ευχαριστούμε για την κλήση!' : 'Thank you for calling!'}
              </h4>
              <p className="text-sm text-gray-600">
                {language === 'el' 
                  ? 'Ελπίζουμε ότι ο Κυριάκος σας βοήθησε με την αίτησή σας.'
                  : 'We hope Kyriakos was able to help with your request.'
                }
              </p>
            </div>

            {/* Call Rating */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {language === 'el' ? 'Πώς ήταν η εμπειρία σας;' : 'How was your experience?'}
              </p>
              <div className="flex justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    className="p-1 hover:scale-110 transition-transform duration-200"
                  >
                    <Star className="size-6 text-yellow-400 hover:text-yellow-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {callState === 'error' && (
          <div className="text-center space-y-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <Phone className="size-12 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h4 className="font-semibold text-red-800">
                {language === 'el' ? 'Σφάλμα σύνδεσης' : 'Connection Error'}
              </h4>
              <p className="text-sm text-red-600">
                {language === 'el' 
                  ? 'Παρακαλώ ελέγξτε τη σύνδεσή σας και δοκιμάστε ξανά.'
                  : 'Please check your connection and try again.'
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CallStatus
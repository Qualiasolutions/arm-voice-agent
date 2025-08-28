import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, PhoneCall, PhoneOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CallButtonProps {
  onStartCall: () => void
  onEndCall: () => void
  callState: 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'error'
  disabled?: boolean
  className?: string
  size?: 'default' | 'lg' | 'xl'
}

const CallButton: React.FC<CallButtonProps> = ({
  onStartCall,
  onEndCall,
  callState,
  disabled = false,
  className,
  size = 'xl'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getButtonContent = () => {
    switch (callState) {
      case 'idle':
        return {
          icon: <Phone className="size-8" />,
          text: 'Call Kyriakos Now',
          subtext: 'Start AI-powered assistance',
          onClick: onStartCall,
          variant: 'default' as const,
          className: 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300'
        }
      
      case 'connecting':
        return {
          icon: <Loader2 className="size-8 animate-spin" />,
          text: 'Connecting...',
          subtext: 'Please wait',
          onClick: () => {},
          variant: 'secondary' as const,
          className: 'bg-gradient-to-r from-yellow-400 to-amber-500 cursor-wait'
        }
      
      case 'ringing':
        return {
          icon: <PhoneCall className="size-8 animate-bounce" />,
          text: 'Calling...',
          subtext: 'Kyriakos will answer shortly',
          onClick: onEndCall,
          variant: 'secondary' as const,
          className: 'bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse'
        }
      
      case 'connected':
        return {
          icon: <PhoneOff className="size-8" />,
          text: 'End Call',
          subtext: 'Call in progress',
          onClick: onEndCall,
          variant: 'destructive' as const,
          className: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
        }
      
      case 'error':
        return {
          icon: <Phone className="size-8" />,
          text: 'Try Again',
          subtext: 'Connection failed',
          onClick: onStartCall,
          variant: 'outline' as const,
          className: 'border-red-300 text-red-600 hover:bg-red-50'
        }
      
      default:
        return {
          icon: <Phone className="size-8" />,
          text: 'Call Kyriakos',
          subtext: '',
          onClick: onStartCall,
          variant: 'default' as const,
          className: ''
        }
    }
  }

  const buttonConfig = getButtonContent()

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Main Call Button */}
      <Button
        size="lg"
        variant={buttonConfig.variant}
        disabled={disabled || callState === 'connecting'}
        onClick={buttonConfig.onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative group overflow-hidden",
          // Size variants
          size === 'xl' ? 'h-24 px-12 text-xl font-bold min-w-80' :
          size === 'lg' ? 'h-20 px-10 text-lg font-semibold min-w-72' :
          'h-16 px-8 text-base font-medium min-w-64',
          
          // Base styling
          "rounded-2xl shadow-lg border-0 transition-all duration-500 ease-out",
          "focus:ring-4 focus:ring-blue-500/50 focus:ring-offset-2",
          
          // Custom variant styles
          buttonConfig.className,
          
          // Hover effects
          "hover:shadow-2xl hover:-translate-y-1",
          
          // Disabled state
          disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''
        )}
      >
        {/* Background gradient overlay on hover */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700",
          callState === 'idle' ? 'block' : 'hidden'
        )} />
        
        {/* Button content */}
        <div className="relative z-10 flex items-center space-x-4">
          {/* Icon with pulse animation for idle state */}
          <div className={cn(
            "flex items-center justify-center",
            callState === 'idle' && isHovered ? 'animate-pulse' : ''
          )}>
            {buttonConfig.icon}
          </div>
          
          {/* Text content */}
          <div className="flex flex-col items-start text-left">
            <span className="font-bold leading-none">
              {buttonConfig.text}
            </span>
            {buttonConfig.subtext && (
              <span className={cn(
                "text-sm opacity-90 mt-1 leading-none",
                size === 'xl' ? 'text-base' : 'text-xs'
              )}>
                {buttonConfig.subtext}
              </span>
            )}
          </div>
        </div>

        {/* Ripple effect for active states */}
        {(callState === 'ringing' || callState === 'connected') && (
          <div className="absolute inset-0">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-2xl border-2 border-white/30 animate-ping"
                style={{
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        )}
      </Button>

      {/* Call Status Indicator */}
      {callState !== 'idle' && callState !== 'ended' && (
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
          <div className={cn(
            "size-2 rounded-full",
            callState === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            callState === 'ringing' ? 'bg-green-400 animate-ping' :
            callState === 'connected' ? 'bg-emerald-400 animate-pulse' :
            'bg-red-400'
          )} />
          <span className="text-sm font-medium text-gray-700">
            {callState === 'connecting' && 'Connecting to Kyriakos...'}
            {callState === 'ringing' && 'Ringing...'}
            {callState === 'connected' && 'Connected'}
            {callState === 'error' && 'Connection failed'}
          </span>
        </div>
      )}
    </div>
  )
}

export default CallButton
import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KyriakosAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isActive?: boolean
  className?: string
  showBadge?: boolean
}

const sizeClasses = {
  sm: 'size-12',
  md: 'size-16',
  lg: 'size-24',
  xl: 'size-32'
}

const KyriakosAvatar: React.FC<KyriakosAvatarProps> = ({ 
  size = 'lg', 
  isActive = false, 
  className,
  showBadge = true 
}) => {
  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Avatar with animated ring when active */}
      <div className="relative">
        {/* Animated pulse ring when active */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-600 animate-pulse opacity-75" 
               style={{ 
                 animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                 transform: 'scale(1.1)' 
               }} 
          />
        )}
        
        {/* Outer glow ring */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20",
          isActive ? "animate-spin" : "",
          sizeClasses[size]
        )} style={{ transform: 'scale(1.15)' }} />
        
        {/* Main Avatar */}
        <Avatar className={cn(
          sizeClasses[size],
          "border-4 border-white shadow-2xl bg-gradient-to-br from-amber-500 to-yellow-600 relative z-10"
        )}>
          <AvatarImage 
            src="/kyriakos-avatar.png" 
            alt="Kyriakos AI Assistant"
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white">
            <Bot className={cn(
              size === 'xl' ? 'size-12' :
              size === 'lg' ? 'size-8' :
              size === 'md' ? 'size-6' : 'size-4'
            )} />
          </AvatarFallback>
        </Avatar>

        {/* Sparkle effects when active */}
        {isActive && (
          <>
            <Sparkles className="absolute -top-2 -right-2 size-4 text-yellow-400 animate-bounce" />
            <Sparkles className="absolute -bottom-2 -left-2 size-3 text-amber-400 animate-bounce delay-100" />
          </>
        )}
      </div>

      {/* Status Badge */}
      {showBadge && (
        <div className="mt-4 flex flex-col items-center space-y-2">
          <Badge 
            variant={isActive ? "default" : "secondary"}
            className={cn(
              "transition-all duration-300 font-medium",
              isActive 
                ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg animate-pulse" 
                : "bg-gray-100 text-gray-600"
            )}
          >
            {isActive ? "🟢 Active" : "⚪ Ready"}
          </Badge>
          
          {/* AI Name and Title */}
          <div className="text-center space-y-1">
            <h3 className="font-bold text-2xl bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
              KYRIAKOS
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              AI Shopping Assistant
            </p>
            {isActive && (
              <p className="text-xs text-amber-600 font-semibold animate-pulse">
                Listening...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Floating particles animation */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-60"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default KyriakosAvatar
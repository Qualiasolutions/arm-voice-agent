import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  selectedLanguage: 'el' | 'en'
  onLanguageChange: (language: 'el' | 'en') => void
  className?: string
  variant?: 'default' | 'compact' | 'pills'
}

const languages = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
    greeting: 'Hello! How can Maria help you today?'
  },
  el: {
    code: 'el',
    name: 'Ελληνικά',
    flag: '🇬🇷',
    greeting: 'Γεια σας! Πώς μπορεί η Μαρία να σας βοηθήσει σήμερα;'
  }
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  className,
  variant = 'default'
}) => {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {Object.values(languages).map((lang) => (
          <Button
            key={lang.code}
            variant={selectedLanguage === lang.code ? "default" : "outline"}
            size="sm"
            onClick={() => onLanguageChange(lang.code as 'el' | 'en')}
            className={cn(
              "min-w-[80px] font-medium transition-all duration-200",
              selectedLanguage === lang.code
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                : "hover:bg-gray-50 text-gray-600"
            )}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="text-xs">{lang.code.toUpperCase()}</span>
          </Button>
        ))}
      </div>
    )
  }

  if (variant === 'pills') {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        {Object.values(languages).map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code as 'el' | 'en')}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 border-2",
              selectedLanguage === lang.code
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg transform scale-105"
                : "bg-white/80 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {selectedLanguage === lang.code && (
              <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                Active
              </Badge>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn("space-y-4", className)}>
      {/* Language Toggle */}
      <div className="flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            {Object.values(languages).map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code as 'el' | 'en')}
                className={cn(
                  "flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 font-medium",
                  selectedLanguage === lang.code
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:bg-gray-50 hover:scale-102"
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex flex-col items-start">
                  <span className="text-lg font-semibold">{lang.name}</span>
                  <span className="text-xs opacity-75">
                    {lang.code === 'en' ? 'English' : 'Greek'}
                  </span>
                </div>
                {selectedLanguage === lang.code && (
                  <div className="size-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Message */}
      <div className="text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
          <p className="text-sm text-gray-600 mb-2 font-medium">
            Maria will greet you in:
          </p>
          <p className="text-gray-800 font-medium italic">
            "{languages[selectedLanguage].greeting}"
          </p>
        </div>
      </div>

      {/* Language Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {Object.values(languages).map((lang) => (
          <div
            key={lang.code}
            className={cn(
              "p-4 rounded-lg border-2 transition-all duration-300",
              selectedLanguage === lang.code
                ? "border-blue-200 bg-blue-50 shadow-lg"
                : "border-gray-100 bg-gray-50 opacity-60"
            )}
          >
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-xl">{lang.flag}</span>
              <h3 className="font-semibold text-gray-800">{lang.name}</h3>
              {selectedLanguage === lang.code && (
                <Badge variant="default" className="bg-blue-500">Selected</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {lang.code === 'en' 
                ? 'Full product support, technical assistance, and store information in English.'
                : 'Πλήρης υποστήριξη προϊόντων, τεχνική βοήθεια και πληροφορίες καταστήματος στα ελληνικά.'
              }
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LanguageSelector
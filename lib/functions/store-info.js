import CacheManager from '../cache/index.js';

// Helper function to detect language
function detectLanguage(text) {
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  return greekRegex.test(text) ? 'el' : 'en';
}

// Store information in both languages
const storeInfo = {
  hours: {
    en: {
      weekdays: 'Monday to Friday 9am-7pm',
      saturday: 'Saturday 9am-2pm', 
      sunday: 'Sunday closed',
      full: "We are open Monday to Friday 9am-7pm, Saturday 9am-2pm. We're closed on Sundays."
    },
    el: {
      weekdays: 'Δευτέρα έως Παρασκευή 9π.μ.-7μ.μ.',
      saturday: 'Σάββατο 9π.μ.-2μ.μ.',
      sunday: 'Κυριακή κλειστά',
      full: 'Είμαστε ανοιχτά Δευτέρα έως Παρασκευή 9π.μ.-7μ.μ., Σάββατο 9π.μ.-2μ.μ. Την Κυριακή είμαστε κλειστά.'
    }
  },
  location: {
    en: {
      address: '171 Makarios Avenue, Nicosia, Cyprus',
      directions: "We are located at 171 Makarios Avenue in Nicosia. We're near the city center, easily accessible by car or public transport.",
      parking: 'Free parking is available in front of the store.'
    },
    el: {
      address: 'Λεωφόρος Μακαρίου 171, Λευκωσία, Κύπρος',
      directions: 'Βρισκόμαστε στη Λεωφόρο Μακαρίου 171 στη Λευκωσία. Είμαστε κοντά στο κέντρο της πόλης, εύκολα προσβάσιμοι με αυτοκίνητο ή δημόσια συγκοινωνία.',
      parking: 'Διαθέσιμη δωρεάν στάθμευση μπροστά από το κατάστημα.'
    }
  },
  contact: {
    en: {
      phone: '77-111-104',
      email: 'info@armenius.cy',
      full: 'You can reach us by phone at 77-111-104 or email us at info@armenius.cy'
    },
    el: {
      phone: '77-111-104', 
      email: 'info@armenius.cy',
      full: 'Μπορείτε να μας καλέσετε στο 77-111-104 ή να μας στείλετε email στο info@armenius.cy'
    }
  },
  services: {
    en: {
      repairs: 'Computer and laptop repairs',
      assembly: 'Custom PC building and assembly',
      consultation: 'Technical consultation and advice',
      support: 'After-sales support and warranty service',
      full: 'We offer computer repairs, custom PC building, technical consultation, and comprehensive after-sales support.'
    },
    el: {
      repairs: 'Επισκευές υπολογιστών και laptops',
      assembly: 'Κατασκευή και συναρμολόγηση custom PC',
      consultation: 'Τεχνική συμβουλευτική και υποστήριξη',
      support: 'Υποστήριξη μετά την πώληση και εγγύηση',
      full: 'Προσφέρουμε επισκευές υπολογιστών, κατασκευή custom PC, τεχνική συμβουλευτική και πλήρη υποστήριξη μετά την πώληση.'
    }
  }
};

const storeInfoFunctions = {
  getStoreInfo: {
    ttl: 86400, // Cache for 24 hours (store info rarely changes)
    fallbackResponse: 'You can reach us at 77-111-104 or visit us at 171 Makarios Avenue in Nicosia.',
    
    async execute(params, context) {
      const { info_type, language: requestedLanguage } = params;
      
      // Detect language from context or default to English
      const language = requestedLanguage || 
                     (context.transcript ? detectLanguage(context.transcript) : 'en') ||
                     'en';

      // Check cache first for this specific request
      const cacheKey = `store:${info_type || 'general'}:${language}`;
      const cached = await CacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      let response;

      try {
        if (!info_type || info_type === 'general') {
          // General store information
          response = {
            type: 'general',
            language: language,
            message: language === 'el'
              ? `Καλώς ήρθατε στο Armenius Store! ${storeInfo.hours[language].full} Βρισκόμαστε στη ${storeInfo.location[language].address}. ${storeInfo.contact[language].full}.`
              : `Welcome to Armenius Store! ${storeInfo.hours[language].full} We're located at ${storeInfo.location[language].address}. ${storeInfo.contact[language].full}.`,
            info: {
              hours: storeInfo.hours[language],
              location: storeInfo.location[language],
              contact: storeInfo.contact[language]
            }
          };
        } else if (info_type.includes('hours') || info_type.includes('ώρες') || info_type.includes('ωράριο')) {
          response = {
            type: 'hours',
            language: language,
            message: storeInfo.hours[language].full,
            info: storeInfo.hours[language]
          };
        } else if (info_type.includes('location') || info_type.includes('address') || info_type.includes('τοποθεσία') || info_type.includes('διεύθυνση')) {
          response = {
            type: 'location', 
            language: language,
            message: storeInfo.location[language].directions,
            info: storeInfo.location[language]
          };
        } else if (info_type.includes('contact') || info_type.includes('phone') || info_type.includes('τηλέφωνο') || info_type.includes('επικοινωνία')) {
          response = {
            type: 'contact',
            language: language, 
            message: storeInfo.contact[language].full,
            info: storeInfo.contact[language]
          };
        } else if (info_type.includes('services') || info_type.includes('υπηρεσίες')) {
          response = {
            type: 'services',
            language: language,
            message: storeInfo.services[language].full,
            info: storeInfo.services[language]
          };
        } else {
          // Default to general information
          response = {
            type: 'general',
            language: language,
            message: language === 'el'
              ? `Για γενικές πληροφορίες: ${storeInfo.hours[language].full} Βρισκόμαστε στη ${storeInfo.location[language].address}. Τηλέφωνο: ${storeInfo.contact[language].phone}.`
              : `For general information: ${storeInfo.hours[language].full} We're located at ${storeInfo.location[language].address}. Phone: ${storeInfo.contact[language].phone}.`,
            info: {
              hours: storeInfo.hours[language],
              location: storeInfo.location[language], 
              contact: storeInfo.contact[language]
            }
          };
        }

        // Cache the response
        await CacheManager.set(cacheKey, response, 86400); // 24 hours

        return response;

      } catch (error) {
        console.error('Store info error:', error);
        throw error;
      }
    }
  },

  getDirections: {
    ttl: 86400, // Cache for 24 hours
    fallbackResponse: 'We are located at 171 Makarios Avenue in Nicosia. You can find us near the city center.',
    
    async execute(params, context) {
      const { from_location, transport_method } = params;
      const language = detectLanguage(from_location || '') || 'en';

      try {
        // Basic directions (in real implementation, could integrate with mapping service)
        let directionsMessage;
        
        if (language === 'el') {
          directionsMessage = 'Βρισκόμαστε στη Λεωφόρο Μακαρίου 171 στη Λευκωσία. ';
          
          if (transport_method === 'car' || transport_method === 'αυτοκίνητο') {
            directionsMessage += 'Με αυτοκίνητο: Ακολουθήστε τη Λεωφόρο Μακαρίου προς το κέντρο. Διαθέσιμη δωρεάν στάθμευση.';
          } else if (transport_method === 'bus' || transport_method === 'λεωφορείο') {
            directionsMessage += 'Με λεωφορείο: Πολλές γραμμές περνούν από τη Λεωφόρο Μακαρίου. Στάση κοντά στο κατάστημα.';
          } else {
            directionsMessage += 'Εύκολα προσβάσιμο με αυτοκίνητο ή δημόσια συγκοινωνία. Δωρεάν στάθμευση διαθέσιμη.';
          }
        } else {
          directionsMessage = 'We are located at 171 Makarios Avenue in Nicosia. ';
          
          if (transport_method === 'car') {
            directionsMessage += 'By car: Follow Makarios Avenue towards the city center. Free parking available.';
          } else if (transport_method === 'bus') {
            directionsMessage += 'By bus: Multiple bus lines pass through Makarios Avenue. Bus stop near the store.';
          } else {
            directionsMessage += 'Easily accessible by car or public transport. Free parking available in front of the store.';
          }
        }

        return {
          type: 'directions',
          language: language,
          message: directionsMessage,
          location: storeInfo.location[language],
          googleMapsLink: 'https://maps.google.com/?q=171+Makarios+Avenue+Nicosia+Cyprus'
        };

      } catch (error) {
        console.error('Directions error:', error);
        throw error;
      }
    }
  }
};

export default storeInfoFunctions;
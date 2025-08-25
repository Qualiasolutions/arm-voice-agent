import { db } from '../supabase/client.js';

// Helper function to detect language
function detectLanguage(text) {
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  return greekRegex.test(text) ? 'el' : 'en';
}

// Helper function to format date/time for Cyprus timezone
function formatDateTime(date, language = 'en') {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Nicosia' // Cyprus timezone
  };

  return date.toLocaleDateString(language === 'el' ? 'el-GR' : 'en-GB', options);
}

// Parse natural language date/time
function parseDateTime(dateStr, language = 'en') {
  const now = new Date();
  const lowerStr = dateStr.toLowerCase();

  // Handle relative dates
  if (lowerStr.includes('today') || lowerStr.includes('σήμερα')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0); // Default to 10 AM
  }
  
  if (lowerStr.includes('tomorrow') || lowerStr.includes('αύριο')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0);
  }

  // Try to parse as ISO date or common formats
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Default to next business day at 10 AM
  const nextBusinessDay = new Date(now);
  nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
  while (nextBusinessDay.getDay() === 0 || nextBusinessDay.getDay() === 6) {
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
  }
  nextBusinessDay.setHours(10, 0, 0, 0);
  
  return nextBusinessDay;
}

// Validate business hours
function isBusinessHours(date) {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = date.getHours();
  
  // Monday to Friday: 9 AM to 7 PM
  if (day >= 1 && day <= 5) {
    return hours >= 9 && hours < 19;
  }
  
  // Saturday: 9 AM to 2 PM
  if (day === 6) {
    return hours >= 9 && hours < 14;
  }
  
  // Sunday: Closed
  return false;
}

const appointmentFunctions = {
  bookAppointment: {
    ttl: 0, // Don't cache appointments
    fallbackResponse: "I'm having trouble with our booking system. Please call us directly at 77-111-104 to schedule your appointment.",
    
    async execute(params, context) {
      const { service_type, preferred_date, customer_phone, customer_name } = params;
      const customerProfile = context.customerProfile;
      const customerContext = context.customerContext || {};
      
      // Use customer profile for streamlined booking
      const finalCustomerPhone = customer_phone || context.customerNumber;
      const finalCustomerName = customer_name || customerProfile?.name || 'Phone Customer';
      const language = customerProfile?.preferredLanguage || detectLanguage(finalCustomerName || preferred_date || '');
      
      if (!service_type || !preferred_date) {
        const missingFields = [];
        if (!service_type) missingFields.push(language === 'el' ? 'τύπο υπηρεσίας' : 'service type');
        if (!preferred_date) missingFields.push(language === 'el' ? 'ημερομηνία' : 'preferred date');
        
        let message = language === 'el'
          ? `Χρειάζομαι ${missingFields.join(' και ')} για να κλείσω το ραντεβού σας.`
          : `I need the ${missingFields.join(' and ')} to book your appointment.`;
          
        if (customerProfile && customerProfile.isVipCustomer) {
          message += language === 'el'
            ? ' Ως VIP πελάτης, μπορώ να σας προσφέρω προτεραιότητα στον προγραμματισμό.'
            : ' As a VIP customer, I can offer you priority scheduling.';
        }
        
        return {
          booked: false,
          message: message,
          requiresInput: true,
          customerInfo: {
            name: finalCustomerName,
            phone: finalCustomerPhone,
            isVip: customerProfile?.isVipCustomer || false
          }
        };
      }
      
      if (!finalCustomerPhone) {
        return {
          booked: false,
          message: language === 'el'
            ? 'Χρειάζομαι τον αριθμό τηλεφώνου σας για επιβεβαίωση του ραντεβού.'
            : 'I need your phone number to confirm the appointment.',
          requiresInput: true
        };
      }

      try {
        // Parse the preferred date
        const appointmentDate = parseDateTime(preferred_date, language);
        
        // Check if the date is in business hours
        if (!isBusinessHours(appointmentDate)) {
          const alternatives = await getAlternativeSlots(appointmentDate, service_type);
          return {
            booked: false,
            message: language === 'el'
              ? `Η ώρα που ζητήσατε (${formatDateTime(appointmentDate, language)}) δεν είναι διαθέσιμη. Έχω διαθεσιμότητα στις ${alternatives.slice(0, 2).map(d => formatDateTime(d, language)).join(' ή ')}. Ποια σας βολεύει περισσότερο;`
              : `The time you requested (${formatDateTime(appointmentDate, language)}) is not available. I have availability at ${alternatives.slice(0, 2).map(d => formatDateTime(d, language)).join(' or ')}. Which works better for you?`,
            alternatives: alternatives.slice(0, 3)
          };
        }

        // Check availability
        const isAvailable = await db.checkAvailability(appointmentDate);
        
        if (!isAvailable) {
          const alternatives = await db.getAvailableSlots(appointmentDate, service_type);
          return {
            booked: false,
            message: language === 'el'
              ? `Η ${formatDateTime(appointmentDate, language)} είναι κλεισμένη. Έχω διαθεσιμότητα στις ${alternatives.slice(0, 2).map(d => formatDateTime(d, language)).join(' ή ')}. Ποια σας βολεύει;`
              : `${formatDateTime(appointmentDate, language)} is already booked. I have availability at ${alternatives.slice(0, 2).map(d => formatDateTime(d, language)).join(' or ')}. Which would you prefer?`,
            alternatives: alternatives.slice(0, 3)
          };
        }

        // Create appointment with customer context
        const appointmentData = {
          service_type,
          appointment_time: appointmentDate.toISOString(),
          customer_phone: finalCustomerPhone,
          customer_name: finalCustomerName,
          customer_email: customerProfile?.email,
          status: 'confirmed',
          created_via: 'voice_ai',
          conversation_id: context.conversationId,
          notes: customerProfile?.isVipCustomer ? 'VIP Customer - Priority Service' : null
        };

        const appointment = await db.createAppointment(appointmentData);

        // TODO: Send SMS confirmation (would implement with Twilio)
        // await sendSMSConfirmation(finalCustomerPhone, appointment);

        let message;
        if (customerProfile?.isVipCustomer) {
          message = language === 'el'
            ? `Τέλεια ${finalCustomerName}! Κλείσαμε το VIP ραντεβού σας για ${service_type} στις ${formatDateTime(appointmentDate, language)}. Ως VIP πελάτης, θα έχετε προτεραιότητα στην εξυπηρέτηση. Κωδικός ραντεβού: ${appointment.id.slice(-8)}.`
            : `Perfect ${finalCustomerName}! I've booked your VIP ${service_type} appointment for ${formatDateTime(appointmentDate, language)}. As a VIP customer, you'll receive priority service. Your appointment reference is ${appointment.id.slice(-8)}.`;
        } else if (customerProfile) {
          message = language === 'el'
            ? `Τέλεια ${finalCustomerName}! Κλείσαμε το ραντεβού σας για ${service_type} στις ${formatDateTime(appointmentDate, language)}. Κωδικός ραντεβού: ${appointment.id.slice(-8)}.`
            : `Perfect ${finalCustomerName}! I've booked your ${service_type} appointment for ${formatDateTime(appointmentDate, language)}. Your appointment reference is ${appointment.id.slice(-8)}.`;
        } else {
          message = language === 'el'
            ? `Τέλεια! Κλείσαμε το ραντεβού σας για ${service_type} στις ${formatDateTime(appointmentDate, language)}. Θα λάβετε SMS επιβεβαίωση σύντομα. Κωδικός ραντεβού: ${appointment.id.slice(-8)}.`
            : `Perfect! I've booked your ${service_type} appointment for ${formatDateTime(appointmentDate, language)}. You'll receive an SMS confirmation shortly. Your appointment reference is ${appointment.id.slice(-8)}.`;
        }

        return {
          booked: true,
          appointment: {
            id: appointment.id,
            serviceType: service_type,
            dateTime: formatDateTime(appointmentDate, language),
            customerName: finalCustomerName,
            customerPhone: finalCustomerPhone,
            isVip: customerProfile?.isVipCustomer || false
          },
          message: message,
          language: language
        };

      } catch (error) {
        console.error('Appointment booking error:', error);
        throw error;
      }
    }
  },

  checkAppointment: {
    ttl: 60, // Cache for 1 minute
    fallbackResponse: "I'm having trouble checking appointments right now. Please call us at 77-111-104.",
    
    async execute(params, context) {
      const { customer_phone, appointment_reference } = params;
      
      if (!customer_phone && !appointment_reference) {
        return {
          found: false,
          message: 'I need either your phone number or appointment reference to check your appointment.',
          requiresInput: true
        };
      }

      const language = detectLanguage(params.customer_phone || '');

      try {
        let query = db.supabase
          .from('appointments')
          .select('*')
          .in('status', ['confirmed', 'pending']);

        if (appointment_reference) {
          query = query.ilike('id', `%${appointment_reference}%`);
        } else if (customer_phone) {
          query = query.eq('customer_phone', customer_phone);
        }

        const { data: appointments, error } = await query
          .order('appointment_time', { ascending: true })
          .limit(5);

        if (error) throw error;

        if (!appointments || appointments.length === 0) {
          return {
            found: false,
            message: language === 'el'
              ? 'Δεν βρήκα κανένα ραντεβού με αυτά τα στοιχεία. Μήπως θέλετε να κλείσετε ένα νέο ραντεβού;'
              : "I couldn't find any appointments with those details. Would you like to book a new appointment?"
          };
        }

        if (appointments.length === 1) {
          const appointment = appointments[0];
          const appointmentDate = new Date(appointment.appointment_time);
          
          return {
            found: true,
            appointment: {
              id: appointment.id,
              serviceType: appointment.service_type,
              dateTime: formatDateTime(appointmentDate, language),
              status: appointment.status,
              customerName: appointment.customer_name
            },
            message: language === 'el'
              ? `Βρήκα το ραντεβού σας για ${appointment.service_type} στις ${formatDateTime(appointmentDate, language)}. Η κατάσταση είναι "${appointment.status}". Χρειάζεστε κάτι άλλο;`
              : `I found your ${appointment.service_type} appointment on ${formatDateTime(appointmentDate, language)}. The status is "${appointment.status}". Do you need anything else?`
          };
        }

        // Multiple appointments
        const appointmentList = appointments.map((apt, index) => {
          const date = new Date(apt.appointment_time);
          return `${index + 1}. ${apt.service_type} on ${formatDateTime(date, language)} (${apt.status})`;
        }).join('\n');

        return {
          found: true,
          multipleAppointments: true,
          appointments: appointments,
          message: language === 'el'
            ? `Βρήκα ${appointments.length} ραντεβού:\n${appointmentList}\nΓια ποιο θέλετε περισσότερες πληροφορίες;`
            : `I found ${appointments.length} appointments:\n${appointmentList}\nWhich one would you like more information about?`
        };

      } catch (error) {
        console.error('Appointment check error:', error);
        throw error;
      }
    }
  }
};

// Helper function to get alternative appointment slots
async function getAlternativeSlots(requestedDate, serviceType, count = 5) {
  const alternatives = [];
  const startDate = new Date(requestedDate);
  
  // Look for slots in the next 14 days
  for (let i = 1; i <= 14 && alternatives.length < count; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);
    
    // Try different times during business hours
    const times = [9, 10, 11, 14, 15, 16, 17]; // Business hours
    
    for (const hour of times) {
      if (alternatives.length >= count) break;
      
      const slotTime = new Date(checkDate);
      slotTime.setHours(hour, 0, 0, 0);
      
      if (isBusinessHours(slotTime)) {
        const available = await db.checkAvailability(slotTime);
        if (available) {
          alternatives.push(slotTime);
        }
      }
    }
  }
  
  return alternatives;
}

export default appointmentFunctions;
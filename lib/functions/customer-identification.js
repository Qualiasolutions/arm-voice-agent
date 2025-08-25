// Customer Identification Service
// Identifies callers using phone number and provides personalized context

import CacheManager from '../cache/index.js';

class CustomerIdentification {
  constructor(db) {
    this.db = db;
    this.cachePrefix = 'customer_profile';
    this.cacheTTL = 300; // 5 minutes
  }

  /**
   * Identify customer by phone number and return profile with order history
   */
  async identifyCustomer(phoneNumber, callContext = {}) {
    if (!phoneNumber) {
      return null;
    }

    // Normalize phone number for consistent lookup
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const cacheKey = `${this.cachePrefix}:${normalizedPhone}`;

    try {
      // Check cache first
      let customerProfile = await CacheManager.get(cacheKey);
      
      if (!customerProfile) {
        // Lookup customer in database
        customerProfile = await this.lookupCustomerProfile(normalizedPhone);
        
        if (customerProfile) {
          // Cache the profile for future calls
          await CacheManager.set(cacheKey, customerProfile, this.cacheTTL);
        }
      }

      if (customerProfile) {
        // Track customer identification event
        await this.db.trackEvent('customer_identified', {
          customerName: customerProfile.name,
          phoneNumber: normalizedPhone,
          totalOrders: customerProfile.orderHistory.length,
          lastOrderDate: customerProfile.lastOrderDate,
          totalSpent: customerProfile.totalSpent
        }, callContext.conversationId);

        return customerProfile;
      }

    } catch (error) {
      console.error('Error identifying customer:', error);
      
      // Track identification failure
      await this.db.trackEvent('customer_identification_failed', {
        phoneNumber: normalizedPhone,
        error: error.message
      }, callContext.conversationId);
    }

    return null;
  }

  /**
   * Lookup customer profile from orders database
   */
  async lookupCustomerProfile(phoneNumber) {
    // Try exact match first
    let customer = await this.db.getCustomerByPhone(phoneNumber);
    
    // If no exact match, try without formatting
    if (!customer && phoneNumber) {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      // Try different common formats for Cyprus numbers
      const formats = [
        phoneNumber, // Original
        `+357-99-${digitsOnly.slice(-6)}`, // +357-99-123456
        `+35799${digitsOnly.slice(-6)}`, // +35799123456
        digitsOnly, // Raw digits
        digitsOnly.slice(-8) // Last 8 digits
      ];
      
      for (const format of formats) {
        customer = await this.db.getCustomerByPhone(format);
        if (customer) {
          console.log(`Customer found with format: ${format}`);
          break;
        }
      }
    }
    
    if (!customer) {
      return null;
    }

    // Get customer's order history
    const orderHistory = await this.db.getCustomerOrderHistory(phoneNumber);
    
    // Build comprehensive customer profile
    const profile = {
      name: customer.customer_name,
      email: customer.customer_email,
      phoneNumber: phoneNumber,
      totalOrders: customer.total_orders || 0,
      totalSpent: parseFloat(customer.total_spent || 0),
      averageOrderValue: parseFloat(customer.average_order_value || 0),
      lastOrderDate: customer.last_order_date,
      preferredLanguage: this.detectPreferredLanguage(customer.customer_name),
      orderHistory: orderHistory.slice(0, 5), // Last 5 orders
      isVipCustomer: this.determineVipStatus(customer),
      preferences: this.extractCustomerPreferences(orderHistory)
    };

    return profile;
  }

  /**
   * Generate personalized greeting based on customer profile
   */
  generatePersonalizedGreeting(customerProfile, language = 'en') {
    if (!customerProfile) {
      return null;
    }

    const { name, totalOrders, lastOrderDate, isVipCustomer } = customerProfile;
    const firstName = this.extractFirstName(name);

    if (language === 'el') {
      // Greek personalized greetings
      if (isVipCustomer) {
        return `Γεια σας ${firstName}! Χαίρομαι που σας ακούω πάλι. Είστε ένας από τους πιο εκτιμημένους πελάτες μας στο Armenius Store. Πώς μπορώ να σας βοηθήσω σήμερα;`;
      } else if (totalOrders > 1) {
        return `Καλώς ήρθατε πίσω ${firstName}! Βλέπω ότι είχατε παραγγελία μαζί μας ${this.formatLastOrderDate(lastOrderDate, 'el')}. Πώς μπορώ να σας εξυπηρετήσω σήμερα;`;
      } else {
        return `Γεια σας ${firstName}! Χαίρομαι που επικοινωνείτε μαζί μας στο Armenius Store. Πώς μπορώ να σας βοηθήσω σήμερα;`;
      }
    } else {
      // English personalized greetings
      if (isVipCustomer) {
        return `Hello ${firstName}! Great to hear from you again. You're one of our most valued customers at Armenius Store. How can I assist you today?`;
      } else if (totalOrders > 1) {
        return `Welcome back ${firstName}! I see you placed an order with us ${this.formatLastOrderDate(lastOrderDate, 'en')}. How can I help you today?`;
      } else {
        return `Hello ${firstName}! Thank you for contacting Armenius Store. How can I assist you today?`;
      }
    }
  }

  /**
   * Get customer context for enhanced function responses
   */
  getCustomerContext(customerProfile) {
    if (!customerProfile) {
      return {};
    }

    return {
      name: customerProfile.name,
      isReturningCustomer: customerProfile.totalOrders > 0,
      isVipCustomer: customerProfile.isVipCustomer,
      preferredLanguage: customerProfile.preferredLanguage,
      recentOrders: customerProfile.orderHistory.slice(0, 3),
      preferences: customerProfile.preferences,
      canSkipVerification: customerProfile.totalOrders > 2 // Trusted customer
    };
  }

  /**
   * Helper methods
   */
  normalizePhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters and normalize Cyprus numbers
    let normalized = phoneNumber.replace(/\D/g, '');
    
    // Handle different Cyprus number formats
    if (normalized.startsWith('357')) {
      return '+357-' + normalized.slice(3, 5) + '-' + normalized.slice(5);
    } else if (normalized.startsWith('99') && normalized.length === 8) {
      return '+357-' + normalized.slice(0, 2) + '-' + normalized.slice(2);
    } else if (normalized.length === 8) {
      return '+357-' + normalized.slice(0, 2) + '-' + normalized.slice(2);
    }
    
    // Return original if can't normalize
    return phoneNumber;
  }

  extractFirstName(fullName) {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  }

  detectPreferredLanguage(name) {
    // Simple heuristic: if name contains Greek characters, prefer Greek
    const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
    return greekRegex.test(name) ? 'el' : 'en';
  }

  determineVipStatus(customer) {
    // VIP customers: 5+ orders OR spent over €1000
    return (customer.total_orders >= 5) || (parseFloat(customer.total_spent || 0) >= 1000);
  }

  extractCustomerPreferences(orderHistory) {
    const preferences = {
      categories: {},
      brands: {},
      priceRange: 'mid'
    };

    if (!orderHistory || orderHistory.length === 0) {
      return preferences;
    }

    // Analyze order patterns to extract preferences
    orderHistory.forEach(order => {
      if (order.products) {
        try {
          const products = JSON.parse(order.products);
          products.forEach(product => {
            // Track category preferences
            const category = this.inferCategory(product.name);
            preferences.categories[category] = (preferences.categories[category] || 0) + 1;
            
            // Track brand preferences  
            const brand = this.inferBrand(product.name);
            if (brand) {
              preferences.brands[brand] = (preferences.brands[brand] || 0) + 1;
            }
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    return preferences;
  }

  inferCategory(productName) {
    const name = productName.toLowerCase();
    if (name.includes('laptop') || name.includes('notebook')) return 'laptops';
    if (name.includes('mouse') || name.includes('keyboard')) return 'accessories';
    if (name.includes('headphone') || name.includes('speaker')) return 'audio';
    if (name.includes('monitor') || name.includes('display')) return 'monitors';
    if (name.includes('gaming')) return 'gaming';
    return 'general';
  }

  inferBrand(productName) {
    const name = productName.toLowerCase();
    const brands = ['asus', 'msi', 'corsair', 'logitech', 'razer', 'amd', 'nvidia', 'intel'];
    return brands.find(brand => name.includes(brand)) || null;
  }

  formatLastOrderDate(dateString, language = 'en') {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (language === 'el') {
      if (diffDays === 0) return 'σήμερα';
      if (diffDays === 1) return 'χθες';
      if (diffDays < 7) return `πριν ${diffDays} μέρες`;
      if (diffDays < 30) return `πριν ${Math.floor(diffDays / 7)} εβδομάδες`;
      return `πριν ${Math.floor(diffDays / 30)} μήνες`;
    } else {
      if (diffDays === 0) return 'today';
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    }
  }
}

export default CustomerIdentification;
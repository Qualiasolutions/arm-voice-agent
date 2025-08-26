/**
 * Fallback database client for handling missing environment variables gracefully
 * This ensures the system can still function even if database credentials are not configured
 */

const FALLBACK_DATA = {
  products: [
    {
      id: 1,
      name: 'RTX 4090 Graphics Card',
      brand: 'NVIDIA',
      category: 'Graphics Cards',
      price: 1899.00,
      stock_quantity: 5,
      sku: 'RTX4090-24GB',
      description: 'High-performance graphics card for gaming and content creation'
    },
    {
      id: 2,
      name: 'Intel Core i9-13900K',
      brand: 'Intel',
      category: 'Processors',
      price: 649.99,
      stock_quantity: 12,
      sku: 'I9-13900K',
      description: 'Top-tier gaming and productivity processor'
    },
    {
      id: 3,
      name: 'Gaming Laptop ASUS ROG',
      brand: 'ASUS',
      category: 'Laptops',
      price: 2299.99,
      stock_quantity: 3,
      sku: 'ASUS-ROG-G15',
      description: 'High-performance gaming laptop with RTX graphics'
    }
  ],
  
  appointments: [],
  orders: [],
  customers: []
};

// Fallback database operations
export const fallbackDb = {
  async searchProducts(query, limit = 10) {
    const searchTerm = query.toLowerCase();
    return FALLBACK_DATA.products
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      )
      .slice(0, limit);
  },

  async searchProductsByFTS(query, limit = 10) {
    return this.searchProducts(query, limit);
  },

  async getProductBySkuOrName(identifier) {
    const searchTerm = identifier.toLowerCase();
    return FALLBACK_DATA.products.find(product =>
      product.sku.toLowerCase() === searchTerm ||
      product.name.toLowerCase().includes(searchTerm)
    ) || null;
  },

  async createConversation(vapiCallId, phoneNumber, metadata = {}) {
    console.warn('Database not available, conversation not saved:', { vapiCallId, phoneNumber });
    return {
      id: Date.now(),
      vapi_call_id: vapiCallId,
      phone_number: phoneNumber,
      metadata,
      created_at: new Date().toISOString()
    };
  },

  async updateConversation(vapiCallId, updates) {
    console.warn('Database not available, conversation not updated:', { vapiCallId, updates });
    return { vapi_call_id: vapiCallId, ...updates };
  },

  async checkAvailability(appointmentTime, duration = 30) {
    // In fallback mode, assume all slots are available
    return true;
  },

  async createAppointment(appointmentData) {
    console.warn('Database not available, appointment not saved:', appointmentData);
    return {
      id: Date.now(),
      ...appointmentData,
      status: 'pending',
      created_at: new Date().toISOString()
    };
  },

  async getAvailableSlots(date, serviceType, duration = 30) {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour += 2) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, 0, 0, 0);
      slots.push(slotTime);
    }
    
    return slots.slice(0, 5); // Return 5 available slots
  },

  async trackEvent(eventType, properties = {}, conversationId = null) {
    console.log('Event tracked (fallback mode):', { eventType, properties, conversationId });
  },

  async updateCallCost(vapiCallId, cost, costBreakdown = {}) {
    console.log('Call cost updated (fallback mode):', { vapiCallId, cost, costBreakdown });
    return { vapi_call_id: vapiCallId, cost, metadata: { costs: costBreakdown } };
  },

  async getCustomerByPhone(phoneNumber) {
    // Return a sample customer for demo purposes
    return {
      customer_name: 'Demo Customer',
      customer_email: 'demo@armenius.com.cy',
      phone_number: phoneNumber,
      total_orders: 2,
      total_spent: 1599.98,
      average_order_value: 799.99,
      last_order_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    };
  },

  async getCustomerOrderHistory(phoneNumber, limit = 10) {
    return [
      {
        id: 1,
        order_number: 'ORD-2024-001',
        customer_name: 'Demo Customer',
        phone_number: phoneNumber,
        total: 799.99,
        status: 'delivered',
        order_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  },

  async searchCustomersByName(name) {
    return [
      {
        customer_name: 'Demo Customer',
        customer_email: 'demo@armenius.com.cy',
        phone_number: '+357 99 123456'
      }
    ];
  }
};

export default fallbackDb;
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for public operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Admin client for server operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database helpers
export const db = {
  // Product queries
  async searchProducts(query, limit = 10) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`)
      .gt('stock_quantity', 0)
      .order('stock_quantity', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async searchProductsByFTS(query, limit = 10) {
    const { data, error } = await supabase
      .rpc('search_products_fts', { 
        search_query: query,
        result_limit: limit 
      });

    if (error) throw error;
    return data;
  },

  async getProductBySkuOrName(identifier) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`sku.eq.${identifier},name.ilike.%${identifier}%`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Conversation tracking
  async createConversation(vapiCallId, phoneNumber, metadata = {}) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        vapi_call_id: vapiCallId,
        phone_number: phoneNumber,
        metadata: metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateConversation(vapiCallId, updates) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('vapi_call_id', vapiCallId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Appointments
  async checkAvailability(appointmentTime, duration = 30) {
    const endTime = new Date(appointmentTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .gte('appointment_time', appointmentTime.toISOString())
      .lt('appointment_time', endTime.toISOString())
      .in('status', ['confirmed', 'pending'])
      .limit(1);

    if (error) throw error;
    return data.length === 0;
  },

  async createAppointment(appointmentData) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAvailableSlots(date, serviceType, duration = 30) {
    // This would implement business logic for available time slots
    // For now, return sample slots
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += duration) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        const available = await this.checkAvailability(slotTime, duration);
        if (available) {
          slots.push(slotTime);
        }
      }
    }
    
    return slots.slice(0, 5); // Return first 5 available slots
  },

  // Analytics
  async trackEvent(eventType, properties = {}, conversationId = null) {
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: eventType,
        conversation_id: conversationId,
        properties: properties
      });

    if (error) {
      console.error('Failed to track event:', error);
    }
  },

  // Cost tracking
  async updateCallCost(vapiCallId, cost, costBreakdown = {}) {
    return this.updateConversation(vapiCallId, {
      cost: cost,
      metadata: { costs: costBreakdown }
    });
  },

  // Customer identification methods
  async getCustomerByPhone(phoneNumber) {
    // First try to get customer from the view, fallback to direct orders query
    const { data, error } = await supabase
      .from('customer_order_summary')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    // If view doesn't exist or fails, query orders directly
    if (error) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('customer_name, customer_email, phone_number, total, order_date')
        .eq('phone_number', phoneNumber)
        .order('order_date', { ascending: false })
        .limit(1);

      if (orderError) throw orderError;
      
      if (orderData && orderData.length > 0) {
        const customer = orderData[0];
        
        // Calculate aggregated data manually
        const { data: allOrders } = await supabase
          .from('orders')
          .select('total, order_date')
          .eq('phone_number', phoneNumber);
        
        const totalOrders = allOrders?.length || 1;
        const totalSpent = allOrders?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || customer.total;
        
        return {
          customer_name: customer.customer_name,
          customer_email: customer.customer_email,
          phone_number: customer.phone_number,
          total_orders: totalOrders,
          total_spent: totalSpent,
          average_order_value: totalSpent / totalOrders,
          last_order_date: customer.order_date
        };
      }
      return null;
    }

    return data;
  },

  async getCustomerOrderHistory(phoneNumber, limit = 10) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('order_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async searchCustomersByName(name) {
    const { data, error } = await supabase
      .from('orders')
      .select('customer_name, customer_email, phone_number')
      .ilike('customer_name', `%${name}%`)
      .group('customer_name, customer_email, phone_number')
      .limit(10);

    if (error) throw error;
    return data || [];
  }
};

export default supabase;
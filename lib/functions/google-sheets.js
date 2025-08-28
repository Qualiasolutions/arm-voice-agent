import { google } from 'googleapis';

/**
 * Google Sheets integration for order tracking, customer management, and analytics
 */
export default {
  /**
   * Get product information from Google Sheets
   * This matches the Vapi tool configuration for getProductFromSheet
   */
  getProductFromSheet: {
    ttl: 300,
    fallbackResponse: "I'm having trouble accessing our product database right now. Please call us at 77-111-104 for product information.",
    cacheable: true,

    async execute(parameters, callContext) {
      const { product_name, product_sku, keyword } = parameters;
      const searchTerm = product_name || product_sku || keyword;
      
      if (!searchTerm) {
        return {
          message: "Please provide a product name, SKU, or keyword to search for.",
          found: false
        };
      }
      
      try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '15DE0x5rhzZK3TJ1ZaWLP4MQ46O937HEd0AHPIPNaoFk';
        const range = process.env.GOOGLE_SHEETS_RANGE || 'armenius_products_rich_complete_2016!A:AA';
        
        console.log(`Searching Google Sheets for: ${searchTerm}`);
        
        // Get all product data
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) {
          return {
            message: "No products found in our database.",
            found: false
          };
        }

        // Get headers (first row)
        const headers = rows[0].map(header => header?.toLowerCase().trim());
        
        // Find relevant columns
        const nameCol = findColumnIndex(headers, ['name', 'product_name', 'title', 'description']);
        const skuCol = findColumnIndex(headers, ['sku', 'code', 'product_code', 'id']);
        const priceCol = findColumnIndex(headers, ['price', 'cost', 'euro', '€']);
        const stockCol = findColumnIndex(headers, ['stock', 'quantity', 'available', 'in_stock']);
        const categoryCol = findColumnIndex(headers, ['category', 'type', 'class']);
        const brandCol = findColumnIndex(headers, ['brand', 'manufacturer', 'make']);
        
        console.log(`Column mapping - Name: ${nameCol}, SKU: ${skuCol}, Price: ${priceCol}, Stock: ${stockCol}`);

        // Search for products (case-insensitive)
        const searchTermLower = searchTerm.toLowerCase();
        const matchingProducts = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const productName = row[nameCol] || '';
          const productSku = row[skuCol] || '';
          const productCategory = row[categoryCol] || '';
          const productBrand = row[brandCol] || '';
          
          // Check if search term matches name, SKU, category, or brand
          const matchesName = productName.toLowerCase().includes(searchTermLower);
          const matchesSku = productSku.toLowerCase().includes(searchTermLower);
          const matchesCategory = productCategory.toLowerCase().includes(searchTermLower);
          const matchesBrand = productBrand.toLowerCase().includes(searchTermLower);
          
          if (matchesName || matchesSku || matchesCategory || matchesBrand) {
            const product = {
              name: productName,
              sku: productSku,
              price: formatPrice(row[priceCol]),
              stock: formatStock(row[stockCol]),
              category: productCategory,
              brand: productBrand,
              available: isProductAvailable(row[stockCol])
            };
            
            matchingProducts.push(product);
            
            // Limit to 5 products to avoid response overflow
            if (matchingProducts.length >= 5) break;
          }
        }

        if (matchingProducts.length === 0) {
          return {
            message: `No products found matching "${searchTerm}". Please try a different search term or call us at 77-111-104.`,
            found: false,
            searchTerm
          };
        }

        // Format response based on language preference
        const language = callContext.customerProfile?.preferredLanguage || 'en';
        const message = formatProductSearchResults(matchingProducts, searchTerm, language);

        return {
          message,
          found: true,
          products: matchingProducts,
          count: matchingProducts.length,
          searchTerm
        };

      } catch (error) {
        console.error('Google Sheets product search error:', error);
        throw error;
      }
    }
  },

  /**
   * Log order information to Google Sheets
   */
  logOrderToSheet: {
    ttl: 0, // Don't cache sheet writes
    fallbackResponse: "I've recorded your order information. Our team will contact you soon.",
    cacheable: false,

    async execute(parameters, callContext) {
      const { orderData, sheetName = 'Orders' } = parameters;
      
      try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        
        if (!spreadsheetId) {
          throw new Error('Google Sheets spreadsheet ID not configured');
        }

        // Prepare row data
        const rowData = [
          new Date().toISOString(),
          callContext.customerProfile?.name || orderData.customerName,
          callContext.customerNumber || orderData.customerPhone,
          orderData.orderNumber || generateOrderNumber(),
          orderData.products || JSON.stringify(orderData.items),
          orderData.totalAmount || '',
          orderData.status || 'Pending',
          callContext.callId
        ];

        // Append to sheet
        const response = await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheetName}!A:H`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [rowData]
          }
        });

        return {
          message: `Order logged successfully. Reference: ${orderData.orderNumber}`,
          orderNumber: orderData.orderNumber,
          sheetUpdated: true,
          updatedRange: response.data.updates.updatedRange
        };

      } catch (error) {
        console.error('Google Sheets logging error:', error);
        throw error;
      }
    }
  },

  /**
   * Log customer interaction to Google Sheets for analytics
   */
  logCustomerInteraction: {
    ttl: 0,
    fallbackResponse: "I've recorded our conversation for quality purposes.",
    cacheable: false,

    async execute(parameters, callContext) {
      const { interaction, sentiment = 'neutral' } = parameters;
      
      try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_ANALYTICS_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        
        const rowData = [
          new Date().toISOString(),
          callContext.callId,
          callContext.customerProfile?.name || 'Unknown',
          callContext.customerNumber || '',
          interaction.functionName || '',
          interaction.query || '',
          interaction.response?.substring(0, 200) || '',
          sentiment,
          callContext.customerProfile?.isVipCustomer ? 'VIP' : 'Regular'
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Analytics!A:I',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [rowData]
          }
        });

        return {
          message: "Interaction logged for analytics",
          logged: true
        };

      } catch (error) {
        console.error('Analytics logging error:', error);
        // Don't fail the main conversation for analytics
        return {
          message: "Interaction logged for analytics",
          logged: false,
          error: error.message
        };
      }
    }
  },

  /**
   * Create appointment entry in Google Sheets
   */
  logAppointmentToSheet: {
    ttl: 0,
    fallbackResponse: "Your appointment has been recorded. We'll confirm the details with you soon.",
    cacheable: false,

    async execute(parameters, callContext) {
      const { appointmentData } = parameters;
      
      try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_APPOINTMENTS_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        
        const rowData = [
          new Date().toISOString(),
          appointmentData.appointmentId || generateAppointmentId(),
          callContext.customerProfile?.name || appointmentData.customerName,
          callContext.customerNumber || appointmentData.customerPhone,
          appointmentData.serviceType,
          appointmentData.preferredDate,
          appointmentData.status || 'Scheduled',
          appointmentData.notes || '',
          callContext.callId
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Appointments!A:I',
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [rowData]
          }
        });

        return {
          message: `Appointment scheduled successfully. Reference: ${appointmentData.appointmentId}`,
          appointmentId: appointmentData.appointmentId,
          scheduled: true
        };

      } catch (error) {
        console.error('Appointment logging error:', error);
        throw error;
      }
    }
  },

  /**
   * Read customer data from Google Sheets
   */
  getCustomerDataFromSheet: {
    ttl: 300,
    fallbackResponse: "I'm having trouble accessing customer records right now.",
    cacheable: true,

    async execute(parameters, callContext) {
      const { customerPhone, customerEmail } = parameters;
      
      try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_CUSTOMERS_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        
        // Get all customer data
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Customers!A:Z'
        });

        const rows = response.data.values || [];
        if (rows.length <= 1) {
          return {
            message: "No customer data found",
            found: false
          };
        }

        // Find customer by phone or email
        const customerRow = rows.find(row => 
          (customerPhone && row[2] === customerPhone) ||
          (customerEmail && row[3] === customerEmail)
        );

        if (!customerRow) {
          return {
            message: "Customer not found in records",
            found: false
          };
        }

        // Parse customer data (assuming standard column structure)
        const customerData = {
          name: customerRow[1],
          phone: customerRow[2],
          email: customerRow[3],
          totalOrders: parseInt(customerRow[4]) || 0,
          totalSpent: parseFloat(customerRow[5]) || 0,
          lastOrder: customerRow[6],
          preferredLanguage: customerRow[7] || 'en',
          notes: customerRow[8] || ''
        };

        return {
          message: `Customer found: ${customerData.name}`,
          found: true,
          customerData
        };

      } catch (error) {
        console.error('Customer data retrieval error:', error);
        throw error;
      }
    }
  },

  /**
   * Update inventory in Google Sheets
   */
  updateInventorySheet: {
    ttl: 0,
    fallbackResponse: "Inventory update recorded.",
    cacheable: false,

    async execute(parameters, callContext) {
      const { productSku, quantityChange, operation = 'subtract' } = parameters;
      
      try {
        const sheets = await getGoogleSheetsClient();
        const spreadsheetId = process.env.GOOGLE_SHEETS_INVENTORY_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        
        // Get current inventory data
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: 'Inventory!A:F'
        });

        const rows = response.data.values || [];
        const productIndex = rows.findIndex(row => row[0] === productSku);
        
        if (productIndex === -1) {
          throw new Error(`Product ${productSku} not found in inventory sheet`);
        }

        // Update quantity
        const currentQuantity = parseInt(rows[productIndex][3]) || 0;
        const newQuantity = operation === 'add' 
          ? currentQuantity + quantityChange
          : currentQuantity - quantityChange;

        // Update the sheet
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `Inventory!D${productIndex + 1}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[Math.max(0, newQuantity)]]
          }
        });

        return {
          message: `Inventory updated: ${productSku} quantity changed from ${currentQuantity} to ${newQuantity}`,
          updated: true,
          previousQuantity: currentQuantity,
          newQuantity: Math.max(0, newQuantity)
        };

      } catch (error) {
        console.error('Inventory update error:', error);
        throw error;
      }
    }
  }
};

/**
 * Initialize Google Sheets client
 */
async function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');
  
  if (!credentials.client_email) {
    throw new Error('Google Service Account credentials not configured');
  }

  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  await auth.authorize();
  
  return google.sheets({ version: 'v4', auth });
}

/**
 * Generate unique order number
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ARM-${timestamp}-${random}`;
}

/**
 * Generate unique appointment ID
 */
function generateAppointmentId() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 3).toUpperCase();
  return `APT-${timestamp}-${random}`;
}

/**
 * Find column index by searching for matching header names
 */
function findColumnIndex(headers, possibleNames) {
  for (const name of possibleNames) {
    const index = headers.findIndex(header => 
      header && header.includes(name)
    );
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Format price for display
 */
function formatPrice(priceValue) {
  if (!priceValue) return 'Contact for price';
  
  const price = parseFloat(priceValue.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
  if (isNaN(price)) return 'Contact for price';
  
  return `€${price.toFixed(2)}`;
}

/**
 * Format stock information
 */
function formatStock(stockValue) {
  if (!stockValue) return 'Unknown';
  
  const stock = parseInt(stockValue.toString().replace(/[^\d]/g, ''));
  if (isNaN(stock)) return 'Available';
  
  if (stock === 0) return 'Out of stock';
  if (stock <= 3) return `${stock} left`;
  return 'In stock';
}

/**
 * Check if product is available
 */
function isProductAvailable(stockValue) {
  if (!stockValue) return true; // Assume available if no stock info
  
  const stock = parseInt(stockValue.toString().replace(/[^\d]/g, ''));
  return !isNaN(stock) && stock > 0;
}

/**
 * Format product search results for voice response
 */
function formatProductSearchResults(products, searchTerm, language = 'en') {
  if (products.length === 1) {
    const product = products[0];
    if (language === 'el') {
      return `Βρήκα το προϊόν: ${product.name}${product.brand ? ` από ${product.brand}` : ''}. Τιμή: ${product.price}. Διαθεσιμότητα: ${product.stock}. Μπορείτε να το βρείτε στο κατάστημά μας ή να παραγγείλετε στο armenius.com.cy.`;
    } else {
      return `I found: ${product.name}${product.brand ? ` from ${product.brand}` : ''}. Price: ${product.price}. Stock: ${product.stock}. You can find it in our store or order at armenius.com.cy.`;
    }
  }
  
  if (language === 'el') {
    const productList = products.slice(0, 3).map(p => 
      `${p.name} (${p.price})`
    ).join(', ');
    return `Βρήκα ${products.length} προϊόντα για "${searchTerm}": ${productList}${products.length > 3 ? ' και άλλα' : ''}. Θέλετε περισσότερες λεπτομέρειες για κάποιο συγκεκριμένο προϊόν;`;
  } else {
    const productList = products.slice(0, 3).map(p => 
      `${p.name} (${p.price})`
    ).join(', ');
    return `I found ${products.length} products for "${searchTerm}": ${productList}${products.length > 3 ? ' and more' : ''}. Would you like details about any specific product?`;
  }
}
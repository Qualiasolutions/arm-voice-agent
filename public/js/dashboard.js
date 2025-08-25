// Armenius Voice Assistant Dashboard JavaScript
// Handles all interactive functionality and API calls

let currentLanguage = 'en';
const charts = {};
let vapi = null;
let isCallActive = false;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  initializeDashboard();
    
  // Wait a bit for external scripts to load (Vapi SDK)
  setTimeout(async () => {
    await initializeVapi(); // Wait for Vapi initialization
  }, 1000);
    
  loadSystemStatus();
  loadRecentActivity();
  loadProducts();
  loadAppointments();
  loadAnalytics();
    
  // Auto-refresh every 30 seconds
  setInterval(loadSystemStatus, 30000);
  setInterval(loadRecentActivity, 60000);
});

// Initialize dashboard components
function initializeDashboard() {
  // Note: Demo functionality removed for production
  // Production appointments should be handled through live API calls
    
  // Show overview tab by default
  showTab('overview');
}

// Tab switching functionality
function showTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.classList.add('hidden'));
    
  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.classList.remove('active', 'border-armenius-blue', 'text-armenius-blue');
    btn.classList.add('border-transparent', 'text-gray-500');
  });
    
  // Show selected tab content
  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
    selectedTab.classList.add('fade-in');
  }
    
  // Activate selected tab button
  const activeButton = document.querySelector(`button[onclick="showTab('${tabName}')"]`);
  if (activeButton) {
    activeButton.classList.add('active', 'border-armenius-blue', 'text-armenius-blue');
    activeButton.classList.remove('border-transparent', 'text-gray-500');
  }
    
  // Load tab-specific data
  if (tabName === 'analytics' && !charts.callVolume) {
    setTimeout(initializeCharts, 100);
  }
}

// Language toggle functionality
function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'el' : 'en';
  const toggle = document.getElementById('langToggle');
  toggle.textContent = currentLanguage === 'en' ? '🇬🇧 EN' : '🇬🇷 EL';
    
  // Update UI text based on language
  updateLanguage();
}

function updateLanguage() {
  // This would update all UI text based on current language
  // For demo purposes, we'll just show a notification
  showNotification(`Language switched to ${currentLanguage === 'en' ? 'English' : 'Greek'}`, 'info');
}

// Load system status from API
async function loadSystemStatus() {
  try {
    // Check API health
    const apiResponse = await fetch('/api/vapi');
    const apiStatus = document.getElementById('api-status');
        
    if (apiResponse.ok) {
      apiStatus.textContent = 'Online';
      apiStatus.className = 'text-sm font-medium text-green-600';
    } else {
      apiStatus.textContent = 'Error';
      apiStatus.className = 'text-sm font-medium text-red-600';
    }
        
    // Update other status indicators
    updateSystemMetrics();
    updateApiEndpoints();
    updateEnvironmentStatus();
        
  } catch (error) {
    console.error('Failed to load system status:', error);
    const apiStatus = document.getElementById('api-status');
    apiStatus.textContent = 'Offline';
    apiStatus.className = 'text-sm font-medium text-red-600';
  }
}

function updateSystemMetrics() {
  // Simulate real-time metrics
  const metrics = {
    cacheRate: Math.floor(Math.random() * 20) + 80, // 80-100%
    responseTime: Math.floor(Math.random() * 100) + 200, // 200-300ms
    activeFunctions: 5
  };
    
  document.getElementById('cache-rate').textContent = `${metrics.cacheRate}%`;
  document.getElementById('response-time').textContent = `${metrics.responseTime}ms`;
  document.getElementById('active-functions').textContent = metrics.activeFunctions;
}

// Load recent activity
function loadRecentActivity() {
  const activities = [
    {
      time: '2 minutes ago',
      action: 'checkInventory',
      details: 'RTX 4090 - Found 5 units in stock',
      language: 'en',
      duration: '245ms'
    },
    {
      time: '5 minutes ago',
      action: 'bookAppointment',
      details: 'Repair appointment scheduled for tomorrow',
      language: 'el',
      duration: '1.2s'
    },
    {
      time: '8 minutes ago',
      action: 'getStoreInfo',
      details: 'Store hours requested',
      language: 'en',
      duration: '156ms'
    },
    {
      time: '12 minutes ago',
      action: 'getProductPrice',
      details: 'Intel i9-13900K pricing inquiry',
      language: 'el',
      duration: '189ms'
    }
  ];
    
  const activityContainer = document.getElementById('recent-activity');
  activityContainer.innerHTML = activities.map(activity => `
        <div class="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-${getFunctionIcon(activity.action)} text-blue-600 text-xs"></i>
                </div>
                <div>
                    <div class="text-sm font-medium">${activity.action}</div>
                    <div class="text-xs text-gray-500">${activity.details}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-xs text-gray-500">${activity.time}</div>
                <div class="text-xs text-gray-400">${activity.language.toUpperCase()} • ${activity.duration}</div>
            </div>
        </div>
    `).join('');
}

function getFunctionIcon(functionName) {
  const icons = {
    'checkInventory': 'search',
    'getProductPrice': 'euro-sign',
    'bookAppointment': 'calendar',
    'checkOrderStatus': 'truck',
    'getStoreInfo': 'info-circle'
  };
  return icons[functionName] || 'cog';
}

// Test voice functions
async function testFunction(functionName) {
  const startTime = Date.now();
  const responseContainer = document.getElementById('function-response');
  const processingTimeEl = document.getElementById('processing-time');
  const cacheStatusEl = document.getElementById('cache-status');
    
  // Clear previous response
  responseContainer.innerHTML = '<div class="text-yellow-400">Processing...</div>';
  processingTimeEl.textContent = '--ms';
  cacheStatusEl.textContent = 'Processing';
    
  try {
    let params = {};
        
    // Get parameters based on function
    switch (functionName) {
      case 'checkInventory':
        params = {
          product_name: document.getElementById('inventory-input').value || 'RTX 4090'
        };
        break;
      case 'getProductPrice':
        params = {
          product_identifier: document.getElementById('price-input').value || 'Intel i9-13900K',
          quantity: 1
        };
        break;
      case 'bookAppointment':
        params = {
          service_type: document.getElementById('appointment-type').value,
          preferred_date: new Date().toISOString(),
          customer_phone: '+35799123456'
        };
        break;
      case 'getStoreInfo':
        params = {
          info_type: document.getElementById('info-type').value,
          language: currentLanguage
        };
        break;
    }
        
    // Simulate API call
    const mockResponse = generateMockResponse(functionName, params);
        
    setTimeout(() => {
      const endTime = Date.now();
      const duration = endTime - startTime;
            
      responseContainer.innerHTML = `
                <div class="text-green-400">// Function: ${functionName}</div>
                <div class="text-blue-400">// Parameters: ${JSON.stringify(params, null, 2)}</div>
                <div class="text-white mt-2">${JSON.stringify(mockResponse, null, 2)}</div>
            `;
            
      processingTimeEl.textContent = `${duration}ms`;
      cacheStatusEl.textContent = Math.random() > 0.7 ? 'Hit' : 'Miss';
            
      showNotification(`Function ${functionName} executed successfully`, 'success');
    }, Math.random() * 1000 + 500);
        
  } catch (error) {
    responseContainer.innerHTML = `<div class="text-red-400">Error: ${error.message}</div>`;
    showNotification(`Function ${functionName} failed`, 'error');
  }
}

function generateMockResponse(functionName, params) {
  const responses = {
    'checkInventory': {
      available: true,
      message: `${params.product_name} is in stock. We have 5 units available at €1699.99.`,
      product: {
        name: params.product_name,
        price: 1699.99,
        stock: 5,
        sku: 'RTX4090-MSI-24GB'
      },
      cached: Math.random() > 0.5
    },
    'getProductPrice': {
      price: 589.99,
      currency: 'EUR',
      message: `${params.product_identifier} is available for €589.99. Bulk discounts available for quantities over 5.`,
      discounts: {
        '5+': '5%',
        '10+': '10%'
      }
    },
    'bookAppointment': {
      success: true,
      message: `Appointment scheduled for ${params.service_type} service.`,
      appointment_id: 'apt_' + Math.random().toString(36).substr(2, 9),
      scheduled_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    'getStoreInfo': {
      message: params.info_type === 'hours' 
        ? (currentLanguage === 'en' 
          ? 'We are open Monday to Friday 9am-7pm, Saturday 9am-2pm, closed Sunday.'
          : 'Είμαστε ανοιχτά Δευτέρα έως Παρασκευή 9π.μ.-7μ.μ., Σάββατο 9π.μ.-2μ.μ., Κυριακή κλειστά.')
        : 'We are located at 171 Makarios Avenue in Nicosia, Cyprus.',
      cached: true
    }
  };
    
  return responses[functionName] || { message: 'Function response not available' };
}

// Load and display products
async function loadProducts() {
  const mockProducts = [
    {
      id: '1',
      sku: 'RTX4090-MSI-24GB',
      name: 'NVIDIA GeForce RTX 4090 MSI Gaming X Trio 24GB',
      category: 'Graphics Cards',
      brand: 'MSI',
      price: 1699.99,
      stock_quantity: 5,
      specifications: {
        memory: '24GB GDDR6X',
        boost_clock: '2610 MHz',
        interface: 'PCIe 4.0'
      }
    },
    {
      id: '2',
      sku: 'INTEL-13900K',
      name: 'Intel Core i9-13900K',
      category: 'Processors',
      brand: 'Intel',
      price: 589.99,
      stock_quantity: 15,
      specifications: {
        cores: 24,
        threads: 32,
        base_clock: '3.0 GHz',
        boost_clock: '5.8 GHz'
      }
    },
    {
      id: '3',
      sku: 'DDR5-6000-32GB',
      name: 'G.Skill Trident Z5 DDR5-6000 32GB Kit',
      category: 'Memory',
      brand: 'G.Skill',
      price: 299.99,
      stock_quantity: 20,
      specifications: {
        capacity: '32GB',
        speed: '6000 MHz',
        latency: 'CL36'
      }
    },
    {
      id: '4',
      sku: 'SSD-980PRO-2TB',
      name: 'Samsung 980 PRO NVMe SSD 2TB',
      category: 'Storage',
      brand: 'Samsung',
      price: 199.99,
      stock_quantity: 25,
      specifications: {
        capacity: '2TB',
        interface: 'NVMe PCIe 4.0',
        read_speed: '7000 MB/s'
      }
    },
    {
      id: '5',
      sku: 'MOBO-Z790-ASUS',
      name: 'ASUS ROG Maximus Z790 Hero',
      category: 'Motherboards',
      brand: 'ASUS',
      price: 499.99,
      stock_quantity: 7,
      specifications: {
        socket: 'LGA1700',
        chipset: 'Z790',
        ram_slots: 4
      }
    },
    {
      id: '6',
      sku: 'PSU-850W-CORSAIR',
      name: 'Corsair RM850x 850W 80+ Gold Modular',
      category: 'Power Supplies',
      brand: 'Corsair',
      price: 149.99,
      stock_quantity: 18,
      specifications: {
        wattage: '850W',
        efficiency: '80+ Gold',
        modular: true
      }
    }
  ];
    
  displayProducts(mockProducts);
}

function displayProducts(products) {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = products.map(product => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div class="p-6">
                <div class="flex justify-between items-start mb-3">
                    <div class="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">
                        ${product.category}
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold text-gray-900">€${product.price}</div>
                        <div class="text-sm text-gray-500">Stock: ${product.stock_quantity}</div>
                    </div>
                </div>
                <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${product.name}</h3>
                <div class="text-sm text-gray-600 mb-3">
                    <div class="font-medium">${product.brand}</div>
                    <div class="text-xs text-gray-500">SKU: ${product.sku}</div>
                </div>
                <div class="space-y-1 text-xs text-gray-600">
                    ${Object.entries(product.specifications || {}).slice(0, 3).map(([key, value]) => 
    `<div>${key.replace('_', ' ')}: ${value}</div>`
  ).join('')}
                </div>
                <div class="mt-4 flex space-x-2">
                    <button onclick="quickInventoryCheck('${product.sku}')" class="flex-1 px-3 py-1 bg-armenius-blue text-white text-xs rounded hover:bg-blue-600 transition-colors">
                        <i class="fas fa-search mr-1"></i>Check Stock
                    </button>
                    <button onclick="quickPriceCheck('${product.sku}')" class="flex-1 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors">
                        <i class="fas fa-euro-sign mr-1"></i>Get Quote
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function searchProducts() {
  const searchTerm = document.getElementById('product-search').value;
  const category = document.getElementById('category-filter').value;
    
  // Simulate search
  showNotification(`Searching for "${searchTerm}" in ${category || 'all categories'}...`, 'info');
    
  // In a real implementation, this would call the API
  setTimeout(() => {
    loadProducts(); // Reload products (in real app, would show filtered results)
    showNotification('Search completed', 'success');
  }, 1000);
}

function quickInventoryCheck(sku) {
  document.getElementById('inventory-input').value = sku;
  showTab('voice-test');
  setTimeout(() => testFunction('checkInventory'), 500);
}

function quickPriceCheck(sku) {
  document.getElementById('price-input').value = sku;
  showTab('voice-test');
  setTimeout(() => testFunction('getProductPrice'), 500);
}

// Load appointments
function loadAppointments() {
  const mockAppointments = [
    {
      customer: 'Yiannis Georgiou',
      phone: '+357 99 123456',
      service: 'Computer Repair',
      datetime: '2024-01-25 10:00',
      status: 'confirmed'
    },
    {
      customer: 'Maria Konstantinou',
      phone: '+357 99 234567',
      service: 'Technical Consultation',
      datetime: '2024-01-25 14:30',
      status: 'confirmed'
    },
    {
      customer: 'Andreas Pavlou',
      phone: '+357 99 345678',
      service: 'Warranty Service',
      datetime: '2024-01-26 11:00',
      status: 'pending'
    }
  ];
    
  const table = document.getElementById('appointments-table');
  table.innerHTML = mockAppointments.map(apt => `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
                <div class="font-medium">${apt.customer}</div>
                <div class="text-sm text-gray-500">${apt.phone}</div>
            </td>
            <td class="px-4 py-3">${apt.service}</td>
            <td class="px-4 py-3">${new Date(apt.datetime).toLocaleString()}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${
  apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
    apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
      'bg-gray-100 text-gray-800'
}">
                    ${apt.status}
                </span>
            </td>
        </tr>
    `).join('');
}

function generateTimeSlots() {
  const slots = document.getElementById('time-slots');
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    
  slots.innerHTML = times.map(time => `
        <button onclick="selectTimeSlot('${time}')" class="time-slot px-3 py-2 text-sm border border-gray-300 rounded hover:border-armenius-blue hover:bg-blue-50 transition-colors">
            ${time}
        </button>
    `).join('');
}

function selectTimeSlot(time) {
  // Remove previous selections
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.remove('bg-armenius-blue', 'text-white', 'border-armenius-blue');
    slot.classList.add('border-gray-300');
  });
    
  // Select clicked slot
  event.target.classList.add('bg-armenius-blue', 'text-white', 'border-armenius-blue');
  event.target.classList.remove('border-gray-300');
    
  showNotification(`Time slot ${time} selected`, 'success');
}

function demoBooking() {
  const serviceType = document.getElementById('demo-service-type').value;
  const date = document.getElementById('demo-date').value;
  const phone = document.getElementById('demo-phone').value;
    
  if (!date || !phone) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
    
  // Simulate booking
  showNotification('Processing booking...', 'info');
    
  setTimeout(() => {
    showNotification(`Appointment booked successfully! Service: ${serviceType}, Date: ${date}`, 'success');
        
    // Add to appointments table
    const table = document.getElementById('appointments-table');
    const newRow = `
            <tr class="hover:bg-gray-50 bg-green-50">
                <td class="px-4 py-3">
                    <div class="font-medium">Demo Customer</div>
                    <div class="text-sm text-gray-500">${phone}</div>
                </td>
                <td class="px-4 py-3">${serviceType}</td>
                <td class="px-4 py-3">${new Date(date).toLocaleString()}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        confirmed
                    </span>
                </td>
            </tr>
        `;
    table.insertAdjacentHTML('afterbegin', newRow);
  }, 2000);
}

// Load analytics and initialize charts
function loadAnalytics() {
  // This would fetch real analytics data from the API
  const analyticsData = {
    callVolume: [12, 19, 8, 15, 22, 18, 25],
    costs: [3.84, 6.08, 2.56, 4.80, 7.04, 5.76, 8.00],
    functions: [
      { name: 'checkInventory', count: 145, percentage: 35 },
      { name: 'getStoreInfo', count: 98, percentage: 24 },
      { name: 'getProductPrice', count: 87, percentage: 21 },
      { name: 'bookAppointment', count: 54, percentage: 13 },
      { name: 'checkOrderStatus', count: 28, percentage: 7 }
    ],
    languages: { en: 65, el: 35 }
  };
    
  displayTopFunctions(analyticsData.functions);
}

function displayTopFunctions(functions) {
  const container = document.getElementById('top-functions');
  container.innerHTML = functions.map(func => `
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
                <i class="fas fa-${getFunctionIcon(func.name)} text-armenius-blue"></i>
                <span class="text-sm">${func.name}</span>
            </div>
            <div class="flex items-center space-x-2">
                <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="bg-armenius-blue h-2 rounded-full" style="width: ${func.percentage}%"></div>
                </div>
                <span class="text-sm font-medium text-gray-600">${func.count}</span>
            </div>
        </div>
    `).join('');
}

function initializeCharts() {
  // Call Volume Chart
  const callVolumeCtx = document.getElementById('callVolumeChart').getContext('2d');
  charts.callVolume = new Chart(callVolumeCtx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Calls',
        data: [12, 19, 8, 15, 22, 18, 25],
        borderColor: '#0057FF',
        backgroundColor: 'rgba(0, 87, 255, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
    
  // Cost Chart
  const costCtx = document.getElementById('costChart').getContext('2d');
  charts.cost = new Chart(costCtx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Cost (€)',
        data: [3.84, 6.08, 2.56, 4.80, 7.04, 5.76, 8.00],
        backgroundColor: '#4F46E5',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value;
            }
          }
        }
      }
    }
  });
    
  // Language Distribution Chart
  const languageCtx = document.getElementById('languageChart').getContext('2d');
  charts.language = new Chart(languageCtx, {
    type: 'doughnut',
    data: {
      labels: ['English', 'Greek'],
      datasets: [{
        data: [65, 35],
        backgroundColor: ['#0057FF', '#4F46E5'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Update API endpoints status
function updateApiEndpoints() {
  const endpoints = [
    { name: '/api/vapi', status: 'online', response: '200ms' },
    { name: '/api/cron/warmup-cache', status: 'online', response: '156ms' },
    { name: '/api/cron/daily-report', status: 'online', response: '2.1s' },
    { name: '/api/cron/cost-analysis', status: 'online', response: '890ms' }
  ];
    
  const container = document.getElementById('api-endpoints');
  container.innerHTML = endpoints.map(endpoint => `
        <div class="bg-white border rounded-lg p-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                    <code class="text-sm font-mono">${endpoint.name}</code>
                </div>
                <div class="text-sm text-gray-500">${endpoint.response}</div>
            </div>
        </div>
    `).join('');
}

// Update environment status
function updateEnvironmentStatus() {
  const envVars = [
    { name: 'VAPI_API_KEY', status: 'configured' },
    { name: 'SUPABASE_URL', status: 'configured' },
    { name: 'OPENAI_API_KEY', status: 'configured' },
    { name: 'DEEPGRAM_API_KEY', status: 'configured' },
    { name: 'UPSTASH_REDIS_REST_URL', status: 'configured' },
    { name: 'VAPI_SERVER_SECRET', status: 'configured' }
  ];
    
  const container = document.getElementById('env-status');
  container.innerHTML = envVars.map(env => `
        <div class="bg-white border rounded-lg p-3">
            <div class="flex items-center justify-between">
                <code class="text-sm font-mono text-gray-700">${env.name}</code>
                <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-xs text-green-600">${env.status}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility functions
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white font-medium z-50 ${
    type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
          'bg-blue-500'
  }`;
  notification.textContent = message;
    
  document.body.appendChild(notification);
    
  // Animate in
  notification.style.transform = 'translateX(100%)';
  notification.style.transition = 'transform 0.3s ease';
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
    
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add some sample data refresh
setInterval(() => {
  // Simulate real-time updates
  const metrics = ['cache-rate', 'response-time'];
  metrics.forEach(metric => {
    const element = document.getElementById(metric);
    if (element) {
      if (metric === 'cache-rate') {
        element.textContent = `${Math.floor(Math.random() * 20) + 80}%`;
      } else if (metric === 'response-time') {
        element.textContent = `${Math.floor(Math.random() * 100) + 200}ms`;
      }
    }
  });
}, 5000);

// ================================
// VAPI VOICE CALL FUNCTIONALITY
// ================================

// Create mock Vapi interface for testing when no public key is available
function createMockVapi() {
  const eventListeners = {};
    
  return {
    on: (event, callback) => {
      eventListeners[event] = callback;
    },
        
    start: async (config) => {
      console.log('🎤 Starting mock voice call - demo mode active');
            
      // Simulate call start
      setTimeout(() => {
        if (eventListeners['call-start']) {
          eventListeners['call-start']();
        }
      }, 1000);
            
      // Simulate conversation
      setTimeout(() => {
        if (eventListeners['message']) {
          eventListeners['message']({
            type: 'transcript',
            transcript: "Hello! I'm Maria, your AI assistant for Armenius Store. How can I help you today?"
          });
        }
      }, 2000);
            
      // Auto-end call after 15 seconds for demo
      setTimeout(() => {
        if (eventListeners['call-end']) {
          eventListeners['call-end']();
        }
      }, 15000);
    },
        
    stop: () => {
      console.log('🔴 Ending mock voice call');
      if (eventListeners['call-end']) {
        eventListeners['call-end']();
      }
    }
  };
}

// Initialize Vapi for voice calls
async function initializeVapi() {
  try {
    // Load configuration from backend API
    const configResponse = await fetch('/api/config');
    const configData = await configResponse.json();
    const publicKey = configData?.vapi?.publicKey;
        
    console.log('🔧 Vapi config loaded:', { 
      hasPublicKey: !!publicKey, 
      publicKey: publicKey ? `${publicKey.substring(0, 8)}...` : 'none',
      assistantId: configData?.vapi?.assistantId
    });
        
    console.log('🔍 Debug - Checking Vapi availability:', {
      vapiSDKLoaded: window.vapiSDKLoaded,
      vapiSDKAvailable: typeof window.vapiSDK !== 'undefined',
      allVapiKeys: Object.keys(window).filter(k => k.toLowerCase().includes('vapi')),
      publicKey: publicKey,
      publicKeyLength: publicKey?.length,
      assistantId: configData?.vapi?.assistantId
    });
        
    // Use the new Vapi SDK initialization method
    if (window.vapiSDKLoaded && window.vapiSDK && publicKey && configData?.vapi?.assistantId) {
      // Initialize real Vapi with public key and assistant ID from backend
      vapi = window.vapiSDK.run({
        apiKey: publicKey,
        assistant: configData.vapi.assistantId,
        config: {}
      });
      console.log('✅ Real Vapi initialized with backend config:', {
        publicKey: publicKey.substring(0, 8) + '...',
        assistantId: configData.vapi.assistantId
      });
            
      // Set up event listeners for real Vapi
      vapi.on('call-start', () => {
        console.log('📞 Real Vapi call started');
        updateCallStatus('Connected to Maria', 'text-green-600');
        updateCallButton('End Call', 'fas fa-phone-slash', 'bg-red-500 hover:bg-red-600');
        isCallActive = true;
      });
            
      vapi.on('call-end', () => {
        console.log('📞 Real Vapi call ended');
        updateCallStatus('Call ended', 'text-gray-600');
        updateCallButton('Start Voice Call', 'fas fa-microphone', 'bg-armenius-blue hover:bg-blue-700');
        isCallActive = false;
        setTimeout(hideCallStatus, 2000);
      });
            
      vapi.on('error', (error) => {
        console.error('❌ Real Vapi error:', error);
        updateCallStatus('Connection error', 'text-red-600');
        updateCallButton('Start Voice Call', 'fas fa-microphone', 'bg-armenius-blue hover:bg-blue-700');
        isCallActive = false;
        setTimeout(hideCallStatus, 3000);
      });
            
      vapi.on('speech-start', () => {
        updateCallStatus('Maria is listening...', 'text-blue-600');
      });
            
      vapi.on('speech-end', () => {
        updateCallStatus('Maria is thinking...', 'text-orange-600');
      });
            
      vapi.on('message', (message) => {
        if (message.type === 'transcript') {
          console.log('📝 Transcript:', message.transcript);
        }
      });
            
    } else {
      console.warn('⚠️ Vapi SDK not loaded or missing config - using mock interface');
      console.log('Debug info:', {
        vapiSDKLoaded: window.vapiSDKLoaded,
        vapiSDKAvailable: typeof window.vapiSDK !== 'undefined',
        publicKey: !!publicKey,
        assistantId: !!configData?.vapi?.assistantId,
        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('vapi'))
      });
      vapi = createMockVapi();
    }
        
  } catch (error) {
    console.error('❌ Failed to initialize Vapi:', error);
    console.log('🎭 Falling back to mock interface');
    vapi = createMockVapi();
  }
}

// Start voice call (wrapper for HTML onclick)
function startVoiceCall() {
  handleVoiceCall().catch(error => {
    console.error('Voice call error:', error);
    showNotification('Failed to start voice call. Please try again.', 'error');
  });
}

// Handle voice call (async implementation)
async function handleVoiceCall() {
  if (isCallActive) {
    // End the call
    if (vapi) {
      vapi.stop();
    }
    return;
  }
    
  if (!vapi) {
    showNotification('Voice service not available. Please refresh the page and try again.', 'error');
    return;
  }
    
  try {
    showCallStatus();
    updateCallStatus('Connecting to Maria...', 'text-blue-600');
    updateCallButton('Connecting...', 'fas fa-spinner fa-spin', 'bg-gray-500');
        
    // Load assistant configuration from backend
    const configResponse = await fetch('/api/config');
    const configData = await configResponse.json();
    const assistantId = configData?.vapi?.assistantId;
        
    console.log('🎯 Starting call with assistant:', assistantId);
        
    // Start the call - with new SDK, the assistant is already configured
    if (vapi && typeof vapi.start === 'function') {
      vapi.start();
    } else if (vapi && typeof vapi.call === 'function') {
      // Alternative method for different SDK versions
      vapi.call();
    } else {
      console.error('❌ No valid vapi instance available');
      throw new Error('Vapi not initialized properly');
    }
        
  } catch (error) {
    console.error('Failed to start voice call:', error);
    showNotification('Failed to start voice call. Please try again.', 'error');
    updateCallButton('Start Voice Call', 'fas fa-microphone', 'bg-armenius-blue hover:bg-blue-700');
    hideCallStatus();
  }
}

// Update call status display
function updateCallStatus(message, textClass) {
  const statusElement = document.getElementById('callStatus');
  if (statusElement) {
    statusElement.innerHTML = `
            <div class="inline-flex items-center">
                <div class="w-2 h-2 ${textClass.replace('text-', 'bg-')} rounded-full mr-2 animate-pulse"></div>
                <span class="${textClass}">${message}</span>
            </div>
        `;
  }
}

// Update call button appearance
function updateCallButton(text, iconClass, bgClass) {
  const button = document.getElementById('voiceCallBtn');
  const icon = document.getElementById('voiceIcon');
  const textElement = document.getElementById('voiceText');
    
  if (button && icon && textElement) {
    button.className = `inline-flex items-center px-8 py-4 ${bgClass} text-white font-bold text-lg rounded-full shadow-lg transform transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300`;
    icon.className = `${iconClass} mr-3 text-xl`;
    textElement.textContent = text;
  }
}

// Show call status
function showCallStatus() {
  const statusElement = document.getElementById('callStatus');
  if (statusElement) {
    statusElement.classList.remove('hidden');
  }
}

// Hide call status
function hideCallStatus() {
  const statusElement = document.getElementById('callStatus');
  if (statusElement) {
    statusElement.classList.add('hidden');
  }
}
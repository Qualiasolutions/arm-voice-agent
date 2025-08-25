# Armenius Voice AI Platform

A professional enterprise dashboard for managing voice AI assistant operations.

## 🚀 Features

### Executive Dashboard
- Real-time business KPIs
- Performance metrics and trends
- Quick action center
- Today's performance summary

### Live Operations Center
- Real-time conversation monitoring
- Active call details with sentiment analysis
- Call duration and cost tracking
- Interactive call selection and monitoring

### Voice Assistant Management
- Complete AI configuration interface
- Voice selection (ElevenLabs voices)
- AI model configuration (OpenAI models)
- Language and timing settings
- Live testing mode with conversation simulation

### Business Intelligence
- Advanced analytics with interactive charts
- Daily/weekly performance trends
- Topic analysis and satisfaction metrics
- Hourly call distribution patterns

### Appointment Management
- AI-booked appointment tracking
- Service type categorization
- Customer contact management
- Booking efficiency metrics

### Customer Analytics
- Detailed customer profiles
- Interaction history and preferences
- Satisfaction scoring
- Spending and activity analysis

### Cost & ROI Tracking
- Real-time cost monitoring
- Budget performance tracking
- ROI analysis and projections
- Cost optimization recommendations

### System Configuration
- Comprehensive settings management
- API key configuration
- Security and performance settings
- Integration management

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui v4 with professional styling
- **Styling**: Tailwind CSS with teal/dark blue/white theme
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 🎨 Design System

- **Color Scheme**: Professional teal (#2D9B87), dark blue (#3B4A5C), white
- **Typography**: System fonts with clean, modern styling
- **Components**: Enterprise-grade shadcn/ui components
- **Layout**: Responsive design with sidebar navigation
- **Branding**: "Powered by Qualia Solutions" throughout

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

## 📱 Application Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── Layout.tsx          # Main application layout
├── pages/
│   ├── Dashboard.tsx       # Executive dashboard
│   ├── Operations.tsx      # Live operations center
│   ├── Assistant.tsx       # Voice assistant management
│   ├── Analytics.tsx       # Business intelligence
│   ├── Appointments.tsx    # Appointment management
│   ├── Customers.tsx       # Customer analytics
│   ├── Costs.tsx          # Cost & ROI tracking
│   └── Settings.tsx       # System configuration
├── lib/
│   ├── utils.ts           # Utility functions
│   └── supabase.ts        # Database client
├── App.tsx                # Main application component
└── main.tsx              # Application entry point
```

## 🔧 Configuration

Environment variables needed:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## 🚀 Deployment

The application is configured for deployment on Vercel with:
- Automatic builds on push
- SPA routing support
- Asset optimization and caching

## 👥 Target Users

**Business Owners**: Executive dashboard with high-level KPIs and ROI metrics
**Operations Managers**: Live call monitoring and performance tracking
**Customer Service**: Call details and customer interaction history

## ✨ Key Features

- **Real-time Monitoring**: Live conversation tracking and system health
- **Professional Design**: Enterprise-grade UI with no childish elements
- **Comprehensive Analytics**: Detailed insights into AI performance and costs
- **User-Friendly**: Intuitive interface designed for business users
- **Scalable Architecture**: Built for production use with proper state management

---

*Built with ❤️ by Qualia Solutions*
# ImpACT4CF - Cystic Fibrosis Treatment Management System

## 📋 Overview

ImpACT4CF is a comprehensive web-based platform designed for managing and monitoring cystic fibrosis treatment data. The system provides healthcare professionals, researchers, and patients with tools to track treatment sessions, monitor adherence, and analyze treatment outcomes.

## 🌟 Key Features

- **User Management**: Multi-role support (Super User, Researcher, Clinician, Patient)
- **Treatment Tracking**: Real-time monitoring of ACT (Airway Clearance Therapy) sessions
- **Data Visualization**: Interactive charts and graphs for treatment analysis
- **Prescription Management**: Customizable treatment prescriptions and adherence tracking
- **Analytics Dashboard**: Comprehensive overview of participant activity and treatment metrics
- **Export Functionality**: CSV export capabilities for research and analysis

## 🚀 Core Technologies & Architecture

### **Frontend Framework**

#### **React (v18.3.1)**
- **Purpose**: Building interactive user interfaces
- **Implementation**: 
  - Component-based architecture for reusable UI elements
  - State management with hooks (useState, useEffect)
  - Dynamic data rendering and real-time updates
  - Responsive layouts for medical data visualization

#### **Next.js (v15.1.7)**
- **Purpose**: Full-stack React framework with server-side capabilities
- **Implementation**:
  - **Server-Side Rendering (SSR)**: Pre-renders pages on server for faster load times and better SEO
  - **File-based Routing**: Automatic route generation from file structure
  - **API Integration**: Built-in API routes for backend communication
  - **Dynamic Routes**: `[userId]/all/[date]` for flexible patient data URLs
  ```typescript
  // Example: Server-side data fetching
  export default async function DayProfilePage({ params }) {
    const userData = await authFetcherWithRedirect(`api/users/${userId}`);
    return <Profile initialData={userData} />
  }
  ```

#### **Node.js (v20)**
- **Purpose**: JavaScript runtime environment
- **Implementation**:
  - Server-side code execution
  - Package management (npm/yarn)
  - Build and deployment processes
  - Docker container runtime environment

### **Authentication & Security**

#### **JWT (JSON Web Tokens)**
- **Purpose**: Secure token-based authentication
- **Implementation**:
  ```typescript
  // Automatic token attachment to API requests
  config.headers['Authorization'] = `Bearer ${accessToken}`;
  
  // User identification from token
  const decodedToken = jwtDecode(serviceToken);
  const userId = decodedToken.user_id;
  ```

#### **Amazon Cognito**
- **Purpose**: Enterprise-grade identity management
- **Features**:
  - User registration and authentication
  - Multi-factor authentication (MFA)
  - Role-based access control (RBAC)
  - Password policies and recovery
  - User groups management (Clinicians, Researchers, Patients)

### **Cloud Infrastructure**

#### **Microsoft Azure**
- **Deployment Location**: UK South Region
- **Domain**: `team05docker.uksouth.cloudapp.azure.com`
- **Services Used**:
  - Azure Virtual Machines for Docker hosting
  - Azure Cloud App Service for domain management
  - Load balancing and network security

#### **Docker & Container Architecture**
```yaml
services:
  nextjs:    # Main application container
  nginx:     # Reverse proxy & load balancer
  certbot:   # SSL/TLS certificate management
```

### **UI & Visualization**

#### **Material-UI (MUI v6)**
- **Purpose**: Professional healthcare-grade UI components
- **Components**: Data grids, forms, navigation, responsive layouts

#### **Data Visualization Libraries**
- **ApexCharts**: Interactive treatment charts
- **Recharts**: React-specific chart components
- **D3.js**: Advanced data visualizations
- **Three.js**: 3D visualizations (if applicable)

### **State Management**

#### **Redux Toolkit (v2.4.0)**
- **Purpose**: Global application state management
- **Features**:
  - Centralized state for user data
  - Predictable state updates
  - Redux DevTools for debugging
  - Persistent state with Redux Persist

### **Testing Infrastructure**

#### **Jest (v29.7.0)**
- Unit testing for components and utilities
- Code coverage reports

#### **Playwright (v1.51.1)**
- End-to-end testing for critical user flows
- Cross-browser testing capabilities

## 🔄 Application Architecture Flow

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────┐
│   Azure Load Balancer   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Nginx (Reverse Proxy) │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Next.js Application   │
│   - SSR Rendering       │
│   - React Components    │
│   - API Routes          │
└────────┬────────────────┘
         │ JWT Token
         ▼
┌─────────────────────────┐
│   Backend API           │
│   (UCL Server)          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   Amazon Cognito        │
│   (Identity Validation) │
└─────────────────────────┘
```

## 🔐 Security Features

- **Token-Based Authentication**: All API requests require valid JWT tokens
- **Role-Based Access Control**: Different permissions for different user types
- **Automatic Session Management**: Token refresh and expiry handling
- **SSL/TLS Encryption**: All data transmitted over HTTPS
- **Server-Side Rendering**: Sensitive data processing on server side

## 📦 Prerequisites

- Node.js 20+ 
- npm or yarn
- Docker (for containerized deployment)
- Azure account (for cloud deployment)

## 🛠️ Installation

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/[your-username]/impact4cf.git
cd impact4cf
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=https://api.impact-dev.cs.ucl.ac.uk/
# Add other required environment variables
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Docker Deployment

1. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000` (or port 80/443 with nginx).

## 🧪 Testing

### Unit Tests
```bash
npm run test
# or for watch mode
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
The project includes comprehensive test coverage for:
- Component unit tests
- API integration tests
- E2E user flows (user management, navigation, data entry)

## 📁 Project Structure

```
impact4cf/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (dashboard)/        # Dashboard routes
│   │   ├── (treatment)/        # Treatment tracking pages
│   │   ├── (users-list)/       # User management
│   │   └── (prescription)/     # Prescription management
│   ├── views/                  # React components and views
│   ├── ui-component/          # Reusable UI components
│   ├── utils/                  # Utility functions and helpers
│   │   ├── axiosAuth.ts       # JWT token management
│   │   └── route-guard/       # Authentication guards
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Redux store configuration
│   └── types/                  # TypeScript type definitions
├── e2e/                        # Playwright E2E tests
├── public/                     # Static assets
├── docker-compose.yml          # Docker configuration
├── nginx/                      # Nginx configuration
└── package.json               # Project dependencies
```

## 🔑 Key Modules

### User Management (`/users-list`)
- View all system users with role-based filtering
- Add/edit/delete users with Cognito integration
- Manage user roles and permissions

### Treatment Overview (`/[userId]/all`)
- Server-side rendered patient data
- Weekly treatment summary with real-time updates
- Interactive breath data visualization using ApexCharts

### Prescription Management (`/users/[userId]/prescription`)
- Configure treatment parameters
- Set daily session targets
- Define breath requirements

### Analytics Dashboard (`/dashboard`)
- Real-time participant statistics
- Treatment adherence metrics
- Week-over-week comparisons

## 🌐 API Integration

The application integrates with a backend API for:
- User authentication and management (via Cognito)
- Treatment data storage and retrieval
- Prescription configuration
- Analytics and reporting

Base API URL: `https://api.impact-dev.cs.ucl.ac.uk/`

## 📊 User Roles & Permissions

```typescript
const Roles = {
    SUPER_USER: 'super_user',   // Full system access
    RESEARCHER: 'researcher',    // Research data access
    CLINICIAN: 'clinician',     // Patient management
    PATIENT: 'patient'          // Personal data only
}
```

## 🚢 Production Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Docker Production with SSL
```bash
docker build -t impact4cf .
docker run -p 443:443 impact4cf
```

### Azure Deployment Configuration
Update domain in `docker-compose.yml`:
```yaml
environment:
  DOMAIN_NAME: your-azure-domain.uksouth.cloudapp.azure.com
```

## 📝 Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle with optimization
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code quality checks
- `npm run test` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright E2E tests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for UCL (University College London).

## 👥 Team

Developed by the UCL Computer Science team for the ImpACT4CF research project.

## 📞 Support

For issues or questions, please contact the development team or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- UCL Computer Science Department
- Cystic Fibrosis research team
- NHS Healthcare professionals
- All contributors and testers

---

**⚠️ Important**: This is a healthcare application handling sensitive patient data. Please ensure all security protocols and data protection regulations (GDPR, NHS Data Security Standards) are followed when deploying or modifying this system.

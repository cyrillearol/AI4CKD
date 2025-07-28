# AI4CKD - Chronic Kidney Disease Management System

## Overview

AI4CKD is a comprehensive web application designed for managing patients with Chronic Kidney Disease (CKD). It's built as a full-stack TypeScript application with a React frontend and Express backend, specifically developed for the AI4CKD hackathon program. The system provides intelligent alert monitoring and automated PDF report generation for medical professionals.

**Current Status (July 2024):** 
- ✅ Complete authentication system with secure user registration/login
- ✅ Real-time alert system operational with automatic detection
- ✅ Medical dashboard with patient management capabilities
- ✅ PostgreSQL database with sample data loaded
- ✅ Demo user: dr.kouakou / medecin2024
- ✅ Full CRUD operations for patients and consultations
- ✅ Enhanced PDF generation with professional formatting using PDFKit
- ✅ Patient details page with complete medical history
- ✅ Edit/delete functionality for all entities

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical theme variables
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Validation**: Zod schemas shared between client and server
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple

### Database Design
- **Patients Table**: Core patient information including demographics and CKD stage
- **Consultations Table**: Medical consultation records with clinical measurements
- **Alerts Table**: Automated alert system for critical values
- **Alert Thresholds Table**: Configurable thresholds for alert generation

## Key Components

### 1. Intelligent Alert System
- **Real-time Monitoring**: Automatically detects abnormal clinical values during consultation entry
- **Alert Types**: Creatinine levels, blood pressure, and weight loss monitoring
- **Severity Levels**: Critical, high, and warning classifications with visual indicators
- **Customizable Thresholds**: Global and patient-specific alert thresholds
- **Alert Management**: Mark alerts as read/unread with persistent state

### 2. PDF Report Generation
- **Patient Reports**: Complete medical dossier including patient info, medical history, consultations, and alerts
- **Real-time Generation**: On-demand PDF creation using PDFKit
- **Medical Format**: Structured reports suitable for clinical use
- **Download Functionality**: Direct download from patient interface

### 3. Patient Management
- **Comprehensive Profiles**: Demographics, medical history, and CKD staging
- **Search and Filter**: Patient lookup by name with real-time filtering
- **Consultation History**: Complete timeline of medical visits and measurements

### 4. Dashboard Interface
- **Medical Theme**: Professional blue/green color scheme optimized for healthcare
- **Statistics Overview**: Real-time counts of patients, consultations, and active alerts
- **Recent Activity**: Latest consultations and critical alerts
- **Quick Actions**: Fast access to common tasks like adding consultations

## Data Flow

1. **Consultation Entry**: Medical staff enters patient consultation data through forms
2. **Alert Processing**: System automatically evaluates entered values against thresholds
3. **Alert Generation**: Critical values trigger immediate alert creation with severity classification
4. **Real-time Updates**: Dashboard and alert counters update automatically via React Query
5. **PDF Generation**: On-demand report generation pulls complete patient data and formats for medical use

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **pdfkit**: PDF document generation
- **zod**: Runtime type validation

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Medical and general icons
- **wouter**: Lightweight routing

## Deployment Strategy

### Development
- **Local Development**: Vite dev server with hot reload
- **Database**: Neon serverless PostgreSQL with environment-based connection
- **Build Process**: TypeScript compilation with path mapping support

### Production
- **Build Process**: 
  - Frontend: Vite build outputting to `dist/public`
  - Backend: esbuild bundling server code to `dist/index.js`
- **Deployment**: Single node process serving both static files and API
- **Database**: Production Neon database via DATABASE_URL environment variable
- **Session Storage**: PostgreSQL-based sessions for production scalability

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Path Mapping**: Shared TypeScript paths for frontend (`@/*`) and shared code (`@shared/*`)
- **Database Migrations**: Drizzle Kit for schema management and migrations
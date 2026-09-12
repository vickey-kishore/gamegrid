# GameGrid Next.js Migration - Setup Instructions

## Project Overview
This is a complete migration of the GameGrid tournament and auction management platform from a React + Spring Boot architecture to a modern Next.js + Supabase stack.

## Tech Stack
- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API

## Quick Start

### 1. Install Dependencies
```bash
cd nextjs-gamegrid
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Note**: The app will run in "Demo Mode" without Supabase configuration. To enable full functionality, follow the Supabase setup below.

## Supabase Setup (Optional but Recommended)

### 1. Create Supabase Project
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings and copy:
   - Project URL
   - Anon Key (public)

### 2. Environment Configuration
Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the SQL schema in your Supabase SQL Editor (copy contents of `supabase-schema.sql`).

### 4. Restart Development Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## Key Features Implemented

### Authentication
- User registration and login via Supabase Auth
- Protected routes with middleware
- User context throughout the application
- Demo mode when Supabase is not configured

### Core Pages
- **Dashboard** (`/`) - Overview of tournaments and auctions with calendar widget
- **Tournaments** (`/tournaments`) - List and manage tournaments
- **Auctions** (`/auctions`) - List and manage auctions
- **Create Tournament** (`/tournaments/create`) - Form to create new tournaments
- **Create Auction** (`/auctions/create`) - Form to create new auctions with team configuration
- **Login** (`/login`) - Authentication page

### Components
- **MainLayout** - Consistent layout with sidebar and header
- **Sidebar** - Navigation with collapsible design
- **Header** - Search and user profile with authentication
- **Button** - Reusable button component with variants
- **ConfigNotice** - Helpful configuration notice for demo mode

### Database Schema
- `auctions` - Tournament auction data
- `auction_teams` - Teams participating in auctions
- `players` - Player database
- `auction_players` - Players in specific auctions
- `bids` - Bidding history
- `tournaments` - Tournament management
- `tournament_fixtures` - Match fixtures
- `auction_event_categories` - Reference data for event types
- `roster_category_constraints` - Reference data for roster rules

## Migration Notes

### What Changed
1. **Backend Removal**: Spring Boot backend completely replaced with Supabase
2. **UI Framework**: Material-UI replaced with Tailwind CSS
3. **API Layer**: Axios HTTP calls replaced with Supabase client
4. **Authentication**: Custom auth replaced with Supabase Auth
5. **Routing**: React Router replaced with Next.js App Router
6. **Styling**: Custom Material-UI theme replaced with Tailwind utilities

### What Remains the Same
1. **Core Functionality**: All business logic preserved
2. **Data Models**: Database schema closely matches original JPA entities
3. **User Experience**: Similar look and feel with modern styling
4. **Features**: Tournament management, auction system, team rosters

## Demo Mode vs Full Mode

### Demo Mode (No Supabase Configuration)
- App runs without authentication
- UI components are fully functional
- Forms work but don't persist data
- Shows configuration notice with setup instructions
- Perfect for UI testing and development

### Full Mode (With Supabase Configuration)
- Full authentication with Supabase Auth
- Data persistence in PostgreSQL
- Real database operations
- Protected routes and user management
- Production-ready functionality

## Next Steps

### To Complete the Migration:

1. **Set up Supabase project** and configure environment variables
2. **Run the database schema** in Supabase SQL Editor
3. **Test authentication flow** (register/login)
4. **Create test data** using the UI forms
5. **Implement remaining views** from the original application:
   - Auction dashboard with live bidding (`/auctions/[id]/dashboard`)
   - Team rosters view (`/auctions/[id]/rosters`)
   - Tournament detail view with fixtures (`/tournaments/[id]`)
   - Player import functionality
   - Auction edit functionality (`/auctions/[id]/edit`)

### Additional Enhancements:

1. **Real-time updates**: Implement Supabase real-time subscriptions for live bidding
2. **File uploads**: Add Supabase Storage for team logos and player images
3. **Advanced filtering**: Implement search and filtering for tournaments/auctions
4. **Data validation**: Add form validation with Zod
5. **Error handling**: Improve error boundaries and user feedback
6. **Performance**: Add loading states and optimistic updates

## Troubleshooting

### Environment Variables Not Loading
- Ensure `.env.local` is in the project root
- Restart the development server after adding variables

### Database Connection Issues
- Verify Supabase URL and anon key are correct
- Check Supabase project status (should be active)
- Ensure RLS policies allow read access

### Authentication Issues
- Check Supabase Auth settings
- Verify email confirmation settings in Supabase
- Check middleware configuration

### Styling Issues
- Ensure Tailwind CSS is properly configured
- Check that `globals.css` is imported in layout
- Verify Tailwind class names are correct

### Hydration Errors
- The app uses `useMemo` for date formatting to prevent hydration mismatches
- If you encounter hydration errors, check for client/server-only code

## File Structure

```
nextjs-gamegrid/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── auctions/          # Auction pages
│   │   │   ├── page.tsx       # Auctions list
│   │   │   └── create/        # Create auction form
│   │   ├── tournaments/       # Tournament pages
│   │   │   ├── page.tsx       # Tournaments list
│   │   │   └── create/        # Create tournament form
│   │   ├── login/             # Authentication page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page (dashboard)
│   │   ├── globals.css        # Global styles
│   │   └── middleware.ts      # Auth middleware
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   │   └── AuthContext.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── ui/                # UI components
│   │   │   ├── Button.tsx
│   │   │   └── ConfigNotice.tsx
│   │   └── views/             # Page views
│   │       └── HomeDashboardView.tsx
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── supabase-server.ts # Server-side Supabase client
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
├── supabase-schema.sql        # Database schema
├── package.json
└── SETUP.md                   # This file
```

## Current Status

✅ **Completed:**
- Next.js project setup with TypeScript and Tailwind CSS
- Supabase client configuration (client and server)
- Database schema design matching original entities
- Layout components (Sidebar, Header, MainLayout)
- UI components (Button, ConfigNotice)
- Authentication system with Supabase Auth
- Core pages (Dashboard, Tournaments, Auctions)
- Create forms for tournaments and auctions
- Demo mode for development without Supabase
- Responsive design with mobile support

🚧 **Partially Completed:**
- Basic CRUD operations for tournaments and auctions
- Team configuration in auction creation

⏳ **To Be Implemented:**
- Auction dashboard with live bidding interface
- Team rosters view
- Tournament detail view with fixtures
- Player import functionality
- Edit forms for tournaments and auctions
- Real-time bidding updates
- File upload for team logos and player images

## Support

For issues or questions about the migration, refer to:
- Next.js documentation: https://nextjs.org/docs
- Supabase documentation: https://supabase.com/docs
- Tailwind CSS documentation: https://tailwindcss.com/docs

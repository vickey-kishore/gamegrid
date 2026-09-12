# Permission System Documentation

## Overview

This application implements a hierarchical permission system with three levels:

1. **Master Admin (role: 'admin')** - Full control over all resources
2. **Resource Owners (role: 'creator')** - Control over resources they create
3. **Regular Users (role: 'player')** - View-only access, can manage their own registrations

## Setting Up the Master Admin

### Step 1: Sign Up or Sign In

First, create an account through the application's login page at `/login`.
A profile will be automatically created in the `profiles` table with a default role of 'player'.

### Step 2: Set Admin Role in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **profiles**
3. Find your user's profile (by email or ID)
4. Click on the profile to edit
5. Change the `role` field from 'player' to 'admin'
6. Click **Save**

### Step 3: Verify

Refresh your application. The user should now have admin privileges with:

- Access to create auctions and tournaments
- Ability to edit/delete any auction or tournament (not just their own)
- Full control over all resources

## Role-Based Access Control

### Master Admin (admin)

- Can create, edit, and delete any auction or tournament
- Full access to all features
- Overrides resource ownership checks

### Resource Owners (creator)

- Can create auctions and tournaments
- Can only edit/delete resources they created (where `user_id` matches their user ID)
- Cannot modify resources created by others

### Regular Users (player)

- Can view all auctions and tournaments
- Cannot create, edit, or delete resources
- Can manage their own registrations (when implemented)

## Database Schema

### profiles table

- `id` (UUID, primary key) - References `auth.users(id)`
- `email` (TEXT) - User's email
- `name` (TEXT) - User's display name
- `role` (TEXT) - User's role: 'admin', 'creator', or 'player' (default: 'player')
- `created_at` (TIMESTAMP) - Profile creation time
- `updated_at` (TIMESTAMP) - Last update time

### auctions table

- `user_id` (UUID, nullable) - References `auth.users(id)` - tracks ownership

### tournaments table

- `user_id` (UUID, nullable) - References `auth.users(id)` - tracks ownership

## Automatic Profile Creation

When a new user signs up, a database trigger automatically creates a profile in the `profiles` table with:

- The user's ID from `auth.users`
- The user's email
- The user's name (from signup metadata)
- Default role of 'player'

This happens via the `handle_new_user()` function and `on_auth_user_created` trigger.

## RLS Policies

Row Level Security policies enforce permissions at the database level:

### Profiles

- **Read**: Users can only view their own profile
- **Update**: Users can update their own profile
- **Role Update**: Only admins can change roles

### Auctions

- **Read**: All users can read all auctions
- **Insert**: Users can only insert auctions with their own `user_id`
- **Update/Delete**: Users can update/delete their own auctions OR if they are admin (checked via profiles table)

### Tournaments

- **Read**: All users can read all tournaments
- **Insert**: Users can only insert tournaments with their own `user_id`
- **Update/Delete**: Users can update/delete their own tournaments OR if they are admin (checked via profiles table)

## Utility Functions

The `src/lib/permissions.ts` file provides helper functions:

```typescript
isMasterAdmin(user); // Check if user is admin
isResourceOwner(user, resourceUserId); // Check if user owns the resource
canManageResource(user, resourceUserId); // Check if user can manage (admin OR owner)
canCreateResource(user); // Check if user can create resources (admin OR creator)
```

## Implementation in Components

### Protecting Create Pages

```typescript
useEffect(() => {
  if (!authLoading && user && !canCreateResource(user)) {
    setPermissionDenied(true);
    router.push("/");
  }
}, [user, authLoading, router]);
```

### Conditionally Showing Edit/Delete Buttons

```typescript
{canManageResource(user, auction.user_id) && (
  <>
    <Button onClick={handleEdit}>Edit</Button>
    <Button onClick={handleDelete}>Delete</Button>
  </>
)}
```

### Setting Ownership on Create

```typescript
await supabase.from("auctions").insert({
  ...formData,
  user_id: user?.id, // Automatically set current user as owner
});
```

## Security Notes

- Permission checks are enforced both in the UI (for UX) and at the database level (RLS policies)
- Never rely solely on UI checks - RLS policies provide the actual security
- The master admin role is checked via the `profiles` table in RLS policies
- All new users automatically get 'player' role (lowest privileges)
- Only you (as the admin) can promote users to 'creator' or 'admin' roles by editing the profiles table

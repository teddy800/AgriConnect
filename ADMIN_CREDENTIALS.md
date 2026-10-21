# 🔐 AgriConnect Admin Credentials

## Admin User Access

### Login Methods

#### Option 1: Phone Login
```
Phone Number: 0911111111
Password: password123
```

#### Option 2: Email Login
```
Email: admin@agriconnect.com
Password: password123
```

## Quick Access Guide

### Step 1: Login
1. Navigate to: http://localhost:5173/login
2. Choose login method (Phone or Email)
3. Enter credentials above
4. Click "Log in"

### Step 2: Access Admin Panel
1. After successful login, look for **"Admin Panel"** in the sidebar (Shield icon 🛡️)
2. Or navigate directly to: http://localhost:5173/admin

## Admin Dashboard Features

### 📊 Overview Tab
- Total users count
- Active listings count
- Total inquiries
- Completed deals
- User role distribution
- Verification statistics
- Activity metrics

### 👥 Users Management Tab
- View all registered users
- Search by name or phone
- Filter by role (Farmer, Buyer, Agronomist, Admin)
- Verify/unverify users with one click
- Activate/deactivate accounts
- View registration dates

### 📈 Analytics Tab
- Recent user registrations
- Platform growth tracking
- User activity trends

## Admin Powers

### User Management
✅ Verify farmer accounts
✅ Deactivate problematic users
✅ Monitor new registrations
✅ View user details

### System Monitoring
✅ Track active listings
✅ Monitor marketplace activity
✅ View inquiry statistics
✅ Calculate completion rates

### Content Moderation
✅ Remove inappropriate listings
✅ Manage user access

## Security Notes

⚠️ **Important:**
- Keep these credentials secure
- Change the default password in production
- Admin role cannot be assigned during regular registration
- Only existing admins can create new admin users (via database)

## Troubleshooting

### Can't Login?
1. Ensure you're using the correct phone format: `0911111111` (no spaces or dashes)
2. Password is case-sensitive: `password123`
3. Check if backend server is running on port 4000
4. Clear browser cache and try again

### Don't See Admin Panel?
1. Verify you're logged in as admin user
2. Check the sidebar for "Admin Panel" with shield icon
3. Refresh the page after login

## Technical Details

**User ID:** Auto-generated UUID
**Role:** admin
**Status:** Active & Verified
**Created:** Pre-seeded in database
**Permissions:** Full system access (all RBAC permissions)

---

**Last Updated:** 2026-10-21
**Platform:** AgriConnect Agricultural Marketplace
**Version:** 1.0.0

# 🔒 Login Issue Fix - AgriConnect

## Problem
You're experiencing "Too many authentication attempts" error when trying to log in.

## Root Causes Identified

### 1. Rate Limiting (429 Error)
The authentication rate limiter was set to only **5 attempts per 15 minutes** for security. You've exceeded this limit during testing.

### 2. Invalid Credentials (401 Error)
The phone number format you're using might not match the database format.

### 3. Phone Already Registered (409 Error)
When trying to register, the phone number is already in the database.

---

## ✅ SOLUTIONS

### Solution 1: Use Existing Test Accounts

The database already has test accounts. Use these credentials:

#### **Test Accounts:**
| Phone | Password | Role |
|-------|----------|------|
| `0911111111` | `password123` | Admin |
| `0922222222` | `password123` | Farmer |
| `0933333333` | `password123` | Farmer |
| `0944444444` | `password123` | Farmer |
| `0955555555` | `password123` | Farmer |

**Try logging in with:**
- Phone: `0911111111`
- Password: `password123`

---

### Solution 2: Restart Backend Server

The rate limiter uses in-memory storage (Redis is disabled). Restarting the server will **reset the rate limit counter**.

```bash
# Stop any running node processes (Ctrl+C in the terminal)
# Then restart:
cd backend
npm run dev
```

---

### Solution 3: Increased Rate Limit (Applied)

I've updated the rate limiter configuration:
- **Development**: 20 attempts per 15 minutes
- **Production**: 5 attempts per 15 minutes (for security)

The backend needs to be restarted for this change to take effect.

---

### Solution 4: Wait 15 Minutes

If you can't restart the server, wait 15 minutes for the rate limit to reset automatically.

---

### Solution 5: Create New Account with Different Phone

If you want to create a new account, use a phone number that's NOT in the database:

**Available phone format:** `09XXXXXXXX` or `07XXXXXXXX` (10 digits)

Example new account:
- Phone: `0988888888`
- Password: `yourpassword`
- Full Name: `Your Name`
- Role: Farmer or Buyer

---

## 🔧 Quick Fix Steps

### Step 1: Stop Backend Server
Press `Ctrl+C` in the terminal where the backend is running.

### Step 2: Restart Backend
```bash
cd backend
npm run dev
```

### Step 3: Try Login Again
Use one of the test accounts:
- Phone: `0911111111`
- Password: `password123`

---

## 📋 Verification Checklist

- [ ] Backend server is running (check http://localhost:4000/api/health)
- [ ] Frontend is running (check http://localhost:5173)
- [ ] Using correct phone format (10 digits starting with 09 or 07)
- [ ] Using test account credentials from above
- [ ] Rate limit has been reset (server restarted or 15 minutes passed)

---

## 🐛 Still Having Issues?

### Check Backend Console for Errors
Look for error messages in the backend terminal.

### Check Network Tab in Browser
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Try to log in
4. Check the `/api/auth/login` request
5. Look at the response

### Common Error Messages:

| Error | Meaning | Solution |
|-------|---------|----------|
| 401 | Invalid credentials | Check phone/password |
| 409 | Phone already exists | Use different phone for registration |
| 429 | Too many attempts | Restart server or wait 15 minutes |
| 500 | Server error | Check backend logs |

---

## 🔐 Security Note

The strict rate limiting (5 attempts) is intentional for production to prevent brute force attacks. In development, we've increased it to 20 attempts for convenience.

---

## 📞 Test Account Summary

**Easiest way to test:** Use admin account
```
Phone: 0911111111
Password: password123
```

This will log you in immediately and bypass all rate limiting issues!

---

**Updated:** October 20, 2026
**Status:** ✅ Rate limiter updated, restart required

# 🚀 START HERE - Quick Setup Guide

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Start Backend** 

Open **Terminal 1** and run:

```bash
cd "E:\PROJECTS\Bus_Tracker-main\Smart-Bus-Tracking-System\backend"
python app.py
```

✅ You should see:
```
* Running on http://127.0.0.1:5000
```

---

### **Step 2: Start React App**

Open **Terminal 2** and run:

```bash
cd "D:\pbl projects\Bus_Tracker\bus-tracker-react"
npm run dev
```

✅ You should see:
```
➜  Local:   http://localhost:5173/
```

**IMPORTANT:** If React was already running, **restart it** (Ctrl+C, then `npm run dev`)

---

### **Step 3: Open Browser**

Navigate to: **http://localhost:5173**

---

### **Step 4: Test Login**

1. Click **"Login"** button
2. Enter your credentials
3. Click **"Login"**

**Expected:** ✅ Login works, no errors!

---

## 🎯 **What Changed**

- ✅ **Vite Proxy** - Makes backend appear on same origin
- ✅ **No CORS issues** - Browser thinks it's same-origin
- ✅ **Cookies work** - SameSite=Lax (no HTTPS needed)
- ✅ **Sessions persist** - Stays logged in after refresh

---

## 🔍 **Quick Test Checklist**

Open browser console (F12) and check:

- [ ] No CORS errors
- [ ] No cookie warnings  
- [ ] Login works
- [ ] Session persists after page refresh
- [ ] Can access profile page
- [ ] Driver dashboard works (if driver)

---

## 📁 **Files Modified**

1. ✅ `bus-tracker-react/vite.config.js` - Added proxy
2. ✅ `bus-tracker-react/src/config/config.js` - Changed API URL to `/api`
3. ✅ `backend/app.py` - Updated cookie settings to `SameSite=Lax`

---

## 🐛 **Troubleshooting**

### **Still seeing errors?**

1. **Restart Backend:** Stop (Ctrl+C) and run `python app.py`
2. **Restart React:** Stop (Ctrl+C) and run `npm run dev`
3. **Clear cookies:** F12 → Application → Storage → Clear site data
4. **Hard refresh:** Ctrl+Shift+R

---

## ✨ **All Features Available**

### **For Students:**
- ✅ Track buses on map
- ✅ View routes and stops
- ✅ Check schedules
- ✅ Register for bus service

### **For Drivers:**
- ✅ GPS tracking dashboard
- ✅ Real-time location updates
- ✅ Speed and accuracy monitoring

---

## 📚 **Documentation**

- **Full Setup:** `PROXY_SETUP_COMPLETE.md`
- **React Features:** `bus-tracker-react/README.md`
- **Environment:** `ENVIRONMENT_SETUP.md`

---

## 🆘 **Need Help?**

Check browser console (F12) for error messages and refer to `PROXY_SETUP_COMPLETE.md` for detailed troubleshooting.

---

**Ready?** Start both servers and enjoy! 🎉

**Terminal 1:** `python app.py`  
**Terminal 2:** `npm run dev`  
**Browser:** http://localhost:5173

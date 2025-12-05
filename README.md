# 🎉 Expense Manager - Expo Version

## Quick Start Guide

### ✨ The Easy Way with Expo!

This is the **Expo version** of Expense Manager - much easier to set up and run!

---

## 🚀 Installation (3 Simple Steps)

### 1️⃣ Install Dependencies
```bash
cd d:\sem7_all\Final_Moblile_appdev\ExpenseManagerExpo
npm install
```

### 2️⃣ Start Expo
```bash
npx expo start
```

### 3️⃣ Run the App

**Option A: Use Expo Go App (Easiest!)**
1. Install "Expo Go" app on your Android/iOS phone
2. Scan the QR code from terminal
3. App opens instantly!

**Option B: Android Emulator**
Press `a` in terminal after `npx expo start`

**Option C: iOS Simulator (macOS only)**
Press `i` in terminal after `npx expo start`

**Option D: Web Browser**
Press `w` in terminal after `npx expo start`

---

## 📱 Run Commands

```bash
# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS (macOS only)
npx expo start --ios

# Run on Web
npx expo start --web

# Clear cache and restart
npx expo start --clear
```

---

## ✨ What's Different from React Native CLI?

### ✅ Advantages of Expo
- **No Android Studio/Xcode required** for development
- **Instant testing** with Expo Go app on phone
- **Auto-configuration** of native modules
- **Easy permissions** - no native code needed
- **Web support** - runs in browser too!
- **Over-the-air updates** - update without app store
- **Faster development** - hot reload everywhere

### 📦 Features Working
- ✅ All features from original version
- ✅ Firebase Authentication
- ✅ Firestore Database
- ✅ Cloud Storage
- ✅ Camera & Gallery access (Expo Image Picker)
- ✅ File uploads (Expo Document Picker)
- ✅ Charts & Analytics
- ✅ Real-time sync

---

## 🔧 Configuration

### Environment Variables
The `.env` file is already configured with Firebase credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... etc
```

### App Configuration
Edit `app.json` to customize:
- App name
- Bundle identifier
- Splash screen
- Icon
- Permissions

---

## 📱 Testing on Real Device

### Using Expo Go (Recommended)

1. **Install Expo Go**
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Connect to Same Network**
   - Ensure phone and computer on same WiFi

3. **Scan QR Code**
   - Run `npx expo start`
   - Scan QR code with Expo Go app
   - App opens instantly!

---

## 🏗️ Building for Production

### Android APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build APK
eas build --platform android --profile preview
```

### iOS App (macOS only)
```bash
eas build --platform ios --profile preview
```

### Submit to App Stores
```bash
# Android
eas submit --platform android

# iOS
eas submit --platform ios
```

---

## 📊 Features

### ✅ Fully Working
- User authentication (Signup/Login)
- Add expenses with camera/gallery/file
- 10 expense categories
- 3 expense types (Personal/Business/Reimbursable)
- GST tracking
- Dashboard with pie charts
- Filter expenses
- Delete expenses
- Reports & analytics
- Real-time Firebase sync
- Professional UI/UX

### 📸 Camera & File Features (Expo)
- **Expo Image Picker** - Camera & gallery access
- **Expo Document Picker** - File uploads (PDF, images)
- **Auto permissions** - Expo handles permissions
- **Cross-platform** - Works on Android, iOS, Web

---

## 🎨 UI Components

Same professional design as React Native CLI version:
- Clean, modern interface
- Blue color scheme (#3B82F6)
- Smooth animations
- Consistent typography
- Professional cards and buttons

---

## 🔥 Firebase Integration

Same Firebase backend:
- Authentication
- Firestore Database
- Cloud Storage
- Real-time updates

Configuration in `src/config/firebase.js` using Expo Constants.

---

## 📂 Project Structure

```
ExpenseManagerExpo/
├── App.js                    → Main app entry (Expo)
├── app.json                  → Expo configuration
├── .env                      → Environment variables
├── package.json              → Dependencies
│
├── src/
│   ├── components/common/    → Reusable components
│   ├── config/firebase.js    → Firebase config (Expo)
│   ├── constants/            → App constants
│   ├── contexts/             → React contexts
│   ├── navigation/           → Navigation (Emoji icons)
│   ├── screens/              → All screens
│   ├── theme/                → Design system
│   └── utils/                → Helper functions
│
└── assets/                   → App icons & splash
```

---

## 🐛 Troubleshooting

### "Unable to resolve module"
```bash
npx expo start --clear
```

### "No connected devices"
- Ensure phone and PC on same WiFi
- Restart Expo Go app
- Restart Metro bundler

### Camera/Gallery not working
- Permissions are auto-requested by Expo
- Allow permissions when prompted
- On iOS simulator, use Photos app

### Firebase errors
- Check `.env` file exists
- Verify Firebase config in `app.json`
- Restart with `npx expo start --clear`

---

## 💡 Development Tips

### Hot Reload
- Shake device to open developer menu
- Enable "Fast Refresh" for instant updates

### Debug Menu
- Shake device → "Debug Remote JS"
- Opens Chrome DevTools

### View Logs
- Terminal shows all console logs
- Use `console.log()` for debugging

---

## 🌐 Web Version

Expo supports web out of the box!

```bash
npx expo start --web
```

Runs in browser at `http://localhost:8081`

**Note:** Camera features work differently on web (uses browser APIs).

---

## 📦 Dependencies

### Core
- expo ~54.0.0
- react-native (via Expo)
- react-navigation

### Expo Modules
- expo-image-picker → Camera & gallery
- expo-document-picker → File uploads
- expo-constants → Environment config

### Firebase
- firebase (Web SDK)
- All features via JavaScript SDK

### UI & Utils
- formik, yup → Forms
- date-fns → Dates
- react-native-chart-kit → Charts

---

## 🎯 Next Steps

1. ✅ Install Expo Go on your phone
2. ✅ Run `npx expo start`
3. ✅ Scan QR code
4. ✅ Create account
5. ✅ Add your first expense!

---

## 🆚 Expo vs React Native CLI

| Feature | Expo | RN CLI |
|---------|------|--------|
| Setup | ✅ Easy | ❌ Complex |
| Testing | ✅ Expo Go | ❌ Emulator only |
| Native Code | ❌ Limited | ✅ Full access |
| Web Support | ✅ Yes | ❌ No |
| OTA Updates | ✅ Yes | ❌ No |
| Build Time | ⚡ Fast | 🐌 Slow |

**For this app:** Expo is perfect! All features work without custom native code.

---

## 📚 Documentation

All documentation from the original version applies:
- **Features** - Same 30+ features
- **Design** - Same professional UI
- **Firebase** - Same backend
- **Screens** - Same 7 screens

The only difference is the **easier setup and deployment!**

---

## 🎉 Enjoy Your Expo App!

**Advantages:**
- ⚡ Faster development
- 📱 Test on real device instantly
- 🌐 Web support included
- 🔄 OTA updates
- 🛠️ Less configuration

**Run now:**
```bash
npx expo start
```

Then scan QR code with Expo Go app!

---

**Built with ❤️ using Expo & Firebase**

*Easier, faster, better! 🚀*

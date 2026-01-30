# Using Your Own Logo

The app shows your logo in the header and on login/signup. The iOS app (Capacitor) loads the site from Vercel, so the logo must be available at your deployed URL.

## 1. In-app logo (web + iOS)

1. **Replace the logo file**  
   Put your logo at **`public/logo.png`**.  
   - Use a **PNG** (transparent background works best).  
   - Recommended size: **at least 512×512** (or 1024×1024 for best quality).

2. **Set the app URL for iOS**  
   So the logo loads correctly in the iOS app, set this in **Vercel** (Project → Settings → Environment Variables):

   - **Name:** `NEXT_PUBLIC_APP_URL`  
   - **Value:** `https://learning-log-app.vercel.app`  
   - (Use your real Vercel URL if it’s different.)

   Redeploy after adding the variable.

## 2. iOS home screen app icon

The icon on the iPhone home screen is **not** the same file as `public/logo.png`. To use your logo as the app icon:

1. Export your logo as a **1024×1024 PNG** (no transparency for the icon; Apple recommends a solid background).
2. Replace this file with your image:
   ```
   ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
   ```
3. In Xcode: open the project → **Product → Clean Build Folder** → build and run again.

You can use the same logo for both; just ensure the iOS icon is 1024×1024 and meets [Apple’s app icon guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons).

# Publishing / updating Panchāṅga on Google Play

The `android/` folder is a ready Android app that opens the live site
(`https://indianpanchang.com`). Publishing web changes updates the app content
instantly — you only need a new Play upload when app settings, icons, or the
version change.

## One-time setup

1. Install **Android Studio** on your computer.
2. Have a **Google Play Console** account ($25 one-time).
3. Download this project (Lovable → GitHub / export) so `android/` is on your machine.

## Build an upload file

```bash
npm install
npm run cap:sync
npm run cap:open      # opens Android Studio
```

In Android Studio: **Build → Generate Signed App Bundle / APK → Android App Bundle**.

- First release: create a new keystore and **back it up safely** — every future
  update must be signed with the same one.
- Output: `android/app/release/app-release.aab`.

## Upload

- Play Console → your app → **Production → Create new release** → upload the `.aab`.
- Fill in release notes, then roll out.

## Updating an existing listing

Before each new build, bump both values in `android/app/build.gradle`:

```
versionCode 2        // must increase every upload
versionName "1.1"    // shown to users
```

Then rebuild the signed bundle with the same keystore and upload it as a new release.

## App identity

- Package / application ID: `com.indianpanchang.app` (never change after first release)
- App name: `Panchāṅga` (`android/app/src/main/res/values/strings.xml`)
- Icons: replace `android/app/src/main/res/mipmap-*` files, or use Android Studio's
  Image Asset tool with `public/app-icon-192.png`.

## Review risk

Google may reject apps that are only a website wrapper. Reminders/notifications,
offline support, and location-based sunrise times are already part of the app —
mention these in the listing. Adding real push notifications is the strongest
next step if a reviewer pushes back.

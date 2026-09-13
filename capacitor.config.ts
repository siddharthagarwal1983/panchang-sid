import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.indianpanchang.app",
  appName: "Panchāṅga",
  // The app loads the live site, so published web updates reach users instantly.
  webDir: "public",
  server: {
    url: "https://indianpanchang.com",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;

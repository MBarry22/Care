export default {
  expo: {
    name: "SeniorCare Connect",
    slug: "seniorcare-connect",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Update this with your computer's IP address
      // Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.XXX:3000/api"
    }
  }
};

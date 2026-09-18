import * as NativeSplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    View,
} from "react-native";

type SplashScreenProps = {
  onFinish?: () => void;
};

export default function SplashScreen({
  onFinish,
}: SplashScreenProps) {

  // Animation for fading everything in
  const fadeAnim = useRef(
    new Animated.Value(0)
  ).current;

  // Animation for the globe and hands
  const scaleAnim = useRef(
    new Animated.Value(0.7)
  ).current;

  useEffect(() => {

    // Let the custom splash replace Expo's native splash once JavaScript is ready.
    void NativeSplashScreen.hideAsync();

    // Start animations
    Animated.parallel([

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),

      // Globe grows slightly
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),

    ]).start();

    // Keep splash screen visible for 3 seconds
    const timer = setTimeout(() => {

      if (onFinish) {
        onFinish();
      }

    }, 3000);

    // Clean up timer
    return () => clearTimeout(timer);

  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <View style={styles.container}>

      {/* =========================
          NMU LOGO
      ========================== */}

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
          },
        ]}
      >

        <Image
          source={require("../../assets/images/nmu-logo.png")}
          style={styles.nmuLogo}
          resizeMode="contain"
        />

      </Animated.View>


      {/* =========================
          GLOBE + HANDS
      ========================== */}

      <Animated.View
        style={[
          styles.globeContainer,
          {
            opacity: fadeAnim,

            transform: [
              {
                scale: scaleAnim,
              },
            ],
          },
        ]}
      >

        <Image
          source={require("../../assets/images/globe-hands.png")}
          style={styles.globeHands}
          resizeMode="contain"
        />

      </Animated.View>

    </View>
  );
}


// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({

  // Main splash screen
  container: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "#061D2E",

    alignItems: "center",
    justifyContent: "center",

    zIndex: 999,
  },


  // NMU logo position
  logoContainer: {
    position: "absolute",

    top: 90,

    alignItems: "center",
    justifyContent: "center",
  },


  // NMU logo size
  nmuLogo: {
    width: 220,
    height: 70,
  },


  // Globe and hands container
  globeContainer: {
    alignItems: "center",
    justifyContent: "center",

    marginTop: 40,
  },


  // Globe + hands image size
  globeHands: {
    width: 320,
    height: 320,
  },

});
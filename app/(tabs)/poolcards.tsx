import AsyncStorage from "@react-native-async-storage/async-storage";
// @ts-ignore
import MaskedView from "@react-native-masked-view/masked-view";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// @ts-ignore
import jalaali from "jalaali-js";

const CARD_KEYS = ["کارت بابا", "کارت مامان", "کارت خودم", "کارت داداش"];

// شماره هفته جلالی شنبه شروع
function getJalaliWeekNumber(date: Date) {
  const { jy } = jalaali.toJalaali(date);
  const dayOfWeek = (date.getDay() + 6) % 7;
  const firstDayJalali = jalaali.toGregorian(jy, 1, 1);
  const firstDayDate = new Date(
    firstDayJalali.gy,
    firstDayJalali.gm - 1,
    firstDayJalali.gd
  );
  const diffDays = Math.floor(
    (date.getTime() - firstDayDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.floor((diffDays + dayOfWeek) / 7) + 1;
}

export default function PoolCards() {
  const [fontsLoaded] = useFonts({
    VazirRegular: require("../../assets/fonts/Vazir.ttf"),
    VazirBold: require("../../assets/fonts/Vazir-Bold.ttf"),
  });

  const [cards, setCards] = useState<{ [key: string]: boolean }>({});
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const loadCards = async () => {
      let storedCards: { [key: string]: boolean } = {};
      const today = new Date();
      const currentWeek = getJalaliWeekNumber(today);
      const lastWeek = await AsyncStorage.getItem("lastResetWeek");

      if (!lastWeek || parseInt(lastWeek) !== currentWeek) {
        for (let key of CARD_KEYS) {
          await AsyncStorage.removeItem(key);
          storedCards[key] = false;
        }
        await AsyncStorage.setItem("lastResetWeek", currentWeek.toString());
      } else {
        for (let key of CARD_KEYS) {
          const value = await AsyncStorage.getItem(key);
          storedCards[key] = value === "used";
        }
      }

      setCards(storedCards);
    };
    loadCards();
  }, []);

  const handleCardPress = async (key: string) => {
    const newCards = { ...cards, [key]: true };
    setCards(newCards);
    await AsyncStorage.setItem(key, "used");

    // افکت نئون کوتاه
    glowAnim.setValue(0);
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const resetWeek = async () => {
    let resetCards: { [key: string]: boolean } = {};
    for (let key of CARD_KEYS) {
      resetCards[key] = false;
      await AsyncStorage.removeItem(key);
    }
    await AsyncStorage.setItem(
      "lastResetWeek",
      getJalaliWeekNumber(new Date()).toString()
    );
    setCards(resetCards);
  };

  if (!fontsLoaded) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#0ff" />
        <Text style={{ color: "#0ff", marginTop: 10 }}>در حال بارگذاری...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MaskedView
        maskElement={<Text style={styles.name}>وقتت بخیر مهر 😎</Text>}
      >
        <LinearGradient
          colors={["#ff00ff", "#00ffff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </MaskedView>

      <Text style={styles.title}>کارت‌های استخر</Text>

      <View style={styles.cardsContainer}>
        {CARD_KEYS.map((key) => {
          const glow = glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.7],
          });
          return (
            <Animated.View
              key={key}
              style={[
                styles.cardWrapper,
                { shadowOpacity: cards[key] ? 0.2 : glow },
              ]}
            >
              <TouchableOpacity
                style={[styles.card, cards[key] ? styles.cardUsed : null]}
                onPress={() => handleCardPress(key)}
                disabled={cards[key]}
              >
                <Text style={styles.cardText}>{key}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetWeek}>
        <Text style={styles.resetButtonText}>ریست هفته</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333",
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontFamily: "VazirBold",
    fontSize: 36,
    color: "#deddde",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 1.2,
    fontWeight: "bold",
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    marginBottom: 30,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "VazirBold",
    textAlign: "center",
  },
  cardsContainer: {
    flexDirection: "column",
    width: "100%",
    gap: 20,
  },
  cardWrapper: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  card: {
    paddingVertical: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardUsed: {
    opacity: 0.5,
    backgroundColor: "red",
    color: "#fff",
  },
  cardText: {
    color: "#000",
    fontSize: 18,
    fontFamily: "VazirRegular",
    fontWeight: "bold",
  },
  resetButton: {
    marginTop: 25,
    paddingVertical: 15,
    paddingHorizontal: 50,
    backgroundColor: "yellow",
    borderRadius: 12,
    elevation: 3,
  },
  resetButtonText: {
    color: "#0a0a0a",
    fontSize: 18,
    fontFamily: "VazirBold",
    fontWeight: "bold",
  },
});

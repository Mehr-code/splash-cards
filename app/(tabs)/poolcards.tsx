import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import jalaali from "jalaali-js";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CARD_KEYS = [
  "کارت بابا 🧔‍♂️",
  "کارت مامان 👩",
  "کارت خودم 👽",
  "کارت داداش 👦",
];

function getJalaliWeekNumber(date) {
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

  const [cards, setCards] = useState({});
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const loadCards = async () => {
      let storedCards = {};
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

  const handleCardPress = async (key) => {
    const newCards = { ...cards, [key]: true };
    setCards(newCards);
    await AsyncStorage.setItem(key, "used");

    glowAnim.setValue(0);
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const resetWeek = async () => {
    let resetCards = {};
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
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#aaa" />
        <Text style={{ color: "#ccc", marginTop: 10 }}>در حال بارگذاری...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#121212", "#1b1b1b", "#0e0e0e"]}
      style={styles.container}
    >
      <Text style={styles.header}>وقتت بخیر مهر 😎</Text>

      <Text style={styles.title}>کارت‌های استخر</Text>

      <View style={styles.cardsContainer}>
        {CARD_KEYS.map((key) => (
          <Animated.View key={key} style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.card, cards[key] && styles.cardUsed]}
              onPress={() => handleCardPress(key)}
              disabled={cards[key]}
              activeOpacity={0.7}
            >
              <Text style={styles.cardText}>{key}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetWeek}>
        <Text style={styles.resetButtonText}>ریست هفته ♻️</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 26,
    fontFamily: "VazirBold",
    color: "#e6e6e6",
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    color: "#bbb",
    fontFamily: "VazirBold",
    textAlign: "center",
  },
  cardsContainer: {
    flexDirection: "column",
    width: "100%",
    gap: 15,
  },
  cardWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.3,
  },
  card: {
    paddingVertical: 22,
    backgroundColor: "#deddde",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
    elevation: 3,
    direction: "rtl",
  },
  cardUsed: {
    opacity: 0.6,
    backgroundColor: "#fa5d5dff",
  },
  cardText: {
    color: "#000",
    fontSize: 18,
    fontFamily: "VazirRegular",
  },
  resetButton: {
    marginTop: 35,
    paddingVertical: 12,
    paddingHorizontal: 50,
    backgroundColor: "#2b2b2b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#444",
  },
  resetButtonText: {
    color: "#ddd",
    fontSize: 16,
    fontFamily: "VazirBold",
  },
});

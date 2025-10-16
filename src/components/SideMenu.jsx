import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { ConfigurationModal } from "./configuration";

const SCREEN_WIDTH = Dimensions.get("window").width;
const ANIMATION_DURATION = 220;

const SideMenu = ({
  visible,
  onClose,
  onChangeBaby,
  onNavigateToChat,
  onNavigateToFavorites,
  onNavigateToProfile,
  onNavigateToAccount,
  onNavigateToCreateBaby,
  onNavigateToSubscription,
  onNavigateToLanguage,
  onNavigateToHelpCenter,
  onNavigateToTermsOfUse,
  onNavigateToPrivacyPolicy,
  onLogout,
  babyName = "",
  babyAgeLabel = "",
  userEmail = "",
}) => {
  const [isMounted, setIsMounted] = useState(visible);
  const [showConfigurationModal, setShowConfigurationModal] = useState(false);
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const { t } = useTranslation();

  const menuOptions = [
    {
      key: "chat",
      icon: "chatbubble-outline",
      label: t("sideMenu.chatWithLumi"),
      color: "#7BA5F2",
    },
    {
      key: "favorites",
      icon: "heart-outline",
      label: t("favorites.title"),
      color: "#F9865B",
    },
    {
      key: "profile",
      icon: "person-circle-outline",
      dynamicLabel: (name, translate) => `${translate("sideMenu.profileOf")} ${name}`,
      color: "#D9625E",
    },
    {
      key: "baby",
      icon: "person-add-outline",
      label: t("sideMenu.createBabyProfile"),
      color: "#F9A825",
    },
    {
      key: "configuration",
      icon: "settings-outline",
      label: t("sideMenu.configuration"),
      color: "#7BA5F2",
    },
  ];

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(translateX, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);
        }
      });
    }
  }, [visible, translateX]);

  if (!isMounted) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Menu Panel - Full Screen */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={["#FFF4E3", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="px-6 py-6 border-b border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-primary-500 rounded-full items-center justify-center mr-3">
                    <Text className="text-white text-xl font-bold">L</Text>
                  </View>
                  <View>
                    <Text className="text-2xl font-bold text-gray-900">
                      Lumi
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {t("sideMenu.yourParentingAssistant")}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar menú"
                >
                  <Ionicons name="arrow-back" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Baby Info Card */}
              <TouchableOpacity
                onPress={onChangeBaby}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                activeOpacity={0.8}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-secondary-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-2xl">👶</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {babyName}
                      </Text>
                      {babyAgeLabel && (
                        <Text className="text-sm text-gray-500">
                          {babyAgeLabel}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className="w-8 h-8 items-center justify-center rounded-full bg-primary-100">
                    <Ionicons name="chevron-down" size={16} color="#7BA5F2" />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Menu Options */}
            <View className="flex-1 px-6 py-6">
              <View className="space-y-2">
                {menuOptions.map((option, index) => {
                  const optionLabel =
                    typeof option.dynamicLabel === "function"
                      ? option.dynamicLabel(babyName || "tu bebé", t)
                      : option.label;

                  const handlePress = () => {
                    switch (option.key) {
                      case "favorites":
                        onClose();
                        onNavigateToFavorites?.();
                        break;
                      case "profile":
                        onClose();
                        onNavigateToProfile?.();
                        break;
                      case "configuration":
                        setShowConfigurationModal(true);
                        break;
                      case "chat":
                        onClose();
                        onNavigateToChat?.();
                        break;
                      case "baby":
                        onClose();
                        onNavigateToCreateBaby?.();
                        break;
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={option.key}
                      className="flex-row items-center p-4 rounded-2xl"
                      activeOpacity={0.7}
                      onPress={handlePress}
                      style={{
                        backgroundColor:
                          index === 0 ? "#F8FAFF" : "transparent",
                        borderWidth: index === 0 ? 1 : 0,
                        borderColor: index === 0 ? "#E5EDFF" : "transparent",
                      }}
                    >
                      <View
                        className="w-12 h-12 items-center justify-center rounded-xl mr-4"
                        style={{ backgroundColor: option.color + "15" }}
                      >
                        <Ionicons
                          name={option.icon}
                          size={24}
                          color={option.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-medium text-gray-900">
                          {optionLabel}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#D1D5DB"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Footer - Logout */}
            <View className="px-6 pb-6 border-t border-gray-100 pt-4">
              <TouchableOpacity
                className="flex-row items-center p-4 rounded-2xl"
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  onLogout?.();
                }}
                style={{ backgroundColor: "#FEF2F2" }}
              >
                <View className="w-12 h-12 items-center justify-center rounded-xl mr-4 bg-red-50">
                  <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-red-500">
                    {t("sideMenu.signOut")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FCA5A5" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Configuration Modal */}
      <ConfigurationModal
        visible={showConfigurationModal}
        onClose={() => setShowConfigurationModal(false)}
        onNavigateToProfile={() => {
          setShowConfigurationModal(false);
          onClose();
          onNavigateToProfile?.();
        }}
        onNavigateToSubscription={() => {
          setShowConfigurationModal(false);
          onClose();
          onNavigateToSubscription?.();
        }}
        onNavigateToLanguage={() => {
          setShowConfigurationModal(false);
          onClose();
          onNavigateToLanguage?.();
        }}
        onNavigateToHelpCenter={() => {
          setShowConfigurationModal(false);
          onClose();
          onNavigateToHelpCenter?.();
        }}
        onNavigateToTermsOfUse={() => {
          setShowConfigurationModal(false);
          onClose();
          onNavigateToTermsOfUse?.();
        }}
        onNavigateToPrivacyPolicy={() => {
          setShowConfigurationModal(false);
          onClose();
          onNavigateToPrivacyPolicy?.();
        }}
        userEmail={userEmail}
      />
    </View>
  );
};

export default SideMenu;

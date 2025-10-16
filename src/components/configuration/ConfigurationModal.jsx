import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import ConfigurationSection from "./ConfigurationSection";
import ConfigurationOption from "./ConfigurationOption";

const ConfigurationModal = ({
    visible,
    onClose,
    onNavigateToProfile,
    onNavigateToSubscription,
    onNavigateToLanguage,
    onNavigateToHelpCenter,
    onNavigateToTermsOfUse,
    onNavigateToPrivacyPolicy,
    userEmail = "",
}) => {
    const { t } = useTranslation();

    const accountOptions = [
        {
            id: "profile",
            icon: "person-outline",
            title: t("configuration.profile"),
            subtitle: t("configuration.profileSubtitle"),
            onPress: () => {
                onClose();
                onNavigateToProfile?.();
            },
        },
        {
            id: "subscription",
            icon: "card-outline",
            title: t("configuration.subscription"),
            subtitle: t("configuration.subscriptionSubtitle"),
            onPress: () => {
                onClose();
                onNavigateToSubscription?.();
            },
        },
    ];

    const applicationOptions = [
        {
            id: "language",
            icon: "language-outline",
            title: t("configuration.language"),
            subtitle: t("configuration.languageSubtitle"),
            onPress: () => {
                onClose();
                onNavigateToLanguage?.();
            },
        },
    ];

    const aboutOptions = [
        {
            id: "helpCenter",
            icon: "help-circle-outline",
            title: t("configuration.helpCenter"),
            subtitle: t("configuration.helpCenterSubtitle"),
            onPress: () => {
                onClose();
                onNavigateToHelpCenter?.();
            },
        },
        {
            id: "termsOfUse",
            icon: "document-text-outline",
            title: t("configuration.termsOfUse"),
            subtitle: t("configuration.termsOfUseSubtitle"),
            onPress: () => {
                onClose();
                onNavigateToTermsOfUse?.();
            },
        },
        {
            id: "privacyPolicy",
            icon: "shield-checkmark-outline",
            title: t("configuration.privacyPolicy"),
            subtitle: t("configuration.privacyPolicySubtitle"),
            onPress: () => {
                onClose();
                onNavigateToPrivacyPolicy?.();
            },
        },
    ];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-background-300">
                {/* Header */}
                <View className="bg-white border-b border-gray-200">
                    <View className="flex-row items-center justify-between px-5 py-4 ">
                        <Text className="text-xl font-semibold text-black">
                            {t("configuration.title")}
                        </Text>
                        <TouchableOpacity
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView className="flex-1 pt-5" showsVerticalScrollIndicator={false}>
                    {/* Account Section */}
                    <ConfigurationSection
                        title={t("configuration.account")}
                        subtitle={userEmail}
                    >
                        {accountOptions.map((option) => (
                            <ConfigurationOption
                                key={option.id}
                                icon={option.icon}
                                title={option.title}
                                subtitle={option.subtitle}
                                onPress={option.onPress}
                                showDivider={option.id !== "subscription"}
                            />
                        ))}
                    </ConfigurationSection>

                    {/* Application Section */}
                    <ConfigurationSection
                        title={t("configuration.application")}
                    >
                        {applicationOptions.map((option) => (
                            <ConfigurationOption
                                key={option.id}
                                icon={option.icon}
                                title={option.title}
                                subtitle={option.subtitle}
                                onPress={option.onPress}
                                showDivider={false}
                            />
                        ))}
                    </ConfigurationSection>

                    {/* About Section */}
                    <ConfigurationSection
                        title={t("configuration.about")}
                    >
                        {aboutOptions.map((option, index) => (
                            <ConfigurationOption
                                key={option.id}
                                icon={option.icon}
                                title={option.title}
                                subtitle={option.subtitle}
                                onPress={option.onPress}
                                showDivider={index !== aboutOptions.length - 1}
                            />
                        ))}
                    </ConfigurationSection>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

export default ConfigurationModal;

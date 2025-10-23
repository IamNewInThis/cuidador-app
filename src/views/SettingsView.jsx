import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { setAppLanguage } from '../lib/18n';


const SettingsView = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [modalVisible, setModalVisible] = useState(false);


    const changeLanguage = async (lang) => {
        await setAppLanguage(lang);
        setLanguageModalVisible(false);
    };


    const settingsOptions = [
        {
            id: 'account',
            icon: 'person-outline',
            title: t('settings.account') || 'Mi Cuenta',
            subtitle: t('settings.accountSubtitle') || 'Información personal y perfil',
            color: '#3B82F6',
            onPress: () => navigation.navigate('ProfileSettings'),
        },
        {
            id: 'subscription',
            icon: 'card-outline',
            title: t('settings.subscription') || 'Suscripción',
            subtitle: t('settings.subscriptionSubtitle') || 'Planes y pagos',
            color: '#F59E0B',
            onPress: () => navigation.navigate('SubscriptionView'),
        },
        {
            id: 'language',
            icon: 'language-outline',
            title: t('settings.language') || 'Idioma',
            subtitle: t('settings.languageSubtitle') || 'Español',
            color: '#10B981',
            onPress: () => {
                console.log('Navigate to language settings');
                // navigation.navigate('LanguageSettings');
                setModalVisible(true);
            },
        },
    ];

    const supportOptions = [
        {
            id: 'help',
            icon: 'help-circle-outline',
            title: t('settings.helpCenter') || 'Centro de Ayuda',
            subtitle: t('settings.helpCenterSubtitle') || 'FAQs y soporte',
            onPress: () => {
                console.log('Navigate to help center');
                // navigation.navigate('HelpCenter');
            },
        },
        {
            id: 'terms',
            icon: 'document-text-outline',
            title: t('settings.termsOfUse') || 'Términos de Uso',
            subtitle: t('settings.termsSubtitle') || 'Términos y condiciones',
            onPress: () => {
                console.log('Navigate to terms of use');
                // navigation.navigate('TermsOfUse');
            },
        },
        {
            id: 'privacy',
            icon: 'shield-checkmark-outline',
            title: t('settings.privacyPolicy') || 'Política de Privacidad',
            subtitle: t('settings.privacySubtitle') || 'Cómo usamos tus datos',
            onPress: () => {
                console.log('Navigate to privacy policy');
                // navigation.navigate('PrivacyPolicy');
                setModalVisible(true)
            },
        },
    ];

    const handleGoBack = () => {
        // Volver a Chat con el parámetro para abrir el SideMenu
        navigation.navigate('Chat', { openSideMenu: true });
    };

    return (
        <SafeAreaView className="flex-1 bg-background-300">
            {/* Header */}
            <View className="bg-white border-b border-gray-200">
                <View className="flex-row items-center justify-between px-5 py-4">
                    <TouchableOpacity
                        onPress={handleGoBack}
                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={20} color="#666" />
                    </TouchableOpacity>
                    <Text className="text-xl font-semibold text-black">
                        {t('settings.title') || 'Configuración'}
                    </Text>
                    <View className="w-8" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* User Info Card */}
                <View className="px-5 pt-5">
                    <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                        <View className="flex-row items-center">
                            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
                                <Text className="text-3xl">👤</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg font-semibold text-gray-900">
                                    {user?.user_metadata?.full_name || 'Usuario'}
                                </Text>
                                <Text className="text-sm text-gray-600">
                                    {user?.email || ''}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Settings Section */}
                <View className="px-5 pt-6">
                    <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                        {t('settings.generalSettings') || 'Configuración General'}
                    </Text>
                    <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {settingsOptions.map((option, index) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={option.onPress}
                                className="flex-row items-center p-4"
                                style={{
                                    borderBottomWidth: index < settingsOptions.length - 1 ? 1 : 0,
                                    borderBottomColor: '#F3F4F6',
                                }}
                                activeOpacity={0.7}
                            >
                                <View
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                                    style={{ backgroundColor: option.color + '15' }}
                                >
                                    <Ionicons
                                        name={option.icon}
                                        size={24}
                                        color={option.color}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-medium text-gray-900">
                                        {option.title}
                                    </Text>
                                    <Text className="text-sm text-gray-500 mt-0.5">
                                        {option.subtitle}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Support Section */}
                <View className="px-5 pt-6 pb-6">
                    <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                        {t('settings.supportAndLegal') || 'Soporte y Legal'}
                    </Text>
                    <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {supportOptions.map((option, index) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={option.onPress}
                                className="flex-row items-center p-4"
                                style={{
                                    borderBottomWidth: index < supportOptions.length - 1 ? 1 : 0,
                                    borderBottomColor: '#F3F4F6',
                                }}
                                activeOpacity={0.7}
                            >
                                <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 bg-gray-100">
                                    <Ionicons
                                        name={option.icon}
                                        size={24}
                                        color="#6B7280"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-medium text-gray-900">
                                        {option.title}
                                    </Text>
                                    <Text className="text-sm text-gray-500 mt-0.5">
                                        {option.subtitle}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Version */}
                <View className="px-5 pb-8">
                    <Text className="text-center text-sm text-gray-400">
                        Lumi v1.0.0
                    </Text>
                </View>
            </ScrollView>
            <Modal
                animationType="slide"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/40 justify-center items-center">
                    <View className="bg-white w-4/5 rounded-2xl p-6 items-center">
                        <Text className="text-lg font-semibold mb-4 text-gray-800">
                            {t('settings.selectLanguage') || 'Seleccionar idioma'}
                        </Text>

                        <TouchableOpacity
                            className="py-2 w-full items-center"
                            onPress={() => changeLanguage('es')}
                        >
                            <Text className="text-base">🇪🇸 Español</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="py-2 w-full items-center"
                            onPress={() => changeLanguage('en')}
                        >
                            <Text className="text-base">🇺🇸 English</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="py-2 w-full items-center"
                            onPress={() => changeLanguage('pt')}
                        >
                            <Text className="text-base">🇧🇷 Português</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-4 bg-gray-100 rounded-xl py-2 px-6"
                            onPress={() => setModalVisible(false)}
                        >
                            <Text className="text-gray-700 font-medium">
                                {t('common.cancel') || 'Cancelar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default SettingsView;

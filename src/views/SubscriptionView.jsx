import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const SubscriptionView = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const [selectedPlan, setSelectedPlan] = useState('monthly');

    const plans = [
        {
            id: 'monthly',
            name: t('subscription.monthlyPlan'),
            price: t('subscription.monthlyPrice'),
            period: t('subscription.perMonth'),
            description: t('subscription.monthlyDescription'),
            features: [
                t('subscription.features.unlimitedChat'),
                t('subscription.features.advancedRoutines'),
                t('subscription.features.personalizedTips'),
                t('subscription.features.prioritySupport'),
                t('subscription.features.allFeatures')
            ],
            popular: false,
        },
        {
            id: 'yearly',
            name: t('subscription.yearlyPlan'),
            price: t('subscription.yearlyPrice'),
            period: t('subscription.perYear'),
            originalPrice: t('subscription.originalYearlyPrice'),
            description: t('subscription.yearlyDescription'),
            features: [
                t('subscription.features.everythingMonthly'),
                t('subscription.features.twoMonthsFree'),
                t('subscription.features.specialistConsultations'),
                t('subscription.features.detailedReports'),
                t('subscription.features.cloudBackup'),
                t('subscription.features.betaAccess')
            ],
            popular: true,
            savings: t('subscription.savings'),
        },
        {
            id: 'premium',
            name: t('subscription.familyPlan'),
            price: t('subscription.familyPrice'),
            period: t('subscription.perYear'),
            description: t('subscription.familyDescription'),
            features: [
                t('subscription.features.everythingYearly'),
                t('subscription.features.fiveBabyProfiles'),
                t('subscription.features.familySharing'),
                t('subscription.features.monthlyFamilyAdvice'),
                t('subscription.features.specializedContent'),
                t('subscription.features.support247')
            ],
            popular: false,
        }
    ];

    const handleSelectPlan = (planId) => {
        setSelectedPlan(planId);
    };

    const handleSubscribe = () => {
        const plan = plans.find(p => p.id === selectedPlan);
        Alert.alert(
            t('subscription.confirmTitle'),
            t('subscription.confirmMessage', { plan: plan.name }),
            [{ text: t('subscription.understood'), style: 'default' }]
        );
    };

    const handleGoBack = () => {
        navigation.goBack();
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
                        {t('subscription.title')}
                    </Text>
                    <View className="w-8" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <LinearGradient
                    colors={['#7BA5F2', '#F9865B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="mx-5 mt-5 rounded-2xl p-6"
                >
                    <View className="items-center">
                        <Ionicons name="star" size={40} color="white" />
                        <Text className="text-white text-2xl font-bold mt-2 text-center">
                            {t('subscription.heroTitle')}
                        </Text>
                        <Text className="text-white/90 text-base mt-2 text-center">
                            {t('subscription.heroSubtitle')}
                        </Text>
                    </View>
                </LinearGradient>

                {/* Current Plan Status */}
                <View className="mx-5 mt-5 bg-white rounded-xl p-4 border border-gray-200">
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                        <View className="flex-1">
                            <Text className="text-gray-900 font-medium">{t('subscription.currentPlan')}</Text>
                            <Text className="text-gray-600 text-sm">
                                {t('subscription.currentPlanSubtitle')}
                            </Text>
                        </View>
                        <Ionicons name="information-circle-outline" size={20} color="#7BA5F2" />
                    </View>
                </View>

                {/* Plans */}
                <View className="mx-5 mt-6">
                    <Text className="text-xl font-bold text-gray-900 mb-4">
                        {t('subscription.choosePlan')}
                    </Text>
                    
                    {plans.map((plan, index) => (
                        <TouchableOpacity
                            key={plan.id}
                            onPress={() => handleSelectPlan(plan.id)}
                            className={`mb-4 rounded-2xl border-2 overflow-hidden ${
                                selectedPlan === plan.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-white'
                            }`}
                        >
                            {plan.popular && (
                                <View className="bg-gradient-to-r from-blue-500 to-purple-600">
                                    <LinearGradient
                                        colors={['#3B82F6', '#8B5CF6']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-2"
                                    >
                                        <Text className="text-white text-center font-medium text-sm">
                                            {t('subscription.mostPopular')}
                                        </Text>
                                    </LinearGradient>
                                </View>
                            )}
                            
                            <View className="p-5">
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-1">
                                        <Text className="text-lg font-bold text-gray-900">
                                            {plan.name}
                                        </Text>
                                        <Text className="text-gray-600 text-sm mt-1">
                                            {plan.description}
                                        </Text>
                                    </View>
                                    
                                    <View className="items-end">
                                        <View className="flex-row items-baseline">
                                            <Text className="text-2xl font-bold text-gray-900">
                                                {plan.price}
                                            </Text>
                                            <Text className="text-gray-600 text-sm ml-1">
                                                {plan.period}
                                            </Text>
                                        </View>
                                        
                                        {plan.originalPrice && (
                                            <Text className="text-gray-400 text-sm line-through">
                                                {plan.originalPrice}
                                            </Text>
                                        )}
                                        
                                        {plan.savings && (
                                            <Text className="text-green-600 text-xs font-medium">
                                                {plan.savings}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {/* Features */}
                                <View className="mt-4 space-y-2">
                                    {plan.features.map((feature, featureIndex) => (
                                        <View key={featureIndex} className="flex-row items-center">
                                            <Ionicons 
                                                name="checkmark-circle" 
                                                size={16} 
                                                color="#10B981" 
                                            />
                                            <Text className="text-gray-700 text-sm ml-2 flex-1">
                                                {feature}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Selection Indicator */}
                                {selectedPlan === plan.id && (
                                    <View className="mt-4 flex-row items-center justify-center">
                                        <Ionicons name="radio-button-on" size={20} color="#3B82F6" />
                                        <Text className="text-blue-600 font-medium ml-2">
                                            {t('subscription.planSelected')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Benefits Section */}
                <View className="mx-5 mt-6 mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-4">
                        {t('subscription.whySubscribe')}
                    </Text>
                    
                    <View className="bg-white rounded-xl p-5 border border-gray-200">
                        <View className="space-y-4">
                            <View className="flex-row">
                                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
                                    <Ionicons name="chatbubbles" size={20} color="#3B82F6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">{t('subscription.smartChat')}</Text>
                                    <Text className="text-gray-600 text-sm">
                                        {t('subscription.smartChatDesc')}
                                    </Text>
                                </View>
                            </View>
                            
                            <View className="flex-row">
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
                                    <Ionicons name="calendar" size={20} color="#F97316" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">{t('subscription.advancedTracking')}</Text>
                                    <Text className="text-gray-600 text-sm">
                                        {t('subscription.advancedTrackingDesc')}
                                    </Text>
                                </View>
                            </View>
                            
                            <View className="flex-row">
                                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-4">
                                    <Ionicons name="medical" size={20} color="#10B981" />
                                </View>
                                <View className="flex-1">
                                    <Text className="font-medium text-gray-900">{t('subscription.specializedAdvice')}</Text>
                                    <Text className="text-gray-600 text-sm">
                                        {t('subscription.specializedAdviceDesc')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Action Button */}
            <View className="bg-white border-t border-gray-200 px-5 py-4">
                <TouchableOpacity
                    onPress={handleSubscribe}
                    className="bg-blue-600 rounded-xl py-4 items-center"
                >
                    <Text className="text-white font-bold text-lg">
                        {t('subscription.subscribeButton')} {plans.find(p => p.id === selectedPlan)?.price}
                    </Text>
                </TouchableOpacity>
                
                <Text className="text-gray-500 text-center text-xs mt-3">
                    {t('subscription.disclaimer')}
                </Text>
            </View>
        </SafeAreaView>
    );
};

export default SubscriptionView;
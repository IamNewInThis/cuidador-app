import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useStripe } from '@stripe/stripe-react-native';
import { useAuth } from '../contexts/AuthContext';
import PaymentService from '../services/PaymentService';

const SubscriptionView = () => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const stripe = useStripe();
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [loading, setLoading] = useState(false);

    const plans = [
        {
            id: 'monthly',
            name: t('subscription.monthlyPlan'),
            price: '$10.00',
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
        }
    ];

    const handleSelectPlan = (planId) => {
        setSelectedPlan(planId);
    };

    const handleSubscribe = async () => {
        if (!stripe) {
            Alert.alert('Error', 'Stripe is not initialized. Please restart the app and try again.');
            return;
        }

        if (loading) return;

        const plan = plans.find(p => p.id === selectedPlan);
        if (!plan) {
            Alert.alert('Error', 'Please select a plan first.');
            return;
        }

        setLoading(true);

        try {
            // Get user info from auth context
            const userId = user?.id || 'guest-' + Date.now();
            const email = user?.email || 'guest@example.com';

            console.log('🔐 Starting subscription flow...');
            console.log('👤 User:', userId);
            console.log('📧 Email:', email);
            console.log('💳 Plan:', selectedPlan);
            
            // Step 1: prepare SetupIntent session
            console.log('📡 Requesting subscription session (SetupIntent)...');
            const setupSession = await PaymentService.createSubscriptionSession(
                selectedPlan,
                userId,
                email
            );

            console.log('✅ Setup session received:', {
                customerId: setupSession.customerId,
                hasEphemeralKey: !!setupSession.customerEphemeralKeySecret,
                hasSetupIntent: !!setupSession.setupIntentClientSecret,
                priceId: setupSession.priceId || 'price_1SIbYTPC5k9kGAvvZvy5EA36',
            });

            // Step 2: save payment method via SetupIntent + PaymentSheet
            const setupResult = await PaymentService.presentSetupPaymentSheet(
                setupSession,
                stripe,
                email
            );

            if (setupResult.canceled) {
                console.log('ℹ️ User canceled during payment method setup');
                setLoading(false);
                Alert.alert('Payment Canceled', 'No worries, you can try subscribing again whenever you want.');
                return;
            }

            console.log('💾 Payment method saved. Creating subscription...');

            // Step 3: create subscription on backend
            const subscriptionData = await PaymentService.createSubscription(
                selectedPlan,
                setupSession.customerId,
                userId,
                email
            );

            console.log('🧾 Subscription response:', {
                subscriptionId: subscriptionData.subscriptionId,
                status: subscriptionData.subscriptionStatus,
                paymentIntentStatus: subscriptionData.paymentIntentStatus,
                requiresAction: subscriptionData.requiresAction,
            });

            if (
                subscriptionData.paymentIntentStatus &&
                subscriptionData.paymentIntentStatus === 'requires_payment_method'
            ) {
                throw new Error('The saved payment method could not be used. Please try another card.');
            }

            // Step 4: confirm initial invoice payment if required
            if (subscriptionData.requiresAction) {
                console.log('⚠️ Additional confirmation required. Presenting Payment Sheet again...');
                const confirmationResult = await PaymentService.confirmSubscriptionPayment(
                    subscriptionData,
                    stripe,
                    email
                );

                if (confirmationResult.canceled) {
                    Alert.alert(
                        'Payment Incomplete',
                        'You canceled the payment confirmation. Your subscription is still pending.',
                        [{ text: 'OK' }]
                    );
                    return;
                }

                console.log('✅ Payment confirmation completed.');
            }

            // Step 5: verify final subscription status
            let subscriptionStatusDetails = null;
            try {
                subscriptionStatusDetails = await PaymentService.getSubscriptionStatus(setupSession.customerId);
            } catch (statusError) {
                console.warn('⚠️ Unable to fetch subscription status:', statusError.message);
            }

            const subscriptionId =
                subscriptionStatusDetails?.subscription?.id ||
                subscriptionData.subscriptionId;
            const subscriptionStatus =
                subscriptionStatusDetails?.status ||
                subscriptionStatusDetails?.subscription?.status ||
                subscriptionData.subscriptionStatus ||
                'active';

            console.log('🏁 Final subscription status:', {
                subscriptionId,
                subscriptionStatus,
            });

            Alert.alert(
                '🎉 Payment Successful!',
                `Welcome to Lumi ${plan.name}!\nSubscription ID: ${subscriptionId || 'N/A'}\nStatus: ${subscriptionStatus}`,
                [
                    {
                        text: 'Continue',
                        onPress: () => {
                            navigation.goBack();
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('❌ Payment error:', error);
            
            // More detailed error message
            let errorMessage = 'Something went wrong. Please try again.';
            if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert(
                'Payment Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
        }
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

                {/* Plan */}
                <View className="mx-5 mt-6">
                    <Text className="text-xl font-bold text-gray-900 mb-4">
                        {t('subscription.choosePlan') || 'Subscription Plan'}
                    </Text>
                    
                    <View className="mb-4 rounded-2xl border-2 border-blue-500 bg-white overflow-hidden">
                        <View className="p-5">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-gray-900">
                                        {plans[0].name}
                                    </Text>
                                    <Text className="text-gray-600 text-sm mt-1">
                                        {plans[0].description}
                                    </Text>
                                </View>
                                
                                <View className="items-end">
                                    <View className="flex-row items-baseline">
                                        <Text className="text-2xl font-bold text-gray-900">
                                            {plans[0].price}
                                        </Text>
                                        <Text className="text-gray-600 text-sm ml-1">
                                            {plans[0].period}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Features */}
                            <View className="mt-4 space-y-2">
                                {plans[0].features.map((feature, featureIndex) => (
                                    <View key={featureIndex} className="flex-row items-center mb-2">
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
                        </View>
                    </View>
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
                    disabled={loading}
                    className={`rounded-xl py-4 items-center ${
                        loading ? 'bg-gray-400' : 'bg-blue-600'
                    }`}
                >
                    {loading ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator color="white" size="small" />
                            <Text className="text-white font-bold text-lg ml-2">
                                Processing...
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            {t('subscription.subscribeButton') || 'Subscribe for'} $10.00/month
                        </Text>
                    )}
                </TouchableOpacity>
                
                <Text className="text-gray-500 text-center text-xs mt-3">
                    {t('subscription.disclaimer') || 'Secure payment processed by Stripe. Cancel anytime.'}
                </Text>
            </View>
        </SafeAreaView>
    );
};

export default SubscriptionView;

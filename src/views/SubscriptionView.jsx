// cuidador-app/src/views/SubscriptionView.jsx
import React, { useState, useEffect } from 'react';
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
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [cards, setCards] = useState([]);

    const fetchCards = async () => {
        if (!user) return;

        try {
            if (!user) return;
            const cardsData = await PaymentService.getCards(user.id);
            setCards(cardsData.cards ?? []);
        } catch (error) {
            console.error("❌ Error fetching cards:", error);
        }
    };

    useEffect(() => {
        const getUserAndFetchSubscription = async () => {
            try {
                if (!user) {
                    setStatus({ error: "No user authenticated" });
                    setLoading(false);
                    return;
                }

                // 🔹 2. Obtener estado de suscripción
                const baseURL = process.env.EXPO_PUBLIC_STRIPE_API_URL;
                const response = await fetch(`${baseURL}/subscription/user/${user.id}`);
                const dataResponse = await response.json();

                if (!response.ok) {
                    console.log("❌ Error en el response:", dataResponse);
                    setStatus({
                        error: dataResponse.message || "Failed to fetch subscription status",
                    });
                } else {

                    setStatus(dataResponse);
                }
            } catch (error) {
                console.error("❌ Error general:", error);
                setStatus({ error: "Network error while fetching subscription status" });
            } finally {
                setLoading(false);
            }
        };





        // 🔸 Ejecutar una sola vez al montar
        getUserAndFetchSubscription();
        fetchCards();
    }, [user?.id]);

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

    const handleAddCard = async () => {
        await PaymentService.createCardAndInitSheet(user.id, initPaymentSheet, presentPaymentSheet);
        fetchCards();
    };

    const handleDeleteCard = async (cardId) => {
        try {
            setLoading(true);
            const result = await PaymentService.deleteCard(user.id, cardId);
            if (result.success) {
                Alert.alert("✅ Tarjeta eliminada correctamente");
                fetchCards();
            } else {
                Alert.alert("⚠️ Error al eliminar la tarjeta");
            }
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCardDefault = async (cardId) => {
        try {
            setLoading(true);
            const result = await PaymentService.setDefaultCard(user.id, cardId);

            
            if (result.success) {
                Alert.alert("✅ Tarjeta predeterminada establecida correctamente");
                fetchCards();
            } else {
                Alert.alert("⚠️ Error al establecer la tarjeta predeterminada");
            }
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        // Confirmación al usuario
        Alert.alert(
            t('¿Estás seguro?'),
            t('Se cancelará tu suscripción al final del período actual.'),
            [
                {
                    text: t('volver'),
                    style: 'cancel',
                },
                {
                    text: t('confirmar'),
                    onPress: async () => await PaymentService.cancelSubscription(status.subscriptionId),
                },
            ]
        );
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
            const userName = user?.user_metadata?.full_name || 'Guest User';

            console.log('🔐 Starting subscription flow...');
            console.log('👤 User:', userId);
            console.log('👤 Name:', userName);
            console.log('📧 Email:', email);
            console.log('💳 Plan:', selectedPlan);

            // Step 1: prepare SetupIntent session
            console.log('📡 Requesting subscription session (SetupIntent)...');
            const setupSession = await PaymentService.createSubscriptionSession(
                selectedPlan,
                userId,
                email,
                userName
            );

            console.log('✅ Setup session received:', {
                customerId: setupSession.customerId,
                hasEphemeralKey: !!setupSession.customerEphemeralKeySecret,
                hasSetupIntent: !!setupSession.setupIntentClientSecret,
                priceId: setupSession.priceId || 'price_1SKlk1PC5k9kGAvvwCV6A4wv',
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

                // 🆕 Espera unos segundos antes de consultar estado
                console.log('⏳ Waiting for Stripe to finalize subscription status...');
                await new Promise(r => setTimeout(r, 3000));
            }

            // Step 5: verify final subscription status (reconsulta después de confirmar pago)
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
        // Usar goBack() para volver a SettingsView
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

                {/* Estado suscripción */}
                <View className="mx-5 mt-5 bg-white rounded-xl p-4 border border-gray-200">
                    <View className="flex-row items-center">
                        <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                        <View className="flex-1">
                            <Text className="text-gray-900 font-medium">{status?.status === 'active' ? t('Estás suscrito') : t('No estás suscrito')}</Text>
                            <Text className="text-gray-600 text-sm">
                                {status?.status === 'active' ? t('Tienes acceso a mayor cantidad de consultas') : t('No posees acceso a todo el potencial de Lumi')}
                            </Text>
                        </View>
                        <Ionicons name="information-circle-outline" size={20} color="#279608ff" />
                    </View>
                </View>
                {status?.status === 'active' && (
                    <TouchableOpacity
                        onPress={handleCancel}
                        activeOpacity={0.7}
                        className="mx-5 mt-5 bg-white rounded-xl p-4 border border-gray-200"
                    >
                        <View className="flex-row items-center">
                            <View className="w-3 h-3 bg-red-500 rounded-full mr-3" />
                            <View className="flex-1">
                                <Text className="text-gray-900 font-medium">{t("Cancelar suscripción")}</Text>
                                <Text className="text-gray-600 text-sm">
                                    {t("Seguirás teniendo acceso hasta el final del período")}
                                </Text>
                            </View>
                            <Ionicons name="close-circle" size={22} color="#FF0000" />
                        </View>
                    </TouchableOpacity>
                )}

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
                {/* Cards section */}
                <View className="mt-6">
                    {status?.status === 'active' ? (
                        <View className="mx-5 mb-6 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">

                            {/* Título */}
                            <Text className="text-lg font-bold text-gray-900 mb-4">Tarjetas guardadas</Text>

                            {/* Lista de tarjetas */}
                            {cards.length === 0 ? (
                                <Text className="text-gray-600 text-center py-4">
                                    No hay tarjetas guardadas
                                </Text>
                            ) : (
                                cards.map((card) => (
                                    <View
                                        key={card.id}
                                        className={`flex-row items-center justify-between bg-gray-50 p-4 rounded-xl border mb-3 shadow-sm 
      ${card.isDefault ? "border-blue-400" : "border-gray-100"}`}
                                    >
                                        {/* IZQUIERDA: check predeterminada */}
                                        <TouchableOpacity
                                            onPress={() => handleCardDefault(card.id)}
                                            activeOpacity={0.8}
                                            className="mr-3"
                                        >
                                            {card.isDefault ? (
                                                <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                                            ) : (
                                                <Ionicons name="ellipse-outline" size={24} color="#9CA3AF" />
                                            )}
                                        </TouchableOpacity>

                                        {/* CENTRO: datos de la tarjeta */}
                                        <View className="flex-row items-center flex-1">
                                            <Ionicons name="card" size={20} color="#4339da" className="mr-2" />
                                            <View>
                                                <Text className="font-semibold text-gray-900 text-base tracking-wider">
                                                    **** **** **** {card.last4}
                                                </Text>
                                                <Text className="text-gray-600 text-sm mt-1">
                                                    {card.brand?.toUpperCase() || "CARD"} • Exp:{" "}
                                                    {card.exp_month ? String(card.exp_month).padStart(2, "0") : "--"}/
                                                    {card.exp_year ? String(card.exp_year).slice(-2) : "--"}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* DERECHA: botón eliminar */}
                                        <TouchableOpacity
                                            onPress={() => handleDeleteCard(card.id)}
                                            activeOpacity={0.8}
                                            className="ml-3 flex-row items-center px-2 py-1 bg-red-50 rounded-lg"
                                        >
                                            <Ionicons name="trash" size={18} color="#DC2626" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                            {/* Campo para agregar nueva tarjeta */}
                            <View className="mt-4">
                                {/* Botón agregar tarjeta */}
                                <TouchableOpacity
                                    onPress={handleAddCard}
                                    activeOpacity={0.85}
                                    className="mt-2 flex-row items-center justify-center bg-blue-600 border border-blue-600 rounded-xl py-3 shadow-sm"
                                >
                                    <Ionicons
                                        name="add-circle-outline"
                                        size={22}
                                        color="white"
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text className="text-white text-base font-semibold">
                                        {t("Agregar tarjeta")}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null}
                </View>
            </ScrollView>

            {status?.status !== 'active' ? (
                <View className="bg-white border-t border-gray-200 px-5 py-4">
                    <TouchableOpacity
                        onPress={handleSubscribe}
                        disabled={loading || status?.status === 'active'}
                        className={`rounded-xl py-4 items-center ${loading ? 'bg-gray-400' : 'bg-blue-600'
                            } ${status?.status === 'active' ? 'bg-gray-400' : ''}`}
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
            ) : null}
        </SafeAreaView>
    );
};

export default SubscriptionView;

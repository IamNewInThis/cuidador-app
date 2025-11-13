// cuidador-app/src/services/PaymentService.js
class PaymentService {
    constructor() {
        // Get Stripe API URL from environment variables
        // Falls back to localhost if not set
        const stripeApiUrl = process.env.EXPO_PUBLIC_STRIPE_API_URL;
        this.merchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || 'merchant.cuidador-app';

        this.baseURL = __DEV__
            ? stripeApiUrl
            : 'http://192.168.1.8:8001/api/payments';
    }

    /**
     * Solicita al backend los datos necesarios para guardar un método de pago
     * mediante SetupIntent + Payment Sheet.
     */
    async createSubscriptionSession(planId, userId, email, userName) {
        try {
            const plan = this.getPlanDetails(planId);
            if (!plan) {
                throw new Error('Invalid plan selected');
            }

            const response = await fetch(`${this.baseURL}/create-subscription-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId,
                    userId,
                    email,
                    userName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'Failed to create subscription session');
            }

            return await response.json();
        } catch (error) {
            console.error('PaymentService - createSubscriptionSession error:', error);
            throw error;
        }
    }


    /**
     * Presenta el Payment Sheet en modo SetupIntent para guardar el método de pago.
     */
    async presentSetupPaymentSheet(sessionData, stripe, customerEmail = 'customer@example.com') {
        try {
            if (!sessionData) {
                throw new Error('Missing subscription session data');
            }

            const {
                customerId,
                customerEphemeralKeySecret,
                setupIntentClientSecret,
            } = sessionData;

            if (!customerId || !customerEphemeralKeySecret || !setupIntentClientSecret) {
                throw new Error('Incomplete subscription session data');
            }

            console.log('🧾 Initializing Payment Sheet for SetupIntent...');

            const initParams = {
                merchantDisplayName: 'Lumi Cuidador App',
                merchantCountryCode: 'US',
                customerId,
                customerEphemeralKeySecret,
                setupIntentClientSecret,
                defaultBillingDetails: {
                    email: customerEmail,
                },
                returnURL: 'cuidador-app://stripe-redirect',
                googlePay: {
                    merchantCountryCode: 'US',
                    currencyCode: 'USD',
                    testEnv: __DEV__,
                },
                applePay: {
                    merchantCountryCode: 'US',
                    ...(this.merchantIdentifier ? { merchantId: this.merchantIdentifier } : {}),
                },
                allowsDelayedPaymentMethods: true,
                appearance: {
                    colors: {
                        primary: '#3B82F6',
                        background: '#FFFFFF',
                        componentBackground: '#F3F4F6',
                        componentBorder: '#E5E7EB',
                        componentDivider: '#E5E7EB',
                        primaryText: '#111827',
                        secondaryText: '#6B7280',
                        componentText: '#111827',
                        placeholderText: '#9CA3AF',
                    },
                },
            };

            const { error: initError } = await stripe.initPaymentSheet(initParams);

            if (initError) {
                console.error('❌ Payment Sheet init (setup) error:', initError);
                throw new Error(initError.message || initError.code || 'Failed to initialize Payment Sheet');
            }

            const presentResult = await stripe.presentPaymentSheet();

            if (presentResult.error) {
                if (presentResult.error.code === 'Canceled') {
                    return { success: false, canceled: true };
                }

                throw new Error(presentResult.error.message || presentResult.error.code);
            }

            return { success: true };
        } catch (error) {
            console.error('PaymentService - presentSetupPaymentSheet error:', error);
            throw error;
        }
    }

    /**
     * Crea la suscripción en Stripe tras guardar el método de pago del cliente.
     */
    async createSubscription(planId, customerId, userId, email) {
        try {
            const plan = this.getPlanDetails(planId);
            if (!plan) {
                throw new Error('Invalid plan selected');
            }

            const response = await fetch(`${this.baseURL}/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId,
                    customerId,
                    userId,
                    email,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'Failed to create subscription');
            }

            return await response.json();
        } catch (error) {
            console.error('PaymentService - createSubscription error:', error);
            throw error;
        }
    }

    /**
     * Confirma el PaymentIntent inicial en caso de que Stripe requiera acción adicional.
     */
    async confirmSubscriptionPayment(subscriptionData, stripe, customerEmail = 'customer@example.com') {
        try {
            if (!subscriptionData) {
                throw new Error('Missing subscription confirmation data');
            }

            const {
                paymentIntentClientSecret,
                paymentIntentStatus,
                customerId,
                customerEphemeralKeySecret,
            } = subscriptionData;

            if (!paymentIntentClientSecret) {
                return { success: true, skipped: true };
            }

            if (!customerId || !customerEphemeralKeySecret) {
                throw new Error('Missing customer data to confirm subscription payment');
            }

            if (paymentIntentStatus && !['requires_action', 'requires_payment_method', 'requires_confirmation'].includes(paymentIntentStatus)) {
                return { success: true, alreadyConfirmed: true };
            }

            console.log('🔁 Initializing Payment Sheet for subscription confirmation...');

            const initParams = {
                merchantDisplayName: 'Lumi Cuidador App',
                merchantCountryCode: 'US',
                customerId,
                customerEphemeralKeySecret,
                paymentIntentClientSecret,
                defaultBillingDetails: {
                    email: customerEmail,
                },
                returnURL: 'cuidador-app://stripe-redirect',
                googlePay: {
                    merchantCountryCode: 'US',
                    currencyCode: 'USD',
                    testEnv: __DEV__,
                },
                applePay: {
                    merchantCountryCode: 'US',
                    ...(this.merchantIdentifier ? { merchantId: this.merchantIdentifier } : {}),
                },
                allowsDelayedPaymentMethods: true,
                appearance: {
                    colors: {
                        primary: '#3B82F6',
                        background: '#FFFFFF',
                        componentBackground: '#F3F4F6',
                        componentBorder: '#E5E7EB',
                        componentDivider: '#E5E7EB',
                        primaryText: '#111827',
                        secondaryText: '#6B7280',
                        componentText: '#111827',
                        placeholderText: '#9CA3AF',
                    },
                },
            };

            const { error: initError } = await stripe.initPaymentSheet(initParams);

            if (initError) {
                console.error('❌ Payment Sheet init (confirmation) error:', initError);
                throw new Error(initError.message || initError.code || 'Failed to initialize Payment Sheet for confirmation');
            }

            const presentResult = await stripe.presentPaymentSheet();

            if (presentResult.error) {
                if (presentResult.error.code === 'Canceled') {
                    return { success: false, canceled: true };
                }

                throw new Error(presentResult.error.message || presentResult.error.code);
            }

            return { success: true };
        } catch (error) {
            console.error('PaymentService - confirmSubscriptionPayment error:', error);
            throw error;
        }
    }

    async cancelSubscription(subscriptionId) {
        if (!subscriptionId) {
            throw new Error('subscriptionId is required to cancel subscription');
        }
        const response = await fetch(`${this.baseURL}/subscription/cancel/${subscriptionId}`, {
            method: 'POST',
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to cancel subscription');
        }
        return await response.json();
    }
    /**
     * Obtiene el estado actual de la suscripción en Stripe para un cliente.
     */
    async getSubscriptionStatus(userId) {
        if (!userId) {
            throw new Error('userId is required to fetch subscription status');
        }

        const response = await fetch(`${this.baseURL}/subscription/user/${userId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to fetch subscription status');
        }

        return await response.json();
    }

    // PaymentService.js o PaymentService.ts
    // PaymentService.js o PaymentService.ts
    async createCardAndInitSheet(userId, initPaymentSheet, presentPaymentSheet) {
        try {
            // 1️⃣ Llamar al backend
            console.log("🟢 Iniciando flujo Stripe con userId:", userId);
            const response = await fetch(
                `${this.baseURL}/create-card/${userId}`,
                { method: "POST" }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al obtener configuración de Stripe");
            }

            const {
                setupIntentClientSecret,
                ephemeralKeySecret,
                customer,
            } = await response.json();

            // 2️⃣ Inicializar el PaymentSheet
            const { error: initError } = await initPaymentSheet({
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKeySecret,
                setupIntentClientSecret,
                merchantDisplayName: this.merchantIdentifier,
                allowsDelayedPaymentMethods: false,
            });

            if (initError) {
                throw new Error(initError.message);
            }

            // 3️⃣ Mostrar el PaymentSheet al usuario
            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                console.log("Error", paymentError.message);
                return { success: false };
            } else {
                console.log("✅ Tarjeta agregada", "Tu tarjeta se guardó exitosamente.");
                return { success: true };
            }
        } catch (error) {
            console.error("❌ createCardAndInitSheet error:", error);
            Alert.alert("Error", error.message || "Ocurrió un problema al agregar la tarjeta.");
            return { success: false };
        }
    };

    async getCards(userId) {
        const res = await fetch(`${this.baseURL}/cards/${userId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.error || "Failed to fetch cards");
        }

        return await res.json(); // { customer: 'cus_...', cards: [...] }
    }

    async setDefaultCard(userId, cardId) {
        try {
            const res = await fetch(`${this.baseURL}/cards/default/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardId }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to set default card");
            }

            const data = await res.json();
            console.log("✅ Backend response:", data);
            return data;
        } catch (error) {
            console.error("❌ setDefaultCard error:", error);
            return { success: false, message: error.message };
        }
    }

    async deleteCard(userId, cardId) {
        const res = await fetch(`${this.baseURL}/cards/delete/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardId }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.error || "Failed to delete card");
        }

        return await res.json();
    }

    /**
     * Get plan details with pricing
     */
    getPlanDetails(planId) {
        const plans = {
            monthly: {
                name: 'Monthly Plan',
                price: '$9.99',
                amount: 999,
                period: 'month',
                description: 'Access to all features with monthly billing'
            },
        };

        return plans[planId] || null;
    }

    /**
     * Format amount from cents to currency string
     */
    formatAmount(amountInCents, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amountInCents / 100);
    }
}

export default new PaymentService();

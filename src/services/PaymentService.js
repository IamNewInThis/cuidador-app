// cuidador-app/src/services/PaymentService.js
class PaymentService {
    constructor() {
        // Get Stripe API URL from environment variables
        // Falls back to localhost if not set
        const stripeApiUrl = process.env.EXPO_PUBLIC_STRIPE_API_URL || 'http://192.168.1.83:8001/api/payments';
        this.merchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || 'merchant.cuidador-app';
        
        this.baseURL = __DEV__ 
            ? stripeApiUrl
            : 'https://your-production-server.com/api/payments';
    }

    /**
     * Solicita al backend los datos necesarios para guardar un método de pago
     * mediante SetupIntent + Payment Sheet.
     */
    async createSubscriptionSession(planId, userId, email) {
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

    /**
     * Obtiene el estado actual de la suscripción en Stripe para un cliente.
     */
    async getSubscriptionStatus(customerId) {
        if (!customerId) {
            throw new Error('customerId is required to fetch subscription status');
        }

        const response = await fetch(`${this.baseURL}/subscription/${customerId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to fetch subscription status');
        }

        return await response.json();
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

class PaymentService {
    constructor() {
        // Get Stripe API URL from environment variables
        // Falls back to localhost if not set
        const stripeApiUrl = process.env.EXPO_PUBLIC_STRIPE_API_URL || 'http://localhost:8001/api/payments';
        this.merchantIdentifier = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER || 'merchant.cuidador-app';
        
        this.baseURL = __DEV__ 
            ? stripeApiUrl
            : 'https://your-production-server.com/api/payments';
    }

    /**
     * Creates all resources required for the Stripe Payment Sheet
     */
    async createPaymentSheetSession(planId, userId, email) {
        try {
            // Define plan amounts (in cents)
            const planAmounts = {
                monthly: 1000,     // $9.99
            };

            const amount = planAmounts[planId];
            if (!amount) {
                throw new Error('Invalid plan selected');
            }

            const response = await fetch(`${this.baseURL}/create-payment-sheet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    currency: 'usd',
                    userId,
                    email,
                    description: `Lumi ${planId} subscription`,
                    metadata: {
                        planId,
                        email,
                        subscriptionType: planId
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create payment sheet session');
            }

            return await response.json();
        } catch (error) {
            console.error('PaymentService - createPaymentSheetSession error:', error);
            throw error;
        }
    }

    /**
     * Processes payment using Stripe's native payment sheet
     */
    async processPayment(clientSecret, stripe) {
        try {
            const { error, paymentIntent } = await stripe.confirmPayment(clientSecret, {
                paymentMethodType: 'Card',
                paymentMethodData: {
                    billingDetails: {
                        email: 'customer@example.com', // You can pass this from user data
                    },
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            return {
                success: true,
                paymentIntent,
            };
        } catch (error) {
            console.error('PaymentService - processPayment error:', error);
            throw error;
        }
    }

    /**
     * Processes payment using Stripe's Payment Sheet (recommended for better UX)
     * Shows Google Pay, Apple Pay, and saved cards automatically
     */
    async processPaymentWithSheet(sessionData, stripe, customerEmail = 'customer@example.com') {
        try {
            if (!sessionData) {
                throw new Error('Missing payment session data');
            }

            const { paymentIntent, ephemeralKey, customer } = sessionData;

            if (!paymentIntent || !ephemeralKey || !customer) {
                console.error('❌ Missing required data:', {
                    hasPaymentIntent: !!paymentIntent,
                    hasEphemeralKey: !!ephemeralKey,
                    hasCustomer: !!customer
                });
                throw new Error('Incomplete payment session data. Missing: ' + 
                    [!paymentIntent && 'paymentIntent', !ephemeralKey && 'ephemeralKey', !customer && 'customer']
                    .filter(Boolean).join(', '));
            }

            console.log('� Initializing Payment Sheet...');
            
            // Initialize the Payment Sheet with Google Pay and Apple Pay enabled
            const initParams = {
                merchantDisplayName: 'Lumi Cuidador App',
                customerId: customer,
                customerEphemeralKeySecret: ephemeralKey,
                paymentIntentClientSecret: paymentIntent,
                defaultBillingDetails: {
                    email: customerEmail,
                },
                // IMPORTANT: returnURL for Android 3D Secure and redirects
                returnURL: 'cuidador-app://stripe-redirect',
                // Enable Google Pay for Android
                googlePay: {
                    merchantCountryCode: 'US',
                    testEnv: __DEV__, // Use test environment in development
                    currencyCode: 'USD',
                },
                // Enable Apple Pay for iOS
                applePay: {
                    merchantCountryCode: 'US',
                },
                // Allow card payments and digital wallets
                allowsDelayedPaymentMethods: true,
                // Customize appearance
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
            console.log('📦 Init params prepared. Initializing...');
            
            const { error: initError } = await stripe.initPaymentSheet(initParams);

            if (initError) {
                console.error('❌ Payment Sheet init error:', {
                    code: initError.code,
                    message: initError.message,
                    localizedMessage: initError.localizedMessage
                });
                throw new Error(`Payment Sheet initialization failed: ${initError.message || initError.code}`);
            }

            console.log('✅ Payment Sheet initialized successfully');

            // Present the Payment Sheet
            const presentResult = await stripe.presentPaymentSheet();

            if (presentResult.error) {
                console.log('⚠️ Payment Sheet presentation error:', {
                    code: presentResult.error.code,
                    message: presentResult.error.message
                });
                
                // Check if user canceled
                if (presentResult.error.code === 'Canceled') {
                    console.log('ℹ️ User canceled the payment');
                    return { success: false, canceled: true };
                }
                
                // Check for Failed error
                if (presentResult.error.code === 'Failed') {
                    console.error('❌ Payment Sheet failed to present');
                    throw new Error(`Payment sheet failed: ${presentResult.error.message}`);
                }
                
                throw new Error(presentResult.error.message || presentResult.error.code);
            }

            console.log('✅ Payment successful!');
            return { success: true };
        } catch (error) {
            console.error('❌ PaymentService - processPaymentWithSheet error:', error);
            throw error;
        }
    }

    /**
     * Complete subscription flow
     */
    async subscribeUser(planId, userId, email) {
        try {
            // Show loading state
            console.log(`Starting subscription process for plan: ${planId}`);

            // Create Payment Sheet session on backend
            const paymentData = await this.createPaymentSheetSession(planId, userId, email);

            return {
                success: true,
                ...paymentData,
                clientSecret: paymentData.paymentIntent,
            };
        } catch (error) {
            console.error('PaymentService - subscribeUser error:', error);
            throw error;
        }
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

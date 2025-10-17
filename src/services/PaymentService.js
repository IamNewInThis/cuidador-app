import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';

class PaymentService {
    constructor() {
        // Get Stripe API URL from environment variables
        // Falls back to localhost if not set
        const stripeApiUrl = process.env.EXPO_PUBLIC_STRIPE_API_URL || 'http://localhost:8001/api/payments';
        
        this.baseURL = __DEV__ 
            ? stripeApiUrl
            : 'https://your-production-server.com/api/payments';
    }

    /**
     * Creates a PaymentIntent for subscription payments
     */
    async createSubscriptionPaymentIntent(planId, userId, email) {
        try {
            // Define plan amounts (in cents)
            const planAmounts = {
                monthly: 999,     // $9.99
            };

            const amount = planAmounts[planId];
            if (!amount) {
                throw new Error('Invalid plan selected');
            }

            const response = await fetch(`${this.baseURL}/create-payment-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    currency: 'usd',
                    userId,
                    description: `Lumi ${planId} subscription`,
                    metadata: {
                        planId,
                        email,
                        subscriptionType: planId
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create payment intent');
            }

            return await response.json();
        } catch (error) {
            console.error('PaymentService - createSubscriptionPaymentIntent error:', error);
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
    async processPaymentWithSheet(clientSecret, stripe, customerEmail = 'customer@example.com') {
        try {
            console.log('🔄 Initializing Payment Sheet...');
            console.log('📋 Client Secret:', clientSecret ? 'Present' : 'Missing');
            
            // Initialize the Payment Sheet with Google Pay enabled
            const initParams = {
                merchantDisplayName: 'Lumi Cuidador App',
                paymentIntentClientSecret: clientSecret,
                defaultBillingDetails: {
                    email: customerEmail,
                },
                // Enable Google Pay for Android
                googlePay: {
                    merchantCountryCode: 'US',
                    testEnv: true, // Set to false in production
                },
                // Allow card payments
                allowsDelayedPaymentMethods: true,
                // Customize appearance
                appearance: {
                    colors: {
                        primary: '#3B82F6',
                    },
                },
            };

            console.log('📦 Initializing with params:', JSON.stringify(initParams, null, 2));
            
            const { error: initError } = await stripe.initPaymentSheet(initParams);

            if (initError) {
                console.error('❌ Payment Sheet init error:', initError);
                throw new Error(initError.message);
            }

            console.log('✅ Payment Sheet initialized successfully');
            console.log('🎨 Presenting Payment Sheet...');

            // Present the Payment Sheet
            const presentResult = await stripe.presentPaymentSheet();
            
            console.log('📱 Present result:', JSON.stringify(presentResult, null, 2));

            if (presentResult.error) {
                console.log('⚠️ Payment Sheet presentation error:', presentResult.error);
                
                // Check if user canceled
                if (presentResult.error.code === 'Canceled') {
                    console.log('ℹ️ User canceled the payment');
                    return { success: false, canceled: true };
                }
                
                // Check for Failed error
                if (presentResult.error.code === 'Failed') {
                    console.error('❌ Payment Sheet failed to present:', presentResult.error.message);
                    throw new Error(`Payment sheet failed: ${presentResult.error.message}`);
                }
                
                throw new Error(presentResult.error.message);
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

            // Create PaymentIntent
            const paymentData = await this.createSubscriptionPaymentIntent(planId, userId, email);

            return {
                success: true,
                clientSecret: paymentData.clientSecret,
                paymentIntentId: paymentData.paymentIntentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
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

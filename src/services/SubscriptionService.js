import supabase from '../lib/supabase';

class SubscriptionService {
    /**
     * Crea una nueva suscripción en Supabase
     * @param {Object} subscriptionData - Datos de la suscripción
     * @param {string} subscriptionData.userId - ID del usuario
     * @param {string} subscriptionData.status - Estado de la suscripción (active, inactive, canceled, expired)
     * @param {Date} subscriptionData.startDate - Fecha de inicio
     * @param {Date} subscriptionData.endDate - Fecha de fin
     */
    async createSubscription({ userId, status = 'active', startDate = new Date(), endDate }) {
        try {
            console.log('📝 Creating subscription in Supabase:', { userId, status, startDate, endDate });

            const { data, error } = await supabase
                .from('subscriptions')
                .insert([
                    {
                        user_id: userId,
                        status,
                        start_date: startDate,
                        end_date: endDate,
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating subscription:', error);
                throw error;
            }

            console.log('✅ Subscription created successfully:', data);
            return data;
        } catch (error) {
            console.error('SubscriptionService - createSubscription error:', error);
            throw error;
        }
    }

    /**
     * Obtiene la suscripción activa de un usuario
     * @param {string} userId - ID del usuario
     */
    async getActiveSubscription(userId) {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('Error getting active subscription:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('SubscriptionService - getActiveSubscription error:', error);
            throw error;
        }
    }

    /**
     * Obtiene todas las suscripciones de un usuario
     * @param {string} userId - ID del usuario
     */
    async getUserSubscriptions(userId) {
        try {
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error getting user subscriptions:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('SubscriptionService - getUserSubscriptions error:', error);
            throw error;
        }
    }

    /**
     * Actualiza el estado de una suscripción
     * @param {string} subscriptionId - ID de la suscripción
     * @param {string} status - Nuevo estado (active, inactive, canceled, expired)
     */
    async updateSubscriptionStatus(subscriptionId, status) {
        try {
            console.log('🔄 Updating subscription status:', { subscriptionId, status });

            const { data, error } = await supabase
                .from('subscriptions')
                .update({ status })
                .eq('id', subscriptionId)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating subscription status:', error);
                throw error;
            }

            console.log('✅ Subscription status updated:', data);
            return data;
        } catch (error) {
            console.error('SubscriptionService - updateSubscriptionStatus error:', error);
            throw error;
        }
    }

    /**
     * Cancela una suscripción
     * @param {string} subscriptionId - ID de la suscripción
     */
    async cancelSubscription(subscriptionId) {
        return this.updateSubscriptionStatus(subscriptionId, 'canceled');
    }

    /**
     * Calcula la fecha de finalización basada en el plan
     * @param {string} planId - ID del plan (monthly, yearly)
     * @param {Date} startDate - Fecha de inicio
     */
    calculateEndDate(planId, startDate = new Date()) {
        const endDate = new Date(startDate);
        
        switch (planId) {
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
            default:
                // Por defecto, un mes
                endDate.setMonth(endDate.getMonth() + 1);
        }
        
        return endDate;
    }

    /**
     * Procesa una suscripción completa (crea suscripción y registra pago)
     * @param {Object} data - Datos completos de la transacción
     * @returns {Object} subscription - La suscripción creada
     * @note El pago debe ser registrado usando PaymentService.createPayment()
     */
    async processSubscription({
        userId,
        planId,
        status = 'active'
    }) {
        try {
            console.log('🎯 Processing subscription:', {
                userId,
                planId
            });

            // 1. Calcular fechas
            const startDate = new Date();
            const endDate = this.calculateEndDate(planId, startDate);

            // 2. Crear suscripción
            const subscription = await this.createSubscription({
                userId,
                status,
                startDate,
                endDate
            });

            console.log('✅ Subscription created successfully');
            return subscription;
        } catch (error) {
            console.error('❌ SubscriptionService - processSubscription error:', error);
            throw error;
        }
    }
}

export default new SubscriptionService();

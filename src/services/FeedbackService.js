import supabase from "../lib/supabase.js";

class FeedbackService {
    /**
     * Crea un nuevo feedback para un mensaje de conversación
     * @param {Object} feedback - Objeto con los datos del feedback
     * @param {string} feedback.conversationMessageId - ID del mensaje
     * @param {string} feedback.userId - ID del usuario
     * @param {('useful'|'not_useful')} feedback.rating - Calificación del feedback
     * @param {string} [feedback.comment] - Comentario opcional
     * @returns {Promise<Object>} - El feedback creado
     */
    static async createFeedback({ conversationMessageId, rating, comment = null }) {
        try {
            // Obtener el usuario actual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Error getting current user:', userError);
                throw userError;
            }

            if (!user) {
                throw new Error('No authenticated user found');
            }

            const { data, error } = await supabase
                .from("feedback")
                .insert([{
                    conversation_message_id: conversationMessageId,
                    rating,
                    comment: comment || null,
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating feedback:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Unexpected error creating feedback:', error);
            return { data: null, error };
        }
    }

    /**
     * Elimina un feedback existente
     * @param {string} conversationMessageId - ID del mensaje
     * @param {string} userId - ID del usuario
     * @returns {Promise<void>}
     */
    static async deleteFeedback(conversationMessageId, userId) {
        const { error } = await supabase
            .from('feedback')
            .delete()
            .match({
                conversation_message_id: conversationMessageId,
                user_id: userId
            });

        if (error) {
            console.error('Error deleting feedback:', error);
            throw error;
        }
    }

    /**
     * Obtiene el feedback de un mensaje específico para un usuario
     * @param {string} conversationMessageId - ID del mensaje
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object|null>} - El feedback encontrado o null si no existe
     */
    static async getFeedback(conversationMessageId, userId) {
        const { data, error } = await supabase
            .from('feedback')
            .select('*')
            .match({
                conversation_message_id: conversationMessageId,
                user_id: userId
            })
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 es el código para "no se encontraron registros"
            console.error('Error getting feedback:', error);
            throw error;
        }

        return data;
    }
}

export default FeedbackService;

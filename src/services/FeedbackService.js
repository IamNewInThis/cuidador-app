import supabase from "../lib/supabase.js";

class FeedbackService {
    /**
     * Crea o actualiza feedback para un mensaje de conversación
     * @param {Object} feedback - Objeto con los datos del feedback
     * @param {string} feedback.conversationMessageId - ID del mensaje
     * @param {('useful'|'not_useful')} feedback.rating - Calificación del feedback
     * @param {string} [feedback.comment] - Comentario opcional
     * @returns {Promise<Object>} - El feedback creado o actualizado
     */
    static async upsertFeedback({ conversationMessageId, rating, comment = null }) {
        try {
            // Obtener el usuario actual
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error("No authenticated user found");

            // Usar upsert con el unique (conversation_message_id, user_id)
            const { data, error } = await supabase
                .from("feedback")
                .upsert([{
                    conversation_message_id: conversationMessageId,
                    user_id: user.id, // se valida con RLS
                    rating,
                    comment: comment || null,
                    updated_at: new Date().toISOString()
                }], { onConflict: ["conversation_message_id", "user_id"] })
                .select()
                .maybeSingle(); // evita error PGRST116 si no devuelve filas

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error upserting feedback:", error);
            return { data: null, error };
        }
    }

    /**
     * Elimina un feedback existente
     * @param {string} conversationMessageId - ID del mensaje
     * @param {string} userId - ID del usuario
     */
    static async deleteFeedback(conversationMessageId, userId) {
        const { error } = await supabase
            .from("feedback")
            .delete()
            .match({
                conversation_message_id: conversationMessageId,
                user_id: userId
            });

        if (error) {
            console.error("Error deleting feedback:", error);
            throw error;
        }
    }

    /**
     * Obtiene el feedback de un mensaje específico para un usuario
     * @param {string} conversationMessageId - ID del mensaje
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object|null>}
     */
    static async getFeedback(conversationMessageId, userId) {
        const { data, error } = await supabase
            .from("feedback")
            .select("*")
            .match({
                conversation_message_id: conversationMessageId,
                user_id: userId
            })
            .maybeSingle(); // 👈 aquí también mejor maybeSingle

        if (error) {
            console.error("Error getting feedback:", error);
            throw error;
        }
        return data;
    }
}

export default FeedbackService;

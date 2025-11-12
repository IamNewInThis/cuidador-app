import supabase from "../lib/supabase";

class ConversationsService {
    async createMessage({ userId, babyId = null, content, role }) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .insert([
                    {
                        user_id: userId,
                        baby_id: babyId,
                        content,
                        role,
                    }
                ])
                .select('*')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating message:', error);
            throw error;
        }
    }

    async getConversationHistory(limit = 50) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            throw error;
        }
    }

    async getConversationsByBaby(babyId, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('baby_id', babyId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching baby conversations:', error);
            throw error;
        }
    }

    async searchMessagesByText(babyId, searchText, limit = 50) {
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .eq('baby_id', babyId)
                .ilike('content', `%${searchText}%`) // búsqueda insensible a mayúsculas
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error searching messages:', error);
            throw error;
        }
    }

    /**
 * 🔼 INCREMENTA el contador de mensajes (consume 1 mensaje)
 * Úsala ANTES de enviar un mensaje al chat
 */
    async limitMessagesPerDay(userId) {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const DAILY_LIMIT = 10; // ⚙️ Configuración centralizada

        try {
            // 1️⃣ Verificar suscripción activa
            const { data: subscriptions, error: subErr } = await supabase
                .from("subscriptions")
                .select("status, end_date")
                .eq("user_id", userId)
                .order("start_date", { ascending: false })
                .limit(1);

            if (subErr) throw subErr;

            const sub = subscriptions?.[0] || null;

            const isActive =
                sub &&
                sub.status === "active" &&
                sub.end_date &&
                new Date(sub.end_date).getTime() > Date.now();

            if (isActive) {
                console.log("✅ Usuario con suscripción activa (GET)");
                return {
                    status: "subscriber",
                    used: 0,
                    remaining: 9999,
                    resetAt: null,
                    DAILY_LIMIT,
                };
            }

            // 2️⃣ Usuario free: consultar uso actual
            console.log("🔍 Consultando estado de uso de mensajes (GET)");

            const { data, error } = await supabase.rpc("get_message_usage_status", {
                p_user_id: userId,
                p_limit: DAILY_LIMIT,
            });

            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;

            // ✅ Si el usuario no existe aún en la tabla
            if (!row) {
                console.log("🆕 Usuario nuevo: inicializando contador de mensajes.");
                return {
                    status: "free",
                    used: 0,
                    remaining: DAILY_LIMIT,
                    resetAt: null,
                    DAILY_LIMIT,
                };
            }

            // ✅ Usuario existente
            console.log("📊 Estado actual del uso:", row);

            return {
                status: "free",
                used: row.used ?? 0,
                remaining: row.remaining ?? DAILY_LIMIT,
                resetAt: row.reset_at ?? null,
                DAILY_LIMIT,
            };
        } catch (error) {
            console.error("❌ Error al obtener estado de mensajes:", error);
            return {
                status: "error",
                used: 0,
                remaining: DAILY_LIMIT,
                resetAt: null,
                DAILY_LIMIT,
                error: error?.message ?? "unknown_error",
            };
        }
    }

    /**
     * 👁️ CONSULTA el estado actual (NO consume mensajes)
     * Úsala para mostrar el contador en la UI
     */
    async getMessageUsageStatus(userId) {
        const DAILY_LIMIT = 10; // ⚙️ Configuración centralizada

        try {
            // 1️⃣ Verificar si tiene suscripción activa
            const { data: subscriptions, error: subErr } = await supabase
                .from("subscriptions")
                .select("status, end_date, start_date")
                .eq("user_id", userId)
                .in("status", ["active", "trialing"])
                .order("start_date", { ascending: false })
                .limit(1);

            const sub = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

            // Validación estricta de suscripción activa
            const isActive = sub &&
                sub.status === "active" &&
                sub.end_date !== null &&
                new Date(sub.end_date) > new Date();

            if (isActive) {
                console.log("✅ Usuario con suscripción activa (GET)");
                return {
                    status: "subscriber",
                    used: 0,
                    remaining: 9999,
                    resetAt: null,
                    DAILY_LIMIT: DAILY_LIMIT
                };
            }

            // 2️⃣ Usuario free: consultar estado (SIN incrementar)
            console.log('🔍 Consultando estado de uso de mensajes (GET)');

            const { data, error } = await supabase.rpc("get_message_usage_status", {
                p_user_id: userId,
                p_limit: DAILY_LIMIT
            });

            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;
            if (!row) throw new Error("Sin respuesta de RPC");

            console.log("📊 Estado actual del uso:", row);

            return {
                status: "free",
                used: row.used,
                remaining: row.remaining,
                resetAt: row.reset_at,
                DAILY_LIMIT: DAILY_LIMIT,
            };

        } catch (error) {
            console.error("❌ Error al obtener estado de mensajes:", error);
            return {
                status: "error",
                used: 0,
                remaining: DAILY_LIMIT,
                resetAt: null,
                DAILY_LIMIT: DAILY_LIMIT,
                error: error.message ?? "unknown_error"
            };
        }
    }

}


export default new ConversationsService();

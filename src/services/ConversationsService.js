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
        const DAILY_LIMIT = 10; // ⚙️ Configuración centralizada
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

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
                    tier: "subscriber",
                    status: "subscriber",
                    used: 0,
                    remaining: 9999,
                    resetAt: null,
                    allowed: true,
                    DAILY_LIMIT,
                };
            }

            // 2️⃣ Usuario free: consumir mensaje mediante RPC
            console.log("🔄 Consumiendo mensaje vía increment_message_usage…");

            const { data, error } = await supabase.rpc("increment_message_usage", {
                p_user_id: userId,
                p_limit: DAILY_LIMIT,
                p_tz: userTimeZone,
            });

            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;

            if (!row) {
                throw new Error("increment_message_usage sin respuesta");
            }

            return {
                status: "free",
                tier: "free",
                used: row.used ?? 0,
                remaining: row.remaining ?? Math.max(DAILY_LIMIT - (row.used ?? 0), 0),
                resetAt: row.reset_at ?? null,
                allowed: row.allowed ?? false,
                DAILY_LIMIT,
            };
        } catch (error) {
            console.error("❌ Error al obtener estado de mensajes:", error);
            return {
                status: "error",
                tier: "free",
                used: 0,
                remaining: DAILY_LIMIT,
                resetAt: null,
                allowed: false,
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
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

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
            console.log('🔍 Consultando uso diario vía get_message_usage_status');

            const { data, error } = await supabase.rpc("get_message_usage_status", {
                p_user_id: userId,
                p_limit: DAILY_LIMIT,
                p_tz: userTimeZone,
            });

            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;

            if (!row) {
                throw new Error("get_message_usage_status sin respuesta");
            }

            const used = row.used ?? 0;
            const remaining = row.remaining ?? Math.max(DAILY_LIMIT - used, 0);

            return {
                status: "free",
                used,
                remaining,
                resetAt: row.reset_at ?? null,
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

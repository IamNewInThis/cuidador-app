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

    async limitMessagesPerDay(userId) {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        //SI CAMBIAS EL LIMITE DIARIO, CAMBIALO EN LA FUNCION GETMESSAGEUSAGESTATUS
        const DAILY_LIMIT = 10;
        try {
            const { data: sub, error: subErr } = await supabase
                .from("subscriptions")
                .select("status, end_date")
                .eq("user_id", userId)
                .maybeSingle();

            if (subErr) throw subErr;

            const isActive =
                sub &&
                sub.status === "active" &&
                (sub.end_date === null || new Date(sub.end_date) > new Date());

            if (isActive) {
                console.log("✅ Usuario con suscripción activa, sin límite.");
                return { allowed: true, tier: "subscriber", remaining: 9999, resetAt: null };
            }

            console.log("🔹 Incrementando uso de mensaje...");
            const { data, error } = await supabase.rpc("increment_message_usage", {
                p_user_id: userId,
                p_limit: DAILY_LIMIT,
                p_tz: userTimeZone,
            });
            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;
            if (!row) throw new Error("Sin respuesta de RPC");

            console.log("📊 Resultado del RPC increment:", row);

            return {
                allowed: row.allowed,
                tier: "free",
                used: row.used,
                remaining: row.remaining,
                resetAt: row.reset_at,
                DAILY_LIMIT: DAILY_LIMIT,
            };
        } catch (error) {
            console.error("❌ Error en limitMessagesPerDay:", error);
            return { allowed: false, error: error.message ?? "unknown_error" };
        }
    }

    async getMessageUsageStatus(userId) {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        //AQUI TAMBIEN CAMBIA EL LIMITE DIARIO SI LO MODIFICAS, CAMBIALO EN LA FUNCION LIMITMESSAGESPERDAY.
        const DAILY_LIMIT = 10;
        try {
            const { data, error } = await supabase.rpc("get_message_usage_status", {
                p_user_id: userId,
                p_limit: DAILY_LIMIT,
                p_tz: userTimeZone,
            });
            if (error) throw error;

            const row = Array.isArray(data) ? data[0] : data;
            if (!row) throw new Error("Sin respuesta de RPC");

            console.log("📊 Estado actual del uso:", row);

            return {
                used: row.used,
                remaining: row.remaining,
                resetAt: row.reset_at,
                DAILY_LIMIT: DAILY_LIMIT,
            };
        } catch (error) {
            console.error("❌ Error al obtener estado de mensajes:", error);
            return { used: 0, remaining: DAILY_LIMIT, resetAt: null };
        }
    }

}


export default new ConversationsService();

import supabase from "../lib/supabase";

/**
 * Obtiene el perfil del usuario por su userId (UUID de auth)
 */
export async function getProfile(userId) {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Actualiza el perfil del usuario (no gestiona email/contraseña de auth)
 */
export async function updateProfile(userId, updates) {
    try {
        const payload = {
            name: updates.name?.trim() || null,
            phone: updates.phone?.trim() || null,
            //updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("profiles")
            .update(payload)
            .eq("id", userId)
            .select("*")
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

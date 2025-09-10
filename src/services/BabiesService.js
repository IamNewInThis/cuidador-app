import supabase from "../lib/supabase";

/**
 * Obtiene todos los bebés del usuario actual
 */
export async function getBabies(userId) {
    try {
        const { data, error } = await supabase
            .from("babies")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

/**
 * Crea un bebé nuevo
 */
export async function createBaby(userId, baby) {
    try {
        const { data, error } = await supabase.from("babies").insert([
            {
                user_id: userId,
                name: baby.name,
                birthdate: baby.birthdate || null,
                gender: baby.gender || null,
                weight: baby.weight || null,
                height: baby.height || null,
                routines: baby.routines || {},
                preferences: baby.preferences || {},
            },
        ]);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateBaby(userId, babyId, updates) {
    try {
        const { data, error } = await supabase
            .from("babies")
            .update({
                name: updates.name,
                birthdate: updates.birthdate ?? null,
                gender: updates.gender ?? null,
                weight: updates.weight ?? null,
                height: updates.height ?? null,
                routines: updates.routines ?? null,
                preferences: updates.preferences ?? null,
            })
            .eq("id", babyId)
            .eq("user_id", userId)
            .select("*")
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function deleteBaby(userId, babyId) {
    try {
        const { error } = await supabase
            .from("babies")
            .delete()
            .eq("id", babyId)
            .eq("user_id", userId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
}

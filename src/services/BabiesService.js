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

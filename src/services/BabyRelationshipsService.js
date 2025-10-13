import supabase from "../lib/supabase";

/**
 * Mapea los valores de relación del frontend a los valores de la base de datos
 */
function mapRelationshipType(frontendType) {
    const mapping = {
        'Mother': 'mother',
        'Father': 'father',
        'Brother': 'sibling',
        'Sister': 'sibling', 
        'Grandmother': 'grandparent',
        'Grandfather': 'grandparent',
        'Uncle': 'uncle',
        'Aunt': 'aunt',
        'Cousin': 'sibling', 
        'Other': 'caregiver'
    };
    
    return mapping[frontendType] || 'caregiver';
}

/**
 * Crea una nueva relación entre un usuario y un bebé
 */
export async function createRelationship(userId, babyId, relationshipType) {
    try {
        // Mapear el tipo de relación del frontend al formato de la base de datos
        const mappedType = mapRelationshipType(relationshipType);
        
        const { data, error } = await supabase
            .from("baby_relationships")
            .insert([
                {
                    user_id: userId,
                    baby_id: babyId,
                    relationship_type: mappedType
                }
            ])
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error creating baby relationship:", error);
        return { data: null, error };
    }
}

/**
 * Obtiene todas las relaciones de un usuario
 */
export async function getUserRelationships(userId) {
    try {
        const { data, error } = await supabase
            .from("baby_relationships")
            .select(`
                *,
                babies (
                    id,
                    name,
                    birthdate,
                    gender
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error getting user relationships:", error);
        return { data: null, error };
    }
}

/**
 * Obtiene todas las relaciones de un bebé específico
 */
export async function getBabyRelationships(babyId) {
    try {
        const { data, error } = await supabase
            .from("baby_relationships")
            .select(`
                *,
                profiles (
                    id,
                    full_name,
                    phone
                )
            `)
            .eq("baby_id", babyId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error getting baby relationships:", error);
        return { data: null, error };
    }
}

/**
 * Actualiza una relación existente
 */
export async function updateRelationship(relationshipId, updates) {
    try {
        const { data, error } = await supabase
            .from("baby_relationships")
            .update(updates)
            .eq("id", relationshipId)
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error updating baby relationship:", error);
        return { data: null, error };
    }
}

/**
 * Elimina permanentemente una relación
 */
export async function deleteRelationship(relationshipId) {
    try {
        const { data, error } = await supabase
            .from("baby_relationships")
            .delete()
            .eq("id", relationshipId);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error("Error deleting baby relationship:", error);
        return { data: null, error };
    }
}


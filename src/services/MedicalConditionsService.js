import supabase from '../lib/supabase';

/**
 * Servicio para manejar las condiciones médicas de los bebés
 */
class MedicalConditionsService {
    /**
     * Obtiene todas las categorías de condiciones médicas disponibles
     * @returns {Promise<Array>} Lista de categorías médicas
     */
    static async getCategories() {
        try {
            const { data, error } = await supabase
                .from('medical_conditions_category')
                .select('*')
                .order('name');

            if (error) {
                console.error('Error al obtener categorías médicas:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error en getCategories:', error);
            throw error;
        }
    }

    /**
     * Obtiene las condiciones médicas de un bebé específico
     * @param {string} babyId - ID del bebé
     * @returns {Promise<Array>} Lista de condiciones médicas del bebé
     */
    static async getMedicalConditionsByBaby(babyId) {
        try {
            if (!babyId) {
                throw new Error('Baby ID es requerido');
            }

            const { data, error } = await supabase
                .from('medical_conditions')
                .select(`
                    *,
                    medical_conditions_category (
                        id,
                        name
                    ),
                    medical_conditions_value!medical_condition_value (
                        id,
                        value
                    )
                `)
                .eq('baby_id', babyId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error al obtener condiciones médicas:', error);
                throw error;
            }

            // Mapear los resultados para incluir condition_name por compatibilidad
            const mappedData = (data || []).map(condition => ({
                ...condition,
                condition_name: condition.medical_conditions_value?.value || 'Unknown condition'
            }));

            return mappedData;
        } catch (error) {
            console.error('Error en getMedicalConditionsByBaby:', error);
            throw error;
        }
    }

    /**
     * Crea una nueva condición médica para un bebé
     * @param {string} babyId - ID del bebé
     * @param {number} categoryId - ID de la categoría médica
     * @param {string} conditionName - Nombre de la condición médica
     * @returns {Promise<Object>} Condición médica creada
     */
    static async createMedicalCondition(babyId, categoryId, conditionName) {
        try {
            // Validación de datos
            if (!babyId || !categoryId || !conditionName) {
                throw new Error('Todos los campos son requeridos: babyId, categoryId, conditionName');
            }

            // Buscar el ID de la condición en medical_conditions_value
            const { data: conditionValue, error: searchError } = await supabase
                .from('medical_conditions_value')
                .select('id')
                .eq('medical_category_id', categoryId)
                .eq('value', conditionName.trim())
                .single();

            if (searchError || !conditionValue) {
                throw new Error(`Condición médica "${conditionName}" no encontrada en la categoría ${categoryId}`);
            }

            // Verificar si la condición ya existe para este bebé
            const existing = await this.checkExistingCondition(babyId, categoryId, conditionValue.id);
            if (existing) {
                throw new Error('Esta condición médica ya está registrada para este bebé');
            }

            const conditionData = {
                baby_id: babyId,
                medical_category_id: categoryId,
                medical_condition_value: conditionValue.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('medical_conditions')
                .insert([conditionData])
                .select(`
                    *,
                    medical_conditions_category (
                        id,
                        name
                    ),
                    medical_conditions_value!medical_condition_value (
                        id,
                        value
                    )
                `)
                .single();

            if (error) {
                console.error('Error al crear condición médica:', error);
                throw error;
            }

            // Mapear resultado para compatibilidad
            return {
                ...data,
                condition_name: data.medical_conditions_value?.value || conditionName
            };
        } catch (error) {
            console.error('Error en createMedicalCondition:', error);
            throw error;
        }
    }

    /**
     * Actualiza una condición médica existente
     * @param {number} conditionId - ID de la condición médica
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} Condición médica actualizada
     */
    static async updateMedicalCondition(conditionId, updateData) {
        try {
            if (!conditionId) {
                throw new Error('ID de la condición médica es requerido');
            }

            const updates = {
                ...updateData,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('medical_conditions')
                .update(updates)
                .eq('id', conditionId)
                .select(`
                    *,
                    medical_conditions_category (
                        id,
                        name
                    ),
                    medical_conditions_value!medical_condition_value (
                        id,
                        value
                    )
                `)
                .single();

            if (!error && data) {
                // Mapear resultado para compatibilidad
                data.condition_name = data.medical_conditions_value?.value || 'Unknown condition';
            }

            if (error) {
                console.error('Error al actualizar condición médica:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error en updateMedicalCondition:', error);
            throw error;
        }
    }

    /**
     * Elimina una condición médica
     * @param {number} conditionId - ID de la condición médica
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    static async deleteMedicalCondition(conditionId) {
        try {
            if (!conditionId) {
                throw new Error('ID de la condición médica es requerido');
            }

            const { error } = await supabase
                .from('medical_conditions')
                .delete()
                .eq('id', conditionId);

            if (error) {
                console.error('Error al eliminar condición médica:', error);
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error en deleteMedicalCondition:', error);
            throw error;
        }
    }

    /**
     * Verifica si una condición médica ya existe para un bebé
     * @param {string} babyId - ID del bebé
     * @param {number} categoryId - ID de la categoría médica
     * @param {number} conditionValueId - ID del valor de condición médica
     * @returns {Promise<boolean>} True si la condición ya existe
     */
    static async checkExistingCondition(babyId, categoryId, conditionValueId) {
        try {
            const { data, error } = await supabase
                .from('medical_conditions')
                .select('id')
                .eq('baby_id', babyId)
                .eq('medical_category_id', categoryId)
                .eq('medical_condition_value', conditionValueId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
                console.error('Error al verificar condición existente:', error);
                throw error;
            }

            return !!data;
        } catch (error) {
            console.error('Error en checkExistingCondition:', error);
            return false;
        }
    }

    /**
     * Obtiene las condiciones predefinidas para una categoría específica
     * @param {number} categoryId - ID de la categoría médica
     * @returns {Promise<Array>} Lista de condiciones predefinidas
     */
    static async getPredefinedConditions(categoryId) {
        try {
            if (!categoryId) {
                throw new Error('Category ID es requerido');
            }

            const { data, error } = await supabase
                .from('medical_conditions_value')
                .select('*')
                .eq('medical_category_id', categoryId)
                .order('value');

            if (error) {
                console.error('Error al obtener condiciones predefinidas:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error en getPredefinedConditions:', error);
            throw error;
        }
    }

    /**
     * Obtiene todas las condiciones predefinidas agrupadas por categoría
     * @returns {Promise<Object>} Objeto con condiciones agrupadas por categoría
     */
    static async getAllPredefinedConditions() {
        try {
            const { data, error } = await supabase
                .from('medical_conditions_value')
                .select(`
                    *,
                    medical_conditions_category (
                        id,
                        name
                    )
                `)
                .order('medical_category_id, value');

            if (error) {
                console.error('Error al obtener todas las condiciones predefinidas:', error);
                throw error;
            }

            // Agrupar por categoría
            const grouped = {};
            (data || []).forEach(condition => {
                const categoryName = condition.medical_conditions_category?.name || 'Unknown';
                const categoryId = condition.medical_category_id;
                
                if (!grouped[categoryId]) {
                    grouped[categoryId] = {
                        categoryId: categoryId,
                        categoryName: categoryName,
                        conditions: []
                    };
                }
                
                grouped[categoryId].conditions.push(condition.value);
            });

            return grouped;
        } catch (error) {
            console.error('Error en getAllPredefinedConditions:', error);
            throw error;
        }
    }

    /**
     * Crea múltiples condiciones médicas para un bebé
     * @param {string} babyId - ID del bebé
     * @param {Array} conditions - Array de objetos con categoryId y conditionName
     * @returns {Promise<Array>} Array de condiciones médicas creadas
     */
    static async createMultipleMedicalConditions(babyId, conditions) {
        try {
            if (!babyId || !conditions || conditions.length === 0) {
                throw new Error('Baby ID y condiciones son requeridos');
            }

            const results = [];

            for (const condition of conditions) {
                try {
                    const result = await this.createMedicalCondition(
                        babyId,
                        condition.categoryId,
                        condition.conditionName
                    );
                    results.push(result);
                } catch (error) {
                    console.warn(`Error creando condición ${condition.conditionName}:`, error.message);
                    // Continuamos con las demás condiciones aunque una falle
                }
            }

            return results;
        } catch (error) {
            console.error('Error en createMultipleMedicalConditions:', error);
            throw error;
        }
    }
}

export default MedicalConditionsService;

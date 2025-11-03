import supabase from "../lib/supabase";

/**
 * Obtener entradas del `baby_profile` para un bebé dado.
 * Ahora incluye los valores de la tabla `baby_profile_value` mediante JOIN.
 * Devuelve los valores mapeados según el idioma solicitado (value_es|value_en|value_pt).
 *
 */
export async function getProfileBaby(babyId, { locale = 'es' } = {}) {
	if (!babyId) {
		return { data: null, error: new Error('babyId is required') };
	}

	try {
		const { data, error } = await supabase
			.from('baby_profile')
			// Solo seleccionar campos de baby_profile y hacer JOIN con baby_profile_value
			.select(`
				id, 
				baby_id, 
				category_id, 
				key, 
				created_at, 
				updated_at,
				profile_category(category),
				baby_profile_value(
					id,
					value_es,
					value_en,
					value_pt,
					created_at,
					updated_at
				)
			`)
			.eq('baby_id', babyId)
			.order('category_id', { ascending: true });

		if (error) throw error;

		const mapped = (data || []).map(row => {
			// Obtener TODOS los valores de baby_profile_value (soporte para one-to-many)
			const profileValues = row.baby_profile_value || [];
			
			let selectedValue = '';
			let allProfileValues = [];
			
			if (profileValues.length > 0) {
				// Extraer valores según el idioma de todos los registros
				const values = profileValues.map(pv => {
					const value = locale === 'en' ? pv.value_en : 
								 locale === 'pt' ? pv.value_pt : 
								 pv.value_es;
					return value?.trim() || '';
				}).filter(v => v !== ''); // Filtrar valores vacíos
				
				// Concatenar múltiples valores con coma y espacio
				selectedValue = values.join(', ');
				allProfileValues = profileValues;
			}

			return {
				id: row.id,
				baby_id: row.baby_id,
				category_id: row.category_id,
				category_name: row.profile_category?.category || null,
				key: row.key,
				value: selectedValue || '', // String concatenado de todos los valores
				values_array: allProfileValues, // Array completo para acceso programático
				values_count: profileValues.length, // Cantidad de valores
				has_profile_value: profileValues.length > 0,
				profile_value_id: profileValues.length > 0 ? profileValues[0].id : null, // ID del primer valor para compatibilidad
				raw: row,
			};
		});

		return { data: mapped, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}

export async function getProfileByCategory(babyId, categoryId, { locale = 'es' } = {}) {
	if (!babyId || !categoryId) {
		return { data: null, error: new Error('babyId and categoryId are required') };
	}

	try {
		const { data, error } = await supabase
			.from('baby_profile')
			// Solo seleccionar campos de baby_profile y hacer JOIN con baby_profile_value
			.select(`
				id, 
				baby_id, 
				category_id, 
				key, 
				created_at, 
				updated_at,
				baby_profile_value(
					id,
					value_es,
					value_en,
					value_pt,
					created_at,
					updated_at
				)
			`)
			.eq('baby_id', babyId)
			.eq('category_id', categoryId)
			.order('key', { ascending: true });

		if (error) throw error;

		const mapped = (data || []).map(row => {
			// Obtener TODOS los valores de baby_profile_value (soporte para one-to-many)
			const profileValues = row.baby_profile_value || [];
			
			let selectedValue = '';
			let allProfileValues = [];
			
			if (profileValues.length > 0) {
				// Extraer valores según el idioma de todos los registros
				const values = profileValues.map(pv => {
					const value = locale === 'en' ? pv.value_en : 
								 locale === 'pt' ? pv.value_pt : 
								 pv.value_es;
					return value?.trim() || '';
				}).filter(v => v !== ''); // Filtrar valores vacíos
				
				// Concatenar múltiples valores con coma y espacio
				selectedValue = values.join(', ');
				allProfileValues = profileValues;
			}

			return {
				id: row.id,
				baby_id: row.baby_id,
				category_id: row.category_id,
				key: row.key,
				value: selectedValue || '', // String concatenado de todos los valores
				values_array: allProfileValues, // Array completo para acceso programático
				values_count: profileValues.length, // Cantidad de valores
				has_profile_value: profileValues.length > 0,
				profile_value_id: profileValues.length > 0 ? profileValues[0].id : null, // ID del primer valor para compatibilidad
				raw: row,
			};
		});

		return { data: mapped, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}

/**
 * Agregar un valor adicional a un perfil existente (para relaciones one-to-many)
 * Útil cuando un perfil como 'where_sleep' puede tener múltiples valores
 */
export async function addProfileValue(profileId, { value_es, value_en, value_pt }) {
	if (!profileId) {
		return { data: null, error: new Error('profileId is required') };
	}

	try {
		const { data, error } = await supabase
			.from('baby_profile_value')
			.insert({
				profile_id: profileId,
				value_es,
				value_en,
				value_pt
			})
			.select()
			.single();

		if (error) throw error;

		return { data, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}

/**
 * Obtener todos los valores de un perfil específico (útil para ver múltiples valores)
 */
export async function getProfileValues(profileId, { locale = 'es' } = {}) {
	if (!profileId) {
		return { data: null, error: new Error('profileId is required') };
	}

	try {
		const { data, error } = await supabase
			.from('baby_profile_value')
			.select('*')
			.eq('profile_id', profileId)
			.order('created_at', { ascending: false }); // Más recientes primero

		if (error) throw error;

		// Mapear valores según idioma
		const mapped = (data || []).map(row => ({
			id: row.id,
			profile_id: row.profile_id,
			value: locale === 'en' ? row.value_en : 
				   locale === 'pt' ? row.value_pt : 
				   row.value_es,
			value_es: row.value_es,
			value_en: row.value_en,
			value_pt: row.value_pt,
			created_at: row.created_at,
			updated_at: row.updated_at
		}));

		return { data: mapped, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}
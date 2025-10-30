import supabase from "../lib/supabase";

/**
 * Obtener entradas del `baby_profile` para un bebé dado.
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
			// traer también la categoría relacionada (profile_category)
			.select('id, baby_id, category_id, key, value_es, value_en, value_pt, created_at, updated_at, profile_category(category)')
			.eq('baby_id', babyId)
			.order('category_id', { ascending: true });

		if (error) throw error;

		const mapped = (data || []).map(row => ({
			id: row.id,
			baby_id: row.baby_id,
			category_id: row.category_id,
			category_name: row.profile_category?.category || null,
			key: row.key,
			// elegir el campo de valor según locale
			value: locale === 'en' ? row.value_en : locale === 'pt' ? row.value_pt : row.value_es,
			raw: row,
		}));

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
			.select('id, baby_id, category_id, key, value_es, value_en, value_pt, created_at, updated_at')
			.eq('baby_id', babyId)
			.eq('category_id', categoryId)
			.order('key', { ascending: true });

		if (error) throw error;

		const mapped = (data || []).map(row => ({
			id: row.id,
			baby_id: row.baby_id,
			category_id: row.category_id,
			key: row.key,
			value: locale === 'en' ? row.value_en : locale === 'pt' ? row.value_pt : row.value_es,
			raw: row,
		}));

		return { data: mapped, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}
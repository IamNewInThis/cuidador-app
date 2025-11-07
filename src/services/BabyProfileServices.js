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

/**
 * Obtener entradas del `baby_profile` para un bebé y categoría dada.
 * Similar a getProfileBaby pero filtrado por categoryId.
 */
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
 * Obtener opciones disponibles para un campo específico del perfil
 * @param {string} key - La clave del campo (ej: 'main_sleep_association', 'sleep_rhythm')
 * @param {string} locale - Idioma para los valores ('es', 'en', 'pt')
 * @returns {Promise<{data: Array<{value: string, label: string, value_en: string, value_es: string, value_pt: string}>, error: any}>}
 */
export async function getProfileValueOptions(key, { locale = 'es' } = {}) {
	if (!key) {
		return { data: null, error: new Error('key is required') };
	}

	try {
		const { data, error } = await supabase
			.from('profile_value_option')
			.select('*')
			.eq('key', key)
			.order('value_es', { ascending: true }); // Ordenar por valor en español

		if (error) throw error;

		// Mapear opciones según el idioma solicitado
		const mapped = (data || []).map(row => {
			const label = locale === 'en' ? row.value_en : 
						 locale === 'pt' ? row.value_pt : 
						 row.value_es;
			
			return {
				id: row.id,
				value: row.value_en || row.value_es, // value_en como identificador, fallback a value_es
				label: label || row.value_es, // Etiqueta localizada, fallback a español
				value_es: row.value_es,
				value_en: row.value_en,
				value_pt: row.value_pt,
				key: row.key,
				created_at: row.created_at,
				updated_at: row.updated_at
			};
		});

		return { data: mapped, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}

/**
 * Obtener todas las claves disponibles en profile_value_option
 * Útil para saber qué campos tienen opciones predefinidas
 * @returns {Promise<{data: Array<string>, error: any}>}
 */
export async function getAvailableProfileKeys() {
	try {
		const { data, error } = await supabase
			.from('profile_value_option')
			.select('key')
			.order('key', { ascending: true });

		if (error) throw error;

		// Extraer claves únicas
		const uniqueKeys = [...new Set((data || []).map(row => row.key))];

		return { data: uniqueKeys, error: null };
	} catch (err) {
		return { data: null, error: err };
	}
}

/**
 * Función auxiliar para determinar si un campo tiene opciones predefinidas
 * @param {string} key - La clave del campo
 * @returns {Promise<{hasOptions: boolean, optionsCount: number, error: any}>}
 */
export async function checkFieldHasOptions(key) {
	if (!key) {
		return { hasOptions: false, optionsCount: 0, error: new Error('key is required') };
	}

	try {
		const { count, error } = await supabase
			.from('profile_value_option')
			.select('*', { count: 'exact', head: true })
			.eq('key', key);

		if (error) throw error;

		return { 
			hasOptions: count > 0, 
			optionsCount: count || 0, 
			error: null 
		};
	} catch (err) {
		return { 
			hasOptions: false, 
			optionsCount: 0, 
			error: err 
		};
	}
}

/**
 * Función para actualizar baby_profile_value 
 * cambiando value_es, value_en, value_pt a los correspondientes de profile_value_option seleccionados
 * @param {string} babyId - ID del bebé
 * @param {Object} editedValues - Objeto con las claves y valores seleccionados {key: selectedLabel}
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function updateBabyProfileValues(babyId, editedValues) {
	if (!babyId || !editedValues) {
		return { data: null, error: new Error('babyId and editedValues are required') };
	}

	const updatedRecords = [];
	const errors = [];

	try {
		// Procesar cada campo editado
		for (const [profileKey, selectedLabel] of Object.entries(editedValues)) {
			try {
				console.log(`🔄 Procesando campo: ${profileKey} con valor: ${selectedLabel}`);

				// 1. Buscar la opción seleccionada en profile_value_option para obtener todos los idiomas
				const { data: optionData, error: optionError } = await supabase
					.from('profile_value_option')
					.select('value_es, value_en, value_pt')
					.eq('key', profileKey)
					.or(`value_es.eq.${selectedLabel},value_en.eq.${selectedLabel},value_pt.eq.${selectedLabel}`)
					.single();

				if (optionError) {
					console.error(`❌ Error buscando opción para ${profileKey}:`, optionError);
					errors.push({
						field: profileKey,
						value: selectedLabel,
						error: `No se encontró la opción seleccionada en profile_value_option`
					});
					continue;
				}

				console.log(`✅ Opción encontrada para ${profileKey}:`, optionData);

				// 2. Buscar el registro baby_profile correspondiente
				const { data: profileData, error: profileError } = await supabase
					.from('baby_profile')
					.select(`
						id,
						baby_profile_value(id)
					`)
					.eq('baby_id', babyId)
					.eq('key', profileKey)
					.single();

				if (profileError) {
					console.error(`❌ Error buscando baby_profile para ${profileKey}:`, profileError);
					errors.push({
						field: profileKey,
						value: selectedLabel,
						error: `No se encontró el registro baby_profile`
					});
					continue;
				}

				console.log(`📋 baby_profile encontrado:`, profileData);

				// 3. Verificar si ya existe baby_profile_value o necesitamos crearlo
				const existingValues = profileData.baby_profile_value || [];

				if (existingValues.length > 0) {
					// Actualizar el primer valor existente
					const valueId = existingValues[0].id;
					console.log(`🔄 Actualizando baby_profile_value existente: ${valueId}`);

					const { data: updateData, error: updateError } = await supabase
						.from('baby_profile_value')
						.update({
							value_es: optionData.value_es,
							value_en: optionData.value_en,
							value_pt: optionData.value_pt,
							updated_at: new Date().toISOString()
						})
						.eq('id', valueId)
						.select()
						.single();

					if (updateError) {
						console.error(`❌ Error actualizando baby_profile_value:`, updateError);
						errors.push({
							field: profileKey,
							value: selectedLabel,
							error: `Error actualizando baby_profile_value: ${updateError.message}`
						});
					} else {
						console.log(`✅ baby_profile_value actualizado:`, updateData);
						updatedRecords.push({
							field: profileKey,
							action: 'updated',
							baby_profile_id: profileData.id,
							baby_profile_value_id: updateData.id,
							values: optionData
						});
					}

					// TODO: Si hay múltiples valores existentes, considerar qué hacer con los otros
					// Por ahora solo actualizamos el primero
				} else {
					// Crear nuevo baby_profile_value
					console.log(`➕ Creando nuevo baby_profile_value para baby_profile: ${profileData.id}`);

					const { data: insertData, error: insertError } = await supabase
						.from('baby_profile_value')
						.insert({
							baby_profile_id: profileData.id,
							value_es: optionData.value_es,
							value_en: optionData.value_en,
							value_pt: optionData.value_pt
						})
						.select()
						.single();

					if (insertError) {
						console.error(`❌ Error creando baby_profile_value:`, insertError);
						errors.push({
							field: profileKey,
							value: selectedLabel,
							error: `Error creando baby_profile_value: ${insertError.message}`
						});
					} else {
						console.log(`✅ baby_profile_value creado:`, insertData);
						updatedRecords.push({
							field: profileKey,
							action: 'created',
							baby_profile_id: profileData.id,
							baby_profile_value_id: insertData.id,
							values: optionData
						});
					}
				}

			} catch (fieldError) {
				console.error(`❌ Error procesando campo ${profileKey}:`, fieldError);
				errors.push({
					field: profileKey,
					value: selectedLabel,
					error: fieldError.message || 'Error desconocido'
				});
			}
		}

		// Retornar resultado
		const result = {
			data: updatedRecords,
			error: errors.length > 0 ? errors : null,
			summary: {
				totalFields: Object.keys(editedValues).length,
				successfulUpdates: updatedRecords.length,
				errors: errors.length
			}
		};

		console.log(`📊 Resumen de actualización:`, result.summary);
		return result;

	} catch (err) {
		console.error('❌ Error general en updateBabyProfileValues:', err);
		return { 
			data: updatedRecords, 
			error: [{ 
				field: 'general', 
				error: err.message || 'Error desconocido' 
			}] 
		};
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
// src/locales/medicalConditionsKeys.js
export const medicalConditionsCategoryKeyLabels = {
    digestive: {
        es: 'Condiciones Digestivas',
        en: 'Digestive Conditions',
        pt: 'Condições Digestivas'
    },
    respiratory: {
        es: 'Condiciones Respiratorias',
        en: 'Respiratory Conditions',
        pt: 'Condições Respiratórias'
    },
    dermatological: {
        es: 'Condiciones Dermatológicas',
        en: 'Dermatological Conditions',
        pt: 'Condições Dermatológicas'
    },
    neurological: {
        es: 'Condiciones Neurológicas',
        en: 'Neurological Conditions',
        pt: 'Condições Neurológicas'
    }
};

export const medicalConditionsValueKeyLabels = {
    // Digestive Conditions (Category ID: 1)
    'Gastroesophageal reflux': {
        es: 'Reflujo gastroesofágico',
        en: 'Gastroesophageal reflux',
        pt: 'Refluxo gastroesofágico'
    },
    'Chronic constipation': {
        es: 'Constipación crónica',
        en: 'Chronic constipation',
        pt: 'Constipação crônica'
    },
    'Lactose intolerance': {
        es: 'Intolerancia a la lactosa',
        en: 'Lactose intolerance',
        pt: 'Intolerância à lactose'
    },
    'Frequent colic': {
        es: 'Cólicos frecuentes',
        en: 'Frequent colic',
        pt: 'Cólicas frequentes'
    },
    'Diagnosed food allergy': {
        es: 'Alergia alimentaria diagnosticada',
        en: 'Diagnosed food allergy',
        pt: 'Alergia alimentar diagnosticada'
    },
    'Constipation': {
        es: 'Estreñimiento',
        en: 'Constipation',
        pt: 'Constipação'
    },
    
    // Respiratory Conditions (Category ID: 2)
    'Asthma': {
        es: 'Asma',
        en: 'Asthma',
        pt: 'Asma'
    },
    'Recurrent bronchitis': {
        es: 'Bronquitis recurrente',
        en: 'Recurrent bronchitis',
        pt: 'Bronquite recorrente'
    },
    'Allergic rhinitis': {
        es: 'Rinitis alérgica',
        en: 'Allergic rhinitis',
        pt: 'Rinite alérgica'
    },
    'Sleep apnea': {
        es: 'Apnea del sueño',
        en: 'Sleep apnea',
        pt: 'Apneia do sono'
    },
    
    // Dermatological Conditions (Category ID: 3)
    'Atopic dermatitis': {
        es: 'Dermatitis atópica',
        en: 'Atopic dermatitis',
        pt: 'Dermatite atópica'
    },
    'Eczema': {
        es: 'Eczema',
        en: 'Eczema',
        pt: 'Eczema'
    },
    'Chronic urticaria': {
        es: 'Urticaria crónica',
        en: 'Chronic urticaria',
        pt: 'Urticária crônica'
    },
    'Contact allergy': {
        es: 'Alergia de contacto',
        en: 'Contact allergy',
        pt: 'Alergia de contato'
    },
    
    // Neurological Conditions (Category ID: 4)
    'Epilepsy': {
        es: 'Epilepsia',
        en: 'Epilepsy',
        pt: 'Epilepsia'
    },
    'Migraines': {
        es: 'Migrañas',
        en: 'Migraines',
        pt: 'Enxaquecas'
    },
    'Sleep disorder': {
        es: 'Trastorno del sueño',
        en: 'Sleep disorder',
        pt: 'Distúrbio do sono'
    },
    'Developmental delay': {
        es: 'Retraso del desarrollo',
        en: 'Developmental delay',
        pt: 'Atraso no desenvolvimento'
    },
    'Febrile seizures': {
        es: 'Convulsiones febriles',
        en: 'Febrile seizures',
        pt: 'Convulsões febris'
    },
    'Hyperactivity': {
        es: 'Hiperactividad',
        en: 'Hyperactivity',
        pt: 'Hiperatividade'
    }
};

/**
 * Función helper para obtener la traducción de una condición médica
 * @param {string} conditionKey - La clave de la condición médica (valor en inglés de medical_conditions_value)
 * @param {string} language - El idioma deseado ('es', 'en', 'pt')
 * @returns {string} La traducción de la condición médica
 */
export const getMedicalConditionTranslation = (conditionKey, language = 'es') => {
    const condition = medicalConditionsValueKeyLabels[conditionKey];
    if (!condition) {
        console.warn(`Translation not found for medical condition: ${conditionKey}`);
        return conditionKey; // Fallback al valor original
    }
    
    return condition[language] || condition.en || conditionKey;
};

/**
 * Función helper para obtener la traducción de una categoría médica
 * @param {string} categoryKey - La clave de la categoría médica
 * @param {string} language - El idioma deseado ('es', 'en', 'pt')
 * @returns {string} La traducción de la categoría médica
 */
export const getMedicalCategoryTranslation = (categoryKey, language = 'es') => {
    const category = medicalConditionsCategoryKeyLabels[categoryKey];
    if (!category) {
        console.warn(`Translation not found for medical category: ${categoryKey}`);
        return categoryKey; // Fallback al valor original
    }
    
    return category[language] || category.en || categoryKey;
};
export const TRANSLATIONS = {
    // Bones
    'hips': 'Malucs',
    'spine': 'Columna',
    'ribs': 'Costelles',
    'neck': 'Coll',
    'skull': 'Crani',
    'femur': 'Fèmur',
    'tibia': 'Tíbia',
    'foot': 'Peu',
    'clavicle': 'Clavícula',
    'humerus': 'Húmer',
    'radius': 'Radi',
    'hand': 'Mà',

    // Muscles
    'pectorals': 'Pectorals',
    'abdominals': 'Abdominals',
    'latissimus': 'Dorsals',
    'trapezius': 'Trapezi',
    'deltoids': 'Deltoides',
    'biceps': 'Bíceps',
    'triceps': 'Tríceps',
    'forearms': 'Avantbraços',
    'glutes': 'Glutis',
    'quadriceps': 'Quàdriceps',
    'hamstrings': 'Isquiotibials',
    'calves': 'Bessons',
    'lower_back': 'Lumbars'
};

export function translateName(name) {
    // Handle suffixes like _L, _R
    const parts = name.split('_');
    const base = parts[0];
    const suffix = parts[1] ? (parts[1] === 'L' ? ' (E)' : ' (D)') : '';

    const translatedBase = TRANSLATIONS[base] || base;
    return translatedBase + suffix;
}

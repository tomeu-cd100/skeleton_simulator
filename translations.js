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
    // Handle suffixes like _L, _R (only when they are the last part, e.g. not 'lower_back')
    const match = name.match(/^(.*)_([LR])$/);
    const base = match ? match[1] : name;
    const suffix = match ? (match[2] === 'L' ? ' (E)' : ' (D)') : '';

    const translatedBase = TRANSLATIONS[base] || base;
    return translatedBase + suffix;
}

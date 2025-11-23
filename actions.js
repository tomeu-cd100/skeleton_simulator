export const ACTIONS = {
    // User Requested Sports/Actions
    JAVELIN: {
        id: 'javelin',
        label: 'Llançament de javelina',
        category: 'sport',
        activeBones: ['humerus_R', 'radius_R', 'hand_R', 'spine', 'hips', 'femur_L'],
        activeMuscles: ['deltoids_R', 'triceps_R', 'latissimus_R', 'abdominals', 'quadriceps_L', 'calves_L']
    },
    CRAWL: {
        id: 'crawl',
        label: 'Nedar crol',
        category: 'sport',
        activeBones: ['humerus_L', 'humerus_R', 'radius_L', 'radius_R', 'spine', 'femur_L', 'femur_R'],
        activeMuscles: ['deltoids_L', 'deltoids_R', 'latissimus_L', 'latissimus_R', 'triceps_L', 'triceps_R', 'abdominals', 'quadriceps_L', 'quadriceps_R']
    },
    HIGH_JUMP: {
        id: 'high_jump',
        label: 'Salt d’alçada',
        category: 'sport',
        activeBones: ['femur_L', 'femur_R', 'tibia_L', 'tibia_R', 'spine', 'hips'],
        activeMuscles: ['quadriceps_L', 'quadriceps_R', 'calves_L', 'calves_R', 'glutes', 'abdominals']
    },
    SOCCER: {
        id: 'soccer',
        label: 'Xut de futbol',
        category: 'sport',
        activeBones: ['femur_R', 'tibia_R', 'foot_R', 'femur_L', 'hips'],
        activeMuscles: ['quadriceps_R', 'hamstrings_R', 'calves_R', 'abdominals', 'glutes']
    },
    VOLLEYBALL: {
        id: 'volleyball',
        label: 'Rematada de voleibol',
        category: 'sport',
        activeBones: ['femur_L', 'femur_R', 'spine', 'humerus_R', 'radius_R', 'hand_R'],
        activeMuscles: ['quadriceps_L', 'quadriceps_R', 'calves_L', 'calves_R', 'deltoids_R', 'triceps_R', 'abdominals']
    },
    DANCING: {
        id: 'dancing',
        label: 'Ballar',
        category: 'sport',
        activeBones: ['spine', 'hips', 'femur_L', 'femur_R', 'tibia_L', 'tibia_R', 'humerus_L', 'humerus_R'],
        activeMuscles: ['calves_L', 'calves_R', 'quadriceps_L', 'quadriceps_R', 'abdominals', 'latissimus_L', 'latissimus_R']
    },
    HANDBALL: {
        id: 'handball',
        label: 'Llançament d’handbol',
        category: 'sport',
        activeBones: ['humerus_R', 'radius_R', 'hand_R', 'spine', 'femur_L', 'femur_R'],
        activeMuscles: ['deltoids_R', 'pectorals', 'triceps_R', 'abdominals', 'quadriceps_L', 'calves_L']
    },
    RUNNING: {
        id: 'running',
        label: 'Correr',
        category: 'sport',
        activeBones: ['femur_L', 'femur_R', 'tibia_L', 'tibia_R', 'humerus_L', 'humerus_R'],
        activeMuscles: ['quadriceps_L', 'quadriceps_R', 'hamstrings_L', 'hamstrings_R', 'calves_L', 'calves_R', 'glutes', 'abdominals']
    },
    CLIMBING: {
        id: 'climbing',
        label: 'Escalada',
        category: 'sport',
        activeBones: ['humerus_L', 'humerus_R', 'radius_L', 'radius_R', 'femur_L', 'femur_R', 'spine'],
        activeMuscles: ['latissimus_L', 'latissimus_R', 'biceps_L', 'biceps_R', 'forearms_L', 'forearms_R', 'calves_L', 'calves_R', 'abdominals']
    },
    CRICKET: {
        id: 'cricket',
        label: 'Llançament criquet',
        category: 'sport',
        activeBones: ['humerus_R', 'radius_R', 'hand_R', 'spine', 'femur_L', 'femur_R'],
        activeMuscles: ['deltoids_R', 'triceps_R', 'latissimus_R', 'abdominals', 'quadriceps_L']
    },

    // Daily Actions
    SITTING: {
        id: 'sitting',
        label: 'Seure',
        category: 'daily',
        activeBones: ['spine', 'hips', 'femur_L', 'femur_R'],
        activeMuscles: ['glutes', 'hamstrings_L', 'hamstrings_R', 'abdominals']
    },
    TYPING: {
        id: 'typing',
        label: 'Escriure',
        category: 'daily',
        activeBones: ['radius_L', 'radius_R', 'hand_L', 'hand_R', 'spine'],
        activeMuscles: ['forearms_L', 'forearms_R', 'deltoids_L', 'deltoids_R', 'trapezius']
    },
    LIFTING: {
        id: 'lifting',
        label: 'Aixecar Caixa',
        category: 'daily',
        activeBones: ['spine', 'femur_L', 'femur_R', 'tibia_L', 'tibia_R', 'humerus_L', 'humerus_R', 'radius_L', 'radius_R'],
        activeMuscles: ['quadriceps_L', 'quadriceps_R', 'glutes', 'lower_back', 'biceps_L', 'biceps_R', 'deltoids_L', 'deltoids_R']
    }
};

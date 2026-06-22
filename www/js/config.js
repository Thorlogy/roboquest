const STORY_ACTS = {
    1: {
        title: "📖 Akt 1: Logistik-Einheit",
        hasFog: false,
        objectives: [
            { id: "find_trash", text: "Finde 3 Schrotteile", target: 3, type: "trash", icon: "🗑" },
            { id: "drop_trash", text: "Bringe Schrott zum Recycling-Center", target: 3, type: "drop_off", icon: "♻️" }
        ],
        reward: { id: 'loops', title: "Schleifen-Modul!", desc: "Ab jetzt kannst du 'Wiederholen'-Blöcke nutzen.", icon: "🔁" },
        spawnItems: [
            { type: "trash", count: 8 }
        ]
    },
    2: {
        title: "📖 Akt 2: Das Felsen-Labyrinth",
        hasFog: true,
        objectives: [
            { id: "escape_maze", text: "Entkomme aus dem Labyrinth", type: "zone", zoneId: "maze_exit", icon: "🏁" },
            { id: "scan_walls", text: "Nutze LiDAR-Scan 3 mal", target: 3, type: "scan", icon: "🔍" }
        ],
        reward: { id: 'logic', title: "Logik-Modul!", desc: "WENN/DANN Blöcke sind jetzt freigeschaltet.", icon: "⑂" },
        spawnItems: [
            { type: "datachip", count: 5 }
        ]
    },
    3: {
        title: "📖 Akt 3: Wiederaufforstung",
        hasFog: false,
        objectives: [
            { id: "find_seeds", text: "Finde 3 Samen", target: 3, type: "seed", icon: "🌱" },
            { id: "plant_trees", text: "Pflanze 3 Bäume", target: 3, type: "seed_plant", icon: "🌲" }
        ],
        reward: { id: 'gold', title: "Roboter-Master!", desc: "Du hast bewiesen, dass ein Bot den Wald retten kann!", icon: "🏆" },
        spawnItems: [
            { type: "seed", count: 8 }
        ]
    },
    4: {
        title: "📖 Akt 4: Solarpunk-City",
        hasFog: false,
        objectives: [
            { id: "repair_turbines", text: "Repariere 3 Windräder per Scan", target: 3, type: "repair_turbine", icon: "⚙️" },
            { id: "find_lake", text: "Finde den versteckten See", type: "zone", zoneId: "lake", icon: "🌊" }
        ],
        reward: { id: 'gold', title: "Umwelt-Retter!", desc: "Der Wald ist gerettet und grün!", icon: "🌟" }
    }
};

let minimapCanvas, minimapCtx;
const MINIMAP_SIZE = 150;
const WORLD_SIZE = 450;

// ════════════════════════════════════════════════════════════════
// SECRET ZONES
// ════════════════════════════════════════════════════════════════
const SECRET_ZONES = [
    {
        id: "hut", name: "Die alte Hütte", icon: "🏚",
        x: -70, z: -50, radius: 10,
        story: "Eine verlassene Forscher-Hütte! Hier hat einmal jemand den Wald erforscht. Auf dem Tisch liegt ein altes Tagebuch...",
        points: 200
    },
    {
        id: "lake", name: "Der versteckte See", icon: "🌊",
        x: 90, z: -30, radius: 12,
        story: "Ein kristallklarer See, versteckt hinter dichten Bäumen! Das Wasser glitzert im Sonnenlicht. Hier lebt der Waldgeist...",
        points: 250,
        requireKey: true
    },
    {
        id: "owl", name: "Der Eulenbaum", icon: "🦉",
        x: 20, z: 100, radius: 8,
        story: "Ein uralter riesiger Baum! In seiner Krone lebt eine weise Eule. Sie flüstert dir zu: 'Pflanze die Samen, und der Wald wird gesunden...'",
        points: 150,
        requireScan: true
    },
    {
        id: "base", name: "Recycling-Hub", icon: "🏠",
        x: 0, z: 0, radius: 10,
        story: "Deine Heimatbasis. Hier werden Materialien recycelt und der Eco-Bot gewartet.",
        points: 0
    },
    {
        id: "maze_exit", name: "Labyrinth-Ausgang", icon: "🏁",
        x: 80, z: 80, radius: 8,
        story: "Du hast es geschafft! Der Weg aus dem Felsen-Labyrinth ist frei.",
        points: 500
    }
];
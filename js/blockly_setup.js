/**
 * RoboQuest Blockly Setup & Runtime Logic
 * Handles custom block definitions, categorized toolbox configuration,
 * and standard workspace injection.
 *
 * Block Categories:
 *   🚗 Bewegung   - move_robot, turn_robot
 *   🔁 Schleifen  - repeat_n, while_sensor
 *   ⑂  Logik      - logic_if_else, logic_compare
 *   ⏳ Warten     - wait_seconds, wait_until_sensor
 *   🤖 Aktionen   - gripper_action, push_action, scan_object
 *   📡 Sensoren   - sensor_touch, sensor_ultrasonic, sensor_camera,
 *                   sensor_light, sensor_rotation, sensor_tilt
 */

// ════════════════════════════════════════════════════════════════
// BLOCK DEFINITIONS
// ════════════════════════════════════════════════════════════════

Blockly.defineBlocksWithJsonArray([

  // ── 🚗 BEWEGUNG ────────────────────────────────────────────────

  {
    "type": "move_robot",
    "message0": "Fahre %1 für %2 Sekunden",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          [ "vorwärts ⬆️", "FORWARD" ],
          [ "rückwärts ⬇️", "BACKWARD" ]
        ]
      },
      {
        "type": "field_number",
        "name": "DISTANCE",
        "value": 1,
        "min": 1,
        "max": 20
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160,
    "tooltip": "Bewegt den Eco-Bot vorwärts oder rückwärts. 1 Sekunde ≈ 1 Feld.",
    "helpUrl": ""
  },

  {
    "type": "turn_robot",
    "message0": "Drehe %1 um %2 x 90°",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          [ "links ↺", "LEFT" ],
          [ "rechts ↻", "RIGHT" ]
        ]
      },
      {
        "type": "field_number",
        "name": "DISTANCE",
        "value": 1,
        "min": 1,
        "max": 4
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160,
    "tooltip": "Dreht den Eco-Bot um 90° nach links oder rechts. 2 = halbe Drehung.",
    "helpUrl": ""
  },

  // ── 🔁 SCHLEIFEN ──────────────────────────────────────────────

  {
    "type": "repeat_n",
    "message0": "Wiederhole %1 mal %2 %3",
    "args0": [
      {
        "type": "field_number",
        "name": "TIMES",
        "value": 3,
        "min": 1,
        "max": 100
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 30,
    "tooltip": "Führe die inneren Blöcke eine bestimmte Anzahl von Malen aus.",
    "helpUrl": ""
  },

  {
    "type": "while_sensor",
    "message0": "Wiederhole solange %1 %2 %3",
    "args0": [
      { "type": "input_value", "name": "CONDITION", "check": "Boolean" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 30,
    "tooltip": "Wiederhole die inneren Blöcke, solange die Bedingung WAHR ist. Max. 100 Durchläufe.",
    "helpUrl": ""
  },

  // ── ⑂ LOGIK ───────────────────────────────────────────────────

  {
    "type": "logic_if_else",
    "message0": "WENN %1 %2 DANN %3 SONST %4",
    "args0": [
      { "type": "input_value", "name": "IF_COND", "check": "Boolean" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO_IF" },
      { "type": "input_statement", "name": "DO_ELSE" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 210,
    "tooltip": "Prüfe eine Bedingung. Wenn WAHR → führe DANN aus, sonst → SONST.",
    "helpUrl": ""
  },

  {
    "type": "logic_compare",
    "message0": "%1 %2 %3",
    "args0": [
      { "type": "input_value", "name": "LEFT", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "OP",
        "options": [
          [ "<", "LT" ],
          [ ">", "GT" ],
          [ "=", "EQ" ],
          [ "≤", "LTE" ],
          [ "≥", "GTE" ]
        ]
      },
      { "type": "input_value", "name": "RIGHT", "check": "Number" }
    ],
    "output": "Boolean",
    "colour": 210,
    "tooltip": "Vergleiche zwei Zahlen. Gibt WAHR oder FALSCH zurück.",
    "helpUrl": ""
  },

  {
    "type": "logic_not",
    "message0": "NICHT %1",
    "args0": [
      { "type": "input_value", "name": "BOOL", "check": "Boolean" }
    ],
    "output": "Boolean",
    "colour": 210,
    "tooltip": "Kehrt das Ergebnis um: WAHR wird FALSCH und umgekehrt.",
    "helpUrl": ""
  },

  {
    "type": "number_value",
    "message0": "%1",
    "args0": [
      {
        "type": "field_number",
        "name": "NUM",
        "value": 50,
        "min": 0,
        "max": 999
      }
    ],
    "output": "Number",
    "colour": 210,
    "tooltip": "Ein Zahlenwert zum Vergleichen mit Sensoren.",
    "helpUrl": ""
  },

  // ── ⏳ WARTEN ─────────────────────────────────────────────────

  {
    "type": "wait_seconds",
    "message0": "Warte %1 Sekunden ⏱",
    "args0": [
      {
        "type": "field_number",
        "name": "SECONDS",
        "value": 1,
        "min": 0.5,
        "max": 10,
        "precision": 0.5
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 50,
    "tooltip": "Pausiert die Programmausführung für die angegebene Zeit.",
    "helpUrl": ""
  },

  {
    "type": "wait_until_sensor",
    "message0": "Warte bis %1 ⏳",
    "args0": [
      { "type": "input_value", "name": "CONDITION", "check": "Boolean" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 50,
    "tooltip": "Wartet, bis die Sensor-Bedingung WAHR wird. Timeout nach 30 Sekunden.",
    "helpUrl": ""
  },

  // ── 🤖 AKTIONEN ───────────────────────────────────────────────

  {
    "type": "gripper_action",
    "message0": "Greifer %1 ✊",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "ACTION",
        "options": [
          [ "schließen", "CLOSE" ],
          [ "öffnen", "OPEN" ]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 280,
    "tooltip": "Öffnet oder schließt den Greifer am Eco-Bot.",
    "helpUrl": ""
  },

  {
    "type": "push_action",
    "message0": "Schiebe vorwärts für %1 Sekunden 💪",
    "args0": [
      {
        "type": "field_number",
        "name": "DURATION",
        "value": 1,
        "min": 1,
        "max": 10
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 280,
    "tooltip": "Der Eco-Bot schiebt ein Objekt vor sich her. Langsamer als normal fahren.",
    "helpUrl": ""
  },

  {
    "type": "scan_object",
    "message0": "Scanne Umgebung 🔍",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 280,
    "tooltip": "Scannt die Umgebung und zeigt alle erkannten Objekte im Sensor-Display an.",
    "helpUrl": ""
  },

  // ── 📡 SENSOREN ───────────────────────────────────────────────

  {
    "type": "sensor_touch",
    "message0": "Berührungssensor 👆",
    "output": "Boolean",
    "colour": 190,
    "tooltip": "Gibt WAHR zurück, wenn der Roboter ein Hindernis berührt."
  },

  {
    "type": "sensor_ultrasonic",
    "message0": "Ultraschall-Abstand (cm) 📏",
    "output": "Number",
    "colour": 190,
    "tooltip": "Misst den Abstand zum nächsten Hindernis in Blickrichtung (0-255 cm)."
  },

  {
    "type": "sensor_camera",
    "message0": "Kamera erkennt Objekt? 📸",
    "output": "Boolean",
    "colour": 190,
    "tooltip": "Gibt WAHR zurück, wenn die Kamera ein Objekt (Baum, Fels, Batterie, Ziel) erkennt."
  },

  {
    "type": "sensor_light",
    "message0": "Lichtsensor (%) ☀️",
    "output": "Number",
    "colour": 190,
    "tooltip": "Misst die Umgebungshelligkeit (0% = dunkel, 100% = hell). Im Wald dunkler."
  },

  {
    "type": "sensor_rotation",
    "message0": "Drehsensor (Grad) 🔄",
    "output": "Number",
    "colour": 190,
    "tooltip": "Gibt die aktuelle Drehung des Roboters in Grad zurück (0-360°)."
  },

  {
    "type": "sensor_tilt",
    "message0": "Neigungssensor (Grad) ⛰️",
    "output": "Number",
    "colour": 190,
    "tooltip": "Misst die Neigung des Geländes unter dem Roboter in Grad."
  },

  {
    "type": "sensor_obstacle_ahead",
    "message0": "Hindernis voraus? 👁",
    "output": "Boolean",
    "colour": 190,
    "tooltip": "Gibt WAHR zurück, wenn sich ein Hindernis direkt vor dem Roboter befindet."
  }

]);

// ════════════════════════════════════════════════════════════════
// BLOCKS PER CATEGORY (used by sidebar buttons to swap flyout)
// ════════════════════════════════════════════════════════════════

const CATEGORY_BLOCKS = {
  "🚗 Bewegung": [
    { "kind": "block", "type": "move_robot" },
    { "kind": "block", "type": "turn_robot" }
  ],
  "🔁 Schleifen": [
    { "kind": "block", "type": "repeat_n" },
    {
      "kind": "block",
      "type": "while_sensor",
      "inputs": {
        "CONDITION": {
          "block": { "type": "sensor_obstacle_ahead" }
        }
      }
    }
  ],
  "⑂ Logik": [
    {
      "kind": "block",
      "type": "logic_if_else",
      "inputs": {
        "IF_COND": {
          "block": { "type": "sensor_obstacle_ahead" }
        }
      }
    },
    {
      "kind": "block",
      "type": "logic_compare",
      "inputs": {
        "LEFT": {
          "block": { "type": "sensor_ultrasonic" }
        },
        "RIGHT": {
          "block": { "type": "number_value", "fields": { "NUM": 50 } }
        }
      }
    },
    { "kind": "block", "type": "logic_not" },
    { "kind": "block", "type": "number_value" }
  ],
  "⏳ Warten": [
    { "kind": "block", "type": "wait_seconds" },
    {
      "kind": "block",
      "type": "wait_until_sensor",
      "inputs": {
        "CONDITION": {
          "block": { "type": "sensor_touch" }
        }
      }
    }
  ],
  "🤖 Aktionen": [
    { "kind": "block", "type": "gripper_action" },
    { "kind": "block", "type": "push_action" },
    { "kind": "block", "type": "scan_object" }
  ],
  "📡 Sensoren": [
    { "kind": "block", "type": "sensor_touch" },
    { "kind": "block", "type": "sensor_ultrasonic" },
    { "kind": "block", "type": "sensor_camera" },
    { "kind": "block", "type": "sensor_light" },
    { "kind": "block", "type": "sensor_rotation" },
    { "kind": "block", "type": "sensor_tilt" },
    { "kind": "block", "type": "sensor_obstacle_ahead" }
  ]
};

// Start with Bewegung blocks visible
const INITIAL_TOOLBOX = {
  "kind": "flyoutToolbox",
  "contents": CATEGORY_BLOCKS["🚗 Bewegung"]
};

// ════════════════════════════════════════════════════════════════
// WORKSPACE MANAGEMENT
// ════════════════════════════════════════════════════════════════

let blocklyWorkspace = null;

window.getBlocklyAST = function() {
    if (!blocklyWorkspace) return null;
    const topBlocks = blocklyWorkspace.getTopBlocks(true);
    return topBlocks.length > 0 ? topBlocks[0] : null;
};

window.highlightBlock = function(id) {
    if (blocklyWorkspace) {
        blocklyWorkspace.highlightBlock(id);
    }
};

window.injectBlockly = function(unlockedFeatures = []) {
    try {
        if (blocklyWorkspace) {
            // Workspace already injected — just resize
            setTimeout(() => Blockly.svgResize(blocklyWorkspace), 50);
            setTimeout(() => Blockly.svgResize(blocklyWorkspace), 150);
            return;
        }

        const theme = (Blockly.Themes && Blockly.Themes.Dark) ? Blockly.Themes.Dark : 'classic';

        blocklyWorkspace = Blockly.inject('blocklyDiv', {
            toolbox: INITIAL_TOOLBOX,
            trashcan: true,
            scrollbars: true,
            zoom: {
                controls: true,
                wheel: true,
                startScale: 0.65,
                maxScale: 1.5,
                minScale: 0.3,
                scaleSpeed: 1.1
            },
            grid: {
                spacing: 20,
                length: 2,
                colour: 'rgba(255,255,255,0.06)',
                snap: true
            },
            theme: theme,
            renderer: 'zelos',
            sounds: false
        });

        // Load saved workspace
        const savedState = localStorage.getItem('roboquest_workspace');
        if (savedState) {
            try {
                Blockly.serialization.workspaces.load(JSON.parse(savedState), blocklyWorkspace);
            } catch (e) {
                console.warn("Could not load workspace", e);
            }
        }

        // Save workspace on changes
        blocklyWorkspace.addChangeListener((e) => {
            if (e.isUiEvent) return;
            const state = Blockly.serialization.workspaces.save(blocklyWorkspace);
            localStorage.setItem('roboquest_workspace', JSON.stringify(state));
        });

        // Add ResizeObserver to update Blockly SVG size dynamically
        if (!window._ideResizeObserver) {
            const blocklyDiv = document.getElementById('blocklyDiv');
            if (blocklyDiv) {
                window._ideResizeObserver = new ResizeObserver(() => {
                    if (blocklyWorkspace) {
                        requestAnimationFrame(() => Blockly.svgResize(blocklyWorkspace));
                    }
                });
                window._ideResizeObserver.observe(blocklyDiv);
            }
        }
    } catch (err) {
        console.error("BLOCKLY INJECT ERROR:", err);
        const out = document.getElementById('sensor-output');
        if (out) out.innerText = "Blockly Error: " + err.message;
    }
};

/**
 * Switch the flyout toolbox to show blocks for the given category.
 * Called by the sidebar category buttons in app.js.
 */
window.selectBlocklyCategory = function(categoryName) {
    if (!blocklyWorkspace) return;
    try {
        const blocks = CATEGORY_BLOCKS[categoryName];
        if (!blocks) {
            console.warn('Unknown category:', categoryName);
            return;
        }
        blocklyWorkspace.updateToolbox({
            "kind": "flyoutToolbox",
            "contents": blocks
        });
        // Resize after toolbox swap
        setTimeout(() => Blockly.svgResize(blocklyWorkspace), 50);
    } catch (e) {
        console.warn('Could not select category:', categoryName, e);
    }
};

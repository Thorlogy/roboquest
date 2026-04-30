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

  {
    "type": "start_motor",
    "message0": "Motor starten: %1 ⚙️",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "DIRECTION",
        "options": [
          [ "vorwärts ⬆️", "FORWARD" ],
          [ "rückwärts ⬇️", "BACKWARD" ],
          [ "links drehen ↺", "LEFT" ],
          [ "rechts drehen ↻", "RIGHT" ]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160,
    "tooltip": "Schaltet die Motoren dauerhaft ein. Muss mit 'Motor stoppen' beendet werden.",
    "helpUrl": ""
  },

  {
    "type": "stop_motor",
    "message0": "Motor stoppen 🛑",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 160,
    "tooltip": "Schaltet alle Motoren am Eco-Bot sofort aus.",
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

  {
    "type": "action_build",
    "message0": "Erschaffen (Block) 🧱",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 280,
    "tooltip": "Platziert einen festen Block direkt vor dem Roboter. Gut für Treppen oder Brücken.",
    "helpUrl": ""
  },

  {
    "type": "action_dig",
    "message0": "Graben (Loch) ⛏️",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 280,
    "tooltip": "Gräbt ein Loch in das weiche Terrain vor dem Roboter.",
    "helpUrl": ""
  },

  {
    "type": "action_remove",
    "message0": "Wegräumen (Block) 🧹",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 280,
    "tooltip": "Entfernt einen künstlich erschaffenen Block, der vor dem Roboter steht.",
    "helpUrl": ""
  },

  {
    "type": "action_clean_water",
    "message0": "Wasser reinigen 💧",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 280,
    "tooltip": "Startet den Reinigungsprozess, wenn der Eco-Bot am Fluss steht.",
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
  },

  {
    "type": "sensor_battery",
    "message0": "Batterie-Sensor (%) 🔋",
    "output": "Number",
    "colour": 190,
    "tooltip": "Gibt den aktuellen Akkustand des Eco-Bots zurück (0-100%). Sinkt beim Fahren, steigt in der Sonne."
  }

]);

// ════════════════════════════════════════════════════════════════
// BLOCKS PER CATEGORY (used by sidebar buttons to swap flyout)
// ════════════════════════════════════════════════════════════════

const CATEGORY_BLOCKS = {
  "🚗 Bewegung": [
    { "kind": "block", "type": "move_robot" },
    { "kind": "block", "type": "turn_robot" },
    { "kind": "block", "type": "start_motor" },
    { "kind": "block", "type": "stop_motor" }
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
    { "kind": "block", "type": "scan_object" },
    { "kind": "block", "type": "action_clean_water" }
  ],
  "📡 Sensoren": [
    { "kind": "block", "type": "sensor_touch" },
    { "kind": "block", "type": "sensor_ultrasonic" },
    { "kind": "block", "type": "sensor_camera" },
    { "kind": "block", "type": "sensor_light" },
    { "kind": "block", "type": "sensor_rotation" },
    { "kind": "block", "type": "sensor_tilt" },
    { "kind": "block", "type": "sensor_obstacle_ahead" },
    { "kind": "block", "type": "sensor_battery" }
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
            
            if (window.updateLiveCodePanel) {
                window.updateLiveCodePanel();
            }
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

// ════════════════════════════════════════════════════════════════
// LIVE CODE GENERATOR
// ════════════════════════════════════════════════════════════════

window.generateLiveCode = function(block, indentLevel = 0) {
    if (!block) return '';
    let code = '';
    const indent = '  '.repeat(indentLevel);
    
    const getCond = (b) => {
        if (!b) return 'False';
        if (b.type === 'sensor_obstacle_ahead') return 'eco_bot.obstacle_ahead()';
        if (b.type === 'sensor_touch') return 'eco_bot.touch_sensor()';
        if (b.type === 'sensor_ultrasonic') return 'eco_bot.ultrasonic()';
        if (b.type === 'sensor_camera') return 'eco_bot.camera()';
        if (b.type === 'sensor_light') return 'eco_bot.light()';
        if (b.type === 'sensor_rotation') return 'eco_bot.rotation()';
        if (b.type === 'sensor_tilt') return 'eco_bot.tilt()';
        if (b.type === 'sensor_battery') return 'eco_bot.battery()';
        if (b.type === 'number_value') return `${b.getFieldValue('NUM')}`;
        if (b.type === 'logic_compare') {
            const l = getCond(b.getInputTargetBlock('LEFT'));
            const r = getCond(b.getInputTargetBlock('RIGHT'));
            const op = {'LT':'<','GT':'>','EQ':'==','LTE':'<=','GTE':'>='}[b.getFieldValue('OP')] || '==';
            return `${l} ${op} ${r}`;
        }
        if (b.type === 'logic_not') {
            return `not (${getCond(b.getInputTargetBlock('BOOL'))})`;
        }
        return 'False';
    };

    switch(block.type) {
        case 'move_robot':
            code += `${indent}# Roboter bewegen\n`;
            code += `${indent}eco_bot.move("${block.getFieldValue('DIRECTION')}", ${block.getFieldValue('DISTANCE')})\n`;
            break;
        case 'turn_robot':
            code += `${indent}# Roboter drehen\n`;
            code += `${indent}eco_bot.turn("${block.getFieldValue('DIRECTION')}", ${block.getFieldValue('DISTANCE')})\n`;
            break;
        case 'start_motor':
            code += `${indent}eco_bot.start_motor("${block.getFieldValue('DIRECTION')}")\n`;
            break;
        case 'stop_motor':
            code += `${indent}eco_bot.stop_motor()\n`;
            break;
        case 'wait_seconds':
            code += `${indent}# Warten\n`;
            code += `${indent}eco_bot.sleep(${block.getFieldValue('SECONDS')})\n`;
            break;
        case 'gripper_action':
            code += `${indent}eco_bot.gripper("${block.getFieldValue('ACTION')}")\n`;
            break;
        case 'push_action':
            code += `${indent}eco_bot.push(${block.getFieldValue('DURATION')})\n`;
            break;
        case 'scan_object':
            code += `${indent}# Umgebung scannen\n`;
            code += `${indent}eco_bot.scan()\n`;
            break;
        case 'action_build':
            code += `${indent}eco_bot.build_block()\n`;
            break;
        case 'action_dig':
            code += `${indent}eco_bot.dig_hole()\n`;
            break;
        case 'action_remove':
            code += `${indent}eco_bot.remove_block()\n`;
            break;
        case 'action_clean_water':
            code += `${indent}# Wasser reinigen\n`;
            code += `${indent}eco_bot.clean_water()\n`;
            break;
        case 'repeat_n':
            code += `${indent}for i in range(${block.getFieldValue('TIMES')}):\n`;
            const doBlock = block.getInputTargetBlock('DO');
            if (doBlock) code += window.generateLiveCode(doBlock, indentLevel + 1);
            else code += `${indent}  pass\n`;
            break;
        case 'while_sensor':
            code += `${indent}while ${getCond(block.getInputTargetBlock('CONDITION'))}:\n`;
            const whileDo = block.getInputTargetBlock('DO');
            if (whileDo) code += window.generateLiveCode(whileDo, indentLevel + 1);
            else code += `${indent}  pass\n`;
            break;
        case 'logic_if_else':
            code += `${indent}if ${getCond(block.getInputTargetBlock('IF_COND'))}:\n`;
            const ifDo = block.getInputTargetBlock('DO_IF');
            if (ifDo) code += window.generateLiveCode(ifDo, indentLevel + 1);
            else code += `${indent}  pass\n`;
            const elseDo = block.getInputTargetBlock('DO_ELSE');
            if (elseDo) {
                code += `${indent}else:\n`;
                code += window.generateLiveCode(elseDo, indentLevel + 1);
            }
            break;
        case 'wait_until_sensor':
            code += `${indent}while not ${getCond(block.getInputTargetBlock('CONDITION'))}:\n`;
            code += `${indent}  eco_bot.sleep(0.1)\n`;
            break;
        default:
            code += `${indent}# Unbekannter Block: ${block.type}\n`;
    }

    if (block.getNextBlock()) {
        code += window.generateLiveCode(block.getNextBlock(), indentLevel);
    }
    return code;
};

window.pyEditor = null; // Exported to be accessible by app.js executor
window.updateLiveCodePanel = function() {
    if (!window.pyEditor) return;
    
    // Only update Ace from Blockly if the Blocks tab is currently active
    // This allows the "One-Way Sync" workflow.
    const blocksTabActive = document.querySelector('[data-tab="blocks"]');
    if (blocksTabActive && !blocksTabActive.classList.contains('active')) return;

    const root = window.getBlocklyAST();
    if (!root) {
        window.pyEditor.setValue('# Baue Blöcke in der IDE,\n# um den Python Code hier zu bearbeiten!\n\neco_bot.move("FORWARD", 1)', -1);
    } else {
        let text = '# --- ECO-BOT PROGRAMM ---\n\n';
        text += window.generateLiveCode(root, 0);
        // Ensure clean trailing newline before end comment
        if (!text.endsWith('\n')) text += '\n';
        text += '\n# Programmende';
        window.pyEditor.setValue(text, -1);
    }
};

// Override injectBlockly to immediately trigger an update after init
const originalInject = window.injectBlockly;
window.injectBlockly = function(unlockedFeatures = []) {
    originalInject(unlockedFeatures);
    setTimeout(window.updateLiveCodePanel, 200);
};

// ════════════════════════════════════════════════════════════════
// PYTHON TO BLOCKS PARSER
// ════════════════════════════════════════════════════════════════

window.pythonToBlocks = function(code, workspace) {
    if (!workspace) return;
    
    workspace.clear();

    const lines = code.split('\n');
    let parentStack = [{ block: null, indent: -1 }];
    let currentBlock = null;
    let firstBlock = null;

    const parseCondition = (condStr, parentBlock) => {
        condStr = condStr.trim();
        let targetType = 'sensor_obstacle_ahead';
        let notMatch = condStr.match(/^not\s*\((.+)\)$/);
        
        if (notMatch) {
            let notBlock = workspace.newBlock('logic_not');
            notBlock.initSvg();
            parseCondition(notMatch[1], notBlock);
            if (parentBlock.type === 'logic_if_else') parentBlock.getInput('IF_COND').connection.connect(notBlock.outputConnection);
            else if (parentBlock.type === 'while_sensor') parentBlock.getInput('CONDITION').connection.connect(notBlock.outputConnection);
            else if (parentBlock.type === 'wait_until_sensor') parentBlock.getInput('CONDITION').connection.connect(notBlock.outputConnection);
            return;
        }

        let cmpMatch = condStr.match(/(.+?)\s*(<|>|==|<=|>=)\s*(.+)/);
        if (cmpMatch) {
            let cmpBlock = workspace.newBlock('logic_compare');
            cmpBlock.initSvg();
            let opMap = {'<':'LT', '>':'GT', '==':'EQ', '<=':'LTE', '>=':'GTE'};
            cmpBlock.setFieldValue(opMap[cmpMatch[2]], 'OP');
            
            parseCondition(cmpMatch[1], cmpBlock); 
            
            let numBlock = workspace.newBlock('number_value');
            numBlock.initSvg();
            numBlock.setFieldValue(Number(cmpMatch[3]), 'NUM');
            cmpBlock.getInput('RIGHT').connection.connect(numBlock.outputConnection);
            
            if (parentBlock.type === 'logic_if_else') parentBlock.getInput('IF_COND').connection.connect(cmpBlock.outputConnection);
            else if (parentBlock.type === 'while_sensor') parentBlock.getInput('CONDITION').connection.connect(cmpBlock.outputConnection);
            else if (parentBlock.type === 'wait_until_sensor') parentBlock.getInput('CONDITION').connection.connect(cmpBlock.outputConnection);
            else if (parentBlock.type === 'logic_not') parentBlock.getInput('BOOL').connection.connect(cmpBlock.outputConnection);
            return;
        }

        if (condStr === 'eco_bot.obstacle_ahead()') targetType = 'sensor_obstacle_ahead';
        else if (condStr === 'eco_bot.touch_sensor()') targetType = 'sensor_touch';
        else if (condStr === 'eco_bot.ultrasonic()') targetType = 'sensor_ultrasonic';
        else if (condStr === 'eco_bot.camera()') targetType = 'sensor_camera';
        else if (condStr === 'eco_bot.light()') targetType = 'sensor_light';
        else if (condStr === 'eco_bot.rotation()') targetType = 'sensor_rotation';
        else if (condStr === 'eco_bot.tilt()') targetType = 'sensor_tilt';
        else if (condStr === 'eco_bot.battery()') targetType = 'sensor_battery';
        else if (!isNaN(Number(condStr))) {
            let numBlock = workspace.newBlock('number_value');
            numBlock.initSvg();
            numBlock.setFieldValue(Number(condStr), 'NUM');
            if (parentBlock.type === 'logic_compare') parentBlock.getInput('LEFT').connection.connect(numBlock.outputConnection);
            return;
        }

        let condBlock = workspace.newBlock(targetType);
        condBlock.initSvg();

        if (parentBlock.type === 'logic_compare') {
            parentBlock.getInput('LEFT').connection.connect(condBlock.outputConnection);
        } else if (parentBlock.type === 'logic_if_else') {
            parentBlock.getInput('IF_COND').connection.connect(condBlock.outputConnection);
        } else if (parentBlock.type === 'while_sensor') {
            parentBlock.getInput('CONDITION').connection.connect(condBlock.outputConnection);
        } else if (parentBlock.type === 'wait_until_sensor') {
            parentBlock.getInput('CONDITION').connection.connect(condBlock.outputConnection);
        } else if (parentBlock.type === 'logic_not') {
            parentBlock.getInput('BOOL').connection.connect(condBlock.outputConnection);
        }
    };

    let previousConnection = null;
    let missingCount = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.trim() === '' || line.trim().startsWith('#')) continue;

        let indentMatch = line.match(/^\s*/);
        let indent = indentMatch ? indentMatch[0].length : 0;
        line = line.trim();

        while (parentStack.length > 1 && indent <= parentStack[parentStack.length - 1].indent) {
            parentStack.pop();
        }

        let parent = parentStack[parentStack.length - 1].block;
        let newBlock = null;

        if (line.startsWith('eco_bot.move(')) {
            let m = line.match(/eco_bot\.move\("([^"]+)",\s*([\d.]+)\)/);
            if (m) {
                newBlock = workspace.newBlock('move_robot');
                newBlock.initSvg();
                newBlock.setFieldValue(m[1], 'DIRECTION');
                newBlock.setFieldValue(Number(m[2]), 'DISTANCE');
            }
        } else if (line.startsWith('eco_bot.turn(')) {
            let m = line.match(/eco_bot\.turn\("([^"]+)",\s*([\d.]+)\)/);
            if (m) {
                newBlock = workspace.newBlock('turn_robot');
                newBlock.initSvg();
                newBlock.setFieldValue(m[1], 'DIRECTION');
                newBlock.setFieldValue(Number(m[2]), 'DISTANCE');
            }
        } else if (line.startsWith('eco_bot.start_motor(')) {
            let m = line.match(/eco_bot\.start_motor\("([^"]+)"\)/);
            if (m) {
                newBlock = workspace.newBlock('start_motor');
                newBlock.initSvg();
                newBlock.setFieldValue(m[1], 'DIRECTION');
            }
        } else if (line === 'eco_bot.stop_motor()') {
            newBlock = workspace.newBlock('stop_motor');
            newBlock.initSvg();
        } else if (line.startsWith('eco_bot.sleep(')) {
            let m = line.match(/eco_bot\.sleep\(([\d.]+)\)/);
            if (m) {
                newBlock = workspace.newBlock('wait_seconds');
                newBlock.initSvg();
                newBlock.setFieldValue(Number(m[1]), 'SECONDS');
            }
        } else if (line.startsWith('eco_bot.gripper(')) {
            let m = line.match(/eco_bot\.gripper\("([^"]+)"\)/);
            if (m) {
                newBlock = workspace.newBlock('gripper_action');
                newBlock.initSvg();
                newBlock.setFieldValue(m[1], 'ACTION');
            }
        } else if (line.startsWith('eco_bot.push(')) {
            let m = line.match(/eco_bot\.push\(([\d.]+)\)/);
            if (m) {
                newBlock = workspace.newBlock('push_action');
                newBlock.initSvg();
                newBlock.setFieldValue(Number(m[1]), 'DURATION');
            }
        } else if (line === 'eco_bot.scan()') {
            newBlock = workspace.newBlock('scan_object');
            newBlock.initSvg();
        } else if (line === 'eco_bot.build_block()') {
            newBlock = workspace.newBlock('action_build');
            newBlock.initSvg();
        } else if (line === 'eco_bot.dig_hole()') {
            newBlock = workspace.newBlock('action_dig');
            newBlock.initSvg();
        } else if (line === 'eco_bot.remove_block()') {
            newBlock = workspace.newBlock('action_remove');
            newBlock.initSvg();
        } else if (line.startsWith('for i in range(')) {
            let m = line.match(/for i in range\((\d+)\):/);
            if (m) {
                newBlock = workspace.newBlock('repeat_n');
                newBlock.initSvg();
                newBlock.setFieldValue(Number(m[1]), 'TIMES');
                parentStack.push({ block: newBlock, indent: indent, inputName: 'DO', lastConnection: null });
            }
        } else if (line.startsWith('while not ')) {
            let m = line.match(/while not (.+):/);
            if (m && i + 1 < lines.length && lines[i+1].trim() === 'eco_bot.sleep(0.1)') {
                newBlock = workspace.newBlock('wait_until_sensor');
                newBlock.initSvg();
                parseCondition(m[1], newBlock);
                i++; // Skip sleep line
            }
        } else if (line.startsWith('while ')) {
            let m = line.match(/while (.+):/);
            if (m) {
                newBlock = workspace.newBlock('while_sensor');
                newBlock.initSvg();
                parseCondition(m[1], newBlock);
                parentStack.push({ block: newBlock, indent: indent, inputName: 'DO', lastConnection: null });
            }
        } else if (line.startsWith('if ')) {
            let m = line.match(/if (.+):/);
            if (m) {
                newBlock = workspace.newBlock('logic_if_else');
                newBlock.initSvg();
                parseCondition(m[1], newBlock);
                parentStack.push({ block: newBlock, indent: indent, inputName: 'DO_IF', lastConnection: null });
            }
        } else if (line.startsWith('else:')) {
            if (parent && parent.type === 'logic_if_else') {
                parentStack[parentStack.length - 1].inputName = 'DO_ELSE';
                parentStack[parentStack.length - 1].lastConnection = null;
            }
            continue;
        } else if (line === 'pass') {
            continue;
        } else {
            console.warn("Python Parser: Could not parse line:", line);
            missingCount++;
            continue;
        }

        if (newBlock) {
            if (!firstBlock) firstBlock = newBlock;

            if (parent) {
                let parentFrame = parentStack[parentStack.length - 1];
                if (!parentFrame.lastConnection) {
                    parent.getInput(parentFrame.inputName).connection.connect(newBlock.previousConnection);
                } else {
                    parentFrame.lastConnection.connect(newBlock.previousConnection);
                }
                parentFrame.lastConnection = newBlock.nextConnection;
            } else if (previousConnection) {
                previousConnection.connect(newBlock.previousConnection);
            }
            
            if (!parent && newBlock) {
                previousConnection = newBlock.nextConnection;
            }
        }
    }
    
    if (firstBlock) {
        firstBlock.moveBy(40, 40);
    }
    
    workspace.render();
    return missingCount;
};

// ════════════════════════════════════════════════════════════════
// IDE TAB MANAGEMENT
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    let pyCodeEdited = false;
    const tabBtns = document.querySelectorAll('.ide-tab-btn');
    const blocklyView = document.getElementById('blocklyDiv');
    const codeView = document.getElementById('live-code-panel');

    // Init Ace Editor
    if (typeof ace !== 'undefined') {
        ace.require("ace/ext/language_tools");
        window.pyEditor = ace.edit("python-editor");
        window.pyEditor.setTheme("ace/theme/tomorrow_night_eighties");
        window.pyEditor.session.setMode("ace/mode/python");
        window.pyEditor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            showPrintMargin: false,
            fontSize: "14px"
        });

        window.pyEditor.on("change", function() {
            // Track if user manually edits code
            if (window.pyEditor.curOp && window.pyEditor.curOp.command.name) {
                pyCodeEdited = true;
            }
        });

        // Eco-Bot Documentation Dictionary
        const ecoBotDocs = {
            "move": { title: "🚗 eco_bot.move(direction, distance)", desc: "Bewegt den Roboter um die angegebene Distanz (z.B. 'FORWARD', 3).", returns: "", example: 'eco_bot.move("FORWARD", 3)' },
            "turn": { title: "🔄 eco_bot.turn(direction, count)", desc: "Dreht den Roboter um 90 Grad ('LEFT' oder 'RIGHT'). count gibt die Anzahl der Drehungen an.", returns: "", example: 'eco_bot.turn("LEFT", 1)' },
            "sleep": { title: "⏳ eco_bot.sleep(seconds)", desc: "Pausiert das Programmfenster und den Roboter für die angegebene Zeit in Sekunden.", returns: "", example: 'eco_bot.sleep(2.0)' },
            "gripper": { title: "✊ eco_bot.gripper(action)", desc: "Öffnet ('OPEN') oder schließt ('CLOSE') den Roboter-Greifarm. Zum Aufnehmen von Gegenständen.", returns: "", example: 'eco_bot.gripper("CLOSE")' },
            "scan": { title: "🔍 eco_bot.scan()", desc: "Aktiviert den LiDAR Radar-Sensor und scannt die direkte Umgebung.", returns: "", example: 'eco_bot.scan()' },
            "push": { title: "💪 eco_bot.push(duration)", desc: "Schiebt ein Objekt mit Motorkraft für die angegebene Zeit nach vorn.", returns: "", example: 'eco_bot.push(2)' },
            "obstacle_ahead": { title: "📡 eco_bot.obstacle_ahead()", desc: "Prüft, ob sich direkt vor dem Roboter ein Hindernis befindet.", returns: "bool: True (Wahr) wenn ein Hindernis vorhanden ist", example: 'if eco_bot.obstacle_ahead():' },
            "touch_sensor": { title: "🛑 eco_bot.touch_sensor()", desc: "Prüft, ob der vordere Stoßdämpfer (Berührungssensor) gerade ausgelöst ist.", returns: "bool: True (Wahr) bei Berührung", example: 'while not eco_bot.touch_sensor():' },
            "ultrasonic": { title: "📏 eco_bot.ultrasonic()", desc: "Misst die genaue Distanz zum nächsten Hindernis mit Ultraschall.", returns: "int: Distanz in cm", example: 'if eco_bot.ultrasonic() < 50:' },
            "camera": { title: "📷 eco_bot.camera()", desc: "Sucht mithilfe der Kamera nach auffälligen Objekten (z.B. Müll).", returns: "bool: True (Wahr) wenn ein Zielobjekt erkannt wurde", example: 'if eco_bot.camera():' },
            "light": { title: "☀️ eco_bot.light()", desc: "Misst die Helligkeit der aktuellen Umgebung. Wichtig in dunklen Höhlen.", returns: "int: Helligkeit in % (0 - 100)", example: 'print(eco_bot.light())' },
            "rotation": { title: "🧭 eco_bot.rotation()", desc: "Prüft den internen Kompass. Gibt an, in welche Richtung der Rumpf zeigt.", returns: "int: Winkel in Grad (0, 90, 180, 270)", example: 'if eco_bot.rotation() == 90:' },
            "tilt": { title: "📐 eco_bot.tilt()", desc: "Misst das Gyroskop um zu sehen, ob der Roboter auf einer Schräge oder Kante steht.", returns: "int: Neigung in Grad", example: 'if eco_bot.tilt() > 10:' },
            "battery": { title: "🔋 eco_bot.battery()", desc: "Gibt den aktuellen Akkustand des Roboters wieder. Wird bei manchen Quests verbraucht.", returns: "int: Akkustand in % (0 - 100)", example: 'if eco_bot.battery() < 20:' },
            "start_motor": { title: "⚙️ eco_bot.start_motor(direction)", desc: "Startet den Motor im Dauerbetrieb. Stoppt nicht von selbst!", returns: "", example: 'eco_bot.start_motor("FORWARD")' },
            "stop_motor": { title: "🛑 eco_bot.stop_motor()", desc: "Stoppt harte Dauerbetrieb-Motorbewegungen sofort.", returns: "", example: 'eco_bot.stop_motor()' }
        };

        const getDocHTML = (key) => {
            const doc = ecoBotDocs[key];
            if (!doc) return "";
            let html = `<h4>${doc.title}</h4><p>${doc.desc}</p>`;
            if (doc.example) html += `<div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; margin: 8px 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #cbd5e1;">Beispiel: ${doc.example}</div>`;
            if (doc.returns) html += `<div class="doc-returns">↪ ${doc.returns}</div>`;
            return html;
        };

        // Autocomplete setup
        const ecoBotCompleter = {
            getCompletions: function(editor, session, pos, prefix, callback) {
                const arr = [
                    { name: 'move', caption: 'eco_bot.move(direction, seconds)', value: 'eco_bot.move("FORWARD", 1)', meta: 'EcoBot API' },
                    { name: 'turn', caption: 'eco_bot.turn(direction, count)', value: 'eco_bot.turn("LEFT", 1)', meta: 'EcoBot API' },
                    { name: 'sleep', caption: 'eco_bot.sleep(seconds)', value: 'eco_bot.sleep(1.0)', meta: 'EcoBot API' },
                    { name: 'gripper', caption: 'eco_bot.gripper(action)', value: 'eco_bot.gripper("OPEN")', meta: 'EcoBot API' },
                    { name: 'scan', caption: 'eco_bot.scan()', value: 'eco_bot.scan()', meta: 'EcoBot API' },
                    { name: 'push', caption: 'eco_bot.push(duration)', value: 'eco_bot.push(1)', meta: 'EcoBot API' },
                    { name: 'obstacle_ahead', caption: 'eco_bot.obstacle_ahead()', value: 'eco_bot.obstacle_ahead()', meta: 'Sensor (bool)' },
                    { name: 'touch_sensor', caption: 'eco_bot.touch_sensor()', value: 'eco_bot.touch_sensor()', meta: 'Sensor (bool)' },
                    { name: 'ultrasonic', caption: 'eco_bot.ultrasonic()', value: 'eco_bot.ultrasonic()', meta: 'Sensor (number)' },
                    { name: 'camera', caption: 'eco_bot.camera()', value: 'eco_bot.camera()', meta: 'Sensor (bool)' },
                    { name: 'light', caption: 'eco_bot.light()', value: 'eco_bot.light()', meta: 'Sensor (number)' },
                    { name: 'rotation', caption: 'eco_bot.rotation()', value: 'eco_bot.rotation()', meta: 'Sensor (number)' },
                    { name: 'tilt', caption: 'eco_bot.tilt()', value: 'eco_bot.tilt()', meta: 'Sensor (number)' },
                    { name: 'battery', caption: 'eco_bot.battery()', value: 'eco_bot.battery()', meta: 'Sensor (number)' }
                ];
                
                const completions = arr.map(item => ({
                    caption: item.caption,
                    value: item.value,
                    meta: item.meta,
                    docHTML: getDocHTML(item.name)
                }));
                
                callback(null, completions);
            }
        };
        window.pyEditor.completers = [ecoBotCompleter];

        // Hover Tooltip Implementation
        let hoverTimer = null;
        let tooltipNode = document.createElement('div');
        tooltipNode.className = 'ace-hover-tooltip';
        tooltipNode.style.display = 'none';
        document.body.appendChild(tooltipNode);

        window.pyEditor.on("mousemove", function (e) {
            clearTimeout(hoverTimer);
            const pos = e.getDocumentPosition();
            const token = window.pyEditor.session.getTokenAt(pos.row, pos.column);

            if (token && token.type === "identifier" && ecoBotDocs[token.value]) {
                const doc = ecoBotDocs[token.value];
                const x = e.domEvent.clientX; // Ensure we get screen coordinates
                const y = e.domEvent.clientY;
                
                hoverTimer = setTimeout(() => {
                    let html = `<h4>${doc.title}</h4><p>${doc.desc}</p>`;
                    if (doc.example) html += `<div style="background: rgba(0,0,0,0.3); padding: 5px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; margin: 8px 0; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #cbd5e1;">Beispiel: ${doc.example}</div>`;
                    if (doc.returns) html += `<div class="doc-returns">↪ ${doc.returns}</div>`;
                    tooltipNode.innerHTML = html;
                    
                    // Adjust horizontal position to avoid going off-screen
                    const tooltipWidth = 320;
                    let left = x + 15;
                    if (left + tooltipWidth > window.innerWidth) {
                        left = x - tooltipWidth - 15;
                    }
                    
                    tooltipNode.style.left = left + 'px';
                    tooltipNode.style.top = (y + 15) + 'px';
                    tooltipNode.style.display = 'block';
                }, 350); // 350ms hover delay
            } else {
                tooltipNode.style.display = 'none';
            }
        });

        window.pyEditor.container.addEventListener("mouseleave", () => {
             clearTimeout(hoverTimer);
             tooltipNode.style.display = 'none';
        });
    }


    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const clickedBtn = e.target.closest('.ide-tab-btn');
            if (!clickedBtn) return;
            const target = clickedBtn.getAttribute('data-tab');
            if (!target) return;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            clickedBtn.classList.add('active');

            if (target === 'blocks') {
                if (pyCodeEdited && blocklyWorkspace && window.pyEditor) {
                    const code = window.pyEditor.getValue();
                    const missingCount = window.pythonToBlocks(code, blocklyWorkspace);
                    
                    const statusEl = document.getElementById('sync-status');
                    if (statusEl) {
                        if (missingCount > 0) {
                            statusEl.innerHTML = `🔄 Sync: ⚠️ ${missingCount} Zeilen konnten nicht übersetzt werden`;
                            statusEl.className = 'sync-indicator active warning';
                        } else {
                            statusEl.innerHTML = `🔄 Sync OK`;
                            statusEl.className = 'sync-indicator active';
                        }
                        setTimeout(() => statusEl.classList.remove('active'), 3000);
                    }
                    pyCodeEdited = false;
                }
                
                blocklyView.classList.add('active');
                codeView.classList.remove('active');
                if (blocklyWorkspace) {
                    setTimeout(() => Blockly.svgResize(blocklyWorkspace), 50);
                    setTimeout(() => Blockly.svgResize(blocklyWorkspace), 200);
                }
            } else if (target === 'python') {
                blocklyView.classList.remove('active');
                codeView.classList.add('active');
                if (window.updateLiveCodePanel) {
                    window.updateLiveCodePanel();
                    pyCodeEdited = false;
                }
                if (window.pyEditor) setTimeout(() => window.pyEditor.resize(), 50);
            }
        });
    });
});

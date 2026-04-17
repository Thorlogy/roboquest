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
    { "kind": "block", "type": "scan_object" }
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
        if (b.type === 'sensor_obstacle_ahead') return '<span class="sync-function">eco_bot.obstacle_ahead</span>()';
        if (b.type === 'sensor_touch') return '<span class="sync-function">eco_bot.touch_sensor</span>()';
        if (b.type === 'sensor_ultrasonic') return '<span class="sync-function">eco_bot.ultrasonic</span>()';
        if (b.type === 'sensor_camera') return '<span class="sync-function">eco_bot.camera</span>()';
        if (b.type === 'sensor_light') return '<span class="sync-function">eco_bot.light</span>()';
        if (b.type === 'sensor_rotation') return '<span class="sync-function">eco_bot.rotation</span>()';
        if (b.type === 'sensor_tilt') return '<span class="sync-function">eco_bot.tilt</span>()';
        if (b.type === 'sensor_battery') return '<span class="sync-function">eco_bot.battery</span>()';
        if (b.type === 'number_value') return `<span class="sync-number">${b.getFieldValue('NUM')}</span>`;
        if (b.type === 'logic_compare') {
            const l = getCond(b.getInputTargetBlock('LEFT'));
            const r = getCond(b.getInputTargetBlock('RIGHT'));
            const op = {'LT':'&lt;','GT':'&gt;','EQ':'==','LTE':'&lt;=','GTE':'&gt;='}[b.getFieldValue('OP')] || '==';
            return `${l} ${op} ${r}`;
        }
        if (b.type === 'logic_not') {
            return `<span class="sync-keyword">not</span> (${getCond(b.getInputTargetBlock('BOOL'))})`;
        }
        return 'False';
    };

    switch(block.type) {
        case 'move_robot':
            code += `${indent}<span class="sync-comment"># Roboter bewegen</span>\n`;
            code += `${indent}<span class="sync-function">eco_bot.move</span>(<span class="sync-string">"${block.getFieldValue('DIRECTION')}"</span>, <span class="sync-number">${block.getFieldValue('DISTANCE')}</span>)\n`;
            break;
        case 'turn_robot':
            code += `${indent}<span class="sync-comment"># Roboter drehen</span>\n`;
            code += `${indent}<span class="sync-function">eco_bot.turn</span>(<span class="sync-string">"${block.getFieldValue('DIRECTION')}"</span>, <span class="sync-number">${block.getFieldValue('DISTANCE')}</span>)\n`;
            break;
        case 'start_motor':
            code += `${indent}<span class="sync-function">eco_bot.start_motor</span>(<span class="sync-string">"${block.getFieldValue('DIRECTION')}"</span>)\n`;
            break;
        case 'stop_motor':
            code += `${indent}<span class="sync-function">eco_bot.stop_motor</span>()\n`;
            break;
        case 'wait_seconds':
            code += `${indent}<span class="sync-comment"># Warten</span>\n`;
            code += `${indent}<span class="sync-function">eco_bot.sleep</span>(<span class="sync-number">${block.getFieldValue('SECONDS')}</span>)\n`;
            break;
        case 'gripper_action':
            code += `${indent}<span class="sync-function">eco_bot.gripper</span>(<span class="sync-string">"${block.getFieldValue('ACTION')}"</span>)\n`;
            break;
        case 'push_action':
            code += `${indent}<span class="sync-function">eco_bot.push</span>(<span class="sync-number">${block.getFieldValue('DURATION')}</span>)\n`;
            break;
        case 'scan_object':
            code += `${indent}<span class="sync-comment"># Umgebung scannen</span>\n`;
            code += `${indent}<span class="sync-function">eco_bot.scan</span>()\n`;
            break;
        case 'repeat_n':
            code += `${indent}<span class="sync-keyword">for</span> i <span class="sync-keyword">in</span> <span class="sync-function">range</span>(<span class="sync-number">${block.getFieldValue('TIMES')}</span>):\n`;
            const doBlock = block.getInputTargetBlock('DO');
            if (doBlock) code += window.generateLiveCode(doBlock, indentLevel + 1);
            else code += `${indent}  <span class="sync-keyword">pass</span>\n`;
            break;
        case 'while_sensor':
            code += `${indent}<span class="sync-keyword">while</span> ${getCond(block.getInputTargetBlock('CONDITION'))}:\n`;
            const whileDo = block.getInputTargetBlock('DO');
            if (whileDo) code += window.generateLiveCode(whileDo, indentLevel + 1);
            else code += `${indent}  <span class="sync-keyword">pass</span>\n`;
            break;
        case 'logic_if_else':
            code += `${indent}<span class="sync-keyword">if</span> ${getCond(block.getInputTargetBlock('IF_COND'))}:\n`;
            const ifDo = block.getInputTargetBlock('DO_IF');
            if (ifDo) code += window.generateLiveCode(ifDo, indentLevel + 1);
            else code += `${indent}  <span class="sync-keyword">pass</span>\n`;
            const elseDo = block.getInputTargetBlock('DO_ELSE');
            if (elseDo) {
                code += `${indent}<span class="sync-keyword">else</span>:\n`;
                code += window.generateLiveCode(elseDo, indentLevel + 1);
            }
            break;
        case 'wait_until_sensor':
            code += `${indent}<span class="sync-keyword">while</span> <span class="sync-keyword">not</span> ${getCond(block.getInputTargetBlock('CONDITION'))}:\n`;
            code += `${indent}  <span class="sync-function">eco_bot.sleep</span>(<span class="sync-number">0.1</span>)\n`;
            break;
        default:
            code += `${indent}<span class="sync-comment"># Unbekannter Block: ${block.type}</span>\n`;
    }

    if (block.getNextBlock()) {
        code += window.generateLiveCode(block.getNextBlock(), indentLevel);
    }
    return code;
};

window.updateLiveCodePanel = function() {
    const panel = document.getElementById('live-code-content');
    if (!panel) return;
    const root = window.getBlocklyAST();
    if (!root) {
        panel.innerHTML = '<span class="sync-comment"># Baue Blöcke in der IDE,\n# um den Code zu sehen!</span>\n\neco_bot = EcoBot()\neco_bot.boot()';
    } else {
        let text = '<span class="sync-comment"># --- ECO-BOT PROGRAMM ---</span>\n\n';
        text += window.generateLiveCode(root, 0);
        text += '\n<span class="sync-comment"># Programmende</span>';
        panel.innerHTML = text;
    }
};

// Override injectBlockly to immediately trigger an update after init
const originalInject = window.injectBlockly;
window.injectBlockly = function(unlockedFeatures = []) {
    originalInject(unlockedFeatures);
    setTimeout(window.updateLiveCodePanel, 200);
};

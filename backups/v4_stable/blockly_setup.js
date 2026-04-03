// blockly_setup.js — Custom blocks and code generation for RoboQuest
Blockly.defineBlocksWithJsonArray([
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
    "colour": 160
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
    "colour": 160
  },
  {
    "type": "scan_object",
    "message0": "Scanne Umgebung 🔍",
    "previousStatement": null,
    "nextStatement": null,
    "colour": 230
  },
  {
    "type": "repeat_n",
    "message0": "Wiederhole %1 mal %2 %3",
    "args0": [
      {
        "type": "field_number",
        "name": "TIMES",
        "value": 3,
        "min": 1,
        "max": 10
      },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": 120
  },
  {
    "type": "sense_distance",
    "message0": "Abstand zum Hindernis",
    "output": "Number",
    "colour": 210
  },
  {
    "type": "sensor_obstacle_ahead",
    "message0": "Hindernis voraus? 👁",
    "output": "Boolean",
    "colour": 210
  },
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
    "colour": 210
  }
]);

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
        const toolboxContents = [
            { "kind": "block", "type": "move_robot" },
            { "kind": "block", "type": "turn_robot" }
        ];

        if (unlockedFeatures.includes('loops')) {
            toolboxContents.push({ "kind": "block", "type": "repeat_n" });
        }
        if (unlockedFeatures.includes('logic')) {
            toolboxContents.push({ "kind": "block", "type": "logic_if_else" });
            toolboxContents.push({ "kind": "block", "type": "sensor_obstacle_ahead" });
        }
        if (unlockedFeatures.includes('sensor')) {
            toolboxContents.push({ "kind": "block", "type": "scan_object" });
            toolboxContents.push({ "kind": "block", "type": "sense_distance" });
        }

        if (blocklyWorkspace) {
            blocklyWorkspace.updateToolbox({
                "kind": "flyoutToolbox",
                "contents": toolboxContents
            });
            // Important: Force a resize when reopening the IDE to fix any layout issues
            Blockly.svgResize(blocklyWorkspace);
            return;
        }

        blocklyWorkspace = Blockly.inject('blocklyDiv', {
            toolbox: {
                "kind": "flyoutToolbox",
                "contents": toolboxContents
            },
            trashcan: true,
            scrollbars: true,
            theme: Blockly.Themes.Dark
        });

        // Setup highlighting via Trace
        blocklyWorkspace.traceOn(true);

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
                        // Small delay to ensure flexbox calculated the new boundaries
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

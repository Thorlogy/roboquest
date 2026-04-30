import re
import os

with open('js/app.js', 'r') as f:
    lines = f.readlines()

code = "".join(lines)

# List of all globals to map to state
globals_list = [
    'scene', 'camera', 'renderer', 'controls', 'roverGroup', 'targetMesh', 'targetPosition',
    'lidar', 'targetReached', 'score', 'storyState', 'inputState', 'programMotorState',
    'programDriven', 'isRunning', 'gripperState', 'obstacles', 'collectibles', 'secretZones',
    'plantSpots', 'foxes', 'turbines', 'fireflies', 'chargingStations', 'creatures',
    'clock', 'fogEnabled', 'minimapRenderer', 'minimapCamera', 'minimapScene', 'minimapBlip',
    'cameraChaseMode', 'currentCommandObj', 'currentCommand', 'commandProgress',
    'minimapIconSize', 'terrainYGlobal', 'mapCoverage'
]

for g in globals_list:
    # Negative lookbehind to prevent matching obj.scene
    # Negative lookahead to prevent matching scene: (object keys)
    # also don't match if it's part of a string but simple regex is fine for now
    pattern = r'(?<!\.)\b' + g + r'\b(?!\s*:)'
    code = re.sub(pattern, f'state.{g}', code)

# Let's save the modified code to verify
with open('js/app_modified.js', 'w') as f:
    f.write(code)

print("Done. Wrote app_modified.js")

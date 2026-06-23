// ════════════════════════════════════════════════════════════════
// SKULPT PYTHON ENGINE BRIDGE
// ════════════════════════════════════════════════════════════════
window.compileEcoBotSkulptAPI = function() {
    const mod = {};
    mod.tp$getattr = function(name) { return mod[name.v]; };
    
    // Helper to queue an action n times and await resolution from animate loop
    const runSequence = async (commandName, count) => {
        for(let i=0; i<count; i++) {
            await new Promise(resolve => {
                window.pyResolveCallback = resolve;
                currentCommandObj = { action: commandName, id: 'py' };
                currentCommand = commandName;
                commandProgress = 0;
            });
        }
    };

    mod.move = new window.Sk.builtin.func(function(dir, dist) {
        window.Sk.builtin.pyCheckArgs("move", arguments, 2, 2);
        const count = dist.v;
        const actionName = (dir.v === 'BACKWARD') ? 'moveBackward' : 'move';
        const susp = new window.Sk.misceval.Suspension();
        susp.resume = function() { return window.Sk.builtin.none.none$; };
        susp.data = { type: "Sk.promise", promise: runSequence(actionName, count) };
        return susp;
    });

    mod.turn = new window.Sk.builtin.func(function(dir, dist) {
        window.Sk.builtin.pyCheckArgs("turn", arguments, 2, 2);
        const count = dist.v;
        const actionName = (dir.v === 'LEFT') ? 'turnLeft' : 'turnRight';
        const susp = new window.Sk.misceval.Suspension();
        susp.resume = function() { return window.Sk.builtin.none.none$; };
        susp.data = { type: "Sk.promise", promise: runSequence(actionName, count) };
        return susp;
    });

    mod.sleep = new window.Sk.builtin.func(function(seconds) {
        window.Sk.builtin.pyCheckArgs("sleep", arguments, 1, 1);
        const susp = new window.Sk.misceval.Suspension();
        susp.resume = function() { return window.Sk.builtin.none.none$; };
        susp.data = { type: "Sk.promise", promise: new Promise(resolve => {
            window.pyResolveCallback = resolve;
            currentCommandObj = { action: 'wait', duration: seconds.v, id: 'py' };
            currentCommand = 'wait';
            commandProgress = 0;
        })};
        return susp;
    });

    const singleAction = (actionName) => {
        return new window.Sk.builtin.func(function() {
            const susp = new window.Sk.misceval.Suspension();
            susp.resume = function() { return window.Sk.builtin.none.none$; };
            susp.data = { type: "Sk.promise", promise: runSequence(actionName, 1) };
            return susp;
        });
    }

    mod.build_block = singleAction('build');
    mod.dig_hole = singleAction('dig');
    mod.remove_block = singleAction('remove');
    mod.scan = singleAction('scan');
    mod.clean_water = singleAction('cleanWater');
    mod.plant_vertical = singleAction('plantVertical');
    mod.solar_track = singleAction('solarTrack');
    
    mod.push = new window.Sk.builtin.func(function(dist) {
        const susp = new window.Sk.misceval.Suspension();
        susp.resume = function() { return window.Sk.builtin.none.none$; };
        susp.data = { type: "Sk.promise", promise: runSequence('push', (dist ? dist.v : 1)) };
        return susp;
    });
    
    mod.gripper = new window.Sk.builtin.func(function(state) {
        const susp = new window.Sk.misceval.Suspension();
        susp.resume = function() { return window.Sk.builtin.none.none$; };
        susp.data = { type: "Sk.promise", promise: new Promise(resolve => {
            window.pyResolveCallback = resolve;
            gripperState = state.v;
            currentCommandObj = { action: 'gripper', id: 'py' };
            currentCommand = 'gripper';
            commandProgress = 0;
        })};
        return susp;
    });
    
    mod.start_motor = new window.Sk.builtin.func(function(dir) {
        const d = dir.v;
        programMotorState = { forward: false, backward: false, left: false, right: false };
        if (d === 'FORWARD') programMotorState.forward = true;
        if (d === 'BACKWARD') programMotorState.backward = true;
        if (d === 'LEFT') programMotorState.left = true;
        if (d === 'RIGHT') programMotorState.right = true;
        return window.Sk.builtin.none.none$;
    });

    mod.stop_motor = new window.Sk.builtin.func(function() {
        programMotorState = { forward: false, backward: false, left: false, right: false };
        return window.Sk.builtin.none.none$;
    });

    // Sensors
    mod.obstacle_ahead = new window.Sk.builtin.func(function() { return new window.Sk.builtin.bool(sensorUltrasonic() < 15); });
    mod.touch_sensor = new window.Sk.builtin.func(function() { return new window.Sk.builtin.bool(sensorUltrasonic() < 3); });
    mod.ultrasonic = new window.Sk.builtin.func(function() { return new window.Sk.builtin.int_(Math.round(sensorUltrasonic())); });
    mod.camera = new window.Sk.builtin.func(function() { return new window.Sk.builtin.bool(sensorCameraObjectName() !== 'Nichts'); });
    mod.camera_object = new window.Sk.builtin.func(function() { return new window.Sk.builtin.str(sensorCameraObjectName()); });
    mod.light = new window.Sk.builtin.func(function() { return new window.Sk.builtin.int_(Math.round(sensorLight())); });
    mod.rotation = new window.Sk.builtin.func(function() { return new window.Sk.builtin.int_(Math.round(sensorRotation())); });
    mod.tilt = new window.Sk.builtin.func(function() { return new window.Sk.builtin.int_(Math.round(sensorTilt())); });
    mod.battery = new window.Sk.builtin.func(function() { return new window.Sk.builtin.int_(Math.round(storyState.batteryLevel)); });

    return mod;
};

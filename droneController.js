beScript.onStart = function() {
    // Params

    // verticalSpeed param
    if (this.verticalSpeed !== null && this.verticalSpeed != undefined && typeof this.verticalSpeed === 'number') {
        console.log("verticalSpeed param: " + this.verticalSpeed);
    } else {
        console.error("Invalid verticalSpeed parameter");
        this.verticalSpeed = 30.0;
    }

    // horizontalSpeed param
    if (this.horizontalSpeed !== null && this.horizontalSpeed != undefined && typeof this.horizontalSpeed === 'number') {
        console.log("horizontalSpeed param: " + this.horizontalSpeed);
    } else {
        console.error("Invalid horizontalSpeed parameter");
        this.horizontalSpeed = 1000.0;
    }

    // rollSensitivity param
    if (this.rollSensitivity !== null && this.rollSensitivity != undefined && typeof this.rollSensitivity === 'number') {
        console.log("rollSensitivity param: " + this.rollSensitivity);
    } else {
        console.error("Invalid rollSensitivity parameter");
        this.rollSensitivity = 1.0;
    }

    // yawSensitivity param
    if (this.yawSensitivity !== null && this.yawSensitivity != undefined && typeof this.yawSensitivity === 'number') {
        console.log("yawSensitivity param: " + this.yawSensitivity);
    } else {
        console.error("Invalid yawSensitivity parameter");
        this.yawSensitivity = 1.0;
    }

    // pitchSensitivity param
    if (this.pitchSensitivity !== null && this.pitchSensitivity != undefined && typeof this.pitchSensitivity === 'number') {
        console.log("pitchSensitivity param: " + this.pitchSensitivity);
    } else {
        console.error("Invalid pitchSensitivity parameter");
        this.pitchSensitivity = 1.0;
    }

    // rollP param
    if (this.rollP !== null && this.rollP != undefined && typeof this.rollP === 'number') {
        console.log("rollP param: " + this.rollP);
    } else {
        console.error("Invalid rollP parameter");
        this.rollP = 0.5;
    }

    // rollI param
    if (this.rollI !== null && this.rollI != undefined && typeof this.rollI === 'number') {
        console.log("rollI param: " + this.rollI);
    } else {
        console.error("Invalid rollI parameter");
        this.rollI = 0.5;
    }

    // pitchP param
    if (this.pitchP !== null && this.pitchP != undefined && typeof this.pitchP === 'number') {
        console.log("pitchP param: " + this.pitchP);
    } else {
        console.error("Invalid pitchP parameter");
        this.pitchP = 0.5;
    }

    // pitchI param
    if (this.pitchI !== null && this.pitchI != undefined && typeof this.pitchI === 'number') {
        console.log("pitchI param: " + this.pitchI);
    } else {
        console.error("Invalid pitchI parameter");
        this.pitchI = 0.5;
    }

    // altitudeP param
    if (this.altitudeP !== null && this.altitudeP != undefined && typeof this.altitudeP === 'number') {
        console.log("altitudeP param: " + this.altitudeP);
    } else {
        console.error("Invalid altitudeP parameter");
        this.altitudeP = 0.4;
    }

    // altitudeI param
    if (this.altitudeI !== null && this.altitudeI != undefined && typeof this.altitudeI === 'number') {
        console.log("altitudeI param: " + this.altitudeI);
    } else {
        console.error("Invalid altitudeI parameter");
        this.altitudeI = 0.4;
    }

    // expo param
    if (this.expo !== null && this.expo != undefined && typeof this.expo === 'number') {
        console.log("expo param: " + this.expo);
    } else {
        console.error("Invalid expo parameter");
        this.expo = 4.0;
    }

    // Axis
    this.axisRoll = new ThreeDS.Mathematics.Vector3D();
    this.axisRoll.setCoord(1.0, 0.0, 0.0);
    this.axisYaw = new ThreeDS.Mathematics.Vector3D();
    this.axisYaw.setCoord(0.0, 0.0, 1.0);
    this.axisPitch = new ThreeDS.Mathematics.Vector3D();
    this.axisPitch.setCoord(0.0, 1.0, 0.0);

    // Force
    this.weightForce = new ThreeDS.Mathematics.Vector3D();
    this.weightForce.setCoord(0.0, -1.0, 0.0);
    this.throttleAverage = 2.0;
    this.throttleMax = 12.0;
    this.throttle = this.throttleMax;
    this.previousThrottle = 0.0;

    // Angle values
    this.currentRollAngle = 0.0;
    this.targetRollAngle = 0.0;
    this.currentYawAngle = 0.0;
    this.targetYawAngle = 0.0;
    this.currentPitchAngle = 0.0;
    this.targetPitchAngle = 0.0;

    this.currentAltitude = 0.0;
    this.targetAltitude = 200.0;

    this.takeOff = false;
    this.flightMode = 0; //0 = quad, 1=plane

    // Time
    this.dt = 0.0001;
    this.startTime = new Date().getTime();
    this.currentTime = new Date().getTime();
    this.previousTime = new Date().getTime();

    // Engine Props
    var propsRotateAxis = new ThreeDS.Mathematics.Vector3D();
    propsRotateAxis.setCoord(0.0, 1.0, 0.0);
    this.engines = [{
        id: "engineFront",
        name: "propFL",
        actor: null,
        rotateAxis: propsRotateAxis,
        startingSpeedIncrement: 0.03,
        defaultSpeed: 2.0,
        currentSpeed: 0.0,
        rotationWay: 1.0,
        state: 0 // 0=off, 1=starting, 2=on
    }, {
        id: "engineLeft",
        name: "propFR",
        actor: null,
        rotateAxis: propsRotateAxis,
        startingSpeedIncrement: 0.024,
        defaultSpeed: 2.0,
        currentSpeed: 0.0,
        rotationWay: -1.0,
        state: 0 // 0=off, 1=starting, 2=on
    }, {
        id: "engineRight",
        name: "propRL",
        actor: null,
        rotateAxis: propsRotateAxis,
        startingSpeedIncrement: 0.04,
        defaultSpeed: 2.0,
        currentSpeed: 0.0,
        rotationWay: 1.0,
        state: 0 // 0=off, 1=starting, 2=on
    }, {
        id: "engineRear",
        name: "propRR",
        actor: null,
        rotateAxis: propsRotateAxis,
        startingSpeedIncrement: 0.028,
        defaultSpeed: 2.0,
        currentSpeed: 0.0,
        rotationWay: -1.0,
        state: 0 // 0=off, 1=starting, 2=on
    }];

    //Moving Engines
    var engineLeftName = "DroneExp_Moteur Arriere Gauche Assemble ---.000 (Moteur Arriere Gauche Assemble)";
    this.engineLeftActor = this.getActor().getSubActorByName(engineLeftName);
    if (this.engineLeftActor === null || this.engineLeftActor === undefined) {
        console.error("Could not find engineLeftActor named: " + engineLeftName);
    } else {
        this.engineLeftActor.OpenClose.Open();
    }

    var engineRightName = "DroneExp_Moteur Arriere Droit Assemble ---.000 (Moteur Arriere Droit Assemble)";
    this.engineRightActor = this.getActor().getSubActorByName(engineRightName);
    if (this.engineRightActor === null || this.engineRightActor === undefined) {
        console.error("Could not find engineRightActor named: " + engineRightName);
    } else {
        this.engineRightActor.OpenClose.Open();
    }

    // Nose
    var noseActorName = "DroneExp_Nose ---.000 (Nose)";
    this.noseActor = this.getActor().getSubActorByName(noseActorName);
    if (this.noseActor === null || this.noseActor === undefined) {
        console.error("Could not find drone node named: " + noseActorName);
    } else {
        this.noseActor.OpenClose.Open();
    }

    // Landing Gears
    var gearLeftName = "DroneExp_Train Gauche ---.000 (Train Gauche)";
    this.gearLeftActor = this.getActor().getSubActorByName(gearLeftName);
    if (this.gearLeftActor === null || this.gearLeftActor === undefined) {
        console.error("Could not find gearLeftActor named: " + gearLeftName);
    } else {}

    var gearRightName = "DroneExp_Train Droit ---.000 (Train Droit)";
    this.gearRightActor = this.getActor().getSubActorByName(gearRightName);
    if (this.gearRightActor === null || this.gearRightActor === undefined) {
        console.error("Could not find gearRightActor named: " + gearRightName);
    } else {}

    // Ailerons
    var aileronLeftName = "DroneExp_Left Elevon ---.000 (Left Elevon)";
    this.aileronLeftActor = this.getActor().getSubActorByName(aileronLeftName);
    if (this.aileronLeftActor === null || this.aileronLeftActor === undefined) {
        console.error("Could not find aileronLeftActor named: " + aileronLeftName);
    } else {}

    var aileronRightName = "DroneExp_Right Elevon ---.000 (Right Elevon)";
    this.aileronRightActor = this.getActor().getSubActorByName(aileronRightName);
    if (this.aileronRightActor === null || this.aileronRightActor === undefined) {
        console.error("Could not find aileronRightActor named: " + aileronRightName);
    } else {}

    var aileronLeftRefName = "aileronLeft_ref";
    this.aileronLeftRefActor = this.getActor().getSubActorByName(aileronLeftRefName);
    if (this.aileronLeftRefActor === null || this.aileronLeftRefActor === undefined) {
        console.error("Could not find aileronLeftRefActor named: " + aileronLeftRefName);
    } else {
        this.aileronLeftRefActor.setTransform(this.aileronLeftActor.getTransform());

    }

    var aileronRightRefName = "aileronRight_ref";
    this.aileronRightRefActor = this.getActor().getSubActorByName(aileronRightRefName);
    if (this.aileronRightRefActor === null || this.aileronRightRefActor === undefined) {
        console.error("Could not find aileronRightRefActor named: " + aileronRightRefName);
    } else {
        this.aileronRightRefActor.setTransform(this.aileronRightActor.getTransform());
    }

    // Gamepad Management
    this.gamepad = EP.Devices.getGamepad();
    if (this.gamepad === null || this.gamepad === undefined) {
        console.error("Could not init gamepad");
    }
    EP.EventServices.addObjectListener(EP.GamepadPressEvent, beScript, 'onGamepadPressEvent');

    // Inits
    this.initPID();
    this.frameCount = 0;
    this.initEngines(this.engines);
};

beScript.initPID = function() {
    console.log("Initializing PID controllers..");
    this.controllerRoll = new STU.PIDController("Roll", this.rollP, this.rollI, 0.0);
    this.controllerPitch = new STU.PIDController("Pitch", this.pitchP, this.pitchI, 0.0);
    this.controllerYaw = new STU.PIDController("Yaw", 1.0, 1.0, 0.0);
    this.controllerAltitude = new STU.PIDController("Altitude", this.altitudeP, this.altitudeI, 0.0);
};

beScript.initEngines = function(iElmtsArray) {
    console.log("Init propellers: ");
    var nbElmts = iElmtsArray.length;
    // For all elements
    for (var noElmt = 0; noElmt < nbElmts; noElmt++) {
        // Search all subactors to find the good one
        iElmtsArray[noElmt].actor = this.getActor().getSubActorByName(iElmtsArray[noElmt].name, true);
        // If not found, error fired
        if ((iElmtsArray[noElmt].actor === null) || (iElmtsArray[noElmt].actor === undefined)) {
            console.error("Could not find element id: " + iElmtsArray[noElmt].id + ", named: " + iElmtsArray[noElmt].name);
        } else {
            console.log("Starting engine: " + iElmtsArray[noElmt].name);
            iElmtsArray[noElmt].state = 1; // starting
        }
    }
};

beScript.execute = function() {
    this.currentTime = new Date().getTime();
    this.dt = (this.currentTime - this.previousTime) / 100.0;

    this.computePID();
    this.manageEngines(this.engines);

    this.previousTime = this.currentTime;
};

beScript.manageEngines = function(iElmtsArray) {
    var nbElmts = iElmtsArray.length;
    // For all elements
    for (var noElmt = 0; noElmt < nbElmts; noElmt++) {
        // If not found, error fired
        if ((iElmtsArray[noElmt].actor === null) || (iElmtsArray[noElmt].actor === undefined)) {
            console.error("Could not find element id: " + iElmtsArray[noElmt].id + ", named: " + iElmtsArray[noElmt].name);
        } else {
            var rotateAxis = iElmtsArray[noElmt].rotateAxis.clone();
            // If engine is starting
            if ((iElmtsArray[noElmt].state === 1)) {
                //console.log("Engine: " + iElmtsArray[noElmt].name + " is starting");
                // if not at starting speed yet, then increase speed
                if (iElmtsArray[noElmt].currentSpeed < iElmtsArray[noElmt].defaultSpeed) {
                    //console.log("Engine: " + iElmtsArray[noElmt].name + " increasing speed");
                    rotateAxis.multiplyVector(iElmtsArray[noElmt].currentSpeed + iElmtsArray[noElmt].startingSpeedIncrement * this.dt);
                    iElmtsArray[noElmt].currentSpeed += iElmtsArray[noElmt].startingSpeedIncrement * this.dt;
                } else { // starting speed reached
                    //console.log("Engine: " + iElmtsArray[noElmt].name + " reached max speed");
                    iElmtsArray[noElmt].state = 2; // now we're started
                    this.takeOff = true;
                }
            } else { // engine already started
                rotateAxis.multiplyVector(iElmtsArray[noElmt].currentSpeed);
            }

            // If not stopped, then rotate
            if (iElmtsArray[noElmt].state !== 0) {
                //console.log("Rotating: " + iElmtsArray[noElmt].name);
                rotateAxis.multiplyVector(iElmtsArray[noElmt].rotationWay);
                iElmtsArray[noElmt].actor.rotate(rotateAxis, iElmtsArray[noElmt].actor);
            }
        }
    }
}

beScript.computePID = function() {
    var actor = this.getActor();
    if (actor === undefined || actor === null) {
        console.error("Actor null or undefined.");
        return this;
    }

    // Get Current attitude
    var rollAngleVector;
    var pitchAngleVector;
    var yawAngleVector;

    var currentQuat = new ThreeDS.Mathematics.Quaternion();
    currentQuat.rotMatrixToQuaternion(actor.getTransform().matrix);

    this.currentRollAngle = actor.getRotation().x;
    this.currentPitchAngle = actor.getRotation().y;
    this.currentYawAngle = actor.getRotation().z;

    this.currentAltitude = actor.getPosition().z;

    var yawSign = this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSX) && this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSX) / Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSX));
    this.targetYawAngle = -this.yawSensitivity * yawSign * Math.exp(this.expo * Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSX))) / Math.exp(this.expo);

    var rollSign = this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX) && this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX) / Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX));
    this.targetRollAngle = this.rollSensitivity * rollSign * Math.exp(this.expo * Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX))) / Math.exp(this.expo);

    var pitchSign = this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSY) && this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSY) / Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSY));
    this.targetPitchAngle = -this.pitchSensitivity * pitchSign * Math.exp(this.expo * Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSY))) / Math.exp(this.expo);

    // Update PID Controllers
    this.controllerRoll.compute(this.currentRollAngle, this.targetRollAngle, this.currentTime, this.dt);
    this.controllerPitch.compute(this.currentPitchAngle, this.targetPitchAngle, this.currentTime, this.dt);
    //this.controllerYaw.compute(this.currentYawAngle, this.targetYawAngle, this.currentTime, this.dt);

    /*
        // Drone Quat
        var newQuat = new ThreeDS.Mathematics.Quaternion();
        rollAngleVector = {
            angle: this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY) / 2.0, //this.controllerRoll.newValue * this.dt,
            vector: this.axisRoll
        };
        newQuat.setRotationData(rollAngleVector);

        pitchAngleVector = {
            angle: -this.gamepad.getAxisValue(EP.Gamepad.EAxis.eLSY) / 2.0, //this.controllerPitch.newValue * this.dt,
            vector: actor.getTransform().applyToVector(this.axisPitch)
        };
        newQuat.setRotationData(pitchAngleVector);

        yawAngleVector = {
            angle: this.targetYawAngle, //this.controllerYaw.newValue * this.dt,
            vector: actor.getTransform().applyToVector(this.axisYaw)
        };
        newQuat.setRotationData(yawAngleVector);

        var newTransfo = actor.getTransform();
        newTransfo.matrix = newQuat.quaternionToRotMatrix();
        actor.setTransform(newTransfo);
    */

    // Update orientation
    // Roll
    var newRollEuler = this.axisRoll.clone();
    newRollEuler.multiplyVector(this.controllerRoll.newValue * this.dt);
    actor.setRotation(newRollEuler, this.getActor());
    //actor.setScale(1.0);

    // Pitch
    var newPitchEuler = this.axisPitch.clone();
    newPitchEuler.multiplyVector(this.controllerPitch.newValue * this.dt);
    actor.setRotation(newPitchEuler, this.getActor());

    // Yaw
    var newYawEuler = this.axisYaw.clone();
    newYawEuler.multiplyVector(this.targetYawAngle);
    actor.rotate(newYawEuler, this.getActor());

    // If takeoff already occured
    if (this.takeOff === true) {
        //Engine
        var translateVecEngine = new ThreeDS.Mathematics.Vector3D();

        var altitudeSign = this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY) && this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY) / Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY));
        if (this.flightMode === 0) { // flight mode = quad
            var altitudeSpeed = -this.verticalSpeed * altitudeSign * Math.exp(this.expo * Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY))) / Math.exp(this.expo);
            this.targetAltitude += altitudeSpeed;
            this.controllerAltitude.compute(this.currentAltitude, this.targetAltitude, this.currentTime, this.dt);

            translateVecEngine.setCoord(0.0, 0.0, this.throttle * this.dt * 60.0 * Math.max(Math.abs(this.currentRollAngle), Math.abs(this.currentPitchAngle)));
            actor.translate(translateVecEngine, this.getActor());

            var newPos = actor.getPosition();
            newPos.z = this.controllerAltitude.newValue;
            actor.setPosition(newPos);
            //actor.setScale(1.0);

            var rot = new ThreeDS.Mathematics.Vector3D();
            rot.setCoord(0.0, -0.8, 0.0);
            this.aileronLeftActor.setRotation(rot, this.aileronLeftRefActor);
            rot.setCoord(0.0, 0.8, 0.0);
            this.aileronRightActor.setRotation(rot, this.aileronRightRefActor);

        } else { // flight mode = plane
            var horizontalSpeed = -this.horizontalSpeed * altitudeSign * Math.exp(this.expo * Math.abs(this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY))) / Math.exp(this.expo);
            if (horizontalSpeed < 0.0) {
                horizontalSpeed = 0.0;
            }
            translateVecEngine.setCoord(100.0 + horizontalSpeed, 0.0, 0.0);
            actor.translate(translateVecEngine, this.getActor());

            var rot = new ThreeDS.Mathematics.Vector3D();
            rot.setCoord(0.0, -this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX) / 1.0, 0.0);
            this.aileronLeftActor.setRotation(rot, this.aileronLeftRefActor);
            rot.setCoord(0.0, -this.gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX) / 1.0, 0.0);
            this.aileronRightActor.setRotation(rot, this.aileronRightRefActor);
        }

        if (actor.getPosition().z < 0.0) {
            var newPos = new ThreeDS.Mathematics.Vector3D();
            newPos = actor.getPosition();
            newPos.z = 0.0;
            actor.setPosition(newPos);
            this.targetAltitude = 0.0;
        }
    }

    if (this.debug) {
        var str = "PID Altitude: " + "dt: " + this.dt +
            ", currentValue: " + this.controllerAltitude.currentValue +
            ", targetValue: " + this.controllerAltitude.targetValue +
            ", error: " + this.controllerAltitude.currentError +
            ", integral: " + this.controllerAltitude.integral +
            ", derivative: " + this.controllerAltitude.derivative +
            ", newValue: " + this.controllerAltitude.newValue;
        console.log(str);
    }

    return;
};

beScript.onGamepadPressEvent = function(iEvent) {
    if (iEvent.button === EP.Gamepad.EButton.eA) {
        console.log("Gamepad button X pressed");
        this.gearLeftActor.OpenClose.onClickablePress();
        this.gearRightActor.OpenClose.onClickablePress();
    }
    if (iEvent.button === EP.Gamepad.EButton.eX) {
        this.engineLeftActor.OpenClose.onClickablePress();
        this.engineRightActor.OpenClose.onClickablePress();
        this.noseActor.OpenClose.onClickablePress();
        this.flightMode = (this.flightMode + 1) % 2;
        console.log("Flight Mode: " + this.flightMode);
    }
};

beScript.onStop = function() {
    // Gamepad Events registering
    EP.EventServices.removeObjectListener(EP.GamepadPressEvent, beScript, 'onGamepadPressEvent');
};

STU.Actor3D.prototype.setOrientations = function(iTargetUp, iTargetDir) {
    iTargetUp.normalize();
    iTargetDir.normalize();
    var targetLeft = ThreeDS.Mathematics.cross(iTargetUp, iTargetDir);
    targetLeft.normalize();

    var transfo = this.getTransform();
    /*    var coef = [iTargetDir.x, targetLeft.x, iTargetUp.x,
        iTargetDir.y, targetLeft.y, iTargetUp.y,
        iTargetDir.z, targetLeft.z, iTargetUp.z
    ];*/

    var coef = [targetLeft.x, iTargetUp.x, iTargetDir.x,
        targetLeft.y, iTargetUp.y, iTargetDir.y,
        targetLeft.z, iTargetUp.z, iTargetDir.z
    ];

    for (var noCoef = 0; noCoef < coef.length; noCoef++) {
        coef[noCoef] *= this.getScale();
    }
    transfo.matrix.setCoef(coef);
    this.setTransform(transfo);
}

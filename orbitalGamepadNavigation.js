/*
NAME: OrbitalGamepadNavigation
DESC: Smooth Orbital navigation behavior using Gamepad.
FEATURES:
  - Designed to be attached to a Camera Actor
  - Smooth navigation
  - Gamepad support
  - zoom speed proportionnal to target distance (compatible with large scale navigations like Globe)
  - Multiple camera targets, switchable at runtime using gamepad e1 button.
VERSION: Developped on Creative Experience v2017x
KNOWN limitations:
- Tested on XBox360 gamepad only.
PARAMS:
    target (3DActor: null)
    verticalSensibility (Double: 0.05)
    horizontalSensibility (Double: 0.05)
    zoomSensibility (Double: 100.0)
    smoothFactor (Double: 0.5)
    targets (Collection: null)
    minDistance (Double: 100.0)
    maxDistance (Double: 20000)
*/

beScript.onStart = function() {
    //Will be called on the experience start.

    // clamp var
    this.elevationClamp_min = -0.9;
    this.elevationClamp_max = 0.9;

    this.gamepadDeadZone = 0.4;

    this.apple = new this.SphericalCoordinates('Test');
    this.apple.radius = 2500;
    this.apple.polar = 0;
    this.apple.elevation = 0.0;

    this.currentTarget = 0;
    if (this.targets === null || this.targets === undefined) {
        console.log("No target collection defined, using default target parameter as camera target");
    } else {
        var item = this.targets.getObjectAt(0);
        if (item !== null && item !== undefined) {
            console.log("Targets collection defined, using item #0 as camera target: " + item.name);
            this.target = item;
        } else {
            console.log("Empty targets collection defined, using default target parameter as camera target");
        }
    }

    this.desiredPos = cgmMath.addVectorToVector(this.target.getPosition(), this.SphericalToCartesian(this.apple.radius, this.apple.polar, this.apple.elevation));
    this.actor.setPosition(this.desiredPos);
    var targetPos = this.target.getPosition();

    this.lookAtFactor = 1;

    this.currentTime = new Date().getTime();
    this.previousTime = this.currentTime;
};

beScript.onStop = function() {
    //Will be called on experience stop.
};

beScript.execute = function() {
    var gamepad = EP.Devices.getGamepad();
    //Insert your code here.
    this.currentTime = new Date().getTime();
    this.deltaTime = (this.currentTime - this.previousTime) / 1000;

    /////////////////////////////////////////////////////
    //                                                 //
    //          Camero management
    //                                                 //
    /////////////////////////////////////////////////////
    if (this.isActive === true) {
        // Getting right stick X and Y values
        var rightStick_Xvalue = gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX);
        var rightStick_Yvalue = -gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY);
        var rightTrigger = gamepad.getAxisValue(EP.Gamepad.EAxis.eRT);
        var leftTrigger = gamepad.getAxisValue(EP.Gamepad.EAxis.eLT);

        if (rightStick_Xvalue < -this.gamepadDeadZone || rightStick_Xvalue > this.gamepadDeadZone) {
            this.apple.polar = this.apple.polar - rightStick_Xvalue * this.horizontalSensibility;
        } else {
            rightStick_Xvalue = 0;
        }

        if (rightStick_Yvalue < -this.gamepadDeadZone || rightStick_Yvalue > this.gamepadDeadZone) {
            this.apple.elevation = this.clamp((this.apple.elevation + rightStick_Yvalue * this.verticalSensibility), this.elevationClamp_min, this.elevationClamp_max);
        } else {
            rightStick_Yvalue = 0;
        }

        var distToTarget = (this.target.getPosition().sub(this.getActor().getPosition())).norm();
        if (distToTarget < this.range01Threshold) {
            this.range01.visible = false;
            this.range02.visible = false;
            this.range03.visible = false;
        }
        if (distToTarget > this.range01Threshold && distToTarget < this.range02Threshold) {
            this.range01.visible = true;
            this.range02.visible = false;
            this.range03.visible = false;
        }
        if (distToTarget > this.range02Threshold && distToTarget < this.range03Threshold) {
            this.range01.visible = true;
            this.range02.visible = true;
            this.range03.visible = true;
        }

        if (rightTrigger < -this.gamepadDeadZone / 2 || rightTrigger > this.gamepadDeadZone / 2) {
            this.apple.radius = this.clamp((this.apple.radius + rightTrigger * this.zoomSensibility * distToTarget / 1000.0), this.minDistance, this.maxDistance);
        } else {
            rightTrigger = 0;
        }

        if (leftTrigger < -this.gamepadDeadZone / 2 || leftTrigger > this.gamepadDeadZone / 2) {
            this.apple.radius = this.clamp((this.apple.radius - leftTrigger * this.zoomSensibility * distToTarget / 1000.0), this.minDistance, this.maxDistance);
        } else {
            leftTrigger = 0;
        }

        // Camera movement
        var targetPos = this.target.getPosition();
        this.desiredPos = cgmMath.addVectorToVector(targetPos, this.SphericalToCartesian(this.apple.radius, this.apple.polar, this.apple.elevation));
        var camPos = this.actor.getPosition();
        var newDampPos = this.SimpleDamping(camPos, this.desiredPos, this.smoothFactor);
        this.actor.setPosition(newDampPos);
        this.lookAt(targetPos);

    }

    this.previousTime = this.currentTime;
};

// Change camera target dynamically
beScript.changeTarget = function(iTargetNb) {
    console.log("Changing orbital camera target");
    var item;
    if (iTargetNb === null || iTargetNb === undefined) {
        item = this.targets.getObjectAt((++this.currentTarget) % this.targets.getObjectCount());
        if (item !== null && item !== undefined) {
            this.target = item;
            console.log("Changing camera target to: " + this.target.name);
        } else {
            console.error("null item in cam orbital targets collection");
        }
    } else {
        item = this.targets.getObjectAt(iTargetNb);
        if (item !== null && item !== undefined) {
            this.target = item;
            console.log("Changing camera target to: " + this.target.name);
        } else {
            console.error("null item in cam orbital targets collection");
        }
    }
};

// Target change on gamepad e1 button pressed
beScript.onAllGamepadPress = function(iGamepadPressEvent) {
    //console.log("Gamepad pressed: " + iGamepadPressEvent.getButton());
    if (iGamepadPressEvent.getButton() === EP.Gamepad.EButton.e1) {
        //this.changeTarget();
    }
};

/////////////////////////////////////////////////////
//                                                 //
//          Utilities
//                                                 //
/////////////////////////////////////////////////////

beScript.SphericalToCartesian = function(radius, polar, elevation) {
    var a = radius * Math.cos(elevation);
    var outCart = new ThreeDS.Mathematics.Vector3D();
    outCart.x = a * Math.cos(polar);
    outCart.y = a * Math.sin(polar);
    outCart.z = radius * Math.sin(elevation);
    return outCart;
};

beScript.CartesianToSpherical = function(cartCoords) {
    if (cartCoords.x === 0) {
        cartCoords.x = 0.000000001;
    }
    var outRadius = Math.sqrt((cartCoords.x * cartCoords.x) + (cartCoords.y * cartCoords.y) + (cartCoords.z * cartCoords.z));
    var outPolar = Math.atan(cartCoords.z / cartCoords.x);
    if (cartCoords.x < 0)
        outPolar += Math.PI;
    var outElevation = Math.asin(cartCoords.y / outRadius);

    var thisSc = new this.SphericalCoordinates("lo");
    thisSc.radius = outRadius;
    thisSc.polar = outPolar;
    thisSc.elevation = outElevation;

    return thisSc;
};

beScript.lookAt = function(iTarget) {

    var targetPos;
    if (iTarget instanceof STU.Actor3D) {
        targetPos = iTarget.getPosition();
    } else if (iTarget instanceof ThreeDS.Mathematics.Vector3D) {
        targetPos = iTarget.clone();
    }

    var Z = new ThreeDS.Mathematics.Vector3D();
    Z.z = 1;

    // computing the new sight direction using current eye position and the position of the target
    var dir = this.getActor().getPosition();
    dir.subVectorFromVector(targetPos);
    dir.normalize();

    // projecting the new sight direction on the ground to get a right direction parallel to the ground
    var dirOnGround = ThreeDS.Mathematics.cross(Z, ThreeDS.Mathematics.cross(dir, Z));
    dirOnGround.normalize();

    // computing the right direction using the ground-projected sight direction
    var right = ThreeDS.Mathematics.cross(Z, dirOnGround);
    right.normalize();

    // computing the up direction as usual
    var up = ThreeDS.Mathematics.cross(dir, right);
    up.normalize();

    // updating the transform
    var transform = this.getActor().getTransform();
    var matrix = transform.matrix;

    var qCurrent = new ThreeDS.Mathematics.Quaternion();
    qCurrent.rotMatrixToQuaternion(matrix);

    var mTargetLook = new ThreeDS.Mathematics.Matrix3x3();
    mTargetLook.setCoef([dir.x, right.x, up.x,
        dir.y, right.y, up.y,
        dir.z, right.z, up.z
    ]);

    var qTargetLook = new ThreeDS.Mathematics.Quaternion();
    qTargetLook.rotMatrixToQuaternion(mTargetLook);

    transform.matrix = qCurrent.slerp(qTargetLook, this.lookAtFactor).quaternionToRotMatrix();


    this.getActor().setTransform(transform);

};

beScript.SimpleDamping = function(actualValue, destinationValue, dampingFatcor) {
    var lerpVec = new cgmMath.Vector2D();
    lerpVec = actualValue.lerp(destinationValue, (dampingFatcor * this.deltaTime));
    return lerpVec;

};


beScript.clamp = function(value, min, max) {
    return Math.min(Math.max(value, min), max);
};

beScript.distance = function(vecA, vecB) {
    return Math.sqrt(Math.pow((vecA.x - vecB.x), 2) + Math.pow((vecA.y - vecB.y), 2) + Math.pow((vecA.z - vecB.z), 2));
};

beScript.SphericalCoordinates = function(type) {
    this.type = type;
    this.radius = 0;
    this.polar = 0;
    this.elevation = 0;
};

beScript.enableCamera = function() {
    this.isActive = true;
};

beScript.disableCamera = function() {
    this.isActive = false;
};

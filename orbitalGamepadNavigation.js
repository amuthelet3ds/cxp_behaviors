/*PARAMS:

    target (3DActor: null)
    verticalSensibility (Double: 0.01)
    horizontalSensibility (Double: 0.01)
    zoomSensibility (Double: 20.0)
    smoothFactor (Double: 0.4)
    targets (Collection: null)

*/

var renderManager = STU.RenderManager.getInstance();
var gamepad = EP.Devices.getGamepad();
var deadZone = 0.4;

function SphericalCoordinates(type) {
    this.type = type;
    this.radius = 0;
    this.polar = 0;
    this.elevation = 0;
}

var apple = new SphericalCoordinates('Test');
apple.radius = 2500;
apple.polar = 0;
apple.elevation = 0.0;

var relatifCam = new SphericalCoordinates('relatifCam');
relatifCam.radius = 0;
relatifCam.polar = 0;
relatifCam.elevation = 0;

var vectorUp = new ThreeDS.Mathematics.Vector3D();
vectorUp.setCoord(0, 1, 0);


var frame;
var InitDate = new Date().getTime();
var time;
var ElpasedTime;

var lastFrameTime = 0;

var dampingValue = 1;
var boolNormalize = false;

// clamp var
var radiusClamp_min = 15;
var radiusClamp_max = 50000;
var elevationClamp_min = -0.9;
var elevationClamp_max = 0.9;
var polarClamp_min = -0.3;
var polarClamp_max = 0.3;

beScript.onStart = function() {
    //Will be called on the experience start.
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

    this.desiredPos = cgmMath.addVectorToVector(this.target.getPosition(), this.SphericalToCartesian(apple.radius, apple.polar, apple.elevation));
    this.actor.setPosition(this.desiredPos);
    var targetPos = this.target.getPosition();

    this.lookAtFactor = 1;

    this.boolInterested = false;
    this.boolRun = false;

    frame = 0;
    lastFrameTime = time = new Date().getTime();

};
beScript.onStop = function() {
    //Will be called on experience stop.
};

beScript.execute = function() {
    var gamepad = EP.Devices.getGamepad();
    //Insert your code here.
    time = new Date().getTime();
    this.deltaTime = (time - lastFrameTime) / 1000;
    lastFrameTime = time;
    ElpasedTime = time - InitDate;

    /////////////////////////////////////////////////////
    //                                                 //
    //          Gestion déplacement de la camera                
    //                                                 //
    /////////////////////////////////////////////////////

    // On récupère les valeurs des axes X et Y du stick droit
    var rightStick_Xvalue = gamepad.getAxisValue(EP.Gamepad.EAxis.eRSX);
    var rightStick_Yvalue = -gamepad.getAxisValue(EP.Gamepad.EAxis.eRSY);
    var rightTrigger = gamepad.getAxisValue(EP.Gamepad.EAxis.eRT);
    var leftTrigger = gamepad.getAxisValue(EP.Gamepad.EAxis.eLT);

    if (rightStick_Xvalue < -deadZone || rightStick_Xvalue > deadZone) {
        apple.polar = apple.polar - rightStick_Xvalue * this.horizontalSensibility;
    } else {
        rightStick_Xvalue = 0;
    }

    if (rightStick_Yvalue < -deadZone || rightStick_Yvalue > deadZone) {
        apple.elevation = this.clamp((apple.elevation + rightStick_Yvalue * this.verticalSensibility), elevationClamp_min, elevationClamp_max);
    } else {
        rightStick_Yvalue = 0;
    }

    if (rightTrigger < -deadZone / 2 || rightTrigger > deadZone / 2) {
        apple.radius = this.clamp((apple.radius + rightTrigger * this.zoomSensibility), radiusClamp_min, radiusClamp_max);
    } else {
        rightTrigger = 0;
    }

    if (leftTrigger < -deadZone / 2 || leftTrigger > deadZone / 2) {
        apple.radius = this.clamp((apple.radius - leftTrigger * this.zoomSensibility), radiusClamp_min, radiusClamp_max);
    } else {
        leftTrigger = 0;
    }

    // Déplacement Camera
    var playerPos = this.target.getPosition();
    this.desiredPos = cgmMath.addVectorToVector(playerPos, this.SphericalToCartesian(apple.radius, apple.polar, apple.elevation));
    var actorPos = this.actor.getPosition();
    var newDampPos = this.SimpleDamping(actorPos, this.desiredPos, this.smoothFactor);
    this.actor.setPosition(newDampPos);
    this.lookAt(playerPos);

};

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

beScript.onAllGamepadPress = function(iGamepadPressEvent) {
    console.log("Gamepad pressed: " + iGamepadPressEvent.getButton());
    if (iGamepadPressEvent.getButton() === EP.Gamepad.EButton.e1) {
        this.changeTarget();
    }
};

/////////////////////////////////////////////////////
//                                                 //
//          Fonctions Utilitaires               
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

    var thisSc = new SphericalCoordinates("lo");
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

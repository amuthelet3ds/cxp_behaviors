beScript.onStart = function() {
    console.log("OnStart");
    EP.EventServices.addObjectListener(EP.KeyboardPressEvent, this, 'onKey');

    // IO, yo
    this.leftKey = EP.Keyboard.EKey.eLeft;
    this.rightKey = EP.Keyboard.EKey.eRight;
    this.upKey = EP.Keyboard.EKey.eUp;
    this.downKey = EP.Keyboard.EKey.eDown;

    this.inputManager = new STU.InputManager();
    this.inputManager.initialize();
    this.inputManager.activate();
    this.inputManager.useMouse = true;
    this.inputManager.mouseAxis = 2;

    this.lastMousePos = new ThreeDS.Mathematics.Vector2D();
    this.lastMousePos.setCoord(0.0, 0.0);
    this.lastMouseWheelPos = 0.0;
    this.cumulatedWheel = 0.0;
    this.mouseDeltaX = 0.0;
    this.mouseDeltaY = 0.0;

    this.currentAngle = 0.0;
    this.targetAngle = 0.0;
    this.currentPosition = 0.0;

    // Time
    this.dt = 0.0001;
    this.startTime = new Date().getTime();
    this.currentTime = new Date().getTime();
    this.previousTime = new Date().getTime();

    this.debug = false;
    this._renderMngr = STU.RenderManager.getInstance();
    if ((this._renderMngr === null) || (this._renderMngr === undefined)) {
        console.error("Problem getting render manager");
    }

    this.product = [{
        id: "body",
        name: "body",
        actor: null,
    }, {
        id: "wheelLeft",
        name: "wheelLeft",
        actor: null,
        size: 160.0 * this.getActor().getScale()
    }, {
        id: "wheelRight",
        name: "wheelRight",
        actor: null,
        size: 160.0 * this.getActor().getScale()
    }, {
        id: "guidon_rotX",
        name: "guidon_rotX",
        actor: null,
    }, {
        id: "guidon_rotY",
        name: "guidon_rotY",
        actor: null,
    }, {
        id: "guidon_haut",
        name: "guidon_haut",
        actor: null,
    }, {
        id: "guidon_bas",
        name: "guidon_bas",
        actor: null,
    }, {
        id: "guidon_amortisseur_haut",
        name: "guidon_amortisseur_haut",
        actor: null,
    }, {
        id: "guidon_amortisseur_bas",
        name: "guidon_amortisseur_bas",
        actor: null,
    }, {
        id: "guidon_handles",
        name: "guidon_handles",
        actor: null,
    }];
    this.productHeight = 700.0 * this.getActor().getScale();
    this.wheelEnfoncement = 40.0;

    this.noGroundHeight = 0.0;

    this.followCurve = {
        name: "Path 2",
        actor: null
    };

    this.getActor().go = true;
    this.getActor().avatarMode = false;

    this.sketchMode = false;

    var actor = this.getActor();
    actor.addObjectListener(STU.TriggerZoneEnterEvent, beScript, 'onTZEnter');

    this.initProduct(this.product);
    this.initPID();
    this.frameCount = 0;


};

beScript.onStop = function() {
    console.log("OnStop");
    //    this.panel.RequestDelayedDestruction();
};

beScript.initProduct = function(iElmtsArray) {
    console.log("Init Product: ");

    var nbElmts = iElmtsArray.length;
    // For all elements
    for (var noElmt = 0; noElmt < nbElmts; noElmt++) {
        // Search all subactors to find the good one
        iElmtsArray[noElmt].actor = this.getActor().getSubActorByName(iElmtsArray[noElmt].name, true);
        // If not found, error fired
        if ((iElmtsArray[noElmt].actor === null) || (iElmtsArray[noElmt].actor === undefined)) {
            console.error("Could not find element id: " + iElmtsArray[noElmt].id + ", named: " + iElmtsArray[noElmt].name);
        } else {
            // init
            iElmtsArray[noElmt].actor.scale = iElmtsArray[noElmt].actor.getScale();
        }
    }

    // Avatar
    if (this.sketchMode === false) {
        this.avatar = this.getActor().getScene().getActorByName("Human");

        if ((this.avatar !== null) && (this.avatar !== undefined)) {
            console.log("Avatar found");
        } else {
            console.log("Avatar not found");
        }
    }

    // Curve
    this.followCurve.actor = this.getActor().getScene().getActorByName(this.followCurve.name);
    if ((this.followCurve.actor != null) && (this.followCurve.actor != undefined)) {
        console.log("Curve found");
        var newPos = this.followCurve.actor.getValue(0.0);
        newPos.z += 1000.0;
        //this.getActor().setPosition(newPos);
    } else {
        console.log("Curve not found");
    }

    // Debug frames
    this.dbgLeft = this.getActor().getScene().getActorByName("dbgLeft");
    if ((this.dbgLeft != null) && (this.dbgLeft != undefined)) {
        console.log("DbgLeft found");
    } else {
        console.log("DbgLeft not found");
    }

    this.dbgRight = this.getActor().getScene().getActorByName("dbgRight");
    if ((this.dbgRight != null) && (this.dbgRight != undefined)) {
        console.log("DbgRight found");
    } else {
        console.log("DbgRight not found");
    }

    this.dbgCenter = this.getActor().getScene().getActorByName("dbgCenter");
    if ((this.dbgCenter != null) && (this.dbgCenter != undefined)) {
        console.log("DbgCenter found");
    } else {
        console.log("DbgCenter not found");
    }

    // !!!! Ground (well finaly everything is ground but require to set all non-ground objects to non-pickable, especially the crossway)
    this.ground = this.getActor().getScene().getActorByName("ground");
    if ((this.ground != null) && (this.ground != undefined)) {
        console.log("ground found");
    } else {
        console.log("ground not found");
    }
}

beScript.initPID = function() {
    console.log("Initializing PID controllers..");
    this.controllerRotation = new STU.PIDController("Rotation", 0.9, 0.5, 0.0);
    this.controllerPosition = new STU.PIDController("Position", 0.9, 0.5, 0.0);
    this.controllerStab = new STU.PIDController("Stab", 0.6, 0.3, 0.0);
    this.controllerWheelLeft = new STU.PIDController("wheelLeft", 0.2, 0.4, 0.0);
    this.controllerWheelRight = new STU.PIDController("wheelRight", 0.2, 0.4, 0.0);

};

beScript.execute = function() {
    if (this.getActor().go === true) {
        this.currentTime = new Date().getTime();
        this.dt = (this.currentTime - this.previousTime) / 100.0;

        beScript.computeIO();

        this.frameCount++;
        if (this.frameCount > 5) {
            this.computePID();
        }

        this.previousTime = this.currentTime;
    }
};


beScript.computePID = function() {
    var actor = this.getActor();
    if (actor === undefined || actor === null) {
        console.error("Actor null or undefined.");
        return this;
    }

    // Get Current attitude
    this.currentAngle = this.product[0].actor.getRotation().y;
    //console.log("Current Product0 angle Y: " + this.currentAngle);
    this.currentPosition = actor.getPosition().x;
    //console.log("Current Product position X: " + this.currentPosition);

    // Compute PID Rotation
    this.targetAngle = -this.lastMousePos.y * 30.0;

    //console.log("Target Angle Y (from mouse): " + this.targetAngle);
    this.controllerRotation.compute(this.currentAngle, this.targetAngle, this.currentTime, this.dt);
    // Hmm well forget about PID for now, it messes things up LOL:
    this.controllerRotation.newValue = this.targetAngle;
    //console.log("ControllerRotation new Value: " + this.controllerRotation.newValue);

    // Compute PID Pos
    this.controllerPosition.compute(this.currentPosition, this.currentPosition + 5.0 * this.controllerRotation.newValue, this.currentTime, this.dt);
    // Hmm well forget about PID for now, it messes things up LOL:
    this.controllerPosition.newValue = 5.0 * this.controllerRotation.newValue;
    //console.log("ControllerPosition new Value: " + this.controllerPosition.newValue);

    //Update position
    var newPos = actor.getPosition(actor);
    var posOffset = -this.controllerPosition.newValue;
    newPos.x += this.controllerPosition.newValue;
    //   console.log('"NewPos: ' + newPos.x + ", " + newPos.y + ", " + newPos.z);
    actor.setPosition(newPos, actor);

    var newRot = new ThreeDS.Mathematics.Vector3D();
    newRot.setCoord(0.0, 0.0, this.mouseDeltaX * 4.0);

    if (this.sketchMode === false) {
        actor.rotate(newRot, actor);
    }

    // COLLISION - Actor
    var offsetLocal = new ThreeDS.Mathematics.Vector3D();
    offsetLocal.setCoord(100.0, 0.0, 0.0);
    this.intersectionA = this.computeIntersection(actor, offsetLocal, this.noGroundHeight);

    // If intersection actor point is valid
    if ((this.intersectionA !== null) && (this.intersectionA !== undefined)) {
        // set actor newPos z value
        newPos.z = this.intersectionA.z;
        // Set a dbg frame position
        var dbgPos = new ThreeDS.Mathematics.Vector3D();
        dbgPos.setCoord(this.intersectionA.x, this.intersectionA.y, this.intersectionA.z);
        this.dbgCenter.setPosition(dbgPos);
    }

    //Rotate wheels
    var newWheelRot = new ThreeDS.Mathematics.Vector3D();
    // Rotation speed is distance * size
    newWheelRot.setCoord(0.0, this.controllerPosition.newValue / (this.product[1].size * 0.5), 0.0);
    this.product[1].actor.rotate(newWheelRot, this.product[1].actor);
    this.product[2].actor.rotate(newWheelRot, this.product[2].actor);
    //this.product[1].actor.setRotation(newWheelRot, this.product[1].actor);
    //this.product[2].actor.setRotation(newWheelRot, this.product[2].actor);
    this.product[1].actor.setScale(this.product[1].actor.scale);
    this.product[2].actor.setScale(this.product[1].actor.scale);

    // COLLISION - Wheel left
    var newWheelLeftPos = this.product[1].actor.getPosition();
    var offsetWheelLeft = new ThreeDS.Mathematics.Vector3D();
    offsetWheelLeft.setCoord(0.0, 0.0, 0.0);
    this.intersectionB = this.computeIntersection(this.product[1].actor, offsetWheelLeft, this.noGroundHeight);

    // If intersection WheelLeft point is valid
    if ((this.intersectionB !== null) && (this.intersectionB !== undefined)) {
        newWheelLeftPos.z = this.intersectionB.z + this.product[1].size - this.wheelEnfoncement;
        //console.log("GroundLeft: " + this._groundLevelLeft);
        var dbgPos = new ThreeDS.Mathematics.Vector3D();
        dbgPos.setCoord(this.intersectionB.x, this.intersectionB.y, this.intersectionB.z);
        this.dbgLeft.setPosition(dbgPos);
    }

    // COLLISION - Wheel Right
    var newWheelRightPos = this.product[2].actor.getPosition();
    var offsetWheelRight = new ThreeDS.Mathematics.Vector3D();
    offsetWheelRight.setCoord(0.0, 0.0, 0.0);
    this.intersectionC = this.computeIntersection(this.product[2].actor, offsetWheelRight, this.noGroundHeight);

    // If intersection WheelRight point is valid
    if ((this.intersectionC !== null) && (this.intersectionC !== undefined)) {
        newWheelRightPos.z = this.intersectionC.z + this.product[2].size - this.wheelEnfoncement;
        //console.log("GroundRight: " + this._groundLevelRight);
        var dbgPos = new ThreeDS.Mathematics.Vector3D();
        dbgPos.setCoord(this.intersectionC.x, this.intersectionC.y, this.intersectionC.z);
        this.dbgRight.setPosition(dbgPos);
    }

    // Find intersection plane normal (cross product of the three intersection points)
    var groundMeanNormal = new ThreeDS.Mathematics.Vector3D();
    groundMeanNormal.setCoord(0.0, 0.0, 1.0);

    if ((this.intersectionA !== null) && (this.intersectionB !== null) && (this.intersectionC !== null)) {

        // change actor position  (mean value between two wheels height)
        var newPos2 = new ThreeDS.Mathematics.Vector3D();
        //newPos2.z = (this.intersectionC.z + this.intersectionB.z) / 2.0;
        //actor.setPosition(newPos2, actor);
        var offsetALaCon = 100.0;
        if (this.sketchMode === true) {
            offsetALaCon = 0.0;
        }
        newPos2.setCoord(0.0, 0.0, -actor.getPosition().z + (this.intersectionC.z + this.intersectionB.z) / 2.0 + offsetALaCon);
        actor.translate(newPos2);
        // We translate down intersection point A, to take "pitch" rotation of the Crossway
        // At the end we need full orientation of the crossway inside GroundNormal
        this.intersectionA.setCoord(this.intersectionA.x, this.intersectionA.y, this.intersectionA.z - this.controllerPosition.newValue);
        this.dbgCenter.setPosition(this.intersectionA);
        // groundMeanNormal = AB
        groundMeanNormal = (this.intersectionB.clone().subVectorFromVector(this.intersectionA)).normalize();
        // b = AC
        var b = (this.intersectionC.clone().subVectorFromVector(this.intersectionA)).normalize();
        //  final normal = AB cross AC
        groundMeanNormal.cross(b);

        // Change Crossway orientation  to groundMeanNormal
        var currentPos = actor.getPosition();
        currentPos.z -= offsetALaCon;
        var dir = this.intersectionA.clone().subVectorFromVector(currentPos);
        this.product[0].actor.setOrientations(groundMeanNormal, dir);

    } else {
        console.error("!!!! ERROR INTERSECTION !!!!!");
        // do nothing, no intersection found
    }


    // Set Wheels position
    //var newWheelLeftPos = this.product[1].actor.getPosition();
    newWheelLeftPos.z = this.intersectionB.z + this.product[1].size - this.wheelEnfoncement;
    this.controllerWheelLeft.compute(this.product[1].actor.getPosition().z, newWheelLeftPos.z, this.currentTime, this.dt);
    this.controllerWheelLeft.newValue = newWheelLeftPos.z;
    newWheelLeftPos.z = this.controllerWheelLeft.newValue;
    this.product[1].actor.setPosition(newWheelLeftPos);
    this.product[1].actor.setScale(this.product[1].actor.scale);

    //var newWheelRightPos = this.product[2].actor.getPosition();
    newWheelRightPos.z = this.intersectionC.z + this.product[2].size - this.wheelEnfoncement;
    this.controllerWheelRight.compute(this.product[2].actor.getPosition().z, newWheelRightPos.z, this.currentTime, this.dt);
    this.controllerWheelRight.newValue = newWheelRightPos.z;
    newWheelRightPos.z = this.controllerWheelRight.newValue;
    this.product[2].actor.setPosition(newWheelRightPos);
    this.product[2].actor.setScale(this.product[2].actor.scale);

    // Manage Guidon (?)
    var guidonRot = new ThreeDS.Mathematics.Vector3D();
    // not working, tentative to lock guidon max rot
    if (guidonRot.x < 0.3) {
        //console.log("Guidon rot: " + guidonRot.x + ", " + guidonRot.y + ", " + guidonRot.z);
        var z = new ThreeDS.Mathematics.Vector3D();
        z.setCoord(0.0, 0.0, 1.0);

        var dir = this.product[0].actor.getDir();
        dir.z = 0.0;
        this.product[3].actor.setOrientations(z, dir);
        this.product[3].actor.setScale(this.product[3].actor.scale);

        guidonRot.setCoord(0.0, -Math.atan(-this.controllerPosition.newValue / 100.0) - this.product[4].actor.getRotation().y, 0.0);
        this.product[4].actor.rotate(guidonRot, this.product[4].actor);
        this.product[4].actor.setScale(this.product[4].actor.scale);

        //guidonRot.setCoord(0.0 /*-bodyAngleValue*/ , -(rotComp + this.controllerRotation.newValue) * this.dt, 0.0);
        //guidonRot.setCoord(0.0 /*-bodyAngleValue*/ , -this.controllerRotation.newValue, 0.0);
        guidonRot.setCoord(0.0, Math.atan(-this.controllerPosition.newValue / 100.0) - this.product[5].actor.getRotation().y, 0.0);
        this.product[5].actor.rotate(guidonRot, this.product[5].actor);
        this.product[5].actor.setScale(this.product[5].actor.scale);

        // Guidon amortissement
        this.product[7].actor.setOrientations(z, dir);
        this.product[7].actor.setScale(this.product[7].actor.scale);

        this.product[8].actor.setOrientations(z, dir);
        this.product[8].actor.setScale(this.product[8].actor.scale);
    }

    // Avatar management
    if ((this.sketchMode === false) && (actor.avatarMode === true)) {
        if ((this.avatar !== null) && (this.avatar !== undefined)) {
            console.log("Avatar Mode inside");
            this.avatar.setScale()
            this.avatar.setPosition(this.product[0].actor.getPosition());
            var avatarPos = new ThreeDS.Mathematics.Vector3D();
            avatarPos.z = (1000.0 - this.targetAngle * 8.0);
            avatarPos.x = -100.0;
            avatarPos.y = 0.0;
            this.avatar.translate(avatarPos, this.avatar);
            this.avatar.setOrientations(z, dir);
        }
    } else {
        if ((this.avatar !== null) && (this.avatar !== undefined)) {
            var pos = new ThreeDS.Mathematics.Vector3D();
            pos.setCoord(9500.0, -7600.0, 926.0);
            this.avatar.setPosition(pos);
        }
    }

    return;
};

beScript.computeIntersection = function(iActor, iOffsetLocal, iZValueIfNoIntersect) {
    // Result
    var intersection = new ThreeDS.Mathematics.Vector3D();

    var rays = [{
        ray: null,
        angle: 0.0,
        intersection: null
    }, {
        ray: null,
        angle: -15.0, //deg
        intersection: null
    }, {
        ray: null,
        angle: 15.0, //deg
        intersection: null
    }];

    var offsetWorld = iActor.getTransform().applyToVector(iOffsetLocal);
    for (var noRay = 0; noRay < rays.length; noRay++) {
        // Create new Ray
        rays[noRay].ray = new STU.Ray();
        // Origin set on actor position + offset if required
        rays[noRay].ray.origin = new ThreeDS.Mathematics.Vector3D();
        rays[noRay].ray.origin.setCoord(iActor.getPosition().x + offsetWorld.x, iActor.getPosition().y + offsetWorld.y, 1000.0 + offsetWorld.z);

        rays[noRay].ray.direction.setCoord(0, Math.tan((rays[noRay].angle * Math.PI) / 180.0), -1);
        rays[noRay].ray.setLength(5000.0);
        //        console.log("Ray #angle" + rays[noRay].angle + ", origin: " + rays[noRay].ray.origin.x + ", y: " + rays[noRay].ray.origin.y + ", z: " + rays[noRay].ray.origin.z);
        //       console.log("Ray #angle" + rays[noRay].angle + ", dir: " + rays[noRay].ray.direction.x + ", y: " + rays[noRay].ray.direction.y + ", z: " + rays[noRay].ray.direction.z);

        // Compute intersection
        rays[noRay].intersection = new ThreeDS.Mathematics.Vector3D();
        var intersectArray = this._renderMngr.pickFromRay(rays[noRay].ray);

        // if there is an object under
        if (intersectArray.length > 0) {
            for (var noInter = 0; noInter < 1 /*intersectArray.length*/ ; noInter++) {
                //if (intersectArray[noInter].getActor() === this.ground) {
                rays[noRay].intersection.setCoord(intersectArray[noInter].getPoint().x,
                    intersectArray[noInter].getPoint().y,
                    intersectArray[noInter].getPoint().z);
                //}
            }
            //        console.log("Ground: " + intersectArray[0].getPoint().z);
        } else {
            console.log("Actor: " + iActor.name + " has no ground intersection, ray: " + rays[noRay].angle);
            rays[noRay].intersection.setCoord(rays[noRay].ray.origin.x,
                rays[noRay].ray.origin.y,
                iZValueIfNoIntersect);
        }

        //console.log("IntersectionZ of # " + noRay + ", is: " + rays[noRay].intersection.z);
    }

    var highestIntersection = rays.reduce(function(previous, current) {
        return previous.intersection.z > current.intersection.z ? previous : current;
    });

    //console.log("highestIntersection: " + highestIntersection.intersection.z);

    intersection = rays[0].intersection;
    intersection.z = highestIntersection.intersection.z;

    return intersection;
}

beScript.computeIO = function() {
    if (this.inputManager.buttonsState[1] === true) {
        this.mouseDeltaX = this.inputManager.axis2.x - this.lastMousePos.x;
        this.mouseDeltaY = this.inputManager.axis2.y - this.lastMousePos.y;
        this.lastMousePos.x = this.inputManager.axis2.x;
        this.lastMousePos.y = this.inputManager.axis2.y;
        this.cumulatedWheel += this.inputManager.axis2.z;

        if (this.cumulatedWheel > 4.0) {
            this.cumulatedWheel = 4.0;
        } else {
            if (this.cumulatedWheel < -4.0) {
                this.cumulatedWheel = -4.0;
            }
        };

        if (this.inputManager.axis2.z === this.lastMouseWheelPos) {
            this.lastMouseWheelTime = this.currentTime;
        }

        if (this.currentTime - this.lastMouseWheelTime > 300.0) {
            this.cumulatedWheel = 0.0;
            this.lastMouseWheelTime = this.currentTime;
            this.inputManager.axis2.z = 0.0;
        }
    } else {
        this.mouseDeltaX *= 0.6;
        this.mouseDeltaY *= 0.6;
        this.lastMousePos.x *= 0.6;
        this.lastMousePos.y *= 0.6;
    }
}

beScript.onKey = function(iKeyboardEvent) {
    if (this.debug)
        console.log("Keypressed: " + iKeyboardEvent.keyCode);

    switch (iKeyboardEvent.keyCode) {
        case this.leftKey:
            break;
        case this.rightKey:
            break;
    }
};

STU.Actor3D.prototype.setOrientations = function(iTargetUp, iTargetDir) {
    //console.log("____ Setting Orientation of: " + this.name);
    iTargetUp.normalize();
    iTargetDir.normalize();
    var targetLeft = ThreeDS.Mathematics.cross(iTargetUp, iTargetDir);
    targetLeft.normalize();

    var transfo = this.getTransform();
    var coef = [iTargetDir.x, targetLeft.x, iTargetUp.x,
        iTargetDir.y, targetLeft.y, iTargetUp.y,
        iTargetDir.z, targetLeft.z, iTargetUp.z
    ];

    for (var noCoef = 0; noCoef < coef.length; noCoef++) {
        coef[noCoef] *= this.getScale();
    }
    transfo.matrix.setCoef(coef);
    this.setTransform(transfo);
}

STU.Actor3D.prototype.getDir = function() {
    var coef = this.getTransform().matrix.getCoef();
    var dir = new ThreeDS.Mathematics.Vector3D();
    dir.setCoord(coef[0], coef[3], coef[6]);
    dir.normalize();
    return dir.clone();
}

STU.Actor3D.prototype.getUp = function() {
    var coef = this.getTransform().matrix.getCoef();
    var up = new ThreeDS.Mathematics.Vector3D();
    up.setCoord(coef[2], coef[5], coef[8]);
    up.normalize();
    return up.clone();
}

beScript.onTZEnter = function(iEvent) {
    console.log("TriggerZone " + iEvent.zone.name + " is entered by: " + iEvent.object.name);
    if (iEvent.zone.name === "zoneAvatar") {
        if (iEvent.object === this.getActor()) {
            this.getActor().avatarMode = true;
        };
    }
}

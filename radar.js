beScript.onStart = function() {
    //Will be called on the experience start.
    if (this.sensorsCollectionName !== null && this.sensorsCollectionName !== undefined && typeof this.sensorsCollectionName === 'string') {
        console.log("sensorsCollectionName param OK: " + this.sensorsCollectionName);
    } else {
        this.sensorsCollectionName = "sensors";
        console.error('Error: sensorsCollectionName param KO, setting to default name: ' + this.sensorsCollectionName);
    }
    this.sensorsCollection = STU.Experience.getCurrent().getCollectionByName(this.sensorsCollectionName);
    if (this.sensorsCollection === null || this.sensorsCollection === undefined) {
        console.error('Error: SensorsCollectionName param KO, could not find default collection named: ' + this.sensorsCollectionName);
        return;
    } else {
        console.log("SensorsCollectionName param KO, Default collection found named: " + this.sensorsCollectionName);
    };

    for (var noElmt = 0; noElmt < this.sensorsCollection.getObjectCount(); noElmt++) {
        var actor = this.sensorsCollection.getObjectAt(noElmt);
        if (actor instanceof STU.ArrowActor) {
            actor.length = 60000.0;
            actor.width = 30.0;
            actor.headLength = 2000.0;
            actor.headWidth = 60.0;
            actor.setOpacity(100.0);
            actor.visible = false;
        };

    }

    this.colorIntersection = new STU.Color(255, 0, 0);
    this.colorNoIntersection = new STU.Color(255, 255, 0);

    EP.EventServices.addObjectListener(EP.GamepadPressEvent, beScript, 'onGamepadPressEvent');
    this._renderMngr = STU.RenderManager.getInstance();
    if (this._renderMngr === null || this._renderMngr === undefined) {
        console.error("Could not get render manager");
    }
};
beScript.onStop = function() {
    //Will be called on experience stop.
};

beScript.execute = function() {
    //Insert your code here.

    if (this.sensorsCollection !== null && this.sensorsCollection !== undefined) {
        for (var noElmt = 0; noElmt < this.sensorsCollection.getObjectCount(); noElmt++) {
            var actor = this.sensorsCollection.getObjectAt(noElmt);
            if (actor !== null && actor !== undefined) {
                this.computeIntersection(actor);
            } else {
                console.error("Invalid actor in sensors collection");
            }
        }
    } else {
        console.error("Invalid sensorsCollection");
    }

    this.currentHighlight = (this.currentHighlight + 1) % this.sensorsCollection.getObjectCount();
};

beScript.computeIntersection = function(iActor, iOffsetLocal) {
    //console.log("Computing intersection of: " + iActor.name);
    // Result
    var intersection = new ThreeDS.Mathematics.Vector3D();

    var rays = [{
        ray: null,
        angle: 0.0,
        intersection: null
    }];

    var offsetWorld = new ThreeDS.Mathematics.Vector3D();
    if (iOffsetLocal !== undefined && iOffsetLocal !== null) {
        offsetWorld = iActor.getTransform().applyToVector(iOffsetLocal);
    }

    for (var noRay = 0; noRay < rays.length; noRay++) {
        // Create new Ray
        rays[noRay].ray = new STU.Ray();
        // Origin set on actor position + offset if required
        rays[noRay].ray.origin = new ThreeDS.Mathematics.Vector3D();
        rays[noRay].ray.origin.setCoord(iActor.getPosition().x + offsetWorld.x, iActor.getPosition().y + offsetWorld.y, 1000.0 + offsetWorld.z);

        rays[noRay].ray.direction = iActor.getUp();
        //console.log("Ray dir: " + rays[noRay].ray.direction.x + ", " + rays[noRay].ray.direction.y + ", " + rays[noRay].ray.direction.z);
        rays[noRay].ray.setLength(45000.0);

        // Compute intersection
        rays[noRay].intersection = new ThreeDS.Mathematics.Vector3D();
        var intersectArray = this._renderMngr.pickFromRay(rays[noRay].ray);

        // if there is an object under
        if (intersectArray.length > 0) {
            for (var noInter = 0; noInter < 1 /*intersectArray.length*/ ; noInter++) {
                console.log("Intersect: " + intersectArray.length);
                iActor.setColor(this.colorIntersection);
                //console.log("Actor: " + iActor.name + ", intersecting: " + intersectArray[noInter].getActor().name);
            }
            //        console.log("Ground: " + intersectArray[0].getPoint().z);
        } else {
            iActor.setColor(this.colorNoIntersection);
        }
    }

    return;
}

STU.Actor3D.prototype.getUp = function() {
    var coef = this.getTransform().matrix.getCoef();
    var up = new ThreeDS.Mathematics.Vector3D();
    up.setCoord(coef[2], coef[5], coef[8]);
    up.normalize();
    return up.clone();
}

STU.Actor3D.prototype.getDir = function() {
    var coef = this.getTransform().matrix.getCoef();
    var dir = new ThreeDS.Mathematics.Vector3D();
    dir.setCoord(coef[0], coef[3], coef[6]);
    dir.normalize();
    return dir.clone();
}

beScript.onGamepadPressEvent = function(iEvent) {
    if (iEvent.button === EP.Gamepad.EButton.eY) {
        console.log("Gamepad button Y pressed");
        for (var noElmt = 0; noElmt < this.sensorsCollection.getObjectCount(); noElmt++) {
            this.sensorsCollection.getObjectAt(noElmt).visible = false;
        }
    }
    if (iEvent.button === EP.Gamepad.EButton.eB) {
        console.log("Gamepad button B pressed");
        for (var noElmt = 0; noElmt < this.sensorsCollection.getObjectCount(); noElmt++) {
            this.sensorsCollection.getObjectAt(noElmt).visible = true;
        }
    }
};

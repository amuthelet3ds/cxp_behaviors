beScript.onStart = function() {
    console.log("Init smoothFollowBeh");

    this.followTarget = true;
    this.offsetTransform = null;

    // target param
    if (this.targetActor !== null && this.targetActor !== undefined && this.targetActor instanceof STU.Actor3D) {
        console.log("Target found named: " + this.targetActor.name);
    } else {
        console.error("Invalid target parameter");
        this.targetActor = this.getActor().getExperience().getActorByName(pathName);

        return;
    }

    // smoothness param
    if (this.smoothness !== null && this.smoothness !== undefined && typeof this.smoothness === 'number') {
        console.log("Smoothness param: " + this.smoothness);
    } else {
        console.error("Invalid smoothness parameter");
        this.smoothness = 1.0;
    }

    // follow orientation param
    if (this.followOrientation !== null && this.followOrientation !== undefined && typeof this.followOrientation === 'boolean') {
        console.log("FollowOrientation param: " + this.followOrientation);
    } else {
        console.error("Invalid FollowOrientation parameter");
        this.followOrientation = false;
    }

    // PositionOffset param
    if (this.positionOffset !== null && this.positionOffset !== undefined && this.positionOffset instanceof ThreeDS.Mathematics.Vector3D) {
        console.log("positionOffset param: " + this.positionOffset.x + " ," + this.positionOffset.y + ", " + this.positionOffset.z);
    } else {
        console.error("Invalid positionOffset parameter");
        this.positionOffset = new ThreeDS.Mathematics.Vector3D();
        this.positionOffset.setCoord(0.0, 0.0, 0.0);
    }

    this.positionOffset = new ThreeDS.Mathematics.Vector3D();
    this.positionOffset.setCoord(-1000.0, -100.0, 100.0);

    // keep init Offset param
    if (this.keepInitOffset !== null && this.keepInitOffset !== undefined && typeof this.keepInitOffset === 'boolean') {
        console.log("keepInitOffset param: " + this.keepInitOffset);
        this.offsetTransform = this.getActor().getTransform(this.targetActor);
    } else {
        console.error("Invalid keepInitOffset parameter");
        this.keepInitOffset = false;
    }
};

beScript.onStop = function() {};

beScript.execute = function() {
    if (this.followTarget === true) {
        var actor = this.getActor();

        // Src
        var srcPos = actor.getPosition();
        var srcQuat = new ThreeDS.Mathematics.Quaternion();
        srcQuat.rotMatrixToQuaternion(actor.getTransform().matrix);
        //console.log("SrcPos: " + srcPos.x + ", " + srcPos.y + ", " + srcPos.z);

        //Dst
        var dstPos = this.targetActor.getPosition();
        var dstQuat = new ThreeDS.Mathematics.Quaternion();
        dstQuat.rotMatrixToQuaternion(this.targetActor.getTransform().matrix);
        if (this.keepInitOffset === true) {
            dstPos.addVectorToVector(this.targetActor.getTransform().applyToVector(this.offsetTransform.vector));

            var offsetQuat = new ThreeDS.Mathematics.Quaternion();
            offsetQuat.rotMatrixToQuaternion(this.offsetTransform.matrix);
            dstQuat = dstQuat.multiplyQuatByQuat(offsetQuat);
        }
        // console.log("DstPos: " + dstPos.x + ", " + dstPos.y + ", " + dstPos.z);

        //New
        var worldPositionOffset = this.targetActor.getTransform().applyToVector(this.positionOffset);
        var newPos = srcPos.clone().addVectorToVector(worldPositionOffset);
        newPos = newPos.lerp(dstPos, this.smoothness);
        var newQuat = srcQuat.clone();
        newQuat = newQuat.slerp(dstQuat.clone(), this.smoothness);
        //console.log("NewPos: " + newPos.x + ", " + newPos.y + ", " + newPos.z);

        var newTransfo = actor.getTransform();
        if (this.followOrientation === true) {
            newTransfo.matrix = newQuat.quaternionToRotMatrix();
        };
        newTransfo.vector = newPos.clone();
        //actor.setPosition(newPos);
        actor.setTransform(newTransfo);

    }
};

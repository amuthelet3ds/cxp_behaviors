/* Params
path (Path:null)
speed (double:0.1)
smoothness (double: 0.5)
frontAxis (string: 'x')
followOrientation (bool: true)
followOnClick (bool: false)
*/

beScript.onStart = function() {
    console.log("Init smoothFollowPathBeh");

    this.startFollow = false;

    //Time
    this.currentTime = new Date().getTime();
    this.previousTime = this.currentTime;

    // FollowOnClick
    if (this.followOnClick !== null && this.followOnClick !== undefined) {
        console.log("followOnClick param OK: " + this.followOnClick);
    } else {
        console.error("followOnClick param KO, setting to false by default");
        this.followOnClick = false;
    }

    // Follow orientation
    if (this.followOrientation !== null && this.followOrientation !== undefined) {
        console.log("followOrientation param OK: " + this.followOrientation);
    } else {
        console.error("followOrientation param KO, setting to true by default");
        this.followOrientation = true;
    }


    // Path
    if (this.path !== null && this.path !== undefined && this.path instanceof STU.PathActor) {
        console.log("Path param OK: " + this.path.name);
    } else {
        console.log("Path param KO");
    }

    // Speed
    if (this.speed !== null && this.speed !== undefined) {
        console.log("speed param OK: " + this.speed);
    } else {
        console.error("speed param KO, setting to default");
        this.speed = 40.0;
    }

    // Follow smoothness
    if (this.smoothness !== null && this.smoothness !== undefined && typeof this.smoothness === 'number') {
        console.log("Smoothness param: " + this.smoothness);
    } else {
        console.error("Invalid smoothness parameter");
        this.smoothness = 0.03;
    }

    if (this.frontAxis !== null && this.frontAxis !== undefined && typeof this.frontAxis === 'string') {
        console.log("FrontAxis param OK: " + this.frontAxis);
    } else {
        console.error("Invalid frontAxis parameter, default value to x");
        this.frontAxis = "x";
    }

    //this.getActor().addObjectListener(STU.MotionHasCompletedEvent, this, 'onMotionHasCompletedEvent');
    //this.getActor().addObjectListener(STU.ClickablePressEvent, this, 'onClick');

    this.startFollowPath(this.path);
};

beScript.startFollowPath = function(iPath) {
    if (iPath instanceof STU.PathActor) {
        console.log("Start follow path: " + iPath.name);
        this._pathTarget = iPath;

        // init pos / rot
        var dstPos = this._pathTarget.getValue(0.0);
        var dstPosEps = this._pathTarget.getValue(0.1);
        var frontVect = ThreeDS.Mathematics.subVectorFromVector(dstPosEps, dstPos);

        if (frontVect.squareNorm() > 10e-4) {
            var dstTransform = this._computeLookAtTransform(frontVect, this.getActor(), this.frontAxis);
            dstTransform.vector = dstPos;
            this.getActor().setTransform(dstTransform);
        }
    } else {
        this._pathTarget = null;
    }

    this._pathAmount = 0;
};

beScript.stopFollowPath = function() {
    this._pathTarget = null;
    this._pathAmount = 0;
};

beScript.execute = function(iExecCtx) {
    this.currentTime = new Date().getTime();
    this.dt = (this.currentTime - this.previousTime) / 1000.0;

    this.followPathExec(this.dt);

    this.previousTime = new Date().getTime();
};

beScript.followPathExec = function(iElapsedTime) {
    //Follow path
    if (undefined !== this._pathTarget && null !== this._pathTarget) {
        var actor = this.getActor();
        var pathLength = this._pathTarget.getLength();
        var frameStep = this.speed * 1000 * iElapsedTime;

        this._pathAmount = Math.min(1, this._pathAmount + frameStep / pathLength);

        // Src pos/quat
        var srcPos = actor.getPosition();
        var srcQuat = new ThreeDS.Mathematics.Quaternion();
        srcQuat.rotMatrixToQuaternion(actor.getTransform().matrix);

        // Dst pos/quat
        var dstPos = this._pathTarget.getValue(this._pathAmount);
        var dstQuat = new ThreeDS.Mathematics.Quaternion();

        //set front vector tangent to path if no look at has been defined
        if (undefined === this._lookAtTarget || null === this._lookAtTarget) {
            var actorPosEps = this._pathTarget.getValue(Math.min(1, this._pathAmount + 10 * frameStep / pathLength));
            var frontVect = ThreeDS.Mathematics.subVectorFromVector(actorPosEps, dstPos);

            if (frontVect.squareNorm() > 10e-4) {
                var dstTransform = this._computeLookAtTransform(frontVect, actor, this.frontAxis);
                dstQuat.rotMatrixToQuaternion(dstTransform.matrix);
            }
        }

        // New pos/quat
        var newPos = srcPos.clone();
        newPos = newPos.lerp(dstPos, this.smoothness);
        var newQuat = srcQuat.clone();
        newQuat = newQuat.slerp(dstQuat.clone(), this.smoothness);
        //console.log("NewPos: " + newPos.x + ", " + newPos.y + ", " + newPos.z);

        var newTransfo = actor.getTransform();
        newTransfo.vector = newPos.clone();
        if (this.followOrientation === true) {
            newTransfo.matrix = newQuat.quaternionToRotMatrix();
        }
        actor.setTransform(newTransfo);
        //actor.setScale(1.0);

        //Path end
        if (this._pathAmount == 1) {
            this._pathAmount = 0;
            this._pathTarget = null;
        }
    }
};

beScript._computeLookAtTransform = function(iFront, iActor, iActorFront) {
    var dir = iFront.clone();
    // dir.subVectorFromVector(actorPosition);
    dir.normalize();

    // projecting the new sight direction on the ground to get a right direction parallel to the ground
    var dirOnGround = dir.clone();
    dirOnGround.z = 0;
    dirOnGround.normalize();

    // computing the right direction using the ground-projected sight direction
    var ZWorld = new ThreeDS.Mathematics.Vector3D();
    ZWorld.setCoord(0, 0, 1);
    var right = ThreeDS.Mathematics.cross(ZWorld, dirOnGround);
    right.normalize();

    // computing the up direction as usual
    var up = ThreeDS.Mathematics.cross(dir, right);
    up.normalize();

    // updating the transform
    var transform = iActor.getTransform();
    var matrix = transform.matrix;
    var actorScale = matrix.getFirstColumn().norm();

    var qCurrent = new ThreeDS.Mathematics.Quaternion();
    qCurrent.rotMatrixToQuaternion(matrix);

    var mTargetLook = new ThreeDS.Mathematics.Matrix3x3();

    switch (iActorFront) {
        case "x":
            mTargetLook.setCoef([
                dir.x, right.x, up.x,
                dir.y, right.y, up.y,
                dir.z, right.z, up.z
            ]);
            break;
        case "y":
            mTargetLook.setCoef([
                up.x, dir.x, right.x,
                up.y, dir.y, right.y,
                up.z, dir.z, right.z
            ]);
            break;
        case "z":
            mTargetLook.setCoef([
                right.x, up.x, dir.x,
                right.y, up.y, dir.y,
                right.z, up.z, dir.z
            ]);
            break;
        case "-x":
            mTargetLook.setCoef([-dir.x, -right.x, up.x, -dir.y, -right.y, up.y, -dir.z, -right.z, up.z]);
            break;
        case "-y":
            mTargetLook.setCoef([
                up.x, -dir.x, -right.x,
                up.y, -dir.y, -right.y,
                up.z, -dir.z, -right.z
            ]);
            break;
        case "-z":
            mTargetLook.setCoef([-right.x, -up.x, dir.x, -right.y, -up.y, dir.y, -right.z, -up.z, dir.z]);
            break;
    }

    var qTargetLook = new ThreeDS.Mathematics.Quaternion();
    qTargetLook.rotMatrixToQuaternion(mTargetLook);

    transform.matrix = qTargetLook.quaternionToRotMatrix();

    if (Math.abs(actorScale - 1) > 10e-10) {
        transform.matrix.multiplyMatrix(actorScale);
    }

    //    iActor.setTransform(transform);
    return transform;
};

beScript.onStop = function() {};

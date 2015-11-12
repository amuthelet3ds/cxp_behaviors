////////// PID Controller
///////////////////////////
STU.PIDController = function(iName, iP, iI, iD) {
    this.kP = 1.0;
    this.kI = 1.0;
    this.kD = 0.0;
    this.name = "new PIDController";

    if ((iName !== null) && (iName !== undefined)) {
        this.name = iName;
    }

    console.log("Creating new PID Controller: " + this.name);

    if ((iP !== null) && (iP !== undefined)) {
        this.kP = iP;
    }
    if ((iI !== null) && (iI !== undefined)) {
        this.kI = iI;
    }
    if ((iD !== null) && (iD !== undefined)) {
        this.kD = iD;
    }

    this.integral = 0.0;
    this.derivative = 0.0;

    this.currentError = 0.0;
    this.previousError = 0.0;

    this.targetValue = 0.0;
    this.currentValue = 0.0;
    this.newValue = 0.0;

    return;
}

STU.PIDController.prototype.init = function() {
    return;
};

STU.PIDController.prototype.compute = function(iCurrentValue, iTargetValue, iCurrentTime, iDeltaTime) {
    this.currentValue = iCurrentValue;
    this.targetValue = iTargetValue;

    this.currentError = this.targetValue - this.currentValue;
    this.integral = this.integral + this.currentError * iDeltaTime;

    this.derivative = 0.0;
    if (iDeltaTime !== 0.0) {
        this.derivative = (this.currentError - this.previousError) / iDeltaTime;
    }

    this.newValue = (this.kP * this.currentError) + (this.kI * this.integral) + (this.kD * this.derivative);

    this.previousError = this.currentError;

    return;
};

STU.PIDController.prototype.delete = function() {
    return;
};

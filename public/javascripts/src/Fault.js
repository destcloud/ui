//
// Fault
//

DC.Fault = function(type, id, time, options) {

    this.type = type;
    this.id = id;
    this.time = Number(time);
    this.options = options;
    this.recover_id = undefined;

    this.endpoint = undefined;
    this.connection = undefined;
};

DC.Fault.prototype = {
    
    constructor: DC.Fault,

};

DC.Fault.type = {
    down:       "port down",
    disconnect: "disconnect",
    loss:       "packet loss",
    shaping:    "traffic shaping",
    delay:      "delay",
    recover:    "recover",
};

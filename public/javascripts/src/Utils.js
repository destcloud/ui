//
// Utilities
//

DC.Utils = function() {
};

DC.Utils.prototype = {
    
    constructor: DC.Utils,
};

DC.Utils.isEmptyObject = function(obj) {

    return (Object.keys(obj).length == 0);
};


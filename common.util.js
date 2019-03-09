
function throttler(){
    var _this = {};
    _this.isQueued = false;
    _this.throttle = function(callback, interval) {
        if(_this.isQueued == true) { return; }
        _this.isQueued = true;
        setTimeout(function() {
            callback();
            _this.isQueued = false;
        }, interval);
    }
    return _this;
}
/* 
    DSR Calculator
    Goes ding when there's stuff
*/ 

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

// Remove empty fields when populating registry data
removeEmpty = function(list) {
    var filled = list.filter(function(item) {
        if(item.desiredX() !== '' && item.desiredY() !== '') {
            return item;
        }
    });
    return filled;
}

// converts a single digit decimal number to a 2-digit hex number
convertToHex = function(number) {
    var realNumber = parseInt(number);
    var string = realNumber.toString(16);
    string = (string.length === 1) ? '0' + string : string;
    return string;
}

// calculates multipler (6000 / 3000) * 10,000
// converts to hex and flips the bytes
getMultiplier = function(native, desired) {
    var result = Math.round((desired / native) * 10000);    
    var hexValue = (result).toString(16);
    hexValue = (hexValue.length === 3) ? '0' + hexValue : hexValue;
    var flipped = hexValue.substring(2, 4) + ',' + hexValue.substring(0, 2) + ',';

    return flipped.toUpperCase();
}

function DesiredResolution(parent) {
    var self = this;
    var parent = parent;

    self.desiredX = ko.observable('');
    self.desiredY = ko.observable('');

    self.hexResults = ko.computed(function() {
        var results = '';
        var hexX = getMultiplier(parent.nativeX(), self.desiredX());
        var hexY = getMultiplier(parent.nativeY(), self.desiredY());
        
        results = hexX + '00,00,' + hexY + '00,00,00,00,00,00,';
        return results;
    }, this);
}

$(document).ready(function(){
    function AppViewModel() {
        var self = this;
        var total = 10;
        var registryData = '.registry-data code';

        self.nativeX = ko.observable('');
        self.nativeY = ko.observable('');
        self.smoothness = ko.observable('33');
        self.error = ko.computed(function() {
            return (self.nativeX() === '' || self.nativeY() === '');
        }, this);

        self.resolutions = ko.observableArray([]);
    
        self.remaining = ko.computed(function() {
            return (10 - self.resolutions().length);
        }, this);

        self.addRow = function() {
            self.resolutions.push(new DesiredResolution(self));
        };

        // generates the data quired for the registry
        self.generateHex = function () {
            if (self.error()) {
                $(registryData).html("YOU DID NOT ENTER A NATIVE RESOLUTION");
                return false;
            }

            var filledList = removeEmpty(self.resolutions());
            var smoothHex = convertToHex(self.smoothness());
            var resHex = convertToHex(filledList.length);

            // required data
            var hexString = '"SmoothScalingData"=hex:';
            hexString += '01,00,00,00,' + smoothHex + ',00,00,00,' + resHex + ',00,00,00,'

            // adding multiplieres for desired resolutions
            hexString += filledList.map(function(item) {
                return item.hexResults();
            });

            // fill out remaining required data if there are less than 10 resolutions entered
            var shortBy = 10 - filledList.length;
            for (var i = 0; i < shortBy; i++) {
                hexString += '00,00,00,00,00,00,00,00,00,00,00,00,';
            }

            // clean up string
            hexString = hexString.replaceAll(",,", ",").slice(0,-1);

            $(registryData).html(hexString);
        };

        // generate resolution fields based on total
        for (var i = 0; i < total; i++) {
            self.resolutions.push(new DesiredResolution(self));
        }
    }

    ko.applyBindings(new AppViewModel());
});
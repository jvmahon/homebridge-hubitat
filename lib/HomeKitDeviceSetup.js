//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to Hubitat. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' will trigger when the HomeKit Object's value was changed from the iOS application as well as when an updateValue was called.
//				.on('HubValueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from Hubitat. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from Hubitat

'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var HubData = [];

var Sensors = require("../lib/Sensor Setup")
 
console.log(cyan("Loading HomeKitDeviceSetup.js"));

exports.setupServices = function (that, services)
{
	console.log(cyan("Debug: that is: " + Object.getOwnPropertyNames(that.api)))

	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	// console.log(chalk.cyan(`Debug: currentAccessory properties are: ${Object.getOwnPropertyNames(that.currentAccessory)}`));
	// console.log(chalk.cyan(`Debug: currentAccessory is: ${JSON.stringify(that.currentAccessory)}`));

	
	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, that.currentAccessory.manufacturer)
		.setCharacteristic(Characteristic.Model, that.currentAccessory.type || "Unknown")
		.setCharacteristic(Characteristic.Model, that.currentAccessory.name || "Unknown")
		.setCharacteristic(Characteristic.SerialNumber, "Hubitat." + that.currentAccessory.id);
	services.push(informationService);	
	
	console.log(chalk.yellow(`Setting up a device of type: ${that.currentAccessory.type}`));

	switch (that.currentAccessory.type) 
	{
		case "Generic Z-Wave CentralScene Dimmer": 
		case "Generic Zigbee Bulb":
		{
			var thisService = new Service.Lightbulb()
			thisService.isPrimaryService = true;			
			
			var Switch	= thisService.getCharacteristic(Characteristic.On);
			that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, Switch, "switch");
			
			Switch
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						Switch.updateValue ( (HubReport.value == "on") ? 1 : 0 )
					})
				.on('set', function(newHomekitValue, callback, context)
					{
						that.HubData.send(Switch.id, "switch", (newHomekitValue == true) ? "on": "off" )	
						callback(null);
					} );
							
			var Level = thisService.addCharacteristic(new Characteristic.Brightness())
			that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, Level, "level");
	
			Level
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						Level.updateValue(HubReport.value); 
					})
				.on('set', function(newHomekitValue, callback, context)
					{
						that.HubData.send(Switch.id, 'setLevel', newHomekitValue)
						callback(null);
					} );

			services.push(thisService);

			break;
		}
	}
	that.log(chalk.yellow(`Setting up Sensors with "that" object: ${Object.getOwnPropertyNames(that)}`));

	Sensors.setupSensor(that, services);
}

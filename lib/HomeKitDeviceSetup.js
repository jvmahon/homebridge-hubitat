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

var Sensors = require("../lib/Setup Sensors")
var LightsFansPlugs = require("../lib/Setup LightsFansPlugs");
var LocksDoorsWindows = require("../lib/Setup LocksDoorsWindows");
var Valves = require("../lib/Setup Valves");
// var StatelessButttons = require("../lib/Setup Statelessbuttons");
 
console.log(cyan("Loading HomeKitDeviceSetup.js"));

exports.setupServices = function (that, services)
{
	// console.log(cyan("Debug: that is: " + Object.getOwnPropertyNames(that.api)))

	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	// console.log(chalk.cyan(`Debug: currentAccessory properties are: ${Object.getOwnPropertyNames(that.currentAccessory)}`));
	// console.log(chalk.cyan(`Debug: currentAccessory is: ${JSON.stringify(that.currentAccessory)}`));
	
	if (that.currentAccessory.capabilities.includes("Valve"))
		{
			Valves.setupValves(that, services);
		} 
	else
		{
			LightsFansPlugs.setupLightsFansPlugs(that, services)
		}
	Sensors.setupSensor(that, services);
	LocksDoorsWindows.setupLocksDoorsWindows(that, services);
	// StatelessButttons.setupStatelessButtons(that, services);
	
	if (services.length != 0)
	{
		var informationService = new Service.AccessoryInformation();
		informationService
		.setCharacteristic(Characteristic.Manufacturer, that.currentAccessory.manufacturer)
		.setCharacteristic(Characteristic.Model, that.currentAccessory.type || "Unknown")
		.setCharacteristic(Characteristic.Model, that.currentAccessory.name || "Unknown")
		.setCharacteristic(Characteristic.SerialNumber, "Hubitat." + that.currentAccessory.id);
	
		services.push(informationService);	
	}
}




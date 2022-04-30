//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to Hubitat. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' will trigger when the HomeKit Object's value was changed from the iOS application as well as when an updateValue was called.
//				.on('HubValueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from Hubitat. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from Hubitat

'use strict'
var exports = module.exports;

var HubData = [];

var Sensors = require("../lib/Setup Sensors")
var LightsFansPlugs = require("../lib/Setup LightsFansPlugs");
var LocksDoorsWindows = require("../lib/Setup LocksDoorsWindows");
var Valves = require("../lib/Setup Valves");
var Thermostat = require("../lib/Setup Thermostats");
var Battery = require("../lib/Setup Battery");
var Stateless = require("../lib/Setup StatelessSwitch");

exports.setupServices = function (that, services) {
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	
	switch(true) {
		case that.currentAccessory.capabilities.includes("Valve"):
			Valves.setupValves(that, services);
			break;
		case that.currentAccessory.capabilities.includes("Thermostat"):
			Thermostat.setupThermostat(that, services);
			break;
		case that.currentAccessory.capabilities.includes("Lock"):
		case that.currentAccessory.capabilities.includes("GarageDoorControl"):
		case that.currentAccessory.capabilities.includes("WindowShade"):				
			LocksDoorsWindows.setupLocksDoorsWindows(that, services);
			break;
		default:
			Sensors.setupSensor(that, services);
			LightsFansPlugs.setupLightsFansPlugs(that, services)
	}

	Battery.setupBattery(that, services);
	Stateless.setupStatelessProgrammableSwitch(that,services);
	
	if (services.length != 0) {
		var informationService = new Service.AccessoryInformation();
		informationService
		.setCharacteristic(Characteristic.Manufacturer, that.currentAccessory.manufacturer)
		.setCharacteristic(Characteristic.Model, that.currentAccessory.type || "Unknown")
		.setCharacteristic(Characteristic.SerialNumber, "Hubitat." + that.currentAccessory.id);
	
		services.push(informationService);	
	}
}

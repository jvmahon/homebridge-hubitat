//				.on('set', function(value, callback, context)); function called when a change originates from the iOS Home Application.  This should process the value receive from iOS to then send a new value to Hubitat. 
// 				.on('change', function(data)) - Similar to .on('set' ...) - 'change' will trigger when the HomeKit Object's value was changed from the iOS application as well as when an updateValue was called.
//				.on('HSvalueChanged', function(newHSValue, HomeKitObject) - use this to process a change originating from Hubitat. The value of HomeKitObject is either a HomeKit Service or a HomeKit Characteristic. This HomeKit Object is identified by the call .updateUsingHSReference(that.config.ref) which registers the object to receive a change originating from Hubitat

'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
 
var globals = require("../index").globals;
var HubData = require("../index").HubData;


var test = require("../index.js");
console.log(magenta(Object.getOwnPropertyNames(test.HubData)));
console.log(cyan(Object.getOwnPropertyNames(HubData)));

exports.setupServices = function (that, services)
{


	let Characteristic 	= globals.api.hap.Characteristic;
	let Service 		= globals.api.hap.Service;

	var informationService = new Service.AccessoryInformation();
	informationService
		.setCharacteristic(Characteristic.Manufacturer, "HomeSeer")
		.setCharacteristic(Characteristic.Model, that.model)
		.setCharacteristic(Characteristic.SerialNumber, "HS " + that.config.type + " ref " + that.ref);
	services.push(informationService);	
	
	console.log(chalk.yellow(`Setting up a device of type: ${that.type}`));

	switch (that.type) 
	{
		case "Generic Z-Wave CentralScene Dimmer": 
		case "Generic Zigbee Bulb":
		{

			var thisService = new Service.Lightbulb()
			var Switch	= thisService.getCharacteristic(Characteristic.On);
			var SwitchLevel = thisService.addCharacteristic(new Characteristic.Brightness());
			
			thisService.isPrimaryService = true;

			Switch
				.on('HubValueChanged', function(newHubValue, HomeKitObject)
				{
					switch(newHubValue)
					{
						case "off":  // assumes 0 is always off; any other value is On.
							{
								Switch.updateValue(0); 
								break ;
							}
						case "on": 
							{
								Switch.updateValue(1); 
								break;
							}
					}
				})
				.on('set', function(newHubValue, callback, context)
							{
								switch(newHubValue)
								{
									case (true):
									{
										HubData.send(Switch.id, "on")
										break;
									}
									case (false):
									{
										HubData.send(Switch.id, "off")
										break;
									}
									default:
									{
										globals.log(cyan("Error in 'Switch' device type processing on 'set'"));
									}
								}
								
								callback(null);
							} );
							
			SwitchLevel
				.on('HubValueChanged', function(newHubValue, HomeKitObject)
				{
					SwitchLevel.updateValue(newHubValue); 
				})
				.on('set', function(newHubValue, callback, context)
							{
								HubData.sendDataValue(Switch.id, newHubValue)
								callback(null);
							} );
							
			services.push(thisService);

			break;
		}
	}
}

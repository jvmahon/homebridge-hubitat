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

	for (var thisCapability of that.currentAccessory.capabilities)
	{
		if (thisCapability == "Switch")
		{
			var thisService = new Service.Lightbulb()
			
			var SwitchControl =  thisService.getCharacteristic(Characteristic.On);
			// that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, SwitchControl, "switch");
			
			SwitchControl
				.updateOnHubEvents(that.currentAccessory.id, "switch")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
					})
				.on('set', function(newHomekitValue, callback, context)
					{
						that.HubData.send(that.currentAccessory.id, "switch", (newHomekitValue == true) ? "on": "off" )	
						callback(null);
					} );
			
			// Set Up Optional Characteristics of the Dimmer or Bulb!
			if (that.currentAccessory.capabilities.includes("SwitchLevel"))
				{
					var LevelControl = thisService.addCharacteristic(new Characteristic.Brightness())
					that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, LevelControl, "level");
			
					LevelControl
						.on('HubValueChanged', function(HubReport, HomeKitObject)
							{
								LevelControl.updateValue(HubReport.value); 
							})
						.on('set', async function(newHomekitValue, callback, context)
							{
								let data = await that.HubData.send(that.currentAccessory.id, 'setLevel', newHomekitValue)
								callback(null);
							} );
				}
				
			if (that.currentAccessory.capabilities.includes("ColorControl"))
				{
					that.log(chalk.green(`Setting up capability ${that.currentAccessory.capabilities} which includes ColorControl: ${that.currentAccessory.capabilities.includes("ColorControl") == true}.`))
					var HueControl = thisService.addCharacteristic(new Characteristic.Hue())
					var SaturationControl = thisService.addCharacteristic(new Characteristic.Saturation())
					// that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, HueControl, "level");
					
					HueControl
						.on('set', function(newHomekitValue, callback, context)
							{
								var hueValue = newHomekitValue /3.6
								that.HubData.send(that.currentAccessory.id, 'setHue', Math.round(hueValue))
								callback(null);
							} );
							
					SaturationControl
						.on('set', function(newHomekitValue, callback, context)
							{
								that.HubData.send(that.currentAccessory.id, 'setSaturation', newHomekitValue)
	
								callback(null);
							} );								
				}	
			services.push(thisService)
		}
	}


	Sensors.setupSensor(that, services);	

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




'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

exports.setupLightsFansPlugs = function (that, services)
{
	
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;


		if (that.currentAccessory.capabilities.includes("Switch"))
		{
			var thisService = new Service.Lightbulb()
			
			var SwitchControl =  thisService.getCharacteristic(Characteristic.On);
			
			SwitchControl
				.updateOnHubEvents(that.currentAccessory.id, "switch")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
					})
				.on('set', function(newHomekitValue, callback, context)
					{
						that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )	
						callback(null);
					} );
			
			// Set Up Optional Characteristics of the Dimmer or Bulb!
			if (that.currentAccessory.capabilities.includes("SwitchLevel"))
				{
					var LevelControl = thisService.addCharacteristic(new Characteristic.Brightness())
						.updateOnHubEvents(that.currentAccessory.id, "level")
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
'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

let accessoryType = function (accessory)
{
	switch(true)
	{
		// IF the label includes the keyword "switch", "outlet", "heater", "appliance" then make the HomeKit device a switch, but not if it has a "level" setting
		// Because HomeKit "Switches" are Binary only. Anything with a level setting must be a Lightbulb or Fan!
		case (accessory.label.toLowerCase().includes("switch") && !accessory.capabilities.includes("SwitchLevel")):
		case (accessory.label.toLowerCase().includes("outlet") && !accessory.capabilities.includes("SwitchLevel")):
		case (accessory.label.toLowerCase().includes("heater") && !accessory.capabilities.includes("SwitchLevel")):
		case (accessory.label.toLowerCase().includes("appliance") && !accessory.capabilities.includes("SwitchLevel")):
			{
				return "Switch";
				break;
			}
		// IF the label includes the keyword "fan" make it a fan
			case (accessory.label.toLowerCase().includes("fan") || accessory.capabilities.includes("FanControl")):
			{
				return "Fanv2";
				break;
			}
		default:
			{
				return "Lightbulb";
				break;
			}		
	}
}
exports.setupLightsFansPlugs = function (that, services)
{
	
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;


	if (that.currentAccessory.capabilities.includes("Switch"))
	{
		var currentAccessoryType = accessoryType(that.currentAccessory)
		switch(currentAccessoryType)
		{
			case "Switch":
			{
				var thisService = new Service.Switch()
				var SwitchControl	= thisService.getCharacteristic(Characteristic.On)
					.updateOnHubEvents(that.currentAccessory.id, "switch")
					.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							// that.log(chalk.red(`Received HubReport of value: ${HubReport.value}.`));
							SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
						})
					.on('set', function(newHomekitValue, callback, context)
						{
							that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )	
							callback(null);
						} );
				services.push(thisService);
				return;
			}
			case "Outlet":
			{
				var thisService = new Service.Outlet()
				var SwitchControl	= thisService.getCharacteristic(Characteristic.On)
					.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
					.updateOnHubEvents(that.currentAccessory.id, "switch")
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							// that.log(chalk.red(`Received HubReport of value: ${HubReport.value}.`));
							SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
						})
					.on('set', function(newHomekitValue, callback, context)
						{
							that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )	
							callback(null);
						} );
				services.push(thisService);
				return;
			}
			case "Fanv2":
			{
				var thisService = new Service.Fanv2()
				var SwitchControl	= thisService.getCharacteristic(Characteristic.Active)
					.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							// that.log(chalk.red(`Received HubReport of value: ${HubReport.value}.`));
							SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
						})
					.on('set', function(newHomekitValue, callback, context)
						{
							if( this.value != newHomekitValue)
							{
								that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )
							}							
							callback(null);
						} );
				if (that.currentAccessory.capabilities.includes("SwitchLevel"))
				{
					var RotationControl = thisService.addCharacteristic(new Characteristic.RotationSpeed())
					.setInitialValue(that.currentAccessory.attributes.level)
					.updateOnHubEvents(that.currentAccessory.id, "level")
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							RotationControl.updateValue(HubReport.value); 
						})
					.on('set', function(newHomekitValue, callback, context)
						{
							that.HubData.send(that.currentAccessory.id, 'setLevel', newHomekitValue)
							callback(null);
						} );
				}
				services.push(thisService);
				return;
			}
			case "Lightbulb": // A simple non-dimming lightbulb
			{
				var thisService = new Service.Lightbulb()
				var SwitchControl	= thisService.getCharacteristic(Characteristic.On)
					.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
					.updateOnHubEvents(that.currentAccessory.id, "switch")
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							// that.log(chalk.red(`Received HubReport of value: ${HubReport.value}.`));
							SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
						})
					.on('set', function(newHomekitValue, callback, context)
						{
							if( this.value != newHomekitValue)
							{
								that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )
							}							
							callback(null);
						} );

						
				if (that.currentAccessory.capabilities.includes("SwitchLevel"))
				{
					var LevelControl = thisService.addCharacteristic(new Characteristic.Brightness())
					.updateOnHubEvents(that.currentAccessory.id, "level")
					.setInitialValue(that.currentAccessory.attributes.level)
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							LevelControl.updateValue(HubReport.value); 
						})
					.on('set', function(newHomekitValue, callback, context)
						{
							that.HubData.send(that.currentAccessory.id, 'setLevel', newHomekitValue)
							callback(null);
						} );
				}	
				if (that.currentAccessory.capabilities.includes("ColorControl"))
					{
						that.log(chalk.green(`Setting up capability ${that.currentAccessory.capabilities} which includes ColorControl: ${that.currentAccessory.capabilities.includes("ColorControl") == true}.`))
						var HueControl = thisService.addCharacteristic(new Characteristic.Hue())
							.setInitialValue(that.currentAccessory.attributes.hue * 3.6)
							.updateOnHubEvents(that.currentAccessory.id, "hue")
							.on('set', function(newHomekitValue, callback, context)
								{
									var hueValue = newHomekitValue /3.6
									that.HubData.send(that.currentAccessory.id, 'setHue', Math.round(hueValue))
									callback(null);
								} )
							.on('HubValueChanged', function(HubReport, HomeKitObject)
								{
									that.log(`Debug: Received a HubReport Hue value of ${HubReport.value}.`)
									HueControl.updateValue(HubReport.value * 3.6); 
								})	;
								
						var SaturationControl = thisService.addCharacteristic(new Characteristic.Saturation())		
							.setInitialValue(that.currentAccessory.attributes.saturation)
							.updateOnHubEvents(that.currentAccessory.id, "saturation")
							.on('set', function(newHomekitValue, callback, context)
								{
									that.HubData.send(that.currentAccessory.id, 'setSaturation', newHomekitValue)
		
									callback(null);
								} )
							.on('HubValueChanged', function(HubReport, HomeKitObject)
								{
									SaturationControl.updateValue(HubReport.value); 
								})	;							
					}						
				services.push(thisService);
				return;
			}				
			default:
			{
				throw new SyntaxError("Error in setting up Binary device. Type not processed: " + that.config.type);
			}
		}
	}
}
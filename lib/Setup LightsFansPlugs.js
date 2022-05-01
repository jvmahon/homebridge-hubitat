'use strict'
var exports = module.exports;

let accessoryType = function (accessory)
{
	switch(true) {
		// IF the label includes the keyword "outlet" then make the HomeKit device an outlet, but not if it has a "level" setting
		// Because HomeKit "Switches" are Binary only. Anything with a level setting must be a Lightbulb or Fan!
		case (accessory.label.toLowerCase().includes("outlet") && !accessory.capabilities.includes("SwitchLevel")):
		case (accessory.capabilities.includes("Outlet") && !accessory.capabilities.includes("SwitchLevel")):
			return "Outlet";
			break;
		// IF the label includes the keyword "switch", "heater", "appliance" then make the HomeKit device a switch, but not if it has a "level" setting because HomeKit "Switches" are Binary only. Anything with a level setting must be a Lightbulb or Fan!
		case (accessory.label.toLowerCase().includes("switch") && !accessory.capabilities.includes("SwitchLevel")):
		case (accessory.label.toLowerCase().includes("heater") && !accessory.capabilities.includes("SwitchLevel")):
		case (accessory.label.toLowerCase().includes("appliance") && !accessory.capabilities.includes("SwitchLevel")):
			return "Switch";
			break;
		// IF the label includes the keyword "fan" make it a fan
		case (accessory.label.toLowerCase().includes("fan") || accessory.capabilities.includes("FanControl")):
			return "Fanv2";
			break;
		default:
			return "Lightbulb";
			break;
	}
}
exports.setupLightsFansPlugs = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	let roundUp 		= that.platformConfig.roundUp;

	let round = function (level) {
		//that.log(`Rounding based on roundUp config (${roundUp}): ${level}.`);
		return roundUp && level >= 99 ? 100 : level;
	}

	if (that.currentAccessory.capabilities.includes("Switch")) {
		var currentAccessoryType = accessoryType(that.currentAccessory)
		switch(currentAccessoryType) {
			case "Switch":
				{
					var thisService = new Service.Switch()
					var SwitchControl	= thisService.getCharacteristic(Characteristic.On)
						.updateOnHubEvents(that.currentAccessory.id, "switch")
						.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
						.on('HubValueChanged', (HubReport, HomeKitObject) => {
								SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
							})
						.on('set', (newHomekitValue, callback) => {
								that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )	
								callback(null);
							} );
					services.push(thisService);
					return;
				}
				break;
			case "Outlet":
				{
					var thisService = new Service.Outlet()
					var SwitchControl	= thisService.getCharacteristic(Characteristic.On)
						.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
						.updateOnHubEvents(that.currentAccessory.id, "switch")
						.on('HubValueChanged', (HubReport, HomeKitObject) => {
								SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
							})
						.on('set', (newHomekitValue, callback) => {
								that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )	
								callback(null);
							} );
					services.push(thisService);
					return;
				}
				break;
			case "Fanv2":
				{
					var thisService = new Service.Fanv2()
					var SwitchControl	= thisService.getCharacteristic(Characteristic.Active)
						.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
						.updateOnHubEvents(that.currentAccessory.id, "switch")
						.on('HubValueChanged', (HubReport, HomeKitObject) => {
								SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
							})
						.on('set', (newHomekitValue, callback) => {
								if( this.value != newHomekitValue) {
									that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )
								}							
								callback(null);
							} );
					if (that.currentAccessory.capabilities.includes("SwitchLevel")) {
						var RotationControl = thisService.addCharacteristic(new Characteristic.RotationSpeed())
						.setInitialValue(that.currentAccessory.attributes.level)
						.updateOnHubEvents(that.currentAccessory.id, "level")
						.on('HubValueChanged', (HubReport, HomeKitObject) => {
								RotationControl.updateValue(HubReport.value); 
							})
						.on('set', (newHomekitValue, callback) => {
								that.HubData.send(that.currentAccessory.id, 'setLevel', newHomekitValue, 0)
								callback(null);
							} );
					} else if(that.currentAccessory.capabilities.includes("FanControl")) {
						// This section of code is used if the device does not include "level", but still includes "FanControl"
						var RotationControl = thisService.addCharacteristic(new Characteristic.RotationSpeed())
						.setInitialValue(that.currentAccessory.attributes.level)
						.updateOnHubEvents(that.currentAccessory.id, "speed")
						.on('HubValueChanged', (HubReport, HomeKitObject) => {
								var newSpeed = 0
								switch(HubReport.value) {
									case "off":			{ newSpeed =  0; break; }
									case "low":			{ newSpeed = 20; break; }
									case "medium-low":	{ newSpeed = 40; break; }
									case "medium":		{ newSpeed = 60; break; }
									case "medium-high":	{ newSpeed = 80; break; }
									case "high":		{ newSpeed = 100; break; }
									case "on":			{ newSpeed = 100; break; }
								}
								RotationControl.updateValue(newSpeed); 
							})
						.on('set', (newHomekitValue, callback) => {
								var newSpeed = "off"
								
								if (newHomekitValue == 0) { newSpeed ="off" }
								else if (newHomekitValue <   20) 	{ newSpeed = "low" }
								else if (newHomekitValue <   40) 	{ newSpeed = "medium-low" }
								else if (newHomekitValue <   60) 	{ newSpeed = "medium" }
								else if (newHomekitValue <   80) 	{ newSpeed = "medium-high" }
								else if (newHomekitValue <= 100) 	{ newSpeed = "high" }

								that.HubData.send(that.currentAccessory.id, 'setSpeed', newSpeed)
								callback(null);
							} );
					}
					
					services.push(thisService);
					return;
				}
				break;
			case "Lightbulb": // Start by setting up a simple non-dimming lightbulb
				{
					var thisService = new Service.Lightbulb()
					thisService.isPrimaryService = true
					var SwitchControl	= thisService.getCharacteristic(Characteristic.On)
						.setInitialValue(that.currentAccessory.attributes.switch == "on" ? 1 : 0)
						.updateOnHubEvents(that.currentAccessory.id, "switch")
						.on('HubValueChanged', (HubReport, HomeKitObject)=> {
								SwitchControl.updateValue ( (HubReport.value == "on") ? 1 : 0 )
							})
						.on('set', (newHomekitValue, callback) => {
								if( this.value != newHomekitValue) {
									that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "on": "off" )
								}							
								callback(null);
							} );

					// Add dimming capability if supported		
					if (that.currentAccessory.capabilities.includes("SwitchLevel")) {
						var LevelControl = thisService.addCharacteristic(new Characteristic.Brightness())
						.updateOnHubEvents(that.currentAccessory.id, "level")
						.setInitialValue(that.currentAccessory.attributes.level)
						.on('HubValueChanged', (HubReport, HomeKitObject) => {
								let level = round(HubReport.value);
								LevelControl.updateValue(level);
							})
						.on('set', (newHomekitValue, callback) => {
								// Send both the new value as well as a duration of 0 for fast reaction!
								that.HubData.send(that.currentAccessory.id, 'setLevel', newHomekitValue, 0)
								callback(null);
							} );
					}

					// Add color control capability if supported.
					if (that.currentAccessory.capabilities.includes("ColorControl")) {
							that.log(`Setting up capability ${that.currentAccessory.capabilities} which includes ColorControl: ${that.currentAccessory.capabilities.includes("ColorControl") == true}.`)
							var HueControl = thisService.addCharacteristic(new Characteristic.Hue())
								.setInitialValue(that.currentAccessory.attributes.hue * 3.6)
								.updateOnHubEvents(that.currentAccessory.id, "hue")
								.on('set', (newHomekitValue, callback) => {
										var hueValue = newHomekitValue /3.6
										that.HubData.send(that.currentAccessory.id, 'setHue', Math.round(hueValue))
										callback(null);
									} )
								.on('HubValueChanged', (HubReport, HomeKitObject) => {
										// that.log(`Debug: Received a HubReport Hue value of ${HubReport.value}.`)
										HueControl.updateValue(HubReport.value * 3.6); 
									})	;
									
							var SaturationControl = thisService.addCharacteristic(new Characteristic.Saturation())		
								.setInitialValue(that.currentAccessory.attributes.saturation)
								.updateOnHubEvents(that.currentAccessory.id, "saturation")
								.on('set', (newHomekitValue, callback) => {
										that.HubData.send(that.currentAccessory.id, 'setSaturation', newHomekitValue)
										callback(null);
									} )
								.on('HubValueChanged', (HubReport, HomeKitObject) => {
										SaturationControl.updateValue(HubReport.value); 
									})	;							
						}						
					services.push(thisService);
					return;
				}
				break;				
			default:
				throw new SyntaxError("Error in setting up Binary device. Type not processed: " + that.config.type);
		}
	}
}

'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;


exports.setupThermostat = function (that, services)
{
	
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	if (that.currentAccessory.capabilities.includes("Thermostat"))
	{
		var ThermostatService = new Service.Thermostat();
		
		ThermostatService
		.updateOnHubEvents(that.currentAccessory.id, "coolingSetpoint", "heatingSetpoint", "temperature", "thermostatMode", "thermostatSetpoint", "thermostatOperatingState");
			
		// if F: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);
		// if C: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(0);
		
		var CurrentState 		= ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatOperatingState ")
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				console.log(chalk.yellow(`Received CurrentState Value`));
				switch(HubReport.value)
				{
					case "idle":
					case "fan only":
					case "vent economizer":
					{
						CurrentState.updateValue(0); // Off
						break;
					}					
					case "heating":
					case "pending heat":
					{
						CurrentState.updateValue(1); // Heat
						break;
					}
					case "cooling":
					case "pending cool":
					{
						CurrentState.updateValue(2); // Cool
						break;
					}
				}
			});	

		var TargetState 		= ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatMode")
			.on('set', function(newHomekitValue, callback, context)
			{
				switch(newHomekitValue)
				{
					case 0: // off
					{
						that.HubData.send(that.currentAccessory.id, "off");
						break;
					}
					case 1: // Heat
					{
						that.HubData.send(that.currentAccessory.id, "heat");	
						break;
					}
					case 2: // Cool
					{
						that.HubData.send(that.currentAccessory.id, "cool");
						break;
					}
					case 3: // auto
					{
						that.HubData.send(that.currentAccessory.id, "auto");
						break;
					}
				}
				callback(null);
			})
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
			console.log(chalk.yellow(`Received TargetState value;`))
				switch(HubReport.value)
				{
					case "off":
					{
						TargetState.updateValue(0); // Off
						break;
					}					
					case "heat":
					case "emergency heat":
					{
						TargetState.updateValue(1); // Heat
						break;
					}
					case "cool":
					{
						TargetState.updateValue(2); // Cool
						break;
					}
					case "auto":
					{
						TargetState.updateValue(3); // Auto
						break;
					}
				}
			});	
			
		var CurrentTemperature 	= ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)
			.updateOnHubEvents(that.currentAccessory.id, "temperature")
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				// For now, works with Hubitat = Fahrenheit only!
				var updateTemp = (HubReport.value - 32) * (5/9)
				CurrentTemperature.updateValue(updateTemp);
			});	
		
		
		 var TargetTemperature 	= ThermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatSetpoint")
			.on('set', function(newHomekitValue, callback, context)
				{
					var updateTemp = (newHomekitValue * (9/5)) + 32;
					that.HubData.send(that.currentAccessory.id, "setThermostatSetpoint", updateTemp );
					callback(null);
				})
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
					console.log(chalk.yellow(`Received TargetTemperature value;`))

					// var updateTemp = ((HubReport.unit == "°F") ? ((HubReport.value - 32) * (5/9)) : HubReport.value)
					var updateTemp = (HubReport.value - 32) * (5/9);
					TargetTemperature.updateValue(updateTemp);
				});	
		
		
		var DisplayUnits 		= ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits);	

		var HeatingSetpoint 	= ThermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.updateOnHubEvents(that.currentAccessory.id, "heatingSetpoint")	
			.on('set', function(newHomekitValue, callback, context)
				{
					var updateTemp = (newHomekitValue * (9/5)) + 32;
					that.HubData.send(that.currentAccessory.id, "setHeatingSetpoint", updateTemp );
					callback(null);
				})			
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
					// var updateTemp = ((HubReport.unit == "°F") ? ((HubReport.value - 32) * (5/9)) : HubReport.value)
					var updateTemp = (HubReport.value - 32) * (5/9);
					HeatingSetpoint.updateValue(updateTemp);
				});	
			
		var CoolingSetpoint 	= ThermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.updateOnHubEvents(that.currentAccessory.id, "coolingSetpoint")
			.on('set', function(newHomekitValue, callback, context)
				{
					var updateTemp = (newHomekitValue * (9/5)) + 32;
					that.HubData.send(that.currentAccessory.id, "setCoolingSetpoint", updateTemp );
					callback(null);
				})
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
					// var updateTemp = ((HubReport.unit == "°F") ? ((HubReport.value - 32) * (5/9)) : HubReport.value)
					var updateTemp = (HubReport.value - 32) * (5/9);
					HeatingSetpoint.updateValue(updateTemp);
				});	
				
		var CurrentRH 	= ThermostatService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.updateOnHubEvents(that.currentAccessory.id, "humidity")
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CurrentRH.updateValue(parseInt(HubReport.value));
				});
				
		var TargetRH 	= ThermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity);
		
		ThermostatService
		.on('HubValueChanged', function(HubReport, HomeKitObject)
			{

				console.log(chalk.yellow(`Thermostat received a hub report of type ${HubReport.name}.`));

			})
		
		services.push(ThermostatService);
		return;	
	}
}
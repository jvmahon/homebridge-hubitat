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
		var ThermostatService = new Service.Thermostat()
		.updateOnHubEvents(that.currentAccessory.id, "coolingSetpoint", "heatingSetpoint", "temperature", "thermostatMode", "thermostatSetpoint")
							
		// if F: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);
		// if C: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(0);
		var CurrentState 		= ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState);
		var TargetState 		= ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState);
		
		var CurrentTemperature 	= ThermostatService.getCharacteristic(Characteristic.CurrentTemperature);
		var TargetTemperature 	= ThermostatService.getCharacteristic(Characteristic.TargetTemperature);
		
		var DisplayUnits 		= ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits);	

		var HeatingThreshold 	= ThermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature);
		var CoolingThreshold 	= ThermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature);
		
		var CurrentRH 	= ThermostatService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
		var TargetRH 	= ThermostatService.getCharacteristic(Characteristic.TargetRelativeHumidity);
		
		ThermostatService
		.on('HubValueChanged', function(HubReport, HomeKitObject)
			{
				switch(HubReport.name)
				{
					case "coolingSetpoint":
					case "heatingSetpoint":
					case "temperature":
					case "thermostatFanMode":
					case "thermostatMode":
					case "thermostatOperatingState":
					case "thermostatSetpoint":
					{
						console.log(chalk.yellow(`Thermostat received a hub report of type ${HubReport.name}.`));
						break;
					}
					default:
					{
						console.log(chalk.Red(`Error - Thermostat received a hub report of type ${HubReport.name}.`));
						break;
					}					
					
				}
				
			})
		
		services.push(ThermostatService);
		return;	
	}
}
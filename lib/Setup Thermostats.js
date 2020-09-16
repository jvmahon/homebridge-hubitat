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
	
	var CurrentStateOnSetMap = new Map([
			["idle", 0], ["fan only",0], ["vent economizer", 0], 
			["heating", 1], ["pending heat", 1], 
			["cooling", 2], ["pending cool", 2]]);	
	
	var TargetStateOnSetMap = new Map([
			[0,"off"], 
			[1, "heat"], 
			[2, "cool"], 
			[3, "auto"]]);
	var TargetStateReportMap = new Map([
			["off", 0], 
			["heat", 1], ["emergency heat", 1], 
			["cool", 2], 
			["auto", 3]]);		
		
	// Get the complete Hubitat data for this device from the stored array.
	// var fullDeviceData	= that.HubData.allDevices.find( function(currentElement) { return (currentElement.id == that.currentAccessory.id)})
	
	// that.log(green(JSON.stringify(fullDeviceData)));
		
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
				CurrentState.updateValue(CurrentStateOnSetMap.get(HubReport.value));
			});	

		var TargetState 		= ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatMode")
			.on('set', function(newHomekitValue, callback, context)
			{
				that.HubData.send(that.currentAccessory.id, TargetStateOnSetMap.get(newHomekitValue));
				callback(null);
			})
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				console.log(chalk.yellow(`Received TargetState value;`))
				TargetState.updateValue(TargetStateReportMap.get(HubReport.value));
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
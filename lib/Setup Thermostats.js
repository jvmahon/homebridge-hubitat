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
	// console.log(cyan(Object.getOwnPropertyNames(that.currentAccessory)));
	//console.log(green(Object.getOwnPropertyNames(that.HubData.allDevices)));
	// console.log(yellow(JSON.stringify(that.HubData.allDevices)));
	// console.log(cyan(Object.getOwnPropertyNames(that)));
	// console.log(yellow(JSON.stringify(that.platformConfig.temperatureUnits)));
	// Get the complete Hubitat data for this device from the stored array.
	
	//The complete set of data for the current device being set up.
	// var fullDeviceData	= that.HubData.allDevices.find( function(currentElement) { return (currentElement.id == that.currentAccessory.id)})
	
	// that.log(green(JSON.stringify(fullDeviceData)));	
	
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
		
	if (that.currentAccessory.capabilities.includes("Thermostat"))
	{
		var ThermostatService = new Service.Thermostat();
		
		// if F: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);
		// if C: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(0);
		
		var CurrentState = ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.setInitialValue(CurrentStateOnSetMap.get(that.currentAccessory.attributes.thermostatOperatingState))
			.updateOnHubEvents(that.currentAccessory.id, "thermostatOperatingState")
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				var currentOperatingState = CurrentStateOnSetMap.get(HubReport.value)
				// console.log(cyan(`Receieved hub state value ${HubReport.value} and setting to value ${currentOperatingState}.`));
				CurrentState.updateValue(currentOperatingState);
			});	

		var TargetState = ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatMode")
			.setInitialValue(TargetStateReportMap.get(that.currentAccessory.attributes.thermostatMode))
			.on('set', function(newHomekitValue, callback, context)
			{
				this.targetState = newHomekitValue; // waiting for callback isn't returned before setTargetTemp in scenes
				that.HubData.send(that.currentAccessory.id, TargetStateOnSetMap.get(newHomekitValue));
				callback(null);
			})
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				// console.log(chalk.yellow(`Received TargetState value;`))
				TargetState.updateValue(TargetStateReportMap.get(HubReport.value));
			});	
		
		var initialRoomTemp = (that.platformConfig.temperatureUnits.includes("F")) 
				? Math.round((that.currentAccessory.attributes.temperature -32)/1.8)
				: that.currentAccessory.attributes.temperature
				
		// console.log(cyan(`Current Room Temperature is ${initialRoomTemp} Celsius.`))	
		
		var CurrentTemperature 	= ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)
			.setInitialValue(initialRoomTemp)
			.updateOnHubEvents(that.currentAccessory.id, "temperature")
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				var updateTemp = HubReport.value
				// For now, works with Hubitat = Fahrenheit only!
				
				if (that.platformConfig.temperatureUnits.includes("F"))
				{
					updateTemp = (HubReport.value - 32) / 1.8;
				}
				CurrentTemperature.updateValue(updateTemp);
			});	

		var initialTargetTemp = (that.platformConfig.temperatureUnits.includes("F"))
				? Math.round((that.currentAccessory.attributes.thermostatSetpoint -32)/1.8)
				: that.currentAccessory.attributes.thermostatSetpoint
				
		 var TargetTemperature 	= ThermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.setInitialValue(initialTargetTemp)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatSetpoint", "coolingSetpoint", "heatingSetpoint")
			.on('set', function(newHomekitValue, callback, context)
				{
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? Math.round((newHomekitValue * 1.8) + 32)
							: newHomekitValue
					
						if (this.targetState == 2) // 2 = homekit cool
							{
								that.HubData.send(that.currentAccessory.id, "setCoolingSetpoint", updateTemp );
							}
						if (this.targetState == 1) // 1 = homekit heat
							{
								that.HubData.send(that.currentAccessory.id, "setHeatingSetpoint", updateTemp );
							}						

						callback(null);
				})
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
				// console.log(chalk.yellow(`Received TargetTemperature value in report ${JSON.stringify(HubReport)};`))

					var updateTemp = HubReport.value
					if (that.platformConfig.temperatureUnits.includes("F"))
					{
						updateTemp = (HubReport.value - 32) / 1.8;
					}
					
					if((HubReport.name == "coolingSetpoint") && (TargetState.value == 2))
						{
							TargetTemperature.updateValue(updateTemp);
							return;	
						}
					if((HubReport.name == "heatingSetpoint") && (TargetState.value == 1))
						{
							TargetTemperature.updateValue(updateTemp);
							return;
						}
					if(HubReport.name == "thermostatSetpoint")
						{
							TargetTemperature.updateValue(updateTemp);	
							return;								
						}
				});	
		
		var initialHeatSetpoint = (that.platformConfig.temperatureUnits.includes("F"))
				? ((that.currentAccessory.attributes.heatingSetpoint -32)/1.8)
				: that.currentAccessory.attributes.heatingSetpoint
				
		var HeatingSetpoint 	= ThermostatService.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.setInitialValue(initialHeatSetpoint)
			.updateOnHubEvents(that.currentAccessory.id, "heatingSetpoint")	
			.on('set', function(newHomekitValue, callback, context)
				{
					if(TargetState.value !== 3) return callback(null);
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? Math.round((newHomekitValue * 1.8) + 32)
							: newHomekitValue	

					that.HubData.send(that.currentAccessory.id, "setHeatingSetpoint", updateTemp );
					callback(null);
				})			
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
					var updateTemp = HubReport.value
					// For now, works with Hubitat = Fahrenheit only!
					
					if (that.platformConfig.temperatureUnits.includes("F"))
					{
						updateTemp = (HubReport.value - 32) / 1.8;
					}
					HeatingSetpoint.updateValue(updateTemp);
				});	
				
		var initialCoolSetpoint = (that.platformConfig.temperatureUnits.includes("F"))
				? ((that.currentAccessory.attributes.coolingSetpoint -32)/1.8)
				: that.currentAccessory.attributes.coolingSetpoint		
				
		var CoolingSetpoint 	= ThermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.setInitialValue(initialCoolSetpoint)
			.updateOnHubEvents(that.currentAccessory.id, "coolingSetpoint")
			.on('set', function(newHomekitValue, callback, context)
				{
					if(TargetState.value !== 3) return callback(null);
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? Math.round((newHomekitValue * 1.8) + 32)
							: newHomekitValue	

					that.HubData.send(that.currentAccessory.id, "setCoolingSetpoint", updateTemp );
					callback(null);
				})
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
					// console.log(chalk.yellow(`Received coolingSetpoint report report ${JSON.stringify(HubReport)};`))

					var updateTemp = HubReport.value
					// For now, works with Hubitat = Fahrenheit only!
					
					if (that.platformConfig.temperatureUnits.includes("F"))
					{
						updateTemp = (HubReport.value - 32) / 1.8;
					}
					CoolingSetpoint.updateValue(updateTemp);
				});	
				
		/*
		var CurrentRH 	= ThermostatService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.updateOnHubEvents(that.currentAccessory.id, "humidity")
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CurrentRH.updateValue(parseInt(HubReport.value));
				});
		*/		
		
		services.push(ThermostatService);
		return;	
	}
}
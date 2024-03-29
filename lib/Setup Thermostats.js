'use strict'
var exports = module.exports;

exports.setupThermostat = function (that, services)
{
	// console.log(Object.getOwnPropertyNames(that.currentAccessory));
	//console.log(Object.getOwnPropertyNames(that.HubData.allDevices));
	// console.log(JSON.stringify(that.HubData.allDevices));
	// console.log(Object.getOwnPropertyNames(that));
	// console.log(JSON.stringify(that.platformConfig.temperatureUnits));
	// Get the complete Hubitat data for this device from the stored array.
	
	//The complete set of data for the current device being set up.
	// var fullDeviceData	= that.HubData.allDevices.find( function(currentElement) { return (currentElement.id == that.currentAccessory.id)})
	
	// that.log(JSON.stringify(fullDeviceData));	
	
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
		
	if (that.currentAccessory.capabilities.includes("Thermostat")) {
		var ThermostatService = new Service.Thermostat();
		
		// if F: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(1);
		// if C: ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(0);
		
		var CurrentState = ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.setInitialValue(CurrentStateOnSetMap.get(that.currentAccessory.attributes.thermostatOperatingState))
			.updateOnHubEvents(that.currentAccessory.id, "thermostatOperatingState")
			.on('HubValueChanged', (HubReport, HomeKitObject) =>  { 
				var currentOperatingState = CurrentStateOnSetMap.get(HubReport.value)
				// May want to add checking for null operating states. 
				CurrentState.updateValue(currentOperatingState);
			});	

		var TargetState = ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatMode")
			.setInitialValue(TargetStateReportMap.get(that.currentAccessory.attributes.thermostatMode))
			.on('set', (newHomekitValue, callback) => {
				that.HubData.send(that.currentAccessory.id, TargetStateOnSetMap.get(newHomekitValue));
				callback(null);
			})
			.on('HubValueChanged', (HubReport, HomeKitObject) => { 
				TargetState.updateValue(TargetStateReportMap.get(HubReport.value));
			});	
		
		var initialRoomTemp = (that.platformConfig.temperatureUnits.includes("F")) 
				? Math.round((that.currentAccessory.attributes.temperature -32)/1.8)
				: that.currentAccessory.attributes.temperature

		var CurrentTemperature 	= ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)
				
		initialRoomTemp =  Math.min(Math.max(initialRoomTemp, CurrentTemperature.props.minValue), CurrentTemperature.props.maxValue )		
		
		CurrentTemperature
			.setInitialValue(initialRoomTemp)
			.updateOnHubEvents(that.currentAccessory.id, "temperature")
			.on('HubValueChanged', (HubReport, HomeKitObject) => { 
				// HomeKit internally uses Celsius, so convert Fahrenheit To Celsius
				var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
					? updateTemp = (HubReport.value - 32) / 1.8
					: HubReport.value

				updateTemp =  Math.min(Math.max(updateTemp, CurrentTemperature.props.minValue), CurrentTemperature.props.maxValue )		

				CurrentTemperature.updateValue(updateTemp);
			});	

		var initialTargetTemp = (that.platformConfig.temperatureUnits.includes("F"))
				? Math.round((that.currentAccessory.attributes.thermostatSetpoint -32)/1.8)
				: that.currentAccessory.attributes.thermostatSetpoint
				
		 var TargetTemperature 	= ThermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.setInitialValue(initialTargetTemp)
			.updateOnHubEvents(that.currentAccessory.id, "thermostatSetpoint", "coolingSetpoint", "heatingSetpoint")
			.on('set', (newHomekitValue, callback) => {
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? Math.round((newHomekitValue * 1.8) + 32)
							: newHomekitValue
							
					updateTemp =  Math.min(Math.max(updateTemp, TargetTemperature.props.minValue), TargetTemperature.props.maxValue )		
						
						setTimeout( () => {
							if (TargetState.value == 2) { // 2 = homekit cool
								that.HubData.send(that.currentAccessory.id, "setCoolingSetpoint", updateTemp );
							} else if (TargetState.value == 1) { // 1 = homekit heat
								that.HubData.send(that.currentAccessory.id, "setHeatingSetpoint", updateTemp );
							}						
						}, 50);
						
						callback(null);
				})
			.on('HubValueChanged', (HubReport, HomeKitObject) => { 
					if(		((HubReport.name == "coolingSetpoint") && (TargetState.value == 2))  
						|| 	((HubReport.name == "heatingSetpoint") && (TargetState.value == 1)) 
						||	((HubReport.name == "thermostatSetpoint")) ) 
						{
							var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
									? (HubReport.value - 32) / 1.8
									: HubReport.value	
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
			.on('set', (newHomekitValue, callback) => {
					// Next line proposed by D. Covi to address mode-dependent use of attributes. Added version 1.0.1
					// Further review needed in light of https://community.hubitat.com/t/thermostat-capability-and-attributes/54960/7
					// if(TargetState.value !== 3) return callback(null);
					
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? Math.round((newHomekitValue * 1.8) + 32)
							: newHomekitValue	

					that.HubData.send(that.currentAccessory.id, "setHeatingSetpoint", updateTemp );
					callback(null);
				})			
			.on('HubValueChanged', (HubReport, HomeKitObject) => { 
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? (HubReport.value - 32) / 1.8
							: HubReport.value	
					HeatingSetpoint.updateValue(updateTemp);
				});	
				
		var initialCoolSetpoint = (that.platformConfig.temperatureUnits.includes("F"))
				? ((that.currentAccessory.attributes.coolingSetpoint -32)/1.8)
				: that.currentAccessory.attributes.coolingSetpoint		
				
		var CoolingSetpoint 	= ThermostatService.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.setInitialValue(initialCoolSetpoint)
			.updateOnHubEvents(that.currentAccessory.id, "coolingSetpoint")
			.on('set', (newHomekitValue, callback) => {
					// Next line proposed by D. Covi to address mode-dependent use of attributes. Added version 1.0.1
					// Further review needed in light of https://community.hubitat.com/t/thermostat-capability-and-attributes/54960/7
					// if(TargetState.value !== 3) return callback(null);
					
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? Math.round((newHomekitValue * 1.8) + 32)
							: newHomekitValue	

					that.HubData.send(that.currentAccessory.id, "setCoolingSetpoint", updateTemp );
					callback(null);
				})
			.on('HubValueChanged', (HubReport, HomeKitObject) => { 
					var updateTemp = (that.platformConfig.temperatureUnits.includes("F"))
							? (HubReport.value - 32) / 1.8
							: HubReport.value				
					CoolingSetpoint.updateValue(updateTemp);
				});	
				
		if (that.currentAccessory.attributes.humidity !== null) {	
			var CurrentRH 	= ThermostatService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateOnHubEvents(that.currentAccessory.id, "humidity")
				.on('HubValueChanged', (HubReport, HomeKitObject) => {
						CurrentRH.updateValue(parseInt(HubReport.value));
					});
		}
		
		services.push(ThermostatService);
		return;	
	}
}
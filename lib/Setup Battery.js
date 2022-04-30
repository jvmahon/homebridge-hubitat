'use strict'
var exports = module.exports;

exports.setupBattery = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	
	// Is this is not a batterySome device with a battery may also be USB charged, in which case, the battery attribute is set to null, so don't add the battery device!.
	if (that.currentAccessory.capabilities.includes("Battery") 
		&& ( that.currentAccessory.attributes.battery !== null))		
	{
		
		var thisBatteryService = new Service.BatteryService();
		
		var BatteryLevel =  thisBatteryService.getCharacteristic(Characteristic.BatteryLevel)
			.updateOnHubEvents(that.currentAccessory.id, "battery")
			.setInitialValue(that.currentAccessory.attributes.battery)
			.on('HubValueChanged', function(HubReport, HomeKitObject) { 
				BatteryLevel.updateValue(HubReport.value);
			});	
		let lowBatteryThreshold = that.platformConfig.lowBatteryThreshold ?? 35
		
		var BatteryThreshold =	thisBatteryService.getCharacteristic(Characteristic.StatusLowBattery)
			.updateOnHubEvents(that.currentAccessory.id, "battery")
			.setInitialValue((that.currentAccessory.attributes.battery < lowBatteryThreshold) ? 1 : 0)
			.on('HubValueChanged', (HubReport, homekitObject) => { 
					BatteryThreshold.updateValue((HubReport.value < lowBatteryThreshold) ? 1 : 0)
				});	
				
		var ChargingState = thisBatteryService.getCharacteristic(Characteristic.ChargingState).setInitialValue(2);
			
		services.push(thisBatteryService);				
	}	
}

'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

exports.setupSensor = function (that, services)
{
	
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;

	that.log(green(`Sensor setup that object is ${Object.getOwnPropertyNames(that)}`))
	that.log(green(`Sensor setup that.HubData object is ${Object.getOwnPropertyNames(that.HubData)}`))
	that.log(green(`Sensor setup that.currentAccessory object is ${Object.getOwnPropertyNames(that.currentAccessory)}`))
	
	for (var thisCapability of that.currentAccessory.capabilities)
	{
	that.log(green(`Processing Capability ${thisCapability}`))
	
		switch(thisCapability)
		{
			case "TemperatureMeasurement":
			{
				that.log(yellow(`Setting up a Temperature sensor`));
				
				var thisSensorService = new Service.TemperatureSensor();
			
				var TemperatureSensor = thisSensorService.getCharacteristic(Characteristic.CurrentTemperature);
				TemperatureSensor.setProps({ minValue: -25, maxValue: 100 });
				
				that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, TemperatureSensor, "temperature")
				
				TemperatureSensor	
					.on('HubValueChanged', function(HubReport, HomeKitObject)
					{ 
						var updateTemp = (HubReport.unit == "°F") ? ((HubReport.value - 32) * (5/9)) : HubReport.value

						TemperatureSensor.updateValue(updateTemp);
					})	
					
				services.push(thisSensorService)				
				break;
			}
			case "Battery":
			{
				that.log(yellow(`Setting up a Battery`));
				var thisSensorService = new Service.BatteryService();
				
				var BatteryLevel =  thisSensorService.getCharacteristic(Characteristic.BatteryLevel)
				that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, BatteryLevel, "battery")

				BatteryLevel
					.on('HubValueChanged', function(HubReport, HomeKitObject)
					{ 
						BatteryLevel.updateValue(HubReport.value);
					});						
				
				BatteryLevel.updateValue(that.currentAccessory.value == null ? 100 : that.currentAccessory.value);
				
				services.push(thisSensorService);				
				break;
			}
			case "WaterSensor":
			{
				that.log(yellow(`Setting up a water sensor`));
				
				var thisSensorService = new Service.LeakSensor();
			
				var LeakDetected = thisSensorService.getCharacteristic(Characteristic.LeakDetected);
				that.HubData.registerObjectToReceiveUpdates(that.currentAccessory.id, LeakDetected, "water")
				
				thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
				
				LeakDetected	
					.on('HubValueChanged', function(HubReport, HomeKitObject)
					{ 
						if(HubReport.water == "dry") 
							{ LeakDetected.updateValue(false); }
						else
							{ LeakDetected.updateValue(true); }
					})	
				
				services.push(thisSensorService)				
				break;
			}
			case "AccelerationSensor":
			{
				that.log(yellow(`Setting up a AccelerationSensor.`));

				break;
			}
			case "CarbonDioxideMeasurement":
			{
				that.log(yellow(`Setting up a CarbonDioxideMeasurement sensor.`));
				break;
			}
			case "CarbonMonoxideDetector":
			{
				that.log(yellow(`Setting up a CarbonMonoxideDetector.`));
				break;
			}
			case "ContactSensor":
			{
				that.log(yellow(`Setting up a ContactSensor`));
				break;
			}
			default:
			{
				break;
			}
		}
	}
	
	
}
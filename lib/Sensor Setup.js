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
	
	if (that.currentAccessory.capabilities.includes("Battery"))
	{
		that.log(yellow(`Setting up a Battery`));
		var thisSensorService = new Service.BatteryService();
		
		var thisCharacteristic =  thisSensorService.getCharacteristic(Characteristic.BatteryLevel)
			.updateOnHubEvents(that.currentAccessory.id, "battery")
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				thisCharacteristic.updateValue(HubReport.value);
			});						
		
		thisCharacteristic.updateValue(that.currentAccessory.value == null ? 100 : that.currentAccessory.value);
		
		services.push(thisSensorService);				
	}	
	/*
	if (that.currentAccessory.capabilities.includes("CarbonDioxideMeasurement"))
	{
		var thisSensorService = new Service.CarbonDioxideSensor();
		that.log(yellow(`Setting up a CarbonDioxideMeasurement sensor.`));
		
		var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.updateOnHubEvents(that.currentAccessory.id, "carbonDioxide")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						thisCharacteristic.updateValue(HubReport.value);
					})
		services.push(thisSensorService)				
					
	}
*/

	// Tested and Works!
	if (that.currentAccessory.capabilities.includes("CarbonMonoxideDetector"))
	{
			var thisSensorService = new Service.CarbonMonoxideSensor();
			that.log(yellow(`Setting up a CarbonMonoxideDetector.`));
			
			var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
				.updateOnHubEvents(that.currentAccessory.id, "carbonMonoxide")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						that.log(red(`HubReport value is ${HubReport.value}.`));
						if(HubReport.value == "clear") 
							{ thisCharacteristic.updateValue(false); }
						else
							{ thisCharacteristic.updateValue(true); }						
					})					
		services.push(thisSensorService)				
	}

	
	// Contact Sensor Tested and Working
	if (that.currentAccessory.capabilities.includes("ContactSensor"))
	{
			var thisSensorService = new Service.ContactSensor();
			that.log(yellow(`Setting up a ContactSensor`));
			var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.ContactSensorState)
				.updateOnHubEvents(that.currentAccessory.id, "contact")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						that.log(red(`HubReport value is ${HubReport.value}.`));
						if(HubReport.value == "closed") 
							{ thisCharacteristic.updateValue(false); }
						else
							{ thisCharacteristic.updateValue(true); }
					})					
		services.push(thisSensorService)				
	}


	
	// Tested and Works
	if (that.currentAccessory.capabilities.includes("IlluminanceMeasurement"))
	{
			var thisSensorService = new Service.LightSensor();
			
			var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
				.updateOnHubEvents(that.currentAccessory.id, "illuminance")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						thisCharacteristic.updateValue(parseFloat(HubReport.value));
					})
		services.push(thisSensorService)				
	}	

	// Motion Sensor tested and working!
	if (that.currentAccessory.capabilities.includes("MotionSensor"))
	{
			var thisSensorService = new Service.MotionSensor();
					that.log(yellow(`Setting up a MotionSensor`));

			var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.MotionDetected)
				.updateOnHubEvents(that.currentAccessory.id, "motion")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						if(HubReport.value == "inactive") 
							{ thisCharacteristic.updateValue(false); }
						else
							{ thisCharacteristic.updateValue(true); }						
					})
		services.push(thisSensorService)				
	}	

	// Tested and Works
	if (that.currentAccessory.capabilities.includes("PresenceSensor"))
	{
			var thisSensorService = new Service.OccupancySensor();
			
			var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.OccupancyDetected)
				.updateOnHubEvents(that.currentAccessory.id, "presence")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						if(HubReport.value == "not present") 
							{ thisCharacteristic.updateValue(false); }
						else
							{ thisCharacteristic.updateValue(true); }
					})
		services.push(thisSensorService)				
	}	


	// Tested and works
	if (that.currentAccessory.capabilities.includes("RelativeHumidityMeasurement"))
	{
			var thisSensorService = new Service.HumiditySensor();
			that.log(yellow(`Setting up a HumiditySensor`));
			
			var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
				.updateOnHubEvents(that.currentAccessory.id, "humidity")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						thisCharacteristic.updateValue(parseInt(HubReport.value));
					})		
		services.push(thisSensorService)				
	}	

	// Tested and works
	if (that.currentAccessory.capabilities.includes("SmokeDetector"))
	{
			var thisSensorService = new Service.SmokeSensor();
			
			var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.SmokeDetected)
				.updateOnHubEvents(that.currentAccessory.id, "smoke")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						if(HubReport.value == "clear") 
							{ thisCharacteristic.updateValue(false); }
						else
							{ thisCharacteristic.updateValue(true); }						
					})
		services.push(thisSensorService)				
	}	

	
	// Temperature Measurement Tested and Working
	if (that.currentAccessory.capabilities.includes("TemperatureMeasurement"))
	{
		that.log(yellow(`Setting up a Temperature sensor`));
		
		var thisSensorService = new Service.TemperatureSensor();
	
		var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({ minValue: -25, maxValue: 100 })
			.updateOnHubEvents(that.currentAccessory.id, "temperature")	
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				var updateTemp = (HubReport.unit == "°F") ? ((HubReport.value - 32) * (5/9)) : HubReport.value

				thisCharacteristic.updateValue(updateTemp);
			})	
			
		services.push(thisSensorService)				
	}
	
	
	// Water Sensor - Tested and Working
	if (that.currentAccessory.capabilities.includes("WaterSensor"))
	{
		that.log(yellow(`Setting up a water sensor`));
		
		var thisSensorService = new Service.LeakSensor();
	
		var thisCharacteristic = thisSensorService.getCharacteristic(Characteristic.LeakDetected)
			.updateOnHubEvents(that.currentAccessory.id, "water")	
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 

				if(HubReport.value == "dry") 
					{ thisCharacteristic.updateValue(false); }
				else
					{ thisCharacteristic.updateValue(true); }
			})	
			
		thisSensorService.getCharacteristic(Characteristic.StatusFault).updateValue(false)
		
		services.push(thisSensorService)				
	}	

	/* Maybe add a Tamper Alert to each!
	
	if (that.currentAccessory.capabilities.includes("TamperAlert"))
	{

			thisSensorService.getCharacteristic(Characteristic.StatusTampered)
				.updateOnHubEvents(that.currentAccessory.id, "tamper")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
					})
	}
	*/

	
}
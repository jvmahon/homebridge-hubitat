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
	//The complete set of data for the current device being set up.
	var fullDeviceData	= that.HubData.allDevices.find( function(currentElement) { return (currentElement.id == that.currentAccessory.id)})
	

	/*
	if (that.currentAccessory.capabilities.includes("CarbonDioxideMeasurement"))
	{
		var thisSensorService = new Service.CarbonDioxideSensor();
		that.log(yellow(`Setting up a CarbonDioxideMeasurement sensor.`));
		
		var CarbonDioxideDetected = thisSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected)
				.updateOnHubEvents(that.currentAccessory.id, "carbonDioxide")
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{
						CarbonDioxideDetected.updateValue(HubReport.value);
					})
		services.push(thisSensorService)				
					
	}
*/

	// Tested and Works!
	if (that.currentAccessory.capabilities.includes("CarbonMonoxideDetector"))
	{
		that.log(yellow(`Setting up a CarbonMonoxideDetector.`));

		var thisSensorService = new Service.CarbonMonoxideSensor();
		
		var CarbonMonoxideDetected = thisSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
			.updateOnHubEvents(that.currentAccessory.id, "carbonMonoxide")
			.setInitialValue((that.currentAccessory.attributes.carbonMonoxide == "clear" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CarbonMonoxideDetected.updateValue((HubReport.value == "clear") ? 0 : 1);
				});	
				
		services.push(thisSensorService)				
	}

	// Contact Sensor Tested and Working
	if (that.currentAccessory.capabilities.includes("ContactSensor"))
	{
		that.log(yellow(`Setting up a ContactSensor`));
		
		var thisSensorService = new Service.ContactSensor();
		
		var ContactSensorState = thisSensorService.getCharacteristic(Characteristic.ContactSensorState)
			.updateOnHubEvents(that.currentAccessory.id, "contact")
			.setInitialValue((that.currentAccessory.attributes.contact == "closed" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					ContactSensorState.updateValue((HubReport.value == "closed") ? 0 : 1);
				});	
				
		services.push(thisSensorService)				
	}


	
	// Tested and Works
	if (that.currentAccessory.capabilities.includes("IlluminanceMeasurement"))
	{
		that.log(yellow(`Setting up a Light Sensor`));

		var thisSensorService = new Service.LightSensor();

		var CurrentAmbientLightLevel = thisSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			.updateOnHubEvents(that.currentAccessory.id, "illuminance")
			.setInitialValue(parseInt(that.currentAccessory.attributes.illuminance))
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CurrentAmbientLightLevel.updateValue(parseFloat(HubReport.value));
				});
				
		services.push(thisSensorService)				
	}	

	// Motion Sensor tested and working!
	if (that.currentAccessory.capabilities.includes("MotionSensor"))
	{
		that.log(yellow(`Setting up a Motion Sensor`));

		var thisSensorService = new Service.MotionSensor();

		var MotionDetected = thisSensorService.getCharacteristic(Characteristic.MotionDetected)
			.updateOnHubEvents(that.currentAccessory.id, "motion")
			.setInitialValue((that.currentAccessory.attributes.motion == "inactive" ) ? false : true)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					MotionDetected.updateValue((HubReport.value == "inactive") ? false : true);
				});
				
		services.push(thisSensorService)				
	}	

	// Tested and Works
	if (that.currentAccessory.capabilities.includes("PresenceSensor"))
	{
		that.log(yellow(`Setting up a Presence Sensor`));
		
		var thisSensorService = new Service.OccupancySensor();
			
		var OccupancyDetected = thisSensorService.getCharacteristic(Characteristic.OccupancyDetected)
			.updateOnHubEvents(that.currentAccessory.id, "presence")
			.setInitialValue((that.currentAccessory.attributes.presence == "not present" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					OccupancyDetected.updateValue((HubReport.value == "not present") ? 0 : 1);
				});
				
		services.push(thisSensorService)				
	}	


	// Tested and works
	if (that.currentAccessory.capabilities.includes("RelativeHumidityMeasurement"))
	{
		that.log(yellow(`Setting up a Humidity Sensor`));

		var thisSensorService = new Service.HumiditySensor();

		var CurrentRelativeHumidity = thisSensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.updateOnHubEvents(that.currentAccessory.id, "humidity")
			.setInitialValue(parseInt(that.currentAccessory.attributes.humidity))
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CurrentRelativeHumidity.updateValue(parseInt(HubReport.value));
				});	
				
		services.push(thisSensorService)				
	}	

	// Tested and works
	if (that.currentAccessory.capabilities.includes("SmokeDetector"))
	{
		that.log(yellow(`Setting up a Smoke Sensor`));
		
		var thisSensorService = new Service.SmokeSensor();
		
		var SmokeDetected = thisSensorService.getCharacteristic(Characteristic.SmokeDetected)
			.updateOnHubEvents(that.currentAccessory.id, "smoke")
			.setInitialValue((that.currentAccessory.attributes.smoke == "clear" ) ? 0 : 1)	
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					SmokeDetected.updateValue((HubReport.value == "clear") ? 0 : 1)
				});

		services.push(thisSensorService)				
	}	

	
	// Temperature Measurement Tested and Working
	if (that.currentAccessory.capabilities.includes("TemperatureMeasurement"))
	{
		that.log(yellow(`Setting up a Temperature sensor`));
		
		let initialTemp = that.platformConfig.temperatureUnits.includes("F")
			? ((that.currentAccessory.attributes.temperature - 32) / 1.8)
			: (that.currentAccessory.attributes.temperature)
		
		var thisSensorService = new Service.TemperatureSensor();

		var CurrentTemperature = thisSensorService.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({ minValue: -25, maxValue: 100 })
			.setInitialValue(initialTemp)
			.updateOnHubEvents(that.currentAccessory.id, "temperature")	
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				// that.log(yellow(`Debug - Temperature Sensor Report Received ${HubReport.value}.`));

				var updateTemp = (that.platformConfig.temperatureUnits.includes("F") 
					? ((HubReport.value - 32) * (5/9)) 
					: HubReport.value)

				CurrentTemperature.updateValue(updateTemp);
			});	

		services.push(thisSensorService)				
	}
	
	
	// Water Sensor - Tested and Working
	if (that.currentAccessory.capabilities.includes("WaterSensor"))
	{
		that.log(yellow(`Setting up a water sensor`));
		
		var thisSensorService = new Service.LeakSensor();
	
		var LeakDetected = thisSensorService.getCharacteristic(Characteristic.LeakDetected)
			.updateOnHubEvents(that.currentAccessory.id, "water")	
			.setInitialValue((that.currentAccessory.attributes.water == "dry" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				LeakDetected.updateValue((HubReport.value == "dry" ) ? 0 : 1)
			});

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
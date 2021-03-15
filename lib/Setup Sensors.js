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
	
	var thisSensorService = undefined
	
	if (that.currentAccessory.capabilities.includes("airQuality"))
	{
		thisSensorService = new Service.AirQuality();
		
		function mapAirQuality(value)
		{
			if (value > 200 ) 		{ return 5 } // Poor
			else if (value > 150) 	{ return 4 } // Inferior
			else if (value > 100) 	{ return 3 } // Fair
			else if (value > 50) 	{ return 2 } // Good
			else if (value > 0) 	{ return 1 } // Excellent
			else 					{ return 0 } // Unknown
		}
		
		var air = thisSensorService.getCharacteristic(Characteristic.AirQuality)
			.updateOnHubEvents(that.currentAccessory.id, "airQualityIndex")
			.setInitialValue(mapAirQuality(parseInt(that.currentAccessory.attributes.airQualityIndex)))
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					air.updateValue(mapAirQuality(HubReport.value))
				})
		
	}

	if (that.currentAccessory.capabilities.includes("CarbonDioxideDetector"))
	{
		thisSensorService = new Service.CarbonDioxideSensor();
		
		var CarbonDioxideDetected = thisSensorService.getCharacteristic(Characteristic.CarbonDioxideDetected)
			.updateOnHubEvents(that.currentAccessory.id, "carbonDioxide")
			.setInitialValue((that.currentAccessory.attributes.carbonDioxide == "clear" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CarbonDioxideDetected.updateValue((HubReport.value == "clear") ? 0 : 1);
				})
		
	}


	// Tested and Works!
	if (that.currentAccessory.capabilities.includes("CarbonMonoxideDetector"))
	{
		that.log(yellow(`Setting up a CarbonMonoxideDetector.`));

		thisSensorService = new Service.CarbonMonoxideSensor();
		
		var CarbonMonoxideDetected = thisSensorService.getCharacteristic(Characteristic.CarbonMonoxideDetected)
			.updateOnHubEvents(that.currentAccessory.id, "carbonMonoxide")
			.setInitialValue((that.currentAccessory.attributes.carbonMonoxide == "clear" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CarbonMonoxideDetected.updateValue((HubReport.value == "clear") ? 0 : 1);
				});	
		
	}

	// Contact Sensor Tested and Working
	if (that.currentAccessory.capabilities.includes("ContactSensor"))
	{
		that.log(yellow(`Setting up a ContactSensor`));
		
		thisSensorService = new Service.ContactSensor();
		
		var ContactSensorState = thisSensorService.getCharacteristic(Characteristic.ContactSensorState)
			.updateOnHubEvents(that.currentAccessory.id, "contact")
			.setInitialValue((that.currentAccessory.attributes.contact == "closed" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					ContactSensorState.updateValue((HubReport.value == "closed") ? 0 : 1);
				});	
		
	}


	
	// Tested and Works
	if (that.currentAccessory.capabilities.includes("IlluminanceMeasurement"))
	{
		that.log(yellow(`Setting up a Light Sensor`));

		thisSensorService = new Service.LightSensor();

		var CurrentAmbientLightLevel = thisSensorService.getCharacteristic(Characteristic.CurrentAmbientLightLevel)
			.updateOnHubEvents(that.currentAccessory.id, "illuminance")
			.setInitialValue(parseInt(that.currentAccessory.attributes.illuminance))
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					var newLightLevel =  Math.min(Math.max(parseFloat(HubReport.value), CurrentAmbientLightLevel.props.minValue), CurrentAmbientLightLevel.props.maxValue )		

					CurrentAmbientLightLevel.updateValue(newLightLevel);
				});
	
	}	

	// Motion Sensor tested and working!
	if (that.currentAccessory.capabilities.includes("MotionSensor"))
	{
		that.log(yellow(`Setting up a Motion Sensor`));

		thisSensorService = new Service.MotionSensor();

		var MotionDetected = thisSensorService.getCharacteristic(Characteristic.MotionDetected)
			.updateOnHubEvents(that.currentAccessory.id, "motion")
			.setInitialValue((that.currentAccessory.attributes.motion == "inactive" ) ? false : true)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					MotionDetected.updateValue((HubReport.value == "inactive") ? false : true);
				});
				
	}	

	// Tested and Works
	if (that.currentAccessory.capabilities.includes("PresenceSensor"))
	{
		that.log(yellow(`Setting up a Presence Sensor`));
		
		thisSensorService = new Service.OccupancySensor();
			
		var OccupancyDetected = thisSensorService.getCharacteristic(Characteristic.OccupancyDetected)
			.updateOnHubEvents(that.currentAccessory.id, "presence")
			.setInitialValue((that.currentAccessory.attributes.presence == "not present" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					OccupancyDetected.updateValue((HubReport.value == "not present") ? 0 : 1);
				});
				
	}	


	// Tested and works
	if (that.currentAccessory.capabilities.includes("RelativeHumidityMeasurement"))
	{
		that.log(yellow(`Setting up a Humidity Sensor`));

		thisSensorService = new Service.HumiditySensor();

		var CurrentRelativeHumidity = thisSensorService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.updateOnHubEvents(that.currentAccessory.id, "humidity")
			.setInitialValue(parseInt(that.currentAccessory.attributes.humidity))
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					CurrentRelativeHumidity.updateValue(parseInt(HubReport.value));
				});	
			
	}	

	// Tested and works
	if (that.currentAccessory.capabilities.includes("SmokeDetector"))
	{
		that.log(yellow(`Setting up a Smoke Sensor`));
		
		thisSensorService = new Service.SmokeSensor();
		
		var SmokeDetected = thisSensorService.getCharacteristic(Characteristic.SmokeDetected)
			.updateOnHubEvents(that.currentAccessory.id, "smoke")
			.setInitialValue((that.currentAccessory.attributes.smoke == "clear" ) ? 0 : 1)	
			.on('HubValueChanged', function(HubReport, HomeKitObject)
				{
					SmokeDetected.updateValue((HubReport.value == "clear") ? 0 : 1)
				});

	}	

	
	// Temperature Measurement Tested and Working
	if (that.currentAccessory.capabilities.includes("TemperatureMeasurement"))
	{
		that.log(yellow(`Setting up a Temperature sensor`));
		
		let initialTemp = that.platformConfig.temperatureUnits.includes("F")
			? ((that.currentAccessory.attributes.temperature - 32) / 1.8)
			: (that.currentAccessory.attributes.temperature)
		
		thisSensorService = new Service.TemperatureSensor();

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
	}
	
	
	// Water Sensor - Tested and Working
	if (that.currentAccessory.capabilities.includes("WaterSensor"))
	{
		that.log(yellow(`Setting up a water sensor`));
		
		thisSensorService = new Service.LeakSensor();
	
		var LeakDetected = thisSensorService.getCharacteristic(Characteristic.LeakDetected)
			.updateOnHubEvents(that.currentAccessory.id, "water")	
			.setInitialValue((that.currentAccessory.attributes.water == "dry" ) ? 0 : 1)
			.on('HubValueChanged', function(HubReport, HomeKitObject)
			{ 
				LeakDetected.updateValue((HubReport.value == "dry" ) ? 0 : 1)
			});
	}	


	if (thisSensorService) // If a sensor was defined, add tamper detection. Many sensors use acceleration instead of the TamperAlert capability.
	{
		if (that.currentAccessory.capabilities.includes("TamperAlert"))
			{

				thisSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateOnHubEvents(that.currentAccessory.id, "tamper")
					.setInitialValue((that.currentAccessory.attributes.tamper == "clear" ) ? 0 : 1)
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							HomeKitObject.updateValue((HubReport.value == "clear" ) ? 0 : 1)
						})
			}
		else if (that.currentAccessory.capabilities.includes("AccelerationSensor"))
			{

				thisSensorService.getCharacteristic(Characteristic.StatusTampered)
					.updateOnHubEvents(that.currentAccessory.id, "acceleration")
					.setInitialValue((that.currentAccessory.attributes.tamper == "inactive" ) ? 0 : 1)
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{
							HomeKitObject.updateValue((HubReport.value == "inactive" ) ? 0 : 1)
						})
			}		
	}

		
	if (thisSensorService)	services.push(thisSensorService)	

}
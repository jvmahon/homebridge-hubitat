'use strict'
var exports = module.exports;

exports.setupHomeSafetyMonitor = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	
	var informationService = new Service.AccessoryInformation();
	informationService
	.setCharacteristic(Characteristic.Manufacturer, "Hubitat")
	.setCharacteristic(Characteristic.Model, "HSM Intrusion Monitor")
	.setCharacteristic(Characteristic.SerialNumber, "Hubitat HSM 0");

	services.push(informationService);	
		
	// if (that.currentAccessory.capabilities.includes("PushableButton"))
	if (true)
	{

		var HSMSecuritySystem = new Service.SecuritySystem()
		
		var currentState = HSMSecuritySystem.getCharacteristic(Characteristic.CurrentState)
		var targetState = HSMSecuritySystem.getCharacteristic(Characteristic.TargetState)	
		
		HSMSecuritySystem			
			.updateOnHubEvents(0, "hsmSetArm", "hsmStatus", "hsmRules", "hsmAlert") // HSM reports as device ID # 0
			.on('HubValueChanged', function(HubReport, HomeKitObject)
					{ 
						that.log(`In security system function, received report named: ${HubReport.name} and value: ${HubReport.value}`)
						if (HubReport.name == "hsmAlert")
						{
							switch (HubReport.value)
							{
								case "intrusion":
								case "intrusion-home":
								case "intrusion-night":
								case "smoke":
								case "water":
										{ 
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(4); // 4 = HomeKit Alarm Triggered
											break; 
										} 
								case "rule":
								case "cancel":
								case "arming":
										{ 
											that.log("Code for rule, cancel, arming is incomplete")
											break; 
										} 
							}
							
						}
						if (HubReport.name == "hsmSetArm")
						{
							that.log(`report is hsmSetArm: ${HubReport}`)
							
						}
						
						if (HubReport.name == "hsmStatus")
							{
								switch (HubReport.value)
								{
									case "allArmed":
									case "armedAway":
										{ 	
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(1); 
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(1); 
											break; 
										} // 1 = HomeKit Away Arm
									case "armingAway":
										{ 	
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(1); 
											break; 
										} // 1 = HomeKit Arming Away
									case "armedHome":
										{ 	
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(0); 
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(0); 
											break; 
										} // 1 = HomeKit Armed Home
									case "armingHome":
										{ 	
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(0); 
											break; 
										} // 1 = HomeKit Armed Home
									case "armedNight":
										{ 	
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(2); 
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(2); 
											break; 
										} // 2 = HomeKit Night Arm
					
									case "armingNight":
										{ 	
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(2); 
											break; 
										} // 2 = HomeKit Night Arm

									case "allDisarmed":
									case "disarmed":
										{
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(3);
											HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(3);
											break
										}
								}
							}
						if (HubReport.name == "hsmRules")
							{
								switch (HubReport.value)
								{
									case "armedRule":
									case "disarmedRule":
										{
											break
										}
								}
							}
					}	
				)
		services.push(HSMSecuritySystem);		
	}	
}
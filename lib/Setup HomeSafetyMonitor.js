'use strict'
var exports = module.exports;

exports.setupHomeSafetyMonitor = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	
	that.log(`Setting up HSM of type: ${that.currentHSMType}`)

	that.uuid_base = that.currentHSMType
			
	var informationService = new Service.AccessoryInformation();
	informationService
	.setCharacteristic(Characteristic.Manufacturer, "Hubitat")
	.setCharacteristic(Characteristic.Model, that.currentHSMType)
	.setCharacteristic(Characteristic.SerialNumber, "Hubitat HSM 0");

	services.push(informationService);	
		
	var thisSecuritySystem
	
	switch (that.currentHSMType)
	{
		case "Intrusion": 
		{
			thisSecuritySystem = new Service.SecuritySystem(that.currentHSMType)
			
			thisSecuritySystem			
				.updateOnHubEvents(0, "hsmSetArm", "hsmStatus", "hsmRules", "hsmAlert") // HSM reports as device ID # 0
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{ 
						that.log(`In security system function, received report named: ${HubReport.name} and value: ${HubReport.value}`)
						var intrusionStateMap = new Map([ 
										["cancel", 3],
										["intrusion",4], ["intrusion-home", 4], ["intrusion-night", 4],
										]);
						if (HubReport.name == "hsmAlert")
						{
							if (intrusionStateMap.get(HubReport.value) !== undefined ) {
								HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(intrusionStateMap.get(HubReport.value));
							}

						}
						
						if (HubReport.name == "hsmStatus")
							{
								var targetStateMap = new Map([ 
										["armedHome", 0], ["armingHome", 0], 
										["allArmed",1], ["armedAway", 1], ["armingAway", 1],
										["armedNight", 2], ["armingNight", 2],
										["allDisarmed", 3], ["disarmed", 3]
										]);
										
								var currentStateMap = new Map([ 
										["armedHome", 0],
										["allArmed",1], ["armedAway", 1],
										["armedNight", 2],
										["allDisarmed", 3], ["disarmed", 3]
										]);
										
								if (currentStateMap.get(HubReport.value) !== undefined ) HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(currentStateMap.get(HubReport.value)); 
								
								if (targetStateMap.get(HubReport.value) !== undefined ) HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(targetStateMap.get(HubReport.value)); 									
							}
					}
				)
				
			thisSecuritySystem.getCharacteristic(Characteristic.SecuritySystemTargetState)
				.on('set', function(newHomekitValue, callback, context)
						{
							var state = new Map([ [0, "armHome"],  [1, "armAway"],  [2, "armNight"], [3, "disarm"] ]);
							that.HubData.HSMsend(state.get(newHomekitValue) )	
							callback(null);
						} );
			break
		}
		case "Water":
		{
			thisSecuritySystem = new Service.SecuritySystem(that.currentHSMType)
			
			var currentState = thisSecuritySystem.getCharacteristic(Characteristic.SecuritySystemCurrentState)
			var targetState = thisSecuritySystem.getCharacteristic(Characteristic.SecuritySystemTargetState)	
			currentState.setProps({validValues:[0, 3, 4]});
			targetState.setProps({validValues:[0, 3]});
			
			thisSecuritySystem			
				.updateOnHubEvents(0, "hsmAlert") // HSM reports as device ID # 0
				.on('HubValueChanged', function(HubReport, HomeKitObject)
					{ 
						if (HubReport.name == "hsmAlert")
						{
							if (waterStateMap.get(HubReport.value) == "cancel" ) {
								HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(3);
								HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(3); 									
								
							}
							if (waterStateMap.get(HubReport.value) == "water" ) {
								HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(4);
							}
						}
						
						if ((HubReport.name == "hsmStatus") && (HubReport.value == "allDisarmed"))
							{
								HomeKitObject.getCharacteristic(Characteristic.SecuritySystemCurrentState).updateValue(3); 
								HomeKitObject.getCharacteristic(Characteristic.SecuritySystemTargetState).updateValue(3); 									
							}
					}
				)
				
			thisSecuritySystem.getCharacteristic(Characteristic.SecuritySystemTargetState)
				.on('set', function(newHomekitValue, callback, context)
						{
							that.log(`water alert set to ${newHomekitValue}`)
							that.HubData.HSMsend("armRule", "Water" )	
							that.HubData.HSMsend("disarmRule", "Water" )
							callback(null);
						} );
			break
		}		
		case "Smoke":
		{
			thisSecuritySystem = new Service.SecuritySystem(that.currentHSMType)
			currentState = thisSecuritySystem.getCharacteristic(Characteristic.SecuritySystemCurrentState)
			targetState = thisSecuritySystem.getCharacteristic(Characteristic.SecuritySystemTargetState)	
			currentState.setProps({validValues:[0, 3, 4]});
			targetState.setProps({validValues:[0, 3]});
			break
		}
	}


	services.push(thisSecuritySystem);	
}

'use strict'
var exports = module.exports;

exports.setupStatelessProgrammableSwitch = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	
	if (! that.platformConfig.createButtonDevices ) return
	if (that.platformConfig.createButtonDevices.toLowerCase() == "never") return

	if ((that.platformConfig.createButtonDevices.toLowerCase() == "always") 
		|| (that.currentAccessory.name.toLowerCase().includes("button") || that.currentAccessory.label.toLowerCase().includes("button")))
	{
		if (that.currentAccessory.capabilities.includes("PushableButton")) {

			var thisServiceLabel = new Service.ServiceLabel()
			
			// 	Need to associate buttons with ServiceLabels (required by HomeKit if there are multiple buttons on a device)	
			thisServiceLabel.getCharacteristic(Characteristic.ServiceLabelNamespace).updateValue(1) // Arabic Numerals
						
			services.push(thisServiceLabel);		

			var statelessSwitch
			var buttonCount = parseInt(that.currentAccessory.attributes.numberOfButtons)
			
			for (var buttonNo = 1; buttonNo <= buttonCount; buttonNo++) {
				statelessSwitch =  new Service.StatelessProgrammableSwitch("ButtonNo", buttonNo)  // there are multiple similar Services on this accessory, so passing the label and button number causes HomeKit to create distincut subtypes.		

				// Set the ServiceLabelIndex to the button number
				statelessSwitch.getCharacteristic(Characteristic.ServiceLabelIndex).setValue(buttonNo)
				
				statelessSwitch
					.updateOnHubEvents(that.currentAccessory.id, "pushed", "held", "doubleTapped" )
					.on('HubValueChanged', (HubReport, HomeKitObject) => { 
							// HubReport.value is the button number. Check if the button number matches the service label index for this button
							// If not, do nothing.
							if (HubReport.value == (HomeKitObject.getCharacteristic(Characteristic.ServiceLabelIndex).value)) {
								switch(HubReport.name) {
									case "pushed": 
										HomeKitObject.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0)
										break;
									case "doubleTapped": 
										HomeKitObject.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(1)
										break;										
									case "held": 
										HomeKitObject.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(2)
										break;
								}
							}
						});	
				services.push(statelessSwitch); // push once for each time through the loop.
			}
		}	
	}
}
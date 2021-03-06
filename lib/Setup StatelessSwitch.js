'use strict'
var exports = module.exports;

exports.setupStatelessProgrammableSwitch = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
		
	if (that.platformConfig.createButtonDevices == "Never") return

	if ((that.platformConfig.createButtonDevices == "Always") 
		|| (that.currentAccessory.name.includes("button") || that.currentAccessory.label.includes("button")))
	{
		if (that.currentAccessory.capabilities.includes("PushableButton"))
		{

			var thisServiceLabel = new Service.ServiceLabel()
				
			thisServiceLabel.getCharacteristic(Characteristic.ServiceLabelNamespace).updateValue(1) // Arabic Numerals
						
			services.push(thisServiceLabel);		

			var statelessSwitch
			var buttonCount = parseInt(that.currentAccessory.attributes.numberOfButtons)
			
			for (var buttonNo = 1; buttonNo <= buttonCount; buttonNo++)
			{
				statelessSwitch =  new Service.StatelessProgrammableSwitch("ButtonNo", buttonNo)		

				statelessSwitch.getCharacteristic(Characteristic.ServiceLabelIndex).setValue(buttonNo)
				
				statelessSwitch
					.updateOnHubEvents(that.currentAccessory.id, "pushed", "held", "doubleTapped" )
					.on('HubValueChanged', function(HubReport, HomeKitObject)
						{ 
							if (HubReport.value == (HomeKitObject.getCharacteristic(Characteristic.ServiceLabelIndex).value))
							{
								switch(HubReport.name)
								{
									case "pushed": 
										{
											HomeKitObject.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(0)
											break
										}
									case "held": 
										{
											HomeKitObject.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(2)
										break
										}
									case "doubleTapped": 
										{
											HomeKitObject.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(1)
											break
										}
								}
							}
						});	
				
				services.push(statelessSwitch);
			}
		}	
	}
}
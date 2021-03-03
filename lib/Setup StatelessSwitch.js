'use strict'
var exports = module.exports;

exports.setupStatelessProgrammableSwitch = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;
	
	if (that.currentAccessory.capabilities.includes("PushableButton")
	{
		
		var thisServiceLabel = new Service.ServiceLabel()
		    .getCharacteristic(Characteristic.ServiceLabelNamespace)
			.updateValue(Characteristic.ServiceLabelNamespace.ARABIC_NUMERALS)
					
		services.push(thisServiceLabel);		
		
		
		var buttonCount = parseInt(that.currentAccessory.capabilities.attributes.numberOfButtons)
		var buttonNo
		for (buttonNo = 1; buttonNo <= buttonCount; buttonNo++)
		{
			var statelessSwitch =  new Service.StatelessProgrammableSwitch()
					// .getCharacteristic(Charateristic.PRogrammableSwitchEvent).setProps([0, 1, 2])
					
				statelessSwitch
				.getCharacteristic(Charateristic.ServiceLabelIndex).setValue(buttonNo)
				.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
					// HomeKitObject.updateValue(HubReport.value);
				});	
				
				services.push(statelessSwitch);
		}
	}	
}
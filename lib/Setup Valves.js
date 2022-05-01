'use strict'
module.exports.setupValves = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;

	// Return if this isn't a valve.
	if (that.currentAccessory.capabilities.includes("Valve")){
		
		var ValveService = new Service.Valve();
		
		var ActiveControl	= ValveService.getCharacteristic(Characteristic.Active)
			.setInitialValue( (that.currentAccessory.attributes.valve == "open" ) ? 1 : 0)
			.on('set', (newHomekitValue, callback) => {
					that.HubData.send(that.currentAccessory.id, (newHomekitValue == true) ? "open": "close" )
					callback(null);
				} );	
				
		var InUse = ValveService.getCharacteristic(Characteristic.InUse)
			.setInitialValue((that.currentAccessory.attributes.valve == "open" ) ? 1 : 0)
			.updateOnHubEvents(that.currentAccessory.id, "valve")		
			.on('HubValueChanged', (HubReport, HomeKitObject) => {
					ActiveControl.updateValue((HubReport.value == "open") ? 1 : 0);
					InUse.updateValue ( (HubReport.value == "open") ? 1 : 0 );
				});

		services.push(ValveService);
		return;	
	}
}
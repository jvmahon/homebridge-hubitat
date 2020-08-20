'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

exports.setupLocksDoorsWindows = function (that, services)
{
	
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;


	if (that.currentAccessory.capabilities.includes("Lock"))
	{
		var lockMgmtService = new Service.LockManagement();
			lockMgmtService.getCharacteristic(Characteristic.LockControlPoint);
			lockMgmtService.getCharacteristic(Characteristic.Version).updateValue("1.0");
			lockMgmtService.addCharacteristic(Characteristic.CurrentDoorState).updateValue(1);
			
		var currentDoorState = lockMgmtService.getCharacteristic(Characteristic.CurrentDoorState)
		
		var lockService = new Service.LockMechanism()
				.updateOnHubEvents(that.currentAccessory.id, "lock") // Handle at Service level since want to update multiple characteristics on a report.
				.on('HubValueChanged', function(HubReport)
					{
						if (HubReport.value == "locked")
						{
						LockCurrentState.updateValue(1); // 1 = locked
						LockTargetState.updateValue(1); // 1 = locked
						} 
						if (HubReport.value.includes("unlocked"))
						{
						LockCurrentState.updateValue(0); // 0 = unlocked; 
						LockTargetState.updateValue(0);  // 0 = unlocked; 
						} 	
						if (HubReport.value.includes("unknown"))
						{
						LockCurrentState.updateValue(3); // 3 = unknown; 
						} 						
					})
				
		var LockCurrentState = lockService.getCharacteristic(Characteristic.LockCurrentState);
		var LockTargetState = lockService.getCharacteristic(Characteristic.LockTargetState)
				.updateOnHubEvents(that.currentAccessory.id, "lock")
				.updateValue(that.currentAccessory.attributes.lock)
				.on('set', function(newHomekitValue, callback, context)
					{
						var newLockValue = (newHomekitValue == "locked") ? "lock" : "unlock";
						
						that.HubData.send(that.currentAccessory.id, newLockValue )	
						callback(null);
					} );
			
		services.push(lockMgmtService);			
		services.push(lockService);
	}
}
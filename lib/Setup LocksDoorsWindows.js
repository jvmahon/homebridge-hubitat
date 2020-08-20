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
			
			
			var lockService = new Service.LockMechanism();
			var LockCurrentState = lockService.getCharacteristic(Characteristic.LockCurrentState);
			var LockTargetState = lockService.getCharacteristic(Characteristic.LockTargetState)
				.updateOnHubEvents(that.currentAccessory.id, "lock")
				.updateValue(that.currentAccessory.attributes.lock)
				.on('HubValueChanged', function(HubReport, HomeKitObject)
				{ 
					// LockTargetState.updateValue(???);
				});	
				
			services.push(lockMgmtService);			
			services.push(lockService);
		}
	
}
'use strict'
var exports = module.exports;

exports.setupLocksDoorsWindows = function (that, services)
{
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;

	if (that.currentAccessory.capabilities.includes("Lock")) {
		var lockMgmtService = new Service.LockManagement();
			lockMgmtService.getCharacteristic(Characteristic.LockControlPoint);
			lockMgmtService.getCharacteristic(Characteristic.Version).setInitialValue("1.0");
			lockMgmtService.addCharacteristic(Characteristic.CurrentDoorState).setInitialValue(1);
			
		var currentDoorState = lockMgmtService.getCharacteristic(Characteristic.CurrentDoorState)
		
		var lockService = new Service.LockMechanism();
		var LockCurrentState = lockService.getCharacteristic(Characteristic.LockCurrentState)
		var LockTargetState =  lockService.getCharacteristic(Characteristic.LockTargetState)
		
		lockService
			.updateOnHubEvents(that.currentAccessory.id, "lock") // Handle at Service level since want to update multiple characteristics on a report.
			.on('HubValueChanged', (HubReport) => {
					if (HubReport.value == "locked") {
						LockCurrentState.updateValue(1); // 1 = locked
						LockTargetState.updateValue(1); // 1 = locked
					} else if (HubReport.value.includes("unlocked")) {
						LockCurrentState.updateValue(0); // 0 = unlocked; 
						LockTargetState.updateValue(0);  // 0 = unlocked; 
					}  else if (HubReport.value.includes("unknown")) {
						LockCurrentState.updateValue(3); // 3 = unknown; 
					} 						
				})
				
		var lockInitialValue
		
		if (that.currentAccessory.attributes.lock == "unlocked" ) {
				lockInitialValue = 0
		} else if (that.currentAccessory.attributes.lock == "locked" ) {
				lockInitialValue = 1
		} else {
				lockInitialValue = 3
		}
			
	
		LockCurrentState
			.setInitialValue(lockInitialValue);
		LockTargetState
			.updateOnHubEvents(that.currentAccessory.id, "lock")
			.setInitialValue((that.currentAccessory.attributes.lock == "locked" ) ? 1 : 0 )
			.on('set', (newHomekitValue, callback) => {
					// 0 = unsecured; 1 = secured
					var newLockValue = (newHomekitValue == 1) ? "lock" : "unlock";
					
					that.HubData.send(that.currentAccessory.id, newLockValue )	
					callback(null);
				} );
			
		services.push(lockMgmtService);			
		services.push(lockService);
	}
	
	if (that.currentAccessory.capabilities.includes("GarageDoorControl")) {
		var garageDoorService = new Service.GarageDoorOpener()
		var CurrentDoorState = garageDoorService.getCharacteristic(Characteristic.CurrentDoorState)
		var TargetDoorState = garageDoorService.getCharacteristic(Characteristic.TargetDoorState)

		garageDoorService
			.updateOnHubEvents(that.currentAccessory.id, "door") // Handle at Service level since want to update multiple characteristics on a report.
			.on('HubValueChanged', (HubReport) => {
					if (HubReport.value == "open") {
						TargetDoorState.updateValue(0);  // 0 = open; 
						CurrentDoorState.updateValue(0); // 0 = open; 
					} else if (HubReport.value == "closed") {
						TargetDoorState.updateValue(1); // 1 = closed
						CurrentDoorState.updateValue(1); // 1 = closed
					}  else if (HubReport.value == "opening") {
						TargetDoorState.updateValue(0); // 0 = open
						CurrentDoorState.updateValue(2); // 2 = opening
					} else if (HubReport.value == "closing") {
						TargetDoorState.updateValue(1);  // 1 = close
						CurrentDoorState.updateValue(3); // 3 = Closing
					} else if (HubReport.value == "unknown") {
						CurrentDoorState.updateValue(4); // 4 = stopped; 
					} 						
				})
				
		var doorStateInitialValue
		var targetStateInitialValue
		
		if (that.currentAccessory.attributes.door == "open" ) {
				doorStateInitialValue = 0
				targetStateInitialValue = 0
		} else if (that.currentAccessory.attributes.door == "closed" ) {
				doorStateInitialValue = 1
				targetStateInitialValue = 1
		} else if (that.currentAccessory.attributes.door == "opening" ) {
				doorStateInitialValue = 2
				targetStateInitialValue = 0
		} else if (that.currentAccessory.attributes.door == "closing" ) {
				doorStateInitialValue = 3
				targetStateInitialValue = 1
		} else {
				doorStateInitialValue = 4
				targetStateInitialValue = 0
		}
				
		CurrentDoorState
			.setInitialValue(doorStateInitialValue);
		TargetDoorState
			.updateOnHubEvents(that.currentAccessory.id, "door")
			.setInitialValue(targetStateInitialValue)
			.on('set', (newHomekitValue, callback) => {
					var newDoorState = (newHomekitValue == 1) ? "close" : "open"; // 0 = open; 1 = closed
					that.HubData.send(that.currentAccessory.id, newDoorState )	
					callback(null);
				} );
		
		services.push(garageDoorService);
	}
	if (that.currentAccessory.capabilities.includes("WindowShade")) {
		var shadeService = new Service.Window()	
		var currentPosition = shadeService.getCharacteristic(Characteristic.CurrentPosition);
		var targetPosition = shadeService.getCharacteristic(Characteristic.TargetPosition)
		var positionState = shadeService.getCharacteristic(Characteristic.PositionState)
				
		shadeService
			.updateOnHubEvents(that.currentAccessory.id, "position") // Handle at Service level since want to update multiple characteristics on a report.
			.on('HubValueChanged', (HubReport) => {
					targetPosition.updateValue(HubReport.value);  // 0 = unlocked; 
					currentPosition.updateValue(HubReport.value); // 0 = unlocked; 
				})
				
		targetPosition
			.setInitialValue(that.currentAccessory.attributes.position)
			.on('set', (newHomekitValue, callback) => {
					that.HubData.send(that.currentAccessory.id, 'setPosition', newHomekitValue )	
					callback(null);
				} );
					
		positionState
			.setInitialValue(2)
			.updateOnHubEvents(that.currentAccessory.id, "windowShade")
			.on('HubValueChanged', (HubReport) => {
					switch (HubReport.value) {
						case "closing":
							positionState.updateValue(0); // 0 = going to the minimum value
							break;
						case "opening":
							positionState.updateValue(1); // 1 = going to the maximum value
							break;
						default: // open, closed, partially-opened, stopped
							positionState.updateValue(2); // 2 = stopped
					}
				})			
		services.push(shadeService);			
	}
}

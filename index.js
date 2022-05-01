'use strict';

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
//     console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-hubitat", "Hubitat", HubitatPlatform, true);
}

var exports = module.exports;

var HubitatSystem = require('./lib/HubitatSystemObject');
var HubData;
var HomekitSetup = require("./lib/HomeKitDeviceSetup");
var HSM = require ("./lib/Setup HomeSafetyMonitor");

function HubitatPlatform(log, config, api) 
{
	this.log = log;
    this.config = config; // this is the platform configuration data from config.json
	this.api = api;
	
	HubData = new HubitatSystem(log, config, api);
	this.HubData = HubData;
	
	Characteristic.prototype.updateOnHubEvents = function(ID, ...attributeList) {
		// Note that the value of 'this' is the Object that calls it -- i.e.,  a HomeKit Characteristic
		// This defines the item that receives an emitted event. If only a single Characteristic is affected by change in a 
		// Hubitat atribute, have the Characteristic 'listen' for the event. If multiple Charactersitics are interrelated
		// you can have the "Service" listen for  the attribute change, and it can then alter its sub-characteristics.
		// For example, the complex interactions between Thermostate Characteristics makes it better to address changes at the service level.
		HubData.registerObjectToReceiveUpdates(ID, this, attributeList);
		return this;
	}
	Characteristic.prototype.setInitialValue = function(value)  {
		this.updateValue(value);
		return this;
	}	
	Service.prototype.updateOnHubEvents = function(ID, ...attributeList)  {
		// Note that the value of 'this' is the Object that calls it -- i.e.,  a HomeKit Characteristic
		// This defines the item that receives an emitted event. If only a single Characteristic is affected by change in a 
		// Hubitat atribute, have the Characteristic 'listen' for the event. If multiple Charactersitics are interrelated
		// you can have the "Service" listen for  the attribute change, and it can then alter its sub-characteristics.
		// For example, the complex interactions between Thermostate Characteristics makes it better to address changes at the service level.
		HubData.registerObjectToReceiveUpdates(ID, this, attributeList);
		return this;
	}
}

HubitatPlatform.prototype = 
{
    accessories: async function (callback)  {
        var foundAccessories = [];

		var Initialized =   await HubData.initialize( this.config["MakerAPI"]);

		// HSM is a non-device accessory, so its handled by itself.
		// Currently, only the "Intrusion" rule is handled, so createHSMSecuritySystemDevices is always "Intrusion"
		// This is because one (as of Hubitat 2.2.5) cannot individually get the statuses of, and arm, other rules independently from "intrusion".
			this.config.createHSMSecuritySystemDevices?.forEach( (currentHSMType) => {
				this.log(`Creating new Home Safety Monitor Accessary of type ${currentHSMType}.`)
				
				var accessory = new HSMAccessory(this.api, this.log, this.config, currentHSMType, HubData);
				
				foundAccessories.push(accessory);	
			})
			
		// Now set up all of the Hubitat 'device' accessories
		HubData.allDevices.forEach((currentAccessory) =>  {
			this.log(`Creating new Accessary with ID:${currentAccessory.id} labeled ${currentAccessory.label} and a type ${currentAccessory.type}.`)
			
			var accessory = new HubitatAccessory(this.api, this.log, this.config, currentAccessory, HubData);
			
			foundAccessories.push(accessory);
		})
		
		callback(foundAccessories);
		
		// Give HomeKit a few seconds to set up the devices,then start the polling!
		setTimeout( () => { HubData.listenForChanges() }, 5000);		
	}
}

function HubitatAccessory(api, log, platformConfig, currentAccessory, HubInfo) {
	this.api = api;
	this.log = log;
	this.platformConfig = platformConfig
	this.currentAccessory = currentAccessory;
	this.HubData = HubInfo;    

	// The following two parameters are mandatory. 
	// HomeBridge will throw an error if you don't specify them!
    this.name = currentAccessory.label
	this.uuid_base = currentAccessory.id;
}

HubitatAccessory.prototype = {

    identify: function (callback) { callback() },

    getServices: function () {
        var services = [];
		
		HomekitSetup.setupServices(this, services);
        return services;
    }
}


function HSMAccessory(api, log, platformConfig, currentHSMType, HubInfo) 
{
	this.api = api;
	this.log = log;
	this.platformConfig = platformConfig
	this.currentHSMType = currentHSMType;
	this.HubData = HubInfo;    
	log(`current HSM Type is ${currentHSMType}`)

	// The following two parameters are mandatory. 
	// HomeBridge will throw an error if you don't specify them!
    this.name = "Hubitat Home Safety Monitor"
	this.uuid_base = `HSM.${currentHSMType}"`;
}
HSMAccessory.prototype = {
    identify: function (callback) { callback() },

    getServices: function () {
        var services = [];
		
		HSM.setupHomeSafetyMonitor(this, services);
        return services;
    }
}

'use strict';
var chalk = require("chalk");

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

function HubitatPlatform(log, config, api) 
{
	this.log = log;
    this.config = config; // this is the platform configuration data from config.json
	this.api = api;
	HubData = new HubitatSystem(log, config, api);
	this.HubData = HubData;
	
	Characteristic.prototype.updateOnHubEvents = function(ID, eventList) 
	{
		HubData.registerObjectToReceiveUpdates(ID, this, eventList);
		return this;
	}
	Service.prototype.updateOnHubEvents = function(ID, eventList) 
	{
		HubData.registerObjectToReceiveUpdates(ID, this, eventList);
		return this;
	}
}

HubitatPlatform.prototype = 
{
    accessories: async function (callback) 
	{
        var foundAccessories = [];

		var Initialized =   await HubData.initialize( this.config["MakerAPI"]);
		
		for (var currentAccessory of HubData.allDevices) 
		{
			this.log(chalk.green(`Creating new Accessary with ID:${chalk.cyan(currentAccessory.id)} labeled ${chalk.cyan(currentAccessory.label)} and a type ${chalk.cyan(currentAccessory.type)}.`))
			
			var accessory = new HubitatAccessory(this.api, this.log, this.config, currentAccessory, HubData);
			
			foundAccessories.push(accessory);
		}
		HubData.listenForChanges();
		callback(foundAccessories);
		HubData.refreshAll();
	}
}

function HubitatAccessory(api, log, platformConfig, currentAccessory, HubInfo) 
{
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

    identify: function (callback) {
        callback();
    },

    getServices: function () {
        var services = [];
		
		HomekitSetup.setupServices(this, services);
        return services;
    }
}

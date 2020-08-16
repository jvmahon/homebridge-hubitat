'use strict';
var chalk = require("chalk");

var Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
    console.log("homebridge API version: " + homebridge.version);

    // Accessory must be created from PlatformAccessory Constructor
    Accessory = homebridge.platformAccessory;

    // Service and Characteristic are from hap-nodejs
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform("homebridge-hubitat", "Hubitat", HubitatPlatform, true);
}

var exports = module.exports;
var globals = [];
var HubitatSystem = require('./lib/HubitatSystemObject');
var HubData = new HubitatSystem();
var HomekitSetup = require("./lib/HomeKitDeviceSetup");


function HubitatPlatform(log, config, api) {

	// if(!config) return([]);

	this.log = log;
    this.config = config;
	this.api = api;
	// console.log("Config is: " + Object.getOwnPropertyNames(config));
	// console.log("api.hap is: " + Object.getOwnPropertyNames(api.hap));
	

	globals.log = log; 
	globals.platformConfig = config; // Platform variables from config.json:  platform, name, host, temperatureScale, lightbulbs, thermostats, events, accessories
	globals.api = api; // _accessories, _platforms, _configurableAccessories, _dynamicPlatforms, version, serverVersion, user, hap, hapLegacyTypes,platformAccessory,_events, _eventsCount
	console.log(chalk.yellow("Globals: " + Object.getOwnPropertyNames(globals)));

}


HubitatPlatform.prototype = 
{
    accessories: async function (callback) 
	{
        var foundAccessories = [];
		var that = this;
		//console.log(chalk.yellow(Object.getOwnPropertyNames(globals.platformConfig)));
				// console.log(chalk.blue(globals.platformConfig["MakerAPI"]));

		console.log(chalk.green("Start Initializing"))
		var Initialized =   await HubData.initialize( globals.platformConfig["MakerAPI"]);
		console.log(chalk.green(`Initialized. HubData includes: ${HubData}`))

		
		for (var currentAccessory of HubData.Devices) 
		{
			globals.log(chalk.green(`Creating new Hubitat Accessary for device ${chalk.cyan(currentAccessory.name)} with an ID number ${chalk.cyan(currentAccessory.id)}, and a type ${chalk.cyan(currentAccessory.type)}.`))
			
			var accessory = new HubitatAccessory(that.api, that.log, that.config, currentAccessory);
			
			foundAccessories.push(accessory);
		}
		HubData.listenForChanges();
		callback(foundAccessories);
	}
}


function HubitatAccessory(api, log, platformConfig, currentAccessory) {
    this.config = currentAccessory;
	this.platformConfig = platformConfig
    this.name = currentAccessory.name
    this.model = currentAccessory.model || currentAccessory.label;
	this.manufacturer = currentAccessory.manufacturer || "Hubitat"
	this.type = currentAccessory.type
	this.uuid_base = currentAccessory.id;
	this.id = currentAccessory.id;
	this.api = api;
	this.HubData = HubData;
}

HubitatAccessory.prototype = {

    identify: function (callback) {
        callback();
    },

    getServices: function () {
        var services = [];

		// The following function sets up the HomeKit 'services' for particular devices and returns them in the array 'services'. 
		HomekitSetup.setupServices(this, services);
		console.log(chalk.yellow(`Found ${services.length} services for a new accessory: ${this.type}`));
	
        return services;
    }
}

exports.platform = HubitatPlatform;
exports.globals = globals;
exports.HubData = HubData;



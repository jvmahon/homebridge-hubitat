'use strict';
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var URL = require('url').URL;
var fetch = require("node-fetch");
var exports = module.exports;

//	Functions in class HomeSeerSystem

//		async initialize( MakerAPIURL  ) // Called once to set up the internal data structures that store information about Hubitat Devices.
		

class HubitatSystem 
{
	constructor()
	{
		this.Initialized = false;
		this.Devices = [];
		this.name = "Hubitat System";
		this.network = { host:undefined, access_token: undefined, api_number: undefined};
	}

	async initialize(MakerAPIURL)
	{
		var that = this;

		// Break MakerAPI Url into host, api number, and access token
		const deviceURL = new URL(MakerAPIURL);
		that.network.host = deviceURL.host
		that.network.access_token = deviceURL.search;
		var arr = deviceURL.pathname.split('/');
		that.network.api_number = parseInt(arr[3]);
		
		console.log("Network: " + JSON.stringify(that.network));
		
		that.Devices = 	await fetch(deviceURL).then ( response => response.json() );

		that.initialized = true;
		return Promise.resolve(true);;
	}
	
	static send = function(id, value)
	{
		console.log(chalk.yellow(`Sending value to device id: ${id} the value ${value}`))
		return;
	}
}

module.exports = HubitatSystem;

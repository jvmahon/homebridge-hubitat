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
 console.log(cyan("Loading HubitatSystemObject.js"));
 
var WebSocket = require('ws');

//	Functions in class HomeSeerSystem

//		async initialize( MakerAPIURL  ) // Called once to set up the internal data structures that store information about Hubitat Devices.
		

class HubitatSystem 
{
	constructor()
	{
		this.Initialized = false;
		this.Devices = [];
		this.name = "Hubitat System";
		this.network = { origin:undefined, host: undefined, access_token: undefined, api_number: undefined};
		this.webSocket = [];
	}

	async initialize(MakerAPIURL)
	{
		var that = this;

		// Break MakerAPI Url into host, api number, and access token
		const deviceURL = new URL(MakerAPIURL);
		that.network.origin = deviceURL.origin
		that.network.host = deviceURL.host;
		that.network.access_token = deviceURL.search;
		that.network.MakerAPI = MakerAPIURL;
		var arr = deviceURL.pathname.split('/');
		that.network.api_number = parseInt(arr[3]);
		
		// console.log("Network: " + JSON.stringify(that.network));
		
		that.Devices = 	await fetch(deviceURL).then ( response => response.json() );

		that.initialized = true;
		return Promise.resolve(true);;
	}
	
	send = function(id, command, value)
	{
		var control = new URL(this.network.origin);
		switch(command)
		{
			case 'switch' :
			{		
				control.pathname = "/apps/api/" + this.network.api_number + "/devices/" + id +"/" + value;
				break;
			}
			default:
			{
				control.pathname = "/apps/api/" + this.network.api_number + "/devices/" + id +"/" + command + "/" + value;

			}
		}
		control.search = this.network.access_token;
		
		fetch(control)
			.then( function(response) {
					console.log(`Fetch Command Succeeded! ${Object.getOwnPropertyNames(response)}`);
			})
		
		console.log(chalk.yellow(`Sending value to device id: ${id} the command ${command} and value ${value}`))
		console.log(chalk.yellow(`Sending value to device id: ${control.href}`))

		return;
	}
	
	listenForChanges()
	{
		var that = this;
		const listenURL = new URL("ws://" + that.network.host+ "/eventsocket");
		
		that.webSocket = new WebSocket (listenURL.href);
		that.webSocket.on('message', function (data)
		{
			console.log("Received data on WebSocket: " + data);
			if (data.source == "DEVICE")
			{
		
				for(var thisObject of this.Devices[data.deviceId].notifyObjects)
				{
					thisObject.emit("HubValueChanged", data.name, newValue, thisObject)
				}
			}
		}
		)
	}
	
}

module.exports = HubitatSystem;

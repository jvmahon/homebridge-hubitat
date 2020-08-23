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
		this.allDevices = [];
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
		
		that.allDevices = 	await fetch(deviceURL).then ( response => response.json() );

		that.initialized = true;
		return Promise.resolve(true);;
	}
	
	send = function(id, ...args)
	{
		var control = new URL(this.network.origin);
		var log = this.log;
		var that = this;
		control.pathname = "/apps/api/" + this.network.api_number + "/devices/" + id +"/" + args.join("/");

		//console.log(chalk.red(`Args.join are ${args.join("/")}`))
		control.search = this.network.access_token;
		fetch(control)
			.then( function(response) {
				console.log(`Sent to device id: ${id} the command ${args.join("/")}.`);
			})
		
		return;
	}

	listenForChanges()
	{
		var that = this;
		const listenURL = new URL("ws://" + that.network.host+ "/eventsocket");
		
		that.webSocket = new WebSocket (listenURL.href);
		that.webSocket.on('message', function (data)
		{
			var receivedData = JSON.parse(data);
			// console.log(chalk.red("Received data on WebSocket: " + Object.getOwnPropertyNames(receivedData)));
			
			if (receivedData.source == "DEVICE")
			{
				// console.log(chalk.red(`Processing emit data`));

				if (that.Devices[receivedData.deviceId] === undefined) return;

				for(var thisObject of that.Devices[receivedData.deviceId].notifyObjects)
				{
					
					if(thisObject.reportType == receivedData.name)
					{
						console.log(chalk.yellow(`Emitting a data value ${chalk.cyan(receivedData.value)} for device id: ${chalk.cyan(receivedData.deviceId)} and report type ${thisObject.reportType}.`));
						
						thisObject.emit("HubValueChanged", receivedData, thisObject)
					}
					else
					{
					// console.log(chalk.red(`NOT Emitting a data value ${chalk.cyan(receivedData.value)} for device id: ${chalk.cyan(receivedData.deviceId)} and report type ${thisObject.reportType}`));
					}
				}
			}
		}
		)
	}
	
	refreshAll()
	{
		var that = this;
		var x;
		console.log(chalk.yellow(`Calling Refresh for ${that.Devices.length} devices`));

		for (x in that.Devices)
		{
			// console.log(chalk.yellow(`Refreshing device id: ${x}`));
			this.send(x, 'refresh')
		}
	}
	
	registerObjectToReceiveUpdates(id, object, reportType)
	{		
		if (this.Devices[id] === undefined) 
			{ 
				this.Devices[id] =[]
			}
		if (this.Devices[id].notifyObjects === undefined) this.Devices[id].notifyObjects = [];
		object.id = id;
		
				if (this.Devices[id].notifyObjects.includes(object) === false)
				{
					object.reportType = reportType;
					this.Devices[id].notifyObjects.push(object);

				// console.log(red(`Registered object with id = ${id} to receive updates of type ${object.reportType}. Array is now length ${this.Devices[id].notifyObjects.length}`));
				}
				else
				{
					console.log(red("*Warning* - tried to add an item to HubitatSystemObject.Devices[id].notifyObjects that already existed!"));
				}
	}
	
}

module.exports = HubitatSystem;

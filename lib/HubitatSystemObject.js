'use strict';
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var URL = require('url').URL;
var fetch = require("node-fetch");

// The Queue library is used to space out requet to Hubitat so it isn't overwhelmed.
const queue = require("queue");

var exports = module.exports;

console.log(cyan("Loading HubitatSystemObject.js"));
 
var WebSocket = require('ws');

//	Functions in class HomeSeerSystem

//		async initialize( MakerAPIURL  ) // Called once to set up the internal data structures that store information about Hubitat Devices.
		

class HubitatSystem 
{
	constructor(log, config, api)
	{
		this.Initialized = false;
		this.Devices = [];
		this.allDevices = [];
		this.name = "Hubitat System";
		this.network = { origin:undefined, host: undefined, access_token: undefined, api_number: undefined};
		this.webSocket = [];
		this.sendQueue = queue({autostart:true, concurrency:1})
		this.log = log;
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
	
	queuedSend = function(id, ...args)
	{
		var that = this;
		function sendfunction(cb)
		{
			var control = new URL(that.network.origin);
			control.pathname = "/apps/api/" + that.network.api_number + "/devices/" + id +"/" + args.join("/");

			//console.log(chalk.red(`Args.join are ${args.join("/")}`))
			control.search = that.network.access_token;
			var now = new Date();
			fetch(control)
				.then( function(response) {
					that.log(`Queued to device id: ${id} the command ${args.join("/")} at time ${now.toLocaleTimeString()}.`);
					setTimeout( ()=> {cb()}, 500); // request are spaced by 500 mSec, but there can be 4 at once.
				})
				.catch(function(error){
					that.log(`Error Sending to device id: ${id} the command ${args.join("/")}.`);
					setTimeout( ()=> {cb()}, 500);
				})
			
			// setTimeout( ()=> {cb()}, 250);
		}
		this.sendQueue.push(sendfunction);
	}
	send = function(id, ...args)
	{
		var control = new URL(this.network.origin);
		var that = this;
		control.pathname = "/apps/api/" + this.network.api_number + "/devices/" + id +"/" + args.join("/");

		//console.log(chalk.red(`Args.join are ${args.join("/")}`))
		control.search = this.network.access_token;
		fetch(control)
			.then( function(response) {
				that.log(`Sending to Hubitat device id: ${id} the command ${args.join("/")}.`);
			})
		
		return;
	}
	
	
	listenForChanges()
	{
		var that = this;
		var reopenInterval;
		var heartbeatInterval;
		
		function heartbeat()
			{
				clearTimeout(this.pingTimeout)
				this.pingTimeout = setTimeout(() => 
				{
					this.terminate();
				}, 30000 + 1000);			
			};
			
		const listenURL = new URL("ws://" + that.network.host+ "/eventsocket");
		function startWebsocket()
		{

			that.webSocket = new WebSocket (listenURL.href)
			.on('message', function (data)
				{
					var receivedData = JSON.parse(data);
					
					if (receivedData.source == "DEVICE")
					{
						if (that.Devices[receivedData.deviceId] === undefined) return;

						for(var thisObject of that.Devices[receivedData.deviceId].notifyObjects)
						{
							if(thisObject.reportType == receivedData.name)
							{
								that.log(chalk.yellow(`Received a data value ${chalk.cyan(receivedData.value)} from Hubitat for device id: ${chalk.cyan(receivedData.deviceId)} and report type ${chalk.cyan(thisObject.reportType)}.`));
								
								thisObject.emit("HubValueChanged", receivedData, thisObject)
							}
						}
					}
				})

			.on('pong', function heartbeat() 
					{
						that.log(chalk.green("          ....Heartbeat Received "));

					  this.isAlive = true;
					} )	
			.on('open', function ()
				{
					that.log(chalk.green(`Open event. Established connection to Hubitat WebSocket EventStream`));
					that.webSocket.isAlive = true;
					
					// clearInterval(reopenInterval);
					clearInterval(heartbeatInterval);
					
					heartbeatInterval = setInterval(function ping() 
						{
							that.log(chalk.green("Sending Heartbeat...."));
							that.webSocket.isAlive = false;
							that.webSocket.ping( function noop() {});			
							
						}, 30000);	
				})
			.on ('close', function()
				{
					that.log(chalk.red(`ERROR - Connection to Hubitat WebSocket EventStream failed. Will try to reopen every 30 seconds.`));

					that.webSocket.terminate();
					clearInterval(heartbeatInterval);

					reopenInterval = setTimeout( function()
						{
							that.log(chalk.red(`Trying to connect.`));	
							startWebsocket();
						}, 30000);
				})
		}	

		startWebsocket();
	}
	
	refreshAll()
	{
		var that = this;
		var x;
		console.log(chalk.yellow(`Calling Refresh for ${that.Devices.length} devices`));

		for (x in that.Devices)
		{
			// console.log(chalk.yellow(`Refreshing device id: ${x}`));
			this.queuedSend(x, 'refresh')
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

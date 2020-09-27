'use strict';
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;

var URL = require('url').URL;
var fetch = require("node-fetch");

// The Queue library is used to space out requet to Hubitat so it isn't overwhelmed.
const queue = require("queue");

var exports = module.exports;

var WebSocket = require('ws');

//	Functions in class HomeSeerSystem

//		async initialize( MakerAPIURL  ) // Called once to set up the internal data structures that store information about Hubitat Devices.
		

class HubitatSystem 
{
	constructor(log, config, api)
	{
		this.Initialized = false;
		this.Devices = [];// This is an array of HomeKit Services and Characteristics that want to receive event notifications. Includes a sub-array .notifyObjects which is the array of HomeKit Services and Characteristics. the indext to this.Devices[] is the ID of the Hubitat device.
		this.allDevices = []; // Be carefulw ith this one! The indices do not match device number.
		this.name = "Hubitat System";
		this.network = { origin:undefined, host: undefined, access_token: undefined, api_number: undefined};
		this.webSocket = [];
		this.sendQueue = queue({autostart:true, concurrency:2})
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
		
		that.allDevices = 	await fetch(deviceURL).then ( response => response.json() );
		that.networkAvailable = false;
		that.initialized = true;
		return Promise.resolve(true);;
	}
	
	queuedSend = function(id, interval, ...args)
	{
		// Should add a safeguard to not send if the network connection has closed!
		var that = this;
		
		if (that.networkAvailable == false) 
			{
				that.log(chalk.red(`Error - Attempting to queue a send command to device ${id}, but network WebSocket Connection to Hubitat is not available.`)); 
				return;
			}
		
		// Get the complete Hubitat data for this device from the stored array.
		var fullDeviceData	= this.allDevices.find( function(currentElement) { return (currentElement.id == id)})

		function sendfunction(cb)
		{
			var control = new URL(that.network.origin);
			control.pathname = "/apps/api/" + that.network.api_number + "/devices/" + id +"/" + args.join("/");

			//console.log(chalk.red(`Args.join are ${args.join("/")}`))
			control.search = that.network.access_token;
			var now = new Date();
			fetch(control)
				.then( function(response) {

					that.log(`Queued to device id: ${cyan(id)} labeled ${cyan(fullDeviceData.label)} the command ${cyan(args.join("/"))} with timing of ${interval}.`);
					setTimeout( ()=> {cb()}, interval); // request are spaced by interval mSec.
				})
				.catch(function(error){
					that.log(`Error Sending to device id: ${id} the command ${args.join("/")}.`);
					setTimeout( ()=> {cb()}, interval);
				})
			
			// setTimeout( ()=> {cb()}, 250);
		}
		this.sendQueue.push(sendfunction);
	}
	
	send = function(id, ...args)
	{
		this.queuedSend(id, 200, args);
		return;
	}
	
	/*
	send = function(id, ...args)
	{
		var control = new URL(this.network.origin);
		var that = this;
		control.pathname = "/apps/api/" + this.network.api_number + "/devices/" + id +"/" + args.join("/");

		control.search = this.network.access_token;
		fetch(control)
			.then( function(response) {
				that.log(`Sending to Hubitat device id: ${cyan(id)} the command ${args.join("/")}.`);
			})
		return;
	}
	*/
	
	listenForChanges()
	{
		var that = this;
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
						that.log(chalk.green(`Received from device id: ${chalk.cyan(receivedData.deviceId)} a data value ${chalk.cyan(receivedData.value)} in report type ${chalk.cyan(receivedData.name)} with Display Name ${chalk.cyan(receivedData.displayName)} and source ${receivedData.source}.`));

					
					if (receivedData.source == "DEVICE")
					{
						if (that.Devices[receivedData.deviceId] === undefined) return;


						for(var thisObject of that.Devices[receivedData.deviceId].notifyObjects)
						{
						
							if(thisObject.reportType.includes(receivedData.name))
							{
								// that.log(chalk.yellow(`Emitting received data from device id: ${chalk.cyan(receivedData.deviceId)} a data value ${chalk.cyan(receivedData.value)} in report type ${chalk.cyan(receivedData.name)} with Display Name ${chalk.cyan(receivedData.displayName)}.`));
								
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
					that.networkAvailable = true;
					clearInterval(heartbeatInterval);
					
					heartbeatInterval = setInterval(function ping() 
						{
							that.log(chalk.green("Sending Heartbeat...."));
							that.webSocket.isAlive = false;
							that.webSocket.ping( function noop() {});			
						}, 30000);
					that.refreshAll();
					that.occasionalPoll(10000)
				})
			.on('error', function ()
				{
					that.log(chalk.red(`Error. Hubitat WebSocket EventStream connection error!`));

				})			
			.on ('close', function()
				{
					that.log(chalk.red(`Connection Closd - Connection to Hubitat WebSocket EventStream was closed. this may be due to a Hubitat Hub error or reboot. Will try to reopen every 30 seconds.`));
					that.networkAvailable = false;
					that.webSocket.terminate();
					
					clearInterval(heartbeatInterval);

					setTimeout( function()
						{
							that.log(chalk.red(`Trying to reconnect.`));	
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
		that.log(chalk.yellow(`Calling Refresh on each device to update HomeKit with Current Hubitat Device Data.`));

		for (x in that.Devices)
		{
			this.queuedSend(x, 500, 'refresh')
		}
	}
	
	// Occasionally poll all non-battery devices as a safeguard to make sure hubitat and plugin remain synchronized.
	occasionalPoll(interval)
	{
		var that = this;
		function timer(ms) { return new Promise(res => setTimeout(res,ms));}
		
		async function pollNonBatteryDevices()
		{
			while(true)
			{
				for (var x of that.allDevices)
				{
					if(x.attributes.battery == undefined)
					{
						that.log(chalk.cyan(`Polling device ${x.id} named ${x.name}`))
						that.queuedSend(x.id, 200, 'refresh')
					}	
				await timer(interval);
				}
			}
		}
		pollNonBatteryDevices();
	}
	
	registerObjectToReceiveUpdates(id, HomeKitObject, ...reportType)
	{	
	// HomeKitObject is either a Service or a Characteristic.
	//
	
	var ThisReportType = typeof reportType;
	// console.log(red(`Debug: Report type is type: ${ThisReportType} containing ${reportType}`));
	
		if (this.Devices[id] === undefined) 
			{ 
				this.Devices[id] =[]
			}
		if (this.Devices[id].notifyObjects === undefined) this.Devices[id].notifyObjects = [];
		HomeKitObject.id = id;
		
		if (this.Devices[id].notifyObjects.includes(HomeKitObject) === false)
		{
			HomeKitObject.reportType = reportType;
			this.Devices[id].notifyObjects.push(HomeKitObject);

		// console.log(red(`Registered object with id = ${id} to receive updates of type ${object.reportType}. Array is now length ${this.Devices[id].notifyObjects.length}`));
		}
		else
		{
			console.log(red("*Warning* - tried to add an item to HubitatSystemObject.Devices[id].notifyObjects that already existed!"));
		}
	}
}

module.exports = HubitatSystem;

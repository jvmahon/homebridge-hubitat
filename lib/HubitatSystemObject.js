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
		this.UpdateDeviceTraits = [];// This is an array of HomeKit Services and Characteristics that want to receive event notifications. Includes a sub-array .notifyObjects which is the array of HomeKit Services and Characteristics. the indext to this.UpdateDeviceTraits[] is the ID of the Hubitat device.
		this.allDevices = []; // Be carefulw ith this one! The indices do not match device number.
		this.name = "Hubitat System";
		this.network = { origin:undefined, host: undefined, access_token: undefined, api_number: undefined};
		this.webSocket = [];
		this.sendQueue = queue({autostart:true, concurrency:4})
		this.log = log;
	}
	
	async initialize(MakerAPIURL)
	{
		var that = this;

		// Break MakerAPI Url into host, api number, and access token
		that.deviceURL = new URL(MakerAPIURL);
		that.network.origin = that.deviceURL.origin
		that.network.host = that.deviceURL.host;
		that.network.access_token = that.deviceURL.search;
		that.network.MakerAPI = MakerAPIURL;
		var arr = that.deviceURL.pathname.split('/');
		that.network.api_number = parseInt(arr[3]);
		
		that.allDevices = 	await fetch(that.deviceURL).then ( response => response.json() );

		that.initialized = true;
		return Promise.resolve(true);;
	}
	
	// The next function is experimental!
	// It is intended to allow better flow of control to Hubitat limiting the rate of sends
	// There may be 4 outstanding sends at a time. 
	queuedSend = function(id, command, ...args)
	{
		var that = this;
		that.log(`Debug - Received device id: ${cyan(id)} and command ${cyan(command)} with arguments ${args}.`);


		// Get the complete Hubitat data for this device from the stored array.
		var fullDeviceData	= this.allDevices.find( function(currentElement) { return (currentElement.id == id)})

		function sendfunction(cb)
		{
			var control = new URL(that.network.origin);
			control.pathname = `/apps/api/${that.network.api_number}/devices/${id}/${command}`
			if(args.length > 0) control.pathname += "/" + args.join(",");

			control.search = that.network.access_token;
			var now = new Date();
			fetch(control)
				.then( function(response) {

					that.log(`Queued to device id: ${cyan(id)} labeled ${cyan(fullDeviceData.label)} the command ${command}.`);
					setTimeout( ()=> {cb()}, 500); // request are spaced by 500 mSec, but there can be 4 outstanding at once.
				})
				.catch(function(error){
					that.log(`Error Sending to device id: ${id} the command ${that.command}.`);
					setTimeout( ()=> {cb()}, 500);
				})
			
		}
		this.sendQueue.push(sendfunction);
	}

// The following uses the queued send to send data with flow control!
/*
	send = function(id, command, ...args)
	{
		this.queuedSend(id, command, ...args)
	}
*/	
	
// The following "send" uses basic send without flow control.
	send = function(id, command, ...args)
	{
		var control = new URL(this.network.origin);
		var that = this;
		control.pathname = `/apps/api/${this.network.api_number}/devices/${id}/${command}`
		if(args.length > 0) control.pathname += "/" + args.join(",");

		control.search = this.network.access_token;
		fetch(control)
			.then( function(response) {
				that.log(`Sending to Hubitat device id: ${cyan(id)} the command ${command} with arguments ${args.join(",")}.`);
			})
		return;
	}
	
// The following "send" is specifically to control Home Safety Monitor.
	HSMsend = function(command, ...args)
	{
		var control = new URL(this.network.origin);
		var that = this;
		control.pathname = `/apps/api/${this.network.api_number}/hsm/${command}`
		
		// As of HSM 2.2.5, args.length should always be 0, but this is included in case that changes in the future
		if(args.length > 0) control.pathname += "/" + args.join(",");

		control.search = this.network.access_token;
		fetch(control)
			.then( function(response) {
				that.log(`Sending to Hubitat Home Safety Monitor the command ${command}.`);
			})
		return;
	}
	
	
	listenForChanges()
	{
		var that = this;
		var heartbeatInterval;
		var refreshInterval;
		
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

					
					if (receivedData.source == "DEVICE" || receivedData.source == "LOCATION")
					{
						if ((receivedData.source == "LOCATION") && (receivedData.deviceId !== 0)) return; // 0 is for HSM; Everything else is not valid!
						
						if (that.UpdateDeviceTraits[receivedData.deviceId] === undefined) return;

						for(var thisObject of that.UpdateDeviceTraits[receivedData.deviceId].notifyObjects)
						{
							if(thisObject.reportTypes.includes(receivedData.name))
							{
								that.log(chalk.yellow(`Emitting received data from device id: ${chalk.cyan(receivedData.deviceId)} a data value ${chalk.cyan(receivedData.value)} in report type ${chalk.cyan(receivedData.name)} with Display Name ${chalk.cyan(receivedData.displayName)}.`));
								
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
					
					clearInterval(heartbeatInterval);
					clearInterval(refreshInterval);
					
					heartbeatInterval = setInterval(function ping() 
						{
							that.log(chalk.green("Sending Heartbeat...."));
							that.webSocket.isAlive = false;
							that.webSocket.ping( function noop() {});			
						}, 30000);
					var BoundRefreshAll = that.refreshAll.bind(that)
					// that.refreshAll();
					BoundRefreshAll();
					
					// Do a refresh every 10 minutes just to be sure synchronization is maintained
					refreshInterval = setInterval(BoundRefreshAll, 600000)
				})
			.on('error', function ()
				{
					that.log(chalk.red(`Error. Hubitat WebSocket EventStream connection error!`));

				})			
			.on ('close', function()
				{
					that.log(chalk.red(`Connection Closd - Connection to Hubitat WebSocket EventStream was closed. this may be due to a Hubitat Hub error or reboot. Will try to reopen every 30 seconds.`));

					that.webSocket.terminate();
					
					clearInterval(heartbeatInterval);
					clearInterval(refreshInterval);

					setTimeout( function()
						{
							that.log(chalk.red(`Trying to reconnect.`));	
							startWebsocket();
						}, 30000);
				})
		}	
		startWebsocket();
	}
	
	async refreshAll()
	{
		var that = this;
		var deviceID;
		var report = [];
		this.log(chalk.yellow(`Calling Refresh on each device to update HomeKit with Current Hubitat Device Data.`));
		
		that.allDevices = 	await fetch(that.deviceURL).then ( response => response.json() );

		for (deviceID in that.UpdateDeviceTraits)
		{
			if (deviceID == 0) continue // HSM will have a 0 deviceID and it doesn't support a refresh!
			var fullDeviceData	= this.allDevices.find( function(currentElement) { return (currentElement.id == deviceID)})

			for(var thisHomekitObject of that.UpdateDeviceTraits[deviceID].notifyObjects)
			{
				for(var x in thisHomekitObject.reportTypes)
				{
					// Don't do a refresh on items in the next line!
					if (["pushed", "held", "doubleTapped"].includes(thisHomekitObject.reportTypes[x])) continue
					
					report = {
						"name": thisHomekitObject.reportTypes[x], 
						"value": fullDeviceData.attributes[thisHomekitObject.reportTypes[x]] 
						};

					thisHomekitObject.emit("HubValueChanged", report, thisHomekitObject);
				}
			}
		}
	}
	
	registerObjectToReceiveUpdates(id, HomeKitObject, reportTypeArray)
	{	
	// HomeKitObject is either a Service or a Characteristic.
	//
		HomeKitObject.id = id;
		if (HomeKitObject.reportTypes === undefined) HomeKitObject.reportTypes = [];
	
		if (this.UpdateDeviceTraits[id] === undefined) 
			{ 
				this.UpdateDeviceTraits[id] =[]
				this.UpdateDeviceTraits[id].notifyObjects = [];
			}
		
			HomeKitObject.reportTypes.push(...reportTypeArray);
			
			this.UpdateDeviceTraits[id].notifyObjects.push(HomeKitObject);
	}
}

module.exports = HubitatSystem;

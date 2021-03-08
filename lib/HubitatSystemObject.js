'use strict';
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;

var URL = require('url').URL;
var fetch = require("node-fetch");

var exports = module.exports;

var WebSocket = require('ws');

var HSM = require ("../lib/Setup HomeSafetyMonitor");

//	Functions in class HomeSeerSystem

//		async initialize( MakerAPIURL  ) // Called once to set up the internal data structures that store information about Hubitat Devices.
		
class HubitatSystem 
{
	constructor(log, config, api)
	{
		this.Initialized = false;
		this.UpdateDeviceTraits = [];// Each entry of this array is a data structure that identifies the HomeKit Services and Characteristics that receive event notifications when a Hubitat attribute for the device changes. The index value is the Maker API device ID of the Hubitat device. Thus, for example, UpdateDeviceTraits[50] would be the entry for Maker API device #50. Each entry includes a sub-array .notifyObjects which is an array of HomeKit Services and Characteristics placed that receive the emitted emitter's .on() event. Items are place into .notifyObjects by the .updateOnHubEvents() method.  Each of those characteristics or services has associated with it a sub array .hubitatAttributesOfInterest which is a sub-array listing all the Hubitat attributes of interst to that Characteristic or Service.  
		
		this.allDevices = []; // Be careful w th this one! The indices are sequential and do not match device number. This is an array of all devices reported back from Hubitat.
		this.name = "Hubitat System";
		this.network = { origin:undefined, host: undefined, access_token: undefined, api_number: undefined};
		this.webSocket = [];
		this.log = log;
		this.config = config
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
		
		// Get very device that Hubitat Maker API has been selected in Maker API
		that.allDevices = 	await fetch(that.deviceURL).then ( response => response.json() );

		that.initialized = true;
		return Promise.resolve(true);;
	}
	
	
// The following "send" function is used to control devices.
	send = function(id, command, ...args)
	{
		var control = new URL(this.network.origin);
		var that = this;
		control.pathname = `/apps/api/${this.network.api_number}/devices/${id}/${command}`
		if(args.length > 0) control.pathname += "/" + args.join(",");

		control.search = this.network.access_token;
		fetch(control)
			.then( response => response.json())
			.then( data => {
				that.log(`Sending to Hubitat device id: ${cyan(id)} the command ${command} with arguments ${args.join(",")}.`);
				return data
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
		
		that.log(`Sending to Hubitat Home Safety Monitor the command ${command} in control string ${control}.`);

		fetch(control)
			.then( response => response.json())
			.then( data => {
				that.log(`Sent to Hubitat Home Safety Monitor the command ${command} and received response ${JSON.stringify(data)}.`);
				return data
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

					// Only concerned about "DEVICE" or "LOCATION" types.  "LOCATION" is used by HSM.
					if (receivedData.source == "DEVICE" || receivedData.source == "LOCATION")
					{
						// Only concerned about "LOCATION" events for HSM (for which deviceID == 0), so return if you get a LOCATION and deviceID !== 0.
						if ((receivedData.source == "LOCATION") && (receivedData.deviceId !== 0)) return; // 0 is for HSM; Everything else is not valid!
						
						// that.UpdateDeviceTraits[receivedData.deviceId] is the list of Services/ Characteristics that are interested in an update (if undefined, tehre aren't any for this device ID)
						if (that.UpdateDeviceTraits[receivedData.deviceId] === undefined) return;

						// Its possible that multiple Services or Characteristics are registered to received emitted events, so loop through each one.
						for(var thisObject of that.UpdateDeviceTraits[receivedData.deviceId].notifyObjects)
						{
							// For this Object (Serivce or Characteristic), does the name of the event as received from Hubitat match one of the names that was registered to receive events using updateOnHubEvents(), if so, emit the event to that Object (Service or Characteristic), else, ignore it.
							if(thisObject.hubitatAttributesOfInterest.includes(receivedData.name))
							{
								that.log(chalk.yellow(`Emitting received data from device id: ${chalk.cyan(receivedData.deviceId)} a data value ${chalk.cyan(receivedData.value)} in report type ${chalk.cyan(receivedData.name)} with Display Name ${chalk.cyan(receivedData.displayName)}.`));
								
								thisObject.emit("HubValueChanged", receivedData, thisObject)
							}
						}
					}
				})
			.on('pong', function heartbeat()  //  Just check to make sure Hubitat is alive and well!
					{
						that.log(chalk.green("          ....Heartbeat Received "));
						this.isAlive = true;
					} )	
			.on('open', function ()  // Set up some error recovery and functions to establish initial settings.
				{
					that.log(chalk.green(`Open event. Established connection to Hubitat WebSocket EventStream`));
					that.webSocket.isAlive = true;
					
					clearInterval(heartbeatInterval);
					clearInterval(refreshInterval);
					
					// Check that the connection to Hubitat remains good.
					heartbeatInterval = setInterval(function ping() 
						{
							that.log(chalk.green("Sending Heartbeat...."));
							that.webSocket.isAlive = false;
							that.webSocket.ping( function noop() {});			
						}, 30000);
					var BoundRefreshAll = that.refreshAll.bind(that) // refreshAll needed to be bound to "that" to be passed the correct values when called in setInterval.
					// that.refreshAll();
					BoundRefreshAll();
					
					// Do a refresh every 10 minutes just to be sure synchronization is maintained with Hubitat.
					refreshInterval = setInterval(BoundRefreshAll, 600000)
				})
			.on('error', function ()
				{
					that.log(chalk.red(`Error. Hubitat WebSocket EventStream connection error!`));

				})			
			.on ('close', function() // Recover if Hubitat gets rebooted!
				{
					that.log(chalk.red(`Connection Closd - Connection to Hubitat WebSocket EventStream was closed. this may be due to a Hubitat Hub error or reboot. Will try to reopen every 30 seconds.`));

					that.webSocket.terminate();
					
					clearInterval(heartbeatInterval);
					clearInterval(refreshInterval);

					setTimeout( function() // Try to reconnect every 30 seconds if the connection is lost.
						{
							that.log(chalk.red(`Trying to reconnect.`));	
							startWebsocket();
						}, 30000);
				})
		}	
		startWebsocket();
	}
	
	async refreshAll() // Grabs device data from Hubitat just to be sure Homebridge remains in sync. There is no reason it should ever get out of sync, but this is an extra precaution.
	{
		var that = this;
		var deviceID;
		var report = [];	
		
		HSM.HSMRefresh(that)	// Refresh Home Safety Monitor Intrusion Alert status.	
		
		this.log(chalk.yellow(`Calling Refresh on each device to update HomeKit with Current Hubitat Device Data.`));
		
		// Update the allDevices array with the latest data from Maker API.
		that.allDevices = 	await fetch(that.deviceURL).then ( response => response.json() );

		// Loop through all the device IDs of devices that want update. Remember, UpdateDeviceTraits is indexed by the Hubitat Device ID #. Note that this is an 'in' loop, so looping through the keys
		for (deviceID in that.UpdateDeviceTraits)
		{
			if (deviceID == 0) continue // HSM will have a 0 deviceID and it has a special refresh handled by HSMRefresh!
			
			// Want the Hubitat data for this device ID (it's 'fullDeviceData') , but the allDevices array is not indexed by the deviceID, so you need to use the .find() function to get the right entry.
			var fullDeviceData	= this.allDevices.find( function(currentElement) { return (currentElement.id == deviceID)})

			// For a given Hubitat device ID, there may be multiple Services / Characteristics that could be updated. Note that this is an 'of' loop, so looping through the values not keys
			for(var thisHomekitObject of that.UpdateDeviceTraits[deviceID].notifyObjects)
			{
				// For a given Service / Characteristic, it may have registered for one or more Hubitat event attributes(types) - i.e., ("switch", "level", etc). Loop through them.
				// x is the indext to the hubitatAttributesOfInterest arrray
				for(var thisAttributeName of thisHomekitObject.hubitatAttributesOfInterest)
				{
					// Don't do a refresh on items in the next line! If these were refreshed, they would re-trigger any Stateless ProgrammableSwitches which could trigger HomeKit automations.
					// You only want to refresh items that are "stateful" -- for those, re-emitting the same event doesn't cause a trigger in HomeKit.
					if (["pushed", "held", "doubleTapped"].includes(thisAttributeName)) continue
					
					// The following line *should* never be triggered as long as the accessory registered the correct listing of attributes for the emitter
					// But, just in case, a mistake was made, don't emit!
					if ((fullDeviceData.attributes[thisAttributeName]) === undefined) continue
					
					report = {
						"name": thisAttributeName, 
						"value": fullDeviceData.attributes[thisAttributeName] 
						};

					thisHomekitObject.emit("HubValueChanged", report, thisHomekitObject);
				}
			}
		}
	}
	

	registerObjectToReceiveUpdates(id, HomeKitObject, emitOnTheseHubitatAttributes)
	{	
	// HomeKitObject is either a Service or a Characteristic.
	// listenForTheseHubitatAttributes is a listing of Hubitat attributes.
		HomeKitObject.id = id;
		if (HomeKitObject.hubitatAttributesOfInterest === undefined) HomeKitObject.hubitatAttributesOfInterest = [];
	
		if (this.UpdateDeviceTraits[id] === undefined) 
			{ 
				this.UpdateDeviceTraits[id] =[]
				this.UpdateDeviceTraits[id].notifyObjects = [];
			}
		
			HomeKitObject.hubitatAttributesOfInterest.push(...emitOnTheseHubitatAttributes);
			
			this.UpdateDeviceTraits[id].notifyObjects.push(HomeKitObject);
	}
}

module.exports = HubitatSystem;

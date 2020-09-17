# Homebridge-Hubitat


This is not ready for use by others! Expect this to be done by end of September 2020.


# Index Of Wiki Pages
(Wiki Pages To Be Added As needed - check back)

## 1. Installation of HomeBridge and Plugin

* Update - The Homebridge wiki has added updated instructions to install HomeBridge in Windows, Linux, and other platforms. You might want to check out those instructions for other installation options (and they may be more up-to-date for Linux and other platforms). See https://github.com/nfarina/homebridge/wiki

* Also, I've heard this configuration interface can be useful for HomeBridge (I haven't tested it myself, but you may want to check it out) -I suggest making sure you have the "basic" HomeSeer plugin working before adding this). See https://github.com/oznu/homebridge-config-ui-x


### 1.1. Updating The Hubitat Plugin
From time-to-time, you may want to update the Homebridge-Homeseer4-Plugin to the latest version. This is done through the npm update command. To update the plugin, simply enter the following at a command prompt:
`````
npm -g update
`````
Note that this will update all of your npm modules (including those unrelated to Homebridge and this plugin). If you want to update only the homebridge-hubitat plugin, then enter:
`````
npm -g update homebridge-hubitat
`````

To check which version you currently have installed, run the command:
`````
npm -g list --depth=0
`````



## 3. Setting Up Your Config.json file

As Homebridge plugins go, the configuration for this one is fairly simple. In the "platforms": area of your config.json, add a platform as set out below.
"lowBatteryThreshold" is the value (percentage) that iOS Home will use to determine when to give a low battery warning on screen.
"MakerAPI" is the "Get All Devices with Full Details" URL that you can get from the MakerAPI app page. Just right click on that link in the Maker API app page, choose "Copy Link Address" (in Chrome), or "Copy Link" (in Edge), and paste into your config.json between quotes. 


`````
		{
			"platform": "Hubitat",              
			"name": "Hubitat for HomeBridge", 
			"MakerAPI": "http://192.168.1.168/apps/api/36/devices/all?access_token=210ca37a-35d7-47db-b059-744f526999f0",
			"lowBatteryThreshold":35
		}
`````
There is a sample configuration file config.sample.json located here: https://github.com/jvmahon/homebridge-hubitat/tree/master/Config.Sample


## 4. Supported Device Types

| <u>Category                                  	|                      	|                     	|                  	|
|-------------------------------------------	|----------------------	|---------------------	|------------------	|
| <b>Lights and Switches                       	| Lightbulb            	| Switch              	| Outlet           	|
| | | |
| <b>Doors, Windows, Locks and Security Types: 	| Lock                 	| Garage Door Opener                 	| 	|
| | | |
| <b>SensorTypes:                              	| Carbon Monoxide Sensor 	|  	| Contact Sensor    	|
|                                           	| Humidity Sensor       	| LeakSensor          	| Light Sensor      	|
|                                           	| Motion Sensor         	| Occupancy Sensor     	| Smoke Sensor      	|
|                                           	| Temperature Sensor     |                     	|                  	|
| | | |
| <b>Heating and Cooling                       	| Fan            	|   Thermostat (coming soon)  	|                  	|
| | | |
| <b>Miscellaneous                             	|  Battery             	|    Valves                 	|                  	|

<b>Notes on specific types:


## 5. Notes on Switches and Fans

HomeKit supports multiple types of switches and fans. However, Hubitat doesn't always distinguish if a switch is for a lightbulb, fan, our just a plain outlet used for an applicance or just something that isn't a bulb. So ..

### A. Fans
The Plugin will distiguish a Fan in several ways:
* If the Fan appears in Hubitat as a "true" Fan (a device with a speed Control attribute), then it will be configured as a Fan.
* However, the plugin recognizes that a "fan" could also be controlled by a "regular" switch or dimmer. So, the plugin will also set up the device as a "Fan" if the word "Fan" appears in the Hubitat device label.

### B. Outlets
The plugin recognizes that not every switch is a lightbulb!  So, if the Hubitat device label includes the word "switch" or "outlet" or "heater or "appliance", then in HomeKit it will be set up as non-lightbulb Switch.


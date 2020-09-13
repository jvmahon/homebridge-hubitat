# Homebridge-Hubitat


This is not ready for use by others! Expect this to be done by end of September 2020.


# Index Of Wiki Pages

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

First, consider whether you will need to run a single instance of Homebridge, or multiple. See [[Running Multiple Instances of Homebridge]] for guidance on this issue.

Take a look at the sample configuration file config.sample.json located here: To Be Added
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
| <b>Heating and Cooling                       	| Fan            	|                 	|                  	|
| | | |
| <b>Miscellaneous                             	|  Battery             	|    Valves                 	|                  	|

<b>Notes on specific types:




'use strict';
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;
var URL = require('url').URL;
var fetch = require("node-fetch");
var WebSocket = require('ws');

		const listenURL = new URL("ws://192.168.1.168/eventsocket");
		
		var webSocket = new WebSocket (listenURL.href);
		webSocket.on('message', function (data)
		{
			if(data.name != "power")
			{
			console.log(data);
			}
		}
		)




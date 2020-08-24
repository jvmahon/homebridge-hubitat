'use strict'
var exports = module.exports;
var chalk = require("chalk");
var green = chalk.green.bold;
var red = chalk.red.bold;
var yellow = chalk.yellow.bold;
var cyan = chalk.cyan.bold;
var magenta = chalk.magenta.bold;

exports.setupStatelessButtons = function (that, services)
{
	
	let Characteristic 	= that.api.hap.Characteristic;
	let Service 		= that.api.hap.Service;

	if (that.currentAccessory.capabilities.includes("PushableButton"))
	{
		var ServiceLabel = new Service.ServiceLabel();
		var PushableButtons = new Service.StatelessProgrammableSwitch();

		services.push(ServiceLabel)		
		services.push(PushableButtons)		
	}	



}
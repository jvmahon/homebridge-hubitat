# NEOSmartShades

This is a Homebridge plugin for the NEO Smart Shade Controller (See http://neosmartblinds.com/smartcontroller/).

These instructions are in rough draft form, but should be enough to get you started
Linux Installation Instructions to be added!

# I. Installing Homebridge on Windows 10

These instructions were originally written or installing HomeBridge on Windows 10, 64  bit. They should also work for earlier versions of Windows. 

** There are a number of steps that say to use Windows Command Prompt. **Do NOT try to use Windows PowerShell** instead. The install will fail if Windows PowerShell is used instead of Command Prompt. **

You should perform the following steps using the account that you will use to run HomeBridge.  This is because, by default, certain HomeBridge modules are installed in the logged-in user's account at: C:\Users\ _your user name_ \AppData\Roaming\npm\node_modules and will not be accessible from other Windows accounts. I've found it helpful to set up a specific Windows "user" just for the running of HomeBridge (e.g., set up a new user under the login name "HomeBridge" or something like that, and then do the installation when logged in as that user).

## A.	Install Nodejs
These Windows install instructions have been tested with the v13.3.3 series of node so its recommended that you use a version in that series or later. Other version of NodeJS may work but haven’t been tested. You can download NodeJS here: https://nodejs.org/


## B.	Install Homebridge

Now install homebridge from a *new* Windows Command Prompt using the command:

     npm install -g homebridge


## C.	Test Homebridge
Open a new Windows Command Prompt (yes, it must be a newly opened one - don't re-use the prompt from preceding steps) and enter the command:

     homebridge
You should see some text displayed and a QR code. If so, HomeBridge installed correctly.

## D. Install Plugin

Once homebridge is installed, you are ready to install your plugins. The following instructions are to install the "HomeSeer" plugin, but you can also follow a similar pattern for other plugins.

First, if you used a prior HomeSeer plugin, you must remove it before installing this plugin. To delete the prior version of this plugin use:

     npm -g uninstall homebridge-smartshades


## E. File Locations
You will now need to create a config.json file for homebridge. By default, this should be placed in the folder:
   c:\users\ _[Your Root User Directory]_ \\.homebridge
   
A sample configuration file is in the following directory: https://github.com/jvmahon/homebridge-smartshades/tree/master/Config.Sample
   
   
For each shade, you will need to add an entry in the "shades": section of the config.json file. Each shade entry consist of a name as well as a Blind Code. For example, see the entry:
`````
				{"name":"Kitchen Window", 	"code":"145.149-01"}
`````        
The "code" part of this entry comes from the NEO Smart Blind app. Go to the "Advanced Controls" section and look for the code labeled "Blind Code:".



## F. Operation
This plugin was designed for use with roller shades that have 1-way communication between the NEO controller and the shade. This means that the controller can instruct the shade to open or close, but it cannot track the position of the shade. That is, even though the shade has been instructed to open, another device (such as a hand-held remote) could change the shade position and the controller can't track this. In order to deal with this issue, I've designed the plugin so it is, effectively, stateless. That is, after a shade has been opened or closed from the iOS Home application, the Home application will show the shade as open or closed for about 20 seconds. After that, the shade is pictured as being at the 50% (half-way) position. I thought leaving the shade at 50% after an open or close operation better indicates that the controller does not really know if the shade is up or down.







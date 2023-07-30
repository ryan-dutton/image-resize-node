# About

Use this project to setup an image resizing micro-service using Node JS, Express framework and the Sharp image library. 

2 Routes are created
- "POST /"
	- Accepts a JSON-encoded body with 4 properties u,w,h and k  
		- u = The URL of the source image  
  		- w = The width of the image you want to create  
		- h = The height of the image you want to create  
		- k = The key stored in the .env to prevent unauthorised access
  		- Example:
      			`{ u: "https://www.somedomain.com/some_image.jpg", w: 200, h: 150, k: "secret" }`
	- Returns an PNG image body.
- "GET /" - Returns a simple test HTML/JS interface that demonstrates the forementioned POST route

# Example Deployment

To create a free service using this project, follow these steps:

## Step 1: Get FREE compute resources from Oracle
- Signup etc (https://www.oracle.com/cloud)

## Step 2: Deploy an EC2 instance on Oracle (Oracle Linux v9)
- Menu Button > Compute > Instances
- Click 'create instance' button
- give your intance a name e.g. 'image-resizer'
- Under 'image and shape' click 'edit' and change image to 'Oracle Linux 9'
- OPTIONAL : Under SSH keys either select 'generate' or paste your existing private key. You need to do this if you ever want to logon to the instance post creation.
- Click 'show advanced options' link
- In the advanced options management tab, click the paste cloud-init script radio button
- Paste in the init script below, replacing 'secret' with the actual secret you want to use for authentication  
	`#!/bin/bash`  
	`sudo firewall-cmd --permanent --zone=public --add-service=https`  
	`sudo firewall-cmd --reload`  
	`sudo dnf config-manager --set-enabled ol9_appstream`  
	`sudo dnf module enable nodejs:18 -y`  
	`sudo yum install -y nodejs`  
	`sudo dnf install git -y`  
	`sudo npm install pm2 -g`  
	`git clone https://github.com/ryan-dutton/image-resize-node.git`  
	`cd image-resize-node`  
	`sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl.key -out ssl.crt -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com"`  
	`npm update`  
	`sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u opc --hp /home/opc`  
	`echo "KEY=secret" > .env`  
	`sudo npx pm2 start index.js`  
	`sudo npx pm2 save`
- All other options can remain the same
- Click the 'create' button
- Make note of the public IP address

## Step 3: Enable access to web-server on the instance

Select your instance in the Oracle console
- Click on the Virtual Cloud Network
- Click on security lists
- Click on the default list
- Click add ingress rules
- Add a rule
	- Source CIDR = 0.0.0.0/0
	- IP Protocol = TCP
	- Destination Port Range = 433

## Step 4: Test the image resizing service
- In your web-browser visit https://[PUBLIC_IP]/
- Agree to the self-signed SSL certificate error
- Enter the 'secret'
- Click 'Submit' and see the resized image of Uluru.

Notes:
The result of the init script should be visible in : /var/log/cloud-init-output.log
The init script may take time to run. You can monitor with "tail -f /var/log/cloud-init-output.log"

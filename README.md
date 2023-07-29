Step 1: Get FREE compute resources from Oracle
- Signup etc

Step 2: Deploy an EC2 instance on Oracle (Oracle Linux v9)
- Deploy an instance with the following init-script

#/bin/bash
sudo firewall-cmd --permanent --zone=public --add-service=https
sudo firewall-cmd --reload
sudo dnf config-manager --set-enabled ol9_appstream
sudo dnf module enable nodejs:18 -y
sudo yum install -y nodejs
sudo dnf install git -y
sudo npm install pm2 -g
git clone https://github.com/ryan-dutton/image-resize-node.git
cd image-resize-node
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl.key -out ssl.crt -subj "/C=GB/ST=London/L=London/O=Global Security/OU=IT Department/CN=example.com"
npm update
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u opc --hp /home/opc

sudo npx pm2 start index.js
sudo npx pm2 save

Step 3: Enable access to web-server

View your instance in the Oracle console
Click on the Virtual Cloud Network
Click on security lists
Click on the default list
Click add ingress rules
Add a rule
  Source CIDR = 0.0.0.0/0
  IP Protocol = TCP
  Destination Port Range = 80,433
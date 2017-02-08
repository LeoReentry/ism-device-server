# ISM IoT Device Web UI
## Information

Node JS server for ISM device. This is used for configuration of the device.

## Usage

Clone this repo. Create a file  ```/etc/systemd/system/ismserver.service```, replacing [PATH_TO_REPO] with the full path to the cloned repository:

```shell
[Unit]
Description=ISM Device Server
After=network.target

[Service]
ExecStart=[PATH_TO_REPO]/server.js
Restart=always
User=debian
Group=debian
Restart=always
RestartSec=10s                       # Restart service after 10 seconds if node service crashes
SyslogIdentifier=ism-server
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=[PATH_TO_REPO]

[Install]
WantedBy=multi-user.target

```

Then run

```shell
cd ism-device-server
# Generate session secret using openssl
mkdir -p /home/debian/.ismdata/server
echo SESSION_SECRET=`openssl rand -base64 21` > /home/debian/.ismdata/server/.env
# Generate certificates
./gencert.sh
# Download dependencies
npm install
# Allow node to use ports lower than 1024 in user mode
sudo setcap 'cap_net_bind_service=+ep' $(readlink -f $(which node))
# Generate node daemon
sudo systemctl daemon-reload
sudo systemctl enable ismserver
sudo reboot now
```

Now, the server will run as a system daemon

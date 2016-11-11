# ISM IoT Device Web UI
## Information

Node JS server for ISM device. This is used for configuration of the device.

## Usage

Clone this repository and run

```shell
echo "SESSION_SECRET=[Your session secret here]" > .env
./gencert.sh
npm install
sudo node server.js
```

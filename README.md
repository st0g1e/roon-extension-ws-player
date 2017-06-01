# Websocket Roon Player
---------------------------
This is a websocket implementation of roon player

## Prerequisite

This is running on Node.js and socket.io. Below are the steps to install it.

* On Windows, install from the above link.
* On Mac OS, you can use [homebrew](http://brew.sh) to install Node.js.
* On Linux, you can use your distribution's package manager, but make sure it installs a recent Node.js. Otherwise just install from the above link.

Make sure you are running node 5.x or higher.
```sh
node -v
```

For example:

```sh
$ node -v
v5.10.1
```

## Installing roon-extension-ws-player

1. Download the repository.
* Go to [http-extension-ws-player](https://github.com/st0g1e/roon-extension-ws-player) page
* Click on "Clone or Download"
* Click "Download Zip"

2. Install
* Copy the downloaded zip to the desired folder
* unzip
* open terminal/command line and change directory to the folder
  ```
  cd [PATH]
  ```
* Install Dependencies
  
  If you have not installed socket.io, install it using the following command
  ```
  npm install socket.io
  ```
  
  then install the repository
  
  ```
  npm install
  ```
* (Optional) To remove the running log
  Comment console.log lines at
  - node_modules/node-roon-api/lib.js
  - node_modules/node-roon-api/moo.js ( REQUEST)
  - node_modules/node-roon-api/moomsj.js (CONTINUE and COMPLETE)

3. Running
  ```
  node .
  ```
  
4. Enable the extension
   In Roon, go to Settings -> Extensions and click on the "enable" button next to the roon-extension-http-api extension details.
   
## Running in Browser

Open a browser and go to the following link:
```
http://localhost:3002/
```

Port can be changed by changing the PORT variable in apps.js.
IP should be changed to where the repository is located

## Websocket calls
TO create your own client, the following are the available WS calls

The server (apps.js) emits zone whenever there is a change
```
io.emit("zones", zones);
```

For the image, the client sends the image_key to the server
```
socket.emit('getImage', image_key);
```

Then the server returns the image
```
io.emit('image', { image: true, buffer: body.toString('base64') });
```

The server also listen to client's operational calls:

Change Volume
```
  var vol = new Object();
  vol.volume = volume;
  vol.outputId = outputId;

  socket.emit('changeVolume', JSON.stringify(vol));

```

Back Button
```
  socket.emit('goPrev', zone_id);
```

Next Button
```
  socket.emit('goNext', zone_id);
```

Pause/Play Button
```
  socket.emit('goPlayPause', zone_id);
```

## Using Docker

### Building

```bash
docker build -t wsplayer .
```

### Running

```bash
docker run -p 3002 wsplayer
```

### Current issues
It doesn't seem to find the core, even if its running on the same host sharing the same network stack:
`docker run -p 3002:3002 --net=host wsplayer`


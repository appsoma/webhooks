# Webhooks

Execute arbitrary operating system commands (called "actions") in a sandbox when webhook calls are received.

## Usage
`./start [port|7788]` begins the webhooks server.

The server restarts automatically if you change the `webhooks-config.json` file.

## Try It!
Visit the URL of your webhook server to see a web page that lets you experiment.

To make an action that responds to a webhook:

1. Edit `webhooks-config.json`
2. In the `actions` section add this line:
```
"/mycommand": "echo this is my command!"
```
_You do NOT need to restart the server - it watches the config file automatically._
3. Visit `http://yourserver:7788/mycommand`.
4. Watch the console. It worked!


## Configuration

The file `webhooks-config.json` lets you set up commands to run when webhooks are received.

```
{
  actions: {
    "/helloworld": "echo hello world",
    "/badcommand": "commandDoesNotExist",
    "/getResult": {
      command: "echo This is a returned result!",
      stdout: true,
      stderr: true
    }
}
```

## Installation
```
git clone https://github.com/appsoma/webhooks.git
cd webhooks
npm install
```

## Subscribe to Live Webhook Feed

You can see all webhooks happen in real time by connecting to the server with a websocket client. Here is a working example: <a href="https://github.com/appsoma/webhooks/blob/master/index.html">index.html</a>

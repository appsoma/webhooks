# Webhooks

Execute arbitrary operating system commands (called "actions") in a sandbox when webhook calls are received.

## Usage
Start the server:
```
supervisor -n error webhooks.js
```

The server automatically adjusts itself if you change the `webhooks-config.json` file - no restart needed.

## Try It!
Visit the URL of your webhook server to see a web page that lets you experiment.

To make an action that responds to a webhook:

1. Edit `webhooks-config.json`
2. In the `actions` section add this line:
  ```
  "/mycommand": "echo this is my command!"
  ```
  *<sub>You do NOT need to restart the server - it watches the config file automatically.</sub>*

3. Visit `http://yourserver:7788/mycommand`.
4. Watch the console. It worked!


## Attaching Actions

The file `webhooks-config.json` lets you set up commands to run when webhooks are received.

### webhooks-config.json

```
{
  actions: {
    "/helloworld": "echo hello world",
    "/badcommand": "commandDoesNotExist",
    "/getResult": {
      command: "echo This is a returned result. My uid is $webhook_uid",
      respond: true
    }
}
```

### Responses

By default, webhooks.js responds with code 200 and "OK" in the response body.

Setting `respond: true` makes the HTTP response wait until the command's process is complete, and then causes it to pass back:
```
{
  "uid": 132,
  "stdout": "this is my stdout\n",
  "stderr": "any errors show here",
  "exitCode": 0
}
```

### Environment Variables

The following environment variables will be available to any command
you run:
```
webhook_path      the path of the webhook
webhook_command   the command being run
webhook_uid       the unique id of this webhook call
webhook_{key}     each key in the webhook's URL will get an env var
```

## Installation
```
git clone https://github.com/appsoma/webhooks.git
cd webhooks
npm install
```

## Subscribe to Live Webhook Feed

You can see all webhooks happen in real time by connecting to the server with a websocket client. Here is a working example: <a href="https://github.com/appsoma/webhooks/blob/master/index.html">index.html</a>

import { BrowserWindow, Data, ipcMain } from "electron";
import { Peer, DataConnection } from "peerjs";
import { euvoumematar } from ".";
const WebRTC = require("wrtc");
const fetch = require("node-fetch");
const WebSocket = require("ws");
const FileReader = require("filereader");

type DataPackage = {
  channel: string;
  message: any;
};

const polyfills = { fetch, WebSocket, WebRTC, FileReader };

export class p2p_daemon {
  private self: Peer;
  connection?: DataConnection;
  constructor(window: BrowserWindow) {
    this.window = window;
    this.self = new Peer({ secure: true, polyfills: polyfills });
    this.self.on("open", (id) => {
      console.log(`we're in baby! with the id:${id}`);
    });
    this.self.on("connection", this.connection_recieved);
    ipcMain.handle("p2p_send", (e, channel, message) => {
      this.send_message(channel, message);
    });
  }
  private connection_recieved(connection: DataConnection) {
    console.log("Recieved a connection from " + connection.peer);
    this.connection = connection;

    const func = function (dataPackage: any) {
      let data = JSON.parse(dataPackage) as DataPackage;

      console.log(
        `(RECIEVE) CHANNEL: ${data.channel} MESSAGE: ${data.message}`
      );

      //checks for valid data
      if (data.channel === undefined || data.channel === null) return;
      if (data.message === undefined || data.message === null) return;

      euvoumematar(data.channel, data.message);
    }.bind(this);
    this.connection.on("data", func);
  }
  connect(id: string) {
    this.connection = this.self.connect(id, { serialization: "json" });
  }
  send_message(channel: string, message: any) {
    console.log(`(SEND) CHANNEL: ${channel} MESSAGE: ${message}`);
    this.connection?.send(
      JSON.stringify({
        channel: channel,
        message: message,
      })
    );
  }
}

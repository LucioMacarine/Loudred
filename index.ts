/*
    Loudred Bot - A discord music bot.
    Copyright (C) 2023  Lucio Macarine

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { app, BrowserWindow, ipcMain, ipcRenderer } from "electron";
import * as path from "path";

import { get_channels, get_guilds } from "./ipc_commands/commands";
import { Audio, AudioTools } from "./ipc_commands/audio";

import {
  Channel,
  Client,
  Events,
  GatewayIntentBits,
  Guild,
  GuildBasedChannel,
} from "discord.js";

import { Queue } from "./ipc_commands/queue";
import { queueSettings, trackMetadata, trackStatus } from "./types";

const dcclient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let audio: Audio;

let queue: Queue;

let guild: Guild;

let window: BrowserWindow;

app.whenReady().then(() => {
  window = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  window.loadFile("./window/index.html");
});

ipcMain.handle("change_channel", (e, channelId: string) => {
  audio.ChangeChannel(channelId);
});

ipcMain.handle("change_guild", (e, guildId) => {
  audio?.destroy();
  audio = new Audio(dcclient, guildId, (trackStatus: trackStatus) =>
    sendTrackUpdate(trackStatus)
  );

  window.webContents.send("track_update", {
    current_position: 0,
    connection_status: "Unavaliable",
    player_status: "Not Started",
    track_metadata: {
      title:
        "Playback will start if a guild and a channel are selected and a track is added to the queue",
      duration: 100,
    } as trackMetadata,
  } as trackStatus);

  queue = new Queue(audio, (queue: trackMetadata[]) => sendQueueUpdate(queue));

  queue.update();

  //@ts-ignore invalid guilds are checked when creating a new Audio()
  guild = dcclient.guilds.cache.get(guildId);
});

ipcMain.handle("queue_play", (e) => {
  queue.play();
});

ipcMain.handle("queue_next", (e) => {
  queue.moveNext();
});

ipcMain.handle("queue_prev", (e) => {
  queue.moveBack();
});

ipcMain.handle("queue_drop_track", (e, index) => {
  queue.dropTrack(index);
});

ipcMain.handle("queue_swap_track", (e, prevIndex, newIndex) => {
  queue.moveTrack(prevIndex, newIndex);
});

ipcMain.handle("player_push_track", (e, track: trackMetadata) => {
  if (queue === undefined) {
    window_alert("No queue to add track to (yet)");
    return;
  }
  queue.pushTrack(track);
});

ipcMain.handle("get_channels", (e, guild) => {
  return get_channels(dcclient, guild);
});

ipcMain.handle("get_guilds", (e) => {
  return get_guilds(dcclient);
});

ipcMain.handle("get_video_metadata", (e, query) => {
  return AudioTools.getMetadata(query);
});

ipcMain.handle("player_change_settings", (e, settings) => {
  audio.ChangeSettings(settings);
});

ipcMain.handle("queue_change_settings", (e, settings: queueSettings) => {
  if (queue === undefined) {
    window_alert("Cannot change settings of a non-existant queue");
    return;
  }
  queue.changeSettings(settings);
});

ipcMain.handleOnce("set_token", (e, token) => {
  wait();
  dcclient.login(token);
});

function sendTrackUpdate(trackStatus: trackStatus) {
  window.webContents.send("track_update", trackStatus);
}

function sendQueueUpdate(queue: trackMetadata[]) {
  window.webContents.send("queue_update", queue);
}

function window_alert(message: string) {
  window.webContents.send("window_alert", message);
}

dcclient.once("ready", async (c) => {
  window.webContents.send("client_ready");

  done();
});

export function wait() {
  window.webContents.send("wait");
}

export function done() {
  window.webContents.send("done");
}

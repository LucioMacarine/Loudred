/*
    Loudred Bot - A Discord sound player.
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

import { Guild } from "discord.js";
import { playerSettings, queueSettings, trackMetadata } from "./types";
import { contextBridge, ipcRenderer } from "electron";

//False if running the bot locally, true if controlling a remote bot
let remote: boolean = false;

ipcRenderer.on("p2p_incoming_invoke", (e, incoming_channel: string, message) => {
  ipcRenderer.invoke(incoming_channel, message)
})

const on = (channel: string, callback: any, ...params: any[]): any => {
  if (false) {
    return ipcRenderer.on(channel, callback, ...params);
  } else {
    return ipcRenderer.on(
      "p2p_incoming",
      (e, incoming_channel: string, message) => {
        console.log(`checking for ${channel}, found ${incoming_channel}`)
        if (incoming_channel == channel) {
          callback(e, message);
        }
      }, ...params
    );
  }
}

const invoke = (channel: string, ...params: any[]): any => {
  if (!remote) {
    return ipcRenderer.invoke(channel, ...params);
  } else {
    return ipcRenderer.invoke("p2p_send", channel, ...params);
  }
}

contextBridge.exposeInMainWorld("selectavision", {
  set_token: (token: string) => {
    if (token.startsWith("loudredremote://")) {
      const id_b64 = token.replace("loudredremote://", "");
      const buff = Buffer.from(id_b64, "base64");
      const id = buff.toString("utf-8");

      //wait();
      remote = true;
      ipcRenderer.invoke("p2p_start", id);
    } else {
      ipcRenderer.invoke("set_token", token);
    }
  },
  client_ready: (callback: any) => on("client_ready", callback),
  get_guilds: () => invoke("get_guilds"),
  get_channels: (guild: Guild) => invoke("get_channels", guild),
  get_metadata: (query: string) => invoke("get_video_metadata", query),
  queue_push_track: (track: trackMetadata) =>
    invoke("player_push_track", track),
  player_change_settings: (settings: playerSettings) =>
    invoke("player_change_settings", settings),
  track_update: (callback: any) => on("track_update", callback),
  queue_update: (callback: any) => on("queue_update", callback),
  queue_play: () => invoke("queue_play"),
  queue_next: () => invoke("queue_next"),
  queue_prev: () => invoke("queue_prev"),
  queue_drop_track: (index: number) => invoke("queue_drop_track", index),
  queue_swap_track: (prevIndex: number, newIndex: number) =>
    invoke("queue_swap_track", prevIndex, newIndex),
  wait: (callback: any) => on("wait", callback),
  done: (callback: any) => on("done", callback),
  change_channel: (channelId: string) => invoke("change_channel", channelId),
  change_guild: (guildId: string) => invoke("change_guild", guildId),
  queue_change_settings: (settings: queueSettings) =>
    invoke("queue_change_settings", settings),
  window_alert: (callback: any) => on("window_alert", callback),
  get_client_info: () => invoke("get_client_info"),
  open_link: (link: string) => invoke("open_link", link), //perigoso pra caralho com o sv remotokkkkkkkkkkk
});

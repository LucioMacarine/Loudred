import { Guild } from "discord.js";
import { playerSettings, queueSettings, trackMetadata } from "./types";
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("selectavision", {
  client_ready: (callback: any) => ipcRenderer.on("client_ready", callback),
  set_token: (token: string) => ipcRenderer.invoke("set_token", token),
  get_guilds: () => ipcRenderer.invoke("get_guilds"),
  get_channels: (guild: Guild) => ipcRenderer.invoke("get_channels", guild),
  get_metadata: (query: string) =>
    ipcRenderer.invoke("get_video_metadata", query),
  queue_push_track: (track: trackMetadata) =>
    ipcRenderer.invoke("player_push_track", track),
  player_change_settings: (settings: playerSettings) =>
    ipcRenderer.invoke("player_change_settings", settings),
  track_update: (callback: any) => ipcRenderer.on("track_update", callback),
  queue_update: (callback: any) => ipcRenderer.on("queue_update", callback),
  queue_play: () => ipcRenderer.invoke("queue_play"),
  queue_next: () => ipcRenderer.invoke("queue_next"),
  queue_prev: () => ipcRenderer.invoke("queue_prev"),
  queue_drop_track: (index: number) =>
    ipcRenderer.invoke("queue_drop_track", index),
  queue_swap_track: (prevIndex: number, newIndex: number) =>
    ipcRenderer.invoke("queue_swap_track", prevIndex, newIndex),
  wait: (callback: any) => ipcRenderer.on("wait", callback),
  done: (callback: any) => ipcRenderer.on("done", callback),
  change_channel: (channelId: string) =>
    ipcRenderer.invoke("change_channel", channelId),
  change_guild: (guildId: string) =>
    ipcRenderer.invoke("change_guild", guildId),
  queue_change_settings: (settings: queueSettings) =>
    ipcRenderer.invoke("queue_change_settings", settings),
  window_alert: (callback: any) => ipcRenderer.on("window_alert", callback),
});

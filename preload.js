"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("selectavision", {
    client_ready: (callback) => electron_1.ipcRenderer.on("client_ready", callback),
    set_token: (token) => electron_1.ipcRenderer.invoke("set_token", token),
    get_guilds: () => electron_1.ipcRenderer.invoke("get_guilds"),
    get_channels: (guild) => electron_1.ipcRenderer.invoke("get_channels", guild),
    get_metadata: (query) => electron_1.ipcRenderer.invoke("get_video_metadata", query),
    queue_push_track: (track) => electron_1.ipcRenderer.invoke("player_push_track", track),
    player_change_settings: (settings) => electron_1.ipcRenderer.invoke("player_change_settings", settings),
    track_update: (callback) => electron_1.ipcRenderer.on("track_update", callback),
    queue_update: (callback) => electron_1.ipcRenderer.on("queue_update", callback),
    queue_play: () => electron_1.ipcRenderer.invoke("queue_play"),
    queue_next: () => electron_1.ipcRenderer.invoke("queue_next"),
    queue_prev: () => electron_1.ipcRenderer.invoke("queue_prev"),
    queue_drop_track: (index) => electron_1.ipcRenderer.invoke("queue_drop_track", index),
    queue_swap_track: (prevIndex, newIndex) => electron_1.ipcRenderer.invoke("queue_swap_track", prevIndex, newIndex),
    wait: (callback) => electron_1.ipcRenderer.on("wait", callback),
    done: (callback) => electron_1.ipcRenderer.on("done", callback),
    change_channel: (channelId) => electron_1.ipcRenderer.invoke("change_channel", channelId),
    change_guild: (guildId) => electron_1.ipcRenderer.invoke("change_guild", guildId),
    queue_change_settings: (settings) => electron_1.ipcRenderer.invoke("queue_change_settings", settings),
    window_alert: (callback) => electron_1.ipcRenderer.on("window_alert", callback),
});

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.done = exports.wait = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const commands_1 = require("./ipc_commands/commands");
const audio_1 = require("./ipc_commands/audio");
const discord_js_1 = require("discord.js");
const queue_1 = require("./ipc_commands/queue");
const dcclient = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildVoiceStates],
});
let audio;
let queue;
let guild;
let window;
electron_1.app.whenReady().then(() => {
    window = new electron_1.BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });
    window.loadFile("./window/index.html");
});
electron_1.ipcMain.handle("change_channel", (e, channelId) => {
    audio.ChangeChannel(channelId);
});
electron_1.ipcMain.handle("change_guild", (e, guildId) => {
    audio === null || audio === void 0 ? void 0 : audio.destroy();
    audio = new audio_1.Audio(dcclient, guildId, (trackStatus) => sendTrackUpdate(trackStatus));
    window.webContents.send("track_update", {
        current_position: 0,
        connection_status: "Unavaliable",
        player_status: "Not Started",
        track_metadata: {
            title: "Playback will start if a guild and a channel are selected and a track is added to the queue",
            duration: 100,
        },
    });
    queue = new queue_1.Queue(audio, (queue) => sendQueueUpdate(queue));
    queue.update();
    //@ts-ignore invalid guilds are checked when creating a new Audio()
    guild = dcclient.guilds.cache.get(guildId);
});
electron_1.ipcMain.handle("queue_play", (e) => {
    queue.play();
});
electron_1.ipcMain.handle("queue_next", (e) => {
    queue.moveNext();
});
electron_1.ipcMain.handle("queue_prev", (e) => {
    queue.moveBack();
});
electron_1.ipcMain.handle("queue_drop_track", (e, index) => {
    queue.dropTrack(index);
});
electron_1.ipcMain.handle("queue_swap_track", (e, prevIndex, newIndex) => {
    queue.moveTrack(prevIndex, newIndex);
});
electron_1.ipcMain.handle("player_push_track", (e, track) => {
    if (queue === undefined) {
        window_alert("No queue to add track to (yet)");
        return;
    }
    queue.pushTrack(track);
});
electron_1.ipcMain.handle("get_channels", (e, guild) => {
    return (0, commands_1.get_channels)(dcclient, guild);
});
electron_1.ipcMain.handle("get_guilds", (e) => {
    return (0, commands_1.get_guilds)(dcclient);
});
electron_1.ipcMain.handle("get_video_metadata", (e, query) => {
    return audio_1.AudioTools.getMetadata(query);
});
electron_1.ipcMain.handle("player_change_settings", (e, settings) => {
    audio.ChangeSettings(settings);
});
electron_1.ipcMain.handle("queue_change_settings", (e, settings) => {
    if (queue === undefined) {
        window_alert("Cannot change settings of a non-existant queue");
        return;
    }
    queue.changeSettings(settings);
});
electron_1.ipcMain.handleOnce("set_token", (e, token) => {
    wait();
    dcclient.login(token);
});
function sendTrackUpdate(trackStatus) {
    window.webContents.send("track_update", trackStatus);
}
function sendQueueUpdate(queue) {
    window.webContents.send("queue_update", queue);
}
function window_alert(message) {
    window.webContents.send("window_alert", message);
}
dcclient.once("ready", (c) => __awaiter(void 0, void 0, void 0, function* () {
    window.webContents.send("client_ready");
    done();
}));
function wait() {
    window.webContents.send("wait");
}
exports.wait = wait;
function done() {
    window.webContents.send("done");
}
exports.done = done;

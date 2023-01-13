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
exports.Audio = exports.AudioTools = void 0;
const child_process_1 = require("child_process");
const util = __importStar(require("util"));
const exec = util.promisify(require("child_process").exec);
const voice_1 = require("@discordjs/voice");
const index_1 = require("../index");
class AudioTools {
    static createStreamFromYoutube(query, ffmpeg_options_before = "", ffmpeg_options = "") {
        return __awaiter(this, void 0, void 0, function* () {
            let proc = (0, child_process_1.spawn)("yt-dlp", [
                "-f",
                '"bestaudio/ba*/0"',
                "-o",
                "-",
                "--external-downloader",
                "ffmpeg",
                "--external-downloader-args",
                `ffmpeg_i1:"-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5 ${ffmpeg_options_before}"`,
                "--external-downloader-args",
                `ffmpeg:"-f opus -c:a libopus ${ffmpeg_options}"`,
                query,
            ], { shell: true, stdio: ["pipe", "pipe", "inherit"] });
            const { stream, type } = yield (0, voice_1.demuxProbe)(proc.stdout);
            const resource = (0, voice_1.createAudioResource)(proc.stdout, {
                inlineVolume: false,
                inputType: type,
            });
            return resource;
        });
    }
    static getMetadata(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const filteredQuery = query.replace("'", "");
            const { stdout, stderr } = yield exec(`yt-dlp --yes-playlist --flat-playlist --print pre_process:\'{"id": %(id)j, "title": %(title)j, "upload_date": %(upload_date)j, "channel": %(channel)j, "duration_string": %(duration_string)j, "duration": %(duration)j, "view_count": %(view_count)j, "playlist_id": %(playlist_id)j, "playlist_title": %(playlist_title)j, "playlist_count": %(playlist_count)j, "playlist_index": %(playlist_index)j, "webpage_url_domain": %(webpage_url_domain)j, "original_url": %(original_url)j}\' '${filteredQuery}'`);
            const videos = stdout.trim().split(/\r\n|\r|\n/);
            let jsonvideos = [];
            videos.forEach((video) => {
                jsonvideos.push(JSON.parse(video));
            });
            return jsonvideos;
        });
    }
}
exports.AudioTools = AudioTools;
class Audio {
    constructor(client, guildId, updateCallback) {
        this.Index = 0;
        this.Query = "";
        this.Ready = false;
        this.Settings = {
            start_pos: 0,
            pauseState: false,
            ffmpeg_options_before: "",
            ffmpeg_options_after: "",
        };
        this.Client = client;
        var guild = client.guilds.cache.get(guildId);
        if (guild === undefined)
            throw new Error("Guild not found in client cache");
        this.Guild = guild;
        this.UpdateCallback = updateCallback;
        this.TrackTime = new Date(0);
    }
    initialize(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.Player = (0, voice_1.createAudioPlayer)({
                behaviors: { noSubscriber: voice_1.NoSubscriberBehavior.Pause },
            });
            const connection = (0, voice_1.joinVoiceChannel)({
                guildId: this.Guild.id,
                channelId: channelId,
                adapterCreator: this.Guild.voiceAdapterCreator,
            });
            connection.subscribe(this.Player);
            this.Player.on(voice_1.AudioPlayerStatus.Playing, () => this.CountTime());
            connection.on("stateChange", () => this.Update());
            this.Player.on("stateChange", () => this.Update());
            this.Ready = true;
        });
    }
    //safely destroys the connection
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = (0, voice_1.getVoiceConnection)(this.Guild.id);
            if (connection !== undefined) {
                connection.disconnect();
                connection.removeAllListeners();
                connection.destroy();
            }
            if (this.Player !== undefined) {
                this.Player.stop();
                this.Player.removeAllListeners();
            }
        });
    }
    PlayFromQuery(query) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.Player) === null || _a === void 0 ? void 0 : _a.stop();
            const date = new Date(0);
            this.TrackTime = date;
            const metadata = yield AudioTools.getMetadata(query);
            this.TrackMetadata = metadata[0];
            this.Query = query;
            let resource = yield AudioTools.createStreamFromYoutube(query);
            (_b = this.Player) === null || _b === void 0 ? void 0 : _b.play(resource);
        });
    }
    ChangeSettings(settings) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (settings.pauseState !== undefined) {
                if (settings.pauseState)
                    this.Pause();
                else
                    this.UnPause();
                return;
            }
            (0, index_1.wait)();
            let time;
            if (settings.start_pos !== undefined) {
                const date = new Date(0);
                date.setTime(settings.start_pos * 1000);
                this.TrackTime = date;
                time = date;
            }
            else
                time = this.TrackTime;
            (_a = this.Player) === null || _a === void 0 ? void 0 : _a.stop();
            const resource = yield AudioTools.createStreamFromYoutube(this.Query, ((_b = settings.ffmpeg_options_before) !== null && _b !== void 0 ? _b : "") +
                ` -ss ${this.convertToffmpegTime(time)}`, (_c = settings.ffmpeg_options_after) !== null && _c !== void 0 ? _c : "");
            (_d = this.Player) === null || _d === void 0 ? void 0 : _d.play(resource);
            (0, index_1.done)();
        });
    }
    Pause() {
        var _a;
        (_a = this.Player) === null || _a === void 0 ? void 0 : _a.pause();
    }
    UnPause() {
        var _a;
        (_a = this.Player) === null || _a === void 0 ? void 0 : _a.unpause();
    }
    CountTime() {
        var _a;
        //To adjust the precision of the counter change the add value to TrackTime
        //and the delay on miliseconds on the timeout
        if (((_a = this.Player) === null || _a === void 0 ? void 0 : _a.state.status.toLowerCase()) !== "playing")
            return;
        this.TrackTime.setMilliseconds(this.TrackTime.getMilliseconds() + 500);
        setTimeout(() => {
            this.CountTime();
        }, 500);
        this.Update();
    }
    ChangeChannel(channelId) {
        this.Pause();
        const connection = (0, voice_1.getVoiceConnection)(this.Guild.id);
        if (connection === undefined) {
            //audio is probably not initialized
            this.initialize(channelId).then(() => { var _a; 
            //@ts-ignore player is created on initialization
            return (_a = (0, voice_1.getVoiceConnection)(this.Guild.id)) === null || _a === void 0 ? void 0 : _a.subscribe(this.Player); });
        }
        else {
            connection.disconnect();
            connection.rejoin({
                channelId: channelId,
                selfDeaf: true,
                selfMute: false,
            });
            //@ts-ignore a connection without a player seems unlikely
            connection.subscribe(this.Player);
        }
        this.UnPause();
    }
    Update() {
        var _a, _b;
        this.UpdateCallback({
            current_position: this.TrackTime.getTime() / 1000,
            track_metadata: this.TrackMetadata,
            connection_status: (_a = (0, voice_1.getVoiceConnection)(this.Guild.id)) === null || _a === void 0 ? void 0 : _a.state.status,
            player_status: (_b = this.Player) === null || _b === void 0 ? void 0 : _b.state.status,
        });
    }
    convertToffmpegTime(date) {
        //@ts-ignore
        return `${date.getUTCHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
    }
}
exports.Audio = Audio;

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

import { spawn } from "child_process";
import * as util from "util";
import * as events from "events";
const exec = util.promisify(require("child_process").exec);
import {
  demuxProbe,
  createAudioResource,
  AudioResource,
  AudioPlayer,
  joinVoiceChannel,
  VoiceConnection,
  createAudioPlayer,
  NoSubscriberBehavior,
  AudioPlayerPlayingState,
  VoiceConnectionStatus,
  getVoiceConnection,
  AudioPlayerStatus,
} from "@discordjs/voice";
import {
  Client,
  GatewayIntentBits,
  Guild,
  Channel,
  ThreadMemberFlagsBitField,
} from "discord.js";
import { done, wait } from "../index";
import { playerSettings, trackMetadata, trackStatus } from "../types";

export class AudioTools {
  static async createStreamFromYoutube(
    query: string,
    ffmpeg_options_before: string = "",
    ffmpeg_options: string = ""
  ): Promise<AudioResource> {
    let proc = spawn(
      "yt-dlp",
      [
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
      ],
      { shell: true, stdio: ["pipe", "pipe", "inherit"] }
    );

    const { stream, type } = await demuxProbe(proc.stdout);

    const resource = createAudioResource(proc.stdout, {
      inlineVolume: false,
      inputType: type,
    });

    return resource;
  }

  static async getMetadata(query: string): Promise<trackMetadata[]> {
    const filteredQuery = query.replace("'", "");
    const { stdout, stderr } = await exec(
      `yt-dlp --yes-playlist --flat-playlist --print pre_process:\'{"id": %(id)j, "title": %(title)j, "upload_date": %(upload_date)j, "channel": %(channel)j, "duration_string": %(duration_string)j, "duration": %(duration)j, "view_count": %(view_count)j, "playlist_id": %(playlist_id)j, "playlist_title": %(playlist_title)j, "playlist_count": %(playlist_count)j, "playlist_index": %(playlist_index)j, "webpage_url_domain": %(webpage_url_domain)j, "original_url": %(original_url)j}\' '${filteredQuery}'`
    );
    const videos = stdout.trim().split(/\r\n|\r|\n/);
    let jsonvideos: trackMetadata[] = [];
    videos.forEach((video: string) => {
      jsonvideos.push(JSON.parse(video) as trackMetadata);
    });
    return jsonvideos;
  }
}

export class Audio {
  Index: number = 0;
  Client: Client;
  Guild: Guild;
  Player: AudioPlayer | undefined;
  TrackTime: Date;
  UpdateCallback: Function;
  TrackMetadata: trackMetadata | undefined;
  Query: string = "";
  Ready: boolean = false;
  Settings: playerSettings = {
    start_pos: 0,
    pauseState: false,
    ffmpeg_options_before: "",
    ffmpeg_options_after: "",
  };

  constructor(client: Client, guildId: string, updateCallback: Function) {
    this.Client = client;
    var guild = client.guilds.cache.get(guildId);
    if (guild === undefined) throw new Error("Guild not found in client cache");
    this.Guild = guild;
    this.UpdateCallback = updateCallback;
    this.TrackTime = new Date(0);
  }

  async initialize(channelId: string) {
    this.Player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    const connection = joinVoiceChannel({
      guildId: this.Guild.id,
      channelId: channelId,
      adapterCreator: this.Guild.voiceAdapterCreator,
    });
    connection.subscribe(this.Player);
    this.Player.on(AudioPlayerStatus.Playing, () => this.CountTime());
    connection.on("stateChange", () => this.Update());
    this.Player.on("stateChange", () => this.Update());
    this.Ready = true;
  }

  //safely destroys the connection
  async destroy() {
    const connection = getVoiceConnection(this.Guild.id);
    if (connection !== undefined) {
      connection.disconnect();
      connection.removeAllListeners();
      connection.destroy();
    }
    if (this.Player !== undefined) {
      this.Player.stop();
      this.Player.removeAllListeners();
    }
  }

  async PlayFromQuery(query: string) {
    this.Player?.stop();
    const date = new Date(0);
    this.TrackTime = date;
    const metadata = await AudioTools.getMetadata(query);
    this.TrackMetadata = metadata[0];
    this.Query = query;
    let resource = await AudioTools.createStreamFromYoutube(query);
    this.Player?.play(resource);
  }

  async ChangeSettings(settings: playerSettings) {
    if (settings.pauseState !== undefined) {
      if (settings.pauseState) this.Pause();
      else this.UnPause();
      return;
    }
    wait();
    let time: Date;
    if (settings.start_pos !== undefined) {
      const date = new Date(0);
      date.setTime(settings.start_pos * 1000);
      this.TrackTime = date;
      time = date;
    } else time = this.TrackTime;
    this.Player?.stop();
    const resource = await AudioTools.createStreamFromYoutube(
      this.Query,
      (settings.ffmpeg_options_before ?? "") +
        ` -ss ${this.convertToffmpegTime(time)}`,
      settings.ffmpeg_options_after ?? ""
    );
    this.Player?.play(resource);
    done();
  }

  Pause() {
    this.Player?.pause();
  }

  UnPause() {
    this.Player?.unpause();
  }

  CountTime() {
    //To adjust the precision of the counter change the add value to TrackTime
    //and the delay on miliseconds on the timeout
    if (this.Player?.state.status.toLowerCase() !== "playing") return;
    this.TrackTime.setMilliseconds(this.TrackTime.getMilliseconds() + 500);
    setTimeout(() => {
      this.CountTime();
    }, 500);
    this.Update();
  }

  ChangeChannel(channelId: string) {
    this.Pause();
    const connection = getVoiceConnection(this.Guild.id);
    if (connection === undefined) {
      //audio is probably not initialized
      this.initialize(channelId).then(() =>
        //@ts-ignore player is created on initialization
        getVoiceConnection(this.Guild.id)?.subscribe(this.Player)
      );
    } else {
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
    this.UpdateCallback({
      current_position: this.TrackTime.getTime() / 1000,
      track_metadata: this.TrackMetadata,
      connection_status: getVoiceConnection(this.Guild.id)?.state.status,
      player_status: this.Player?.state.status,
    } as trackStatus);
  }

  private convertToffmpegTime(date: Date): string {
    //@ts-ignore
    return `${date.getUTCHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;
  }
}

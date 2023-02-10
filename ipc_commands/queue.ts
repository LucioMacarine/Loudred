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

import {
  AudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
  AudioPlayerState,
  VoiceConnectionStatus,
  demuxProbe,
} from "@discordjs/voice";
import { Channel } from "discord.js";
import { done, wait } from "../index";
import { queueSettings, trackMetadata } from "../types";
import { Audio, AudioTools } from "./audio";

export class Queue {
  CurrentTrack: any = [];
  Dump: any[] = [];
  Queue: trackMetadata[] = [];
  Audio: Audio;
  QueueSettings: queueSettings = {
    repeat_track: false,
  };
  Started: boolean = false;
  Callback: Function;

  constructor(audio: Audio, updateCallback: Function) {
    this.Audio = audio;
    this.Callback = updateCallback;
    this.QueueSettings = { repeat_track: false };
  }

  //only activates on the end of the track
  moveNextEvent = () => {
    if (
      //the + 1 is to give some space for errors in couting
      this.Audio.TrackTime.getTime() / 1000 + 1 <
        this.Audio.TrackMetadata.duration &&
      this.Audio.TrackMetadata?.duration !== "NA"
    )
      return;
    if (this.QueueSettings.repeat_track) {
      this.Audio.ChangeSettings({ start_pos: 0 });
      return;
    }
    this.moveNext();
  };

  async moveNext() {
    if (this.Queue.length <= 1) {
      return;
    }
    console.log("MOVING NEXT");
    this.Audio.Player?.off(AudioPlayerStatus.Idle, this.moveNextEvent);
    this.Dump.push(this.Queue.shift());
    this.update();
    await this.play();
  }

  async moveBack() {
    if (this.Dump.length <= 0) return;
    console.log("MOVING BACKWARDS");
    this.Audio.Player?.off(AudioPlayerStatus.Idle, this.moveNextEvent);
    this.Queue.unshift(this.Dump.pop());
    this.update();
    await this.play();
  }

  async play() {
    wait();
    await this.Audio.PlayFromQuery(this.Queue[0].original_url);
    this.Audio.Player?.on(AudioPlayerStatus.Idle, this.moveNextEvent);
    done();
  }

  async pushTrack(track: trackMetadata) {
    if (!this.Audio.Ready) return;

    this.Queue.push(track);
    this.update();

    if (!this.Started) {
      this.Started = true;
      await this.play();
      return;
    }

    //quickstart in case the queue ends and the user adds another track later
    //NOTE: PLEASE DON'T IF TRACK DURATION is UNKNOWN
    //@ts-ignore trust me bro
    if (this.Audio.TrackMetadata?.duration !== "NA") {
      this.moveNextEvent();
    }
  }

  async changeSettings(settings: queueSettings) {
    this.QueueSettings = settings;
  }

  moveTrack(index: number, newIndex: number) {
    //https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
    this.Queue.splice(newIndex, 0, this.Queue.splice(index, 1)[0]);
    this.update();
  }

  dropTrack(index: number) {
    this.Queue.splice(index, 1);
    this.update();
  }

  update() {
    this.Callback(this.Queue);
  }
}

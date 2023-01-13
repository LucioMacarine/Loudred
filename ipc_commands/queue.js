"use strict";
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
exports.Queue = void 0;
const voice_1 = require("@discordjs/voice");
const index_1 = require("../index");
class Queue {
    constructor(audio, updateCallback) {
        this.CurrentTrack = [];
        this.Dump = [];
        this.Queue = [];
        this.QueueSettings = {
            repeat_track: false,
        };
        this.Started = false;
        //only activates on the end of the track
        this.moveNextEvent = () => {
            var _a;
            if (
            //the + 1 is to give some space for errors in couting
            this.Audio.TrackTime.getTime() / 1000 + 1 <
                this.Audio.TrackMetadata.duration &&
                ((_a = this.Audio.TrackMetadata) === null || _a === void 0 ? void 0 : _a.duration) !== "NA")
                return;
            if (this.QueueSettings.repeat_track) {
                this.Audio.ChangeSettings({ start_pos: 0 });
                return;
            }
            this.moveNext();
        };
        this.Audio = audio;
        this.Callback = updateCallback;
        this.QueueSettings = { repeat_track: false };
    }
    moveNext() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Queue.length <= 1) {
                return;
            }
            console.log("MOVING NEXT");
            (_a = this.Audio.Player) === null || _a === void 0 ? void 0 : _a.off(voice_1.AudioPlayerStatus.Idle, this.moveNextEvent);
            this.Dump.push(this.Queue.shift());
            this.update();
            yield this.play();
        });
    }
    moveBack() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.Dump.length <= 0)
                return;
            console.log("MOVING BACKWARDS");
            (_a = this.Audio.Player) === null || _a === void 0 ? void 0 : _a.off(voice_1.AudioPlayerStatus.Idle, this.moveNextEvent);
            this.Queue.unshift(this.Dump.pop());
            this.update();
            yield this.play();
        });
    }
    play() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (0, index_1.wait)();
            yield this.Audio.PlayFromQuery(this.Queue[0].original_url);
            (_a = this.Audio.Player) === null || _a === void 0 ? void 0 : _a.on(voice_1.AudioPlayerStatus.Idle, this.moveNextEvent);
            (0, index_1.done)();
        });
    }
    pushTrack(track) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.Audio.Ready)
                return;
            this.Queue.push(track);
            this.update();
            if (!this.Started) {
                this.Started = true;
                yield this.play();
                return;
            }
            //quickstart in case the queue ends and the user adds another track later
            //NOTE: PLEASE DON'T IF TRACK DURATION is UNKNOWN
            //@ts-ignore trust me bro
            if (((_a = this.Audio.TrackMetadata) === null || _a === void 0 ? void 0 : _a.duration) !== "NA") {
                this.moveNextEvent();
            }
        });
    }
    changeSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.QueueSettings = settings;
        });
    }
    moveTrack(index, newIndex) {
        //https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
        this.Queue.splice(newIndex, 0, this.Queue.splice(index, 1)[0]);
        this.update();
    }
    dropTrack(index) {
        this.Queue.splice(index, 1);
        this.update();
    }
    update() {
        this.Callback(this.Queue);
    }
}
exports.Queue = Queue;

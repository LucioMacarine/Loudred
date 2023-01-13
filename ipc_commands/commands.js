"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get_channels = exports.get_guilds = void 0;
function get_guilds(client) {
    let guilds = [];
    client.guilds.cache.forEach((x) => {
        guilds.push(x);
    });
    return guilds;
}
exports.get_guilds = get_guilds;
function get_channels(client, id) {
    let channels = [];
    client.guilds.fetch(id).then((guild) => {
        guild.channels.cache.forEach((channel) => {
            channels.push(channel);
        });
    });
    return channels;
}
exports.get_channels = get_channels;

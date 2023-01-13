import {
  Client,
  Channel,
  Guild,
  TextChannel,
  BaseGuildTextChannel,
  GuildChannelTypes,
} from "discord.js";

export function get_guilds(client: Client): Guild[] {
  let guilds: Guild[] = [];
  client.guilds.cache.forEach((x) => {
    guilds.push(x);
  });
  return guilds;
}

export function get_channels(client: Client, id: string): Channel[] {
  let channels: Channel[] = [];
  client.guilds.fetch(id).then((guild) => {
    guild.channels.cache.forEach((channel) => {
      channels.push(channel);
    });
  });
  return channels;
}

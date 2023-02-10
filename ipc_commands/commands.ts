/*
    Loudred Bot - A discord music bot.
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

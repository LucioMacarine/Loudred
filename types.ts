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

export type playerSettings = {
  start_pos?: number;
  pauseState?: boolean;
  ffmpeg_options_before?: string;
  ffmpeg_options_after?: string;
};

export type trackMetadata = {
  id: string;
  title: string;
  upload_date: string;
  channel: string;
  duration_string: string;
  duration: number;
  view_count: number;
  playlist_id: string;
  playlist_title: string;
  playlist_count: number;
  playlist_index: number;
  webpage_url_domain: string;
  original_url: string;
};

export type trackStatus = {
  current_position: number;
  track_metadata: trackMetadata;
  connection_status: string;
  player_status: string;
};

export type queueSettings = {
  repeat_track: boolean;
};

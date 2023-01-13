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

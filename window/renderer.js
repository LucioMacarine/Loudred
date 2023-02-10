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

const tokenbar = document.getElementById("tokenbar");
const mediabar = document.getElementById("mediabar");
const searchbar = document.getElementById("searchbar");

let mouseDown = false;

//#region Input Cancel
let AllowInput = true;
function inhibitInput(e) {
  if (!AllowInput) {
    e.stopPropagation();
    e.preventDefault();
  }
}
document.addEventListener("click", (e) => inhibitInput(e), true);
document.addEventListener("keydown", (e) => inhibitInput(e), true);
//#endregion

//#region Wait/Unwait
const mediaPleaseWait = document.getElementById("mediaPleaseWait");
const mediaTopBar = document.getElementById("mediaTopBar");
const mediaProgressContainer = document.getElementById(
  "mediaProgressContainer"
);
function wait() {
  mediaPleaseWait.classList.remove("display_none");

  mediaTopBar.classList.add("display_none");
  mediaProgressContainer.classList.add("display_none");

  AllowInput = false;
}
function done() {
  mediaPleaseWait.classList.add("display_none");

  mediaTopBar.classList.remove("display_none");
  mediaProgressContainer.classList.remove("display_none");

  AllowInput = true;
}
selectavision.wait(wait);
selectavision.done(done);
//#endregion

let isStarted = false;

selectavision.window_alert((e, message) => {
  window.alert(message);
});

//Tokenbar SetToken
tokenbar.addEventListener("keydown", (e, ev) => {
  var keycode = e.code || e.key;
  if (keycode == "Enter") {
    selectavision.set_token(tokenbar.value);
    tokenbar.remove();
    mediabar.classList.remove("display_none");
    mediabar.classList.add("display_flex");
  }
});

//Add all button handler
const addAllButton = document.getElementById("addAllButton");
addAllButton.addEventListener("click", () => {
  trackList.forEach((track) => selectavision.queue_push_track(track));
});

//#region Search Bar Search
searchbar.addEventListener("keydown", async (e, ev) => {
  var keycode = e.code || e.key;
  if (keycode == "Enter") {
    const input = searchbar.value;
    let searchResult = [];
    if (input.includes("http")) {
      searchResult = await selectavision.get_metadata(input);
    } else {
      searchResult = await selectavision.get_metadata(`ytsearch20:${input}`);
    }
    if (searchResult.length > 1) {
      clearTrackList();
      loadTrackList(searchResult);
      addAllButton.parentElement.classList.remove("display_none");
    } else {
      selectavision.queue_push_track(searchResult[0]);
    }
  }
});
//#endregion

//ON Client login
selectavision.client_ready(async (e) => {
  console.log("Client logged in.");
  await loadguilds();
  if (guilds.length <= 1) {
    loadchannels(guilds[0]);
  }
});

let guilds = [];

let channels = [];
let currentChannel;

let isPaused = false;

let trackList = [];

//#region Play/Pause Button code
const playpausebutton = document.getElementById("playpausebutton");

playpausebutton.addEventListener("click", () => {
  isPaused = !isPaused;
  selectavision.player_change_settings({
    pauseState: !isPaused,
  });
  checkPause();
});

function checkPause(params) {
  if (isPaused) {
    playpausebutton.innerText = "⏸️";
  } else playpausebutton.innerText = "▶️";
}
//#endregion

//#region MoveNext Button Code
const nextTrackButton = document.getElementById("nextTrackButton");
const prevTrackButton = document.getElementById("prevTrackButton");
nextTrackButton.addEventListener("click", () => {
  selectavision.queue_next();
});
prevTrackButton.addEventListener("click", () => {
  selectavision.queue_prev();
});
//#endregion

//#region Repeat Button code
let repeatTrack = false;
const repeatTrackButton = document.getElementById("repeatTrackButton");
repeatTrackButton.addEventListener("click", () => {
  repeatTrack = !repeatTrack;
  selectavision.queue_change_settings({ repeat_track: repeatTrack });
  if (repeatTrack) repeatTrackButton.classList.add("repeatTrackButtonOn");
  else repeatTrackButton.classList.remove("repeatTrackButtonOn");
});
//#endregion

//#region Progress Handler
window.addEventListener("mousedown", () => {
  mouseDown = true;
});

window.addEventListener("mouseup", () => {
  mouseDown = false;
});

const mediaprogressbar = document.getElementById("mediaprogressbar");
const mediatitle = document.getElementById("mediatitle");
const mediastarttime = document.getElementById("mediastarttime");
const mediaendtime = document.getElementById("mediaendtime");
const mediaPlayerStatus = document.getElementById("mediaPlayerStatus");
const mediaConnectionStatus = document.getElementById("mediaConnectionStatus");

//Mouse released. Will reload the player
mediaprogressbar.addEventListener("mouseup", () => {
  console.log(`MOUSE EVENT: ${mediaprogressbar.value}`);
  wait();
  selectavision.player_change_settings({ start_pos: mediaprogressbar.value });
});

//Seek
mediaprogressbar.addEventListener("input", () => {
  mediastarttime.innerText = secondsToString(mediaprogressbar.value);
});

//ON track update
selectavision.track_update((e, settings) => {
  if (!mouseDown) {
    mediaprogressbar.value = settings.current_position;

    isPaused = settings.player_status === "paused" ? false : true;
    checkPause();
  }

  //this because the track can update while in a wait()
  if (AllowInput) {
    if (settings.track_metadata.duration === "NA") {
      //YELP SOMENONE TRYIGN STREAM MUSCI FROM GENERIC EXTRACTAOR NOOOOOOOO!121!!!!!111!
      mediaTopBar.classList.add("mediaSingleBar");
      mediaProgressContainer.classList.add("display_none");
    } else {
      //https://youtu.be/DIiIIY-zh2A

      mediaTopBar.classList.remove("mediaSingleBar");
      mediaProgressContainer.classList.remove("display_none");
    }
  }

  mediatitle.innerText = settings.track_metadata.title;

  mediaPlayerStatus.innerText = settings.player_status;
  mediaConnectionStatus.innerText = settings.connection_status;

  mediaprogressbar.setAttribute("max", `${settings.track_metadata.duration}`);

  mediaendtime.innerText =
    settings.track_metadata.duration === "NA"
      ? "Unknown"
      : secondsToString(settings.track_metadata.duration);
  if (!mouseDown)
    mediastarttime.innerText = secondsToString(settings.current_position);
});
//#endregion

//#region Track Queue Handler
const tracklist = document.getElementById("tracklist");

selectavision.queue_update(async (e, queue) => {
  clearQueue();
  addTracksToQueue(queue);
});
//#endregion

//Fills guilds in the guild dropdown
async function loadguilds() {
  clearGuilds();
  const guildlist = document.getElementById("guildslist");
  let local_guilds = await selectavision.get_guilds();
  local_guilds.forEach(async (guild) => {
    guilds.push(guild);
    let wrapperdiv = fabricateElement('<div class="dropdownitem"></div>');
    if (guild.icon !== null) {
      let image = fabricateElement(
        `<img src="https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp" alt="${guild.name}"></img>`
      );
      wrapperdiv.appendChild(image);
    }
    let name = fabricateElement(`<p>${guild.name}</p>`);
    wrapperdiv.appendChild(name);
    wrapperdiv.onclick = () => {
      loadchannels(guild);
      selectavision.change_guild(guild.id);
    };
    guildlist.appendChild(wrapperdiv);
  });

  //Add invite link
  const inviteContainer = fabricateElement('<div class="dropdownitem"></div>');
  const inviteButton = fabricateElement(
    '<p class="inviteLinkButton">Invite bot</p>'
  );
  inviteButton.onclick = async () => {
    selectavision.open_link(await createInviteLink());
  };
  inviteContainer.appendChild(inviteButton);
  guildlist.appendChild(inviteContainer);
}

async function createInviteLink() {
  const client = await selectavision.get_client_info();
  return `https://discord.com/api/oauth2/authorize?client_id=${client.id}&permissions=3145728&scope=bot`;
}

function clearGuilds() {
  const guildlist = document.getElementById("guildslist");
  Array.from(guildlist.children).forEach((x) => x.remove());
}

//Fills channels in the channel sidebar
async function loadchannels(guild) {
  const channellist = document.getElementById("channellist");

  let oldchannels = Array.from(
    document.getElementsByClassName("channellistchannel")
  );
  oldchannels.forEach((channel) => channel.parentElement.remove());
  let oldseparators = Array.from(
    document.getElementsByClassName("channellistseparator")
  );
  oldseparators.forEach((separator) => separator.parentElement.remove());

  let voicechannels = await selectavision.get_channels(guild.id);
  voicechannels = sortChannelsForDisplay(voicechannels);

  voicechannels = voicechannels.filter(
    (x) => x.type == 2 || x.type == 13 || x.type == 4
  );

  voicechannels.forEach((channel) => {
    channels.push(channel);
    let listitem = document.createElement("li");
    let textitem = document.createElement("p");
    textitem.innerText = channel.name;
    if (channel.type == 4) textitem.classList.add("channellistseparator");
    else {
      textitem.classList.add("channellistchannel");
      listitem.onclick = () => loadChannel(channel, listitem);
    }
    listitem.appendChild(textitem);
    channellist.appendChild(listitem);
  });
}

function loadChannel(channel, listitem) {
  const channellist = document.getElementById("channellist");
  currentChannel = channel;
  Array.from(channellist.children).forEach((element) => {
    element.classList.remove("channelListItemSelected");
  });
  listitem.classList.add("channelListItemSelected");
  selectavision.change_channel(channel.id);
}

//Sorts channels in display order for discord
function sortChannelsForDisplay(channelarray) {
  let categories = channelarray.filter((x) => {
    return x.type == 4;
  });
  categories.sort((a, b) => {
    if (a.rawPosition > b.rawPosition) {
      return 1;
    }
    if (a.rawPosition < b.rawPosition) {
      return -1;
    }
  });
  let sortedcategories = [];
  categories.forEach((category) => {
    let members = channelarray.filter((x) => {
      return x.parentId == category.id;
    });
    let text = members.filter((x) => {
      if (x.type == 2 || x.type == 13) return false;
      else return true;
    });
    text.sort((a, b) => {
      if (a.rawPosition > b.rawPosition) {
        return 1;
      }
      if (a.rawPosition < b.rawPosition) {
        return -1;
      }
    });
    let voices = members.filter((x) => {
      return x.type == 2 || x.type == 13;
    });
    voices.sort((a, b) => {
      if (a.rawPosition > b.rawPosition) {
        return 1;
      }
      if (a.rawPosition < b.rawPosition) {
        return -1;
      }
    });
    let orderedmembers = [];
    text.forEach((x) => {
      orderedmembers.push(x);
    });
    voices.forEach((x) => {
      orderedmembers.push(x);
    });
    orderedmembers.unshift(category);
    sortedcategories.push(orderedmembers);
  });
  let finalarray = [];
  sortedcategories.forEach((category) => {
    category.forEach((element) => {
      finalarray.push(element);
    });
  });
  return finalarray;
}

//Loads the track list in the main panel
function loadTrackList(results) {
  results.forEach((result) => {
    const li = document.createElement("li");

    const resultListItem = fabricateElement(
      '<div class="resultlistitem"></div>'
    );

    //add button part
    const addButton = fabricateElement(
      '<span class="resultlistItemAddButton">+</span>'
    );
    addButton.addEventListener("click", () => {
      selectavision.queue_push_track(result);
    });

    resultListItem.appendChild(addButton);

    //image part
    if (result.webpage_url_domain == "youtube.com") {
      const img = fabricateElement(
        `<img src="https://i3.ytimg.com/vi/${result.id}/hqdefault.jpg" alt="${result.title}"></img>`
      );

      resultListItem.appendChild(img);
    }

    //text part
    const header1 = fabricateElement(`<h1>${result.title}</h1>`);

    const views = fabricateElement(
      `<p>${clearNumber(result.view_count)} views</p>`
    );

    const channel = fabricateElement(`<p>${result.channel}</p>`);

    const resultListItemText = fabricateElement(
      '<div class="resultlistitemtext"></div>'
    );

    resultListItemText.appendChild(header1);
    if (result.view_count !== "NA") resultListItemText.appendChild(views);
    if (result.channel !== "NA") resultListItemText.appendChild(channel);

    resultListItem.appendChild(resultListItemText);

    li.appendChild(resultListItem);

    const list = document.getElementById("resultlist");
    list.appendChild(li);

    trackList.push(result);
  });
}

//Clears videos from the track list in the main panel
function clearTrackList() {
  const list = document.getElementById("resultlist");
  const childarray = Array.from(list.children);
  childarray.forEach((child) => child.remove());
  trackList = [];
}

//Adds tracks to sidebar queue
function addTracksToQueue(queue) {
  queue.forEach((track) => {
    const li = fabricateElement('<li class="track"></li>');
    const div = fabricateElement('<div class="trackHover"></div>');
    const span1 = fabricateElement("<span>❌</span>");
    span1.addEventListener("click", () => {
      selectavision.queue_drop_track(queue.indexOf(track));
    });
    const span2 = fabricateElement("<span>⬇️</span>");
    span2.addEventListener("click", () => {
      selectavision.queue_swap_track(
        queue.indexOf(track),
        queue.indexOf(track) + 1
      );
    });
    const span3 = fabricateElement("<span>⬆️</span>");
    span3.addEventListener("click", () => {
      selectavision.queue_swap_track(
        queue.indexOf(track),
        queue.indexOf(track) - 1
      );
    });

    if (queue.indexOf(track) == 0)
      div.append(
        fabricateElement('<span id="currentlyPlaying">Currently Playing</span>')
      );
    else if (queue.indexOf(track) == 1) div.append(span1, span2);
    else div.append(span1, span2, span3);

    const trackHover = li.appendChild(div);
    const p = fabricateElement(`<p>${track.title}</p>`);
    li.appendChild(p);
    if (track.webpage_url_domain == "youtube.com") {
      const img = fabricateElement(
        `<img src="https://i3.ytimg.com/vi/${track.id}/hqdefault.jpg" alt="${track.title}"></img>`
      );
      li.appendChild(img);
    }

    tracklist.appendChild(li);
  });
}

//Clears tracks from the sidebar queue
function clearQueue() {
  const childarray = Array.from(tracklist.children);
  childarray.forEach((child) => child.remove());
}

function secondsToString(the_seconds) {
  const date = new Date(0);
  date.setTime(the_seconds * 1000);
  const hours = date.getUTCHours() <= 0 ? "" : `${date.getUTCHours()}:`;
  const minutes = `${date.getUTCMinutes()}:`;
  const seconds =
    date.getUTCSeconds() >= 10
      ? date.getUTCSeconds()
      : `0${date.getUTCSeconds()}`;
  const datetext = hours + minutes + seconds;
  return datetext;
}

//https://stackoverflow.com/questions/10599933/convert-long-number-into-abbreviated-string-in-javascript-with-a-special-shortn
function clearNumber(number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(number);
}

//creates an html element using an input string.
function fabricateElement(html) {
  const element = document.createElement("template");
  element.innerHTML = html.trim();
  return element.content.firstElementChild;
}

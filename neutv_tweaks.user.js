// ==UserScript==
// @name         Tweaks for NEU IPTV (the Old Version)
// @namespace    https://github.com/imlijh/userscripts
// @version      0.5
// @description  player redirection, auto scrolling, playback navigation, and more
// @author       k. Lee
// @match        https://hdtv.neu6.edu.cn/newplayer?*
// @match        https://hdtv.neu6.edu.cn/player-review?*
// @run-at       document-start
// @grant        none
// ==/UserScript==

var g_player = ""; // "videojs", "flowplayer"
var g_default_period = 1 * 60 * 60; // in seconds
var g_seekstep = 5;

(function() {
	'use strict';

	var possible_players = ["videojs", "flowplayer"];
	var postload = {
		"/newplayer": function() {
			$("#navigate-backwards").click(function() {
				navigateBackwardsFromNow(g_default_period);
			});
			$("#navigate-forwards").button("option", "disabled", true);
		},
		"/player-review": function() {
			$("#navigate-backwards").click(function() {
				navigateTimeline(-g_default_period);
			});
			$("#navigate-forwards").click(function() {
				navigateTimeline(g_default_period);
			});
		}
	};

	if (possible_players.includes(g_player)) {
		choosePlayer(g_player);
	}

	window.addEventListener('load', function() {
		addNavigationHTML();
		scrollToPlayer();
		setKeyDownHandler();
		if (g_seekstep > 0 && (!g_player || g_player === "flowplayer")) {
			setSeekStep(g_seekstep);
		}
	});

	if(typeof postload[window.location.pathname] !== "undefined") {
		window.addEventListener('load', postload[window.location.pathname]);
	}


	// ---------------------------------------------------

	function choosePlayer(player) {
		var old_href = window.location.href;
		if (parsePlayer() === null && old_href.includes("?") &&
			possible_players.includes(player)) {
			// Use window.location.replace(url) if you want to redirect the user
			// in a way that the current page is forgotten by the back button,
			// because otherwise if you use window.location = url then when the
			// user presses the back button, then the userscript will kick in
			// again and push them back the page that they were just on.
			// See https://stackoverflow.com/a/3170964
			window.location.replace(old_href.replace(/\?/, "?" + player + "&"));
		}
	}

	function setKeyDownHandler() {
		$(document).keydown(function(e) {
			if (e.target === document.body) {
				switch(e.keyCode) {
					case 32: // space
						e.preventDefault(); // disable space scroll
						break;
					default:
						break;
				}
			}
		});
	}

	function scrollToPlayer() {
		var player = $("#content > .flowplayer, #content > .video-js").first();
		if($(window).scrollTop() === 0) {
			// The `setTimeout` trick is necessary when we reload a page scrolled to top.
			// Since browsers will set the scroll state back to its
			// previous state (in this case "top") *after* a reload,
			// we will have to perform the scrolling after this browser action.
			setTimeout(function() {
				$(window).scrollTop(player.offset().top + player.height()/2 - $(window).height()/2);
			}, 0);
		}
	}

	function navigateTimeline(seconds) {
		// include /player-review
		if ((seconds = Math.round(seconds)) === 0) return;
		var old_href = window.location.href;
		var match = window.location.search.match(/(\?|&)timeline=(\d+)-(\d*)-/);
		if (match !== null && !(seconds > 0 && match[3] === "")) {
			var start_time = match[3];
			var end_time = match[2];
			if (seconds < 0) {
				start_time = (parseInt(end_time) + seconds).toString();
			} else {
				end_time = (parseInt(start_time) + seconds).toString();
			}
			window.location = old_href.replace(
				/(\?|&)timeline=(\d+)-(\d*)-/,
				"$1timeline=" + start_time + "-" + end_time + "-"
			);
		}
	}

	function navigateBackwardsFromNow(seconds) {
		// include /newplayer
		if ((seconds = Math.round(seconds)) === 0) return;
		var now = Math.floor(new Date().valueOf() / 1000);
		var match = window.location.search.match(/(\?|&)p=(\w+)(&|$)/);
		if (match !== null) {
			var channel = match[2];
			var player = parsePlayer() || g_player;
			var end_time = now.toString();
			var start_time = (now - seconds).toString();
			window.location = "/player-review?" + (player && (player + "&")) +
				"timeline=" + start_time + "-" + end_time + "-" + channel;
		}
	}

	function addNavigationHTML() {
		$("#main > #container > #content > p").first().append(`
<style>
.ui-buttonset#navigate-group {
		font-size: 75%;
		float: right;
}
</style>
<span id="navigate-group">
		<a id="navigate-backwards" href="javascript: void(0);">&lt;&lt;</a>
	<a id="navigate-forwards" href="javascript: void(0);">&gt;&gt;</a>
</span>`);
		/*
				$("#navigate-backwards").button({
						icons: { primary: "ui-icon-seek-prev" },
						text: false
				});
				$("#navigate-forwards").button({
						icons: { primary: "ui-icon-seek-prev" },
						text: false
				});
				*/
		$("#navigate-group").buttonset();
	}

	function setSeekStep(step) {
		var p = flowplayer(".flowplayer");
		if (!p) {
			console.log("[Warning] flowplayer not found, cannot set seekstep.");
			return false;
		}
		p.oldseek = p.seek;
		p.seek = function(e, callback) {
			if("boolean" == typeof e) {
				var seekstep = step;
				e = this.video.time + (e ? seekstep : -seekstep);
				e = Math.min(Math.max(e, 0), this.video.duration - .1);
			}
			return this.oldseek(e, callback);
		}
		return true;
	}

	function parsePlayer() {
		var re = new RegExp("\\?.*\\b(" + possible_players.join("|") + ")\\b");
		var match = window.location.href.match(re);
		return (match === null) ? null : match[1];
	}
})();

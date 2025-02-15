class FPlyr {

    video;
    audio;
    youtube;
    vimeo;
    when;
    option = {
        showThumb: true,
        panelType: "",
        panelItem: ["play", "progress", "time", "volumeMini", "rate", "full"],
        volume: 100,
        mute: false,
    };
    stateFull = false;

    #isVideo;
    #isAudio;
    #isYoutube;
    #isVimeo;
    #isFullReady;

    #vimeoMuted = false;
    #vimeoVolume = 100
    #vimeoRate = 1;
    #vimeoReady = false;
    #vimeoPlay = false;
    #vimeoPaused = true;
    #vimeoEnd = true;
    #vimeoDuration = 0;
    #vimeoCurrentTime = 0;


    #mediaPlayer;
    #fullPlayer;

    constructor(config = {}) {
        // * 無設定
        if (typeof config != "object") {
            console.log("config: 不存在。");
            return;
        };

        const option = config[_option] || {};
        // ! 3.*.* 版本中將移除 config[_volume]
        const volume = parseInt(option[_volume] || config[_volume]);
        // ! 3.*.* 版本中將移除 config.mute
        const mute = Boolean(option.mute || config.mute);
        // ! 3.*.* 版本中將移除 config.mute
        const showThumb = Boolean(option["showThumb"]);

        // ! 3.*.* 版本中將移除 config.type
        this.option.panelType = $String(option.panelType || config.type || this.option.panelType);
        // ! 3.*.* 版本中將移除 config.panel
        this.option.panelItem = $Array.from(option.panelItem || config.panel || this.option.panelItem);

        if (option["showThumb"] != null) {
            this[_option]["showThumb"] = showThumb;
        };

        if (option[_volume] != null && config[_volume] != null && !isNaN(volume)) {
            this[_option][_volume] = volume;
        };

        if (option.mute != null && config.mute != null) {
            this.option.mute = mute;
        };

        // ! 3.*.* 版本中將移除 config.event
        this.when = config.when || config.event || {};

        // * 初始化播放器容器
        if (typeof config[_id] === _string && document[_getElementById](config[_id])) {
            this[_body] = document[_getElementById](config[_id]);
            this[_body][_classList][_add](_FPlyr);
            this[_body][_dataset].type = this.option.panelType;
            this[_body][_dataset].thumb = this.option.showThumb ? 1 : 0;
        }
        else {
            this[_body] = createElement(_div + "." + _FPlyr, {
                "data-thumb": this.option.showThumb ? 1 : 0,
                "data-type": this.option.panelType
            });
        };

        // * 初始化播放器容器未成功初始化
        if (this[_body] == null) {
            console.log("body: 不存在");
            return;
        };

        this[_body][_onmousemove] =
            this[_body][_onmouseleave] = _ => this.#showPanel(1);

        const video = $String(config[_video] || "")[_trim]();
        const youtube = $String(config[_youtube] || "")[_trim]();
        const vimeo = $String(config[_vimeo] || "")[_trim]();
        const audio = $String(config[_audio] || "")[_trim]();

        if (video[_length]) {
            this[_video] = video;
            this.#initVideo();
        }
        else if (youtube[_length]) {
            this[_youtube] = youtube;
            this.#initYoutube();
        }
        else if (vimeo[_length]) {
            this[_vimeo] = vimeo;
            this.#initVimeo();
        }
        else if (audio[_length]) {
            this[_audio] = audio;
            this.#initAudio();
        };
    };

    #player(isFull) {
        if (isMobile && isFull && this[_vimeo] == null) {
            return this.#fullPlayer;
        }
        return this.#mediaPlayer;
    };

    // * 是否暫停
    isPaused(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            return player.paused;
        }
        else if (this.#isYoutube) {
            return (this.ytState !== 1);
        }
        else if (this.#isVimeo) {
            return this.#vimeoPaused;
        };
    };

    // * 播放影片
    play(isFull) {
        const player = this.#player(isFull);

        // * Youtube 檢查是否正確載入
        if (isFull && !this.#isFullReady && this[_youtube] != null) {
            alert("not Ready");
            return;
        };

        if (this.#isVideo || this.#isAudio) {
            player.play();
        }
        else if (this.#isYoutube) {
            player.playVideo();
        }
        else if (this.#isVimeo && isFull) {
            // * 全螢幕播放
            player.requestFullscreen().then(_ => {
                player.play();
            });
        }
        else if (this.#isVimeo) {
            player.play();
        }

        this.panel.setPlayIcon(false);
    };

    // * 暫停影片
    pause(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            player.pause()
        }
        else if (this.#isYoutube) {
            player.pauseVideo();
        }
        else if (this.#isVimeo) {
            player.pause();
        };

        this.panel.setPlayIcon(true);
    };

    // * 切換播放狀態
    #toggle(isFull) {
        const isPaused = this.isPaused(isFull);
        isPaused ? this.play() : this.pause();
        this.panel.setPlayIcon(!isPaused)
    };

    // * 跳轉至進度
    #seekTo(sec, isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            player.currentTime = sec;
        }
        else if (this.#isYoutube) {
            player.seekTo(sec);
        }
        else if (this.#isVimeo) {
            player.setCurrentTime(sec);
        };

        this.pause();
    };

    // * 獲取音量
    #getVolume(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            return player[_volume] * 100;
        }
        else if (this.#isYoutube) {
            return player.getVolume();
        }
        else if (this.#isVimeo) {
            return this.#vimeoVolume * 100;
        };
    };

    // * 更改音量
    #setVolume(num, isFull) {
        const player = this.#player(isFull);

        this[_option][_volume] = parseInt(num);

        if (this.#isVideo || this.#isAudio) {
            player[_volume] = num / 100;
        }
        else if (this.#isYoutube) {
            player.setVolume(num);
        }
        else if (this.#isVimeo) {
            this.#vimeoVolume = num / 100
            player.setVolume(num / 100);
        };

        this.panel.setVolume(num);
        this.#setMute(parseInt(num) === 0);
    };

    // * 設定靜音
    #setMute(bool, isFull) {
        const isMuted = bool == null ? this.isMuted() : !bool;
        const player = this.#player(isFull);

        if (isMuted && this[_option][_volume] === 0) {
            this[_option][_volume] = 50;
            this.#setVolume(50);
            this.panel.setMuteIcon(false);
            return;
        };

        if (this.#isVideo || this.#isAudio) {
            player.muted = !isMuted;
        }
        else if (this.#isYoutube) {
            isMuted ? player.unMute() : player.mute();
        }
        else if (this.#isVimeo) {
            this.#vimeoMuted = !isMuted;
            player.setMuted(!isMuted).catch(err => alert(err));
        };

        this.panel.setMuteIcon(!isMuted);
    };

    // * 是否靜音
    isMuted(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            return player.muted;
        }
        else if (this.#isYoutube) {
            return player.isMuted();
        }
        else if (this.#isVimeo) {
            return this.#vimeoMuted;
        };
    };

    // * 設定速率
    #setPlaybackRate(num, isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            player.playbackRate = num;
        }
        else if (this.#isYoutube) {
            player.setPlaybackRate(num);
        }
        else if (this.#isVimeo) {
            player.setPlaybackRate(num).catch(err => alert(err));
        };
    };

    // * 獲取速率
    #getPlaybackRate(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            return player.playbackRate;
        }
        else if (this.#isYoutube) {
            return player.getPlaybackRate();
        }
        else if (this.#isVimeo) {
            return this.#vimeoRate;
        };
    };

    // * 設定時長
    #duration(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            this.panel.duration(player.duration);
        }
        else if (this.#isYoutube) {
            this.panel.duration(player.getDuration());
        }
        else if (this.#isVimeo) {
            this.#mediaPlayer.getDuration().then(e => {
                this.#vimeoDuration = e;
                this.panel.duration(this.#vimeoDuration);
            });
        };
    };

    // * 取得時長
    #getDuration(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            return $Math[_ceil](player.duration);
        }
        else if (this[_youtube] != null) {
            return $Math[_ceil](player.getDuration());
        }
        else if (this.#isVimeo) {
            return $Math[_ceil](this.#vimeoDuration);
        };
    };

    #getCurrentTime(isFull) {
        const player = this.#player(isFull);

        if (this.#isVideo || this.#isAudio) {
            return $Math[_ceil](player.currentTime);
        }
        else if (this[_youtube] != null) {
            return $Math[_ceil](player.getCurrentTime());
        }
        else if (this.#isVimeo) {
            return $Math[_ceil](this.#vimeoCurrentTime);
        };
    };

    #setCurrentTime(isFull) {
        const total = this.#getDuration(isFull);

        this.videoTimer = setInterval(() => {

            if (this.#isVimeo) {
                this.#mediaPlayer.getCurrentTime().then(sec => {
                    this.#vimeoCurrentTime = sec;
                    this.panel.setCurrent($Math[_ceil](sec));

                    if ($Math[_ceil](sec) < total) {
                        return;
                    };

                    clearInterval(this.videoTimer);
                });
            }
            else {
                const sec = this.#getCurrentTime();

                this.panel.setCurrent(sec);

                if ($Math[_ceil](sec) < total) {
                    return;
                };

                clearInterval(this.videoTimer);
            }
        }, 100);
    }

    #stateReady() {
        if (this.when.ready != null) {
            this.when.ready();
        };

        // * 初始化基本參數
        if (this[_vimeo] != null) {
            this.#vimeoReady = this.#vimeoPaused = this.#vimeoEnd = true;
            this.#vimeoPlay = false;
        };

        this.#isVideo = Boolean(this.video && this.#mediaPlayer);
        this.#isVimeo = Boolean(this[_vimeo] && this.#mediaPlayer);
        this.#isYoutube = Boolean(this[_youtube] && this.#mediaPlayer);
        this.#isAudio = Boolean(this[_audio] && this.#mediaPlayer);

        this.#duration()
        this.panel.setCurrent(0);

        this.sec = 0;

        if (this.option.mute != null) {
            this.#setMute(this.option.mute);
        }
        else if (this.#isVimeo) {
            this.#mediaPlayer.getMuted().then(bool => this.#vimeoMuted = bool);
        }

        if (this[_option][_volume] != null) {
            this.#setVolume(this[_option][_volume]);
        }
        else if (this.#isVimeo) {
            this.#mediaPlayer.getVolume().then(volume => this.#vimeoVolume = (volume * 100));
        };
    };

    #statePlaying() {
        this.#vimeoPlay = false;
        this.#vimeoPaused = this.#vimeoEnd = false;

        if (this.when.playing != null) {
            this.when.playing();
        };

        if (this.#isYoutube) {

            if (this.start) {
                this.start = false;
            };

            setTimeout(() => {
                this.mask.classList[_add]("hide");
            }, 500);
        };

        this.#setCurrentTime();

        this.panel.hide(1);
    };

    #statePause() {
        this.#vimeoPaused = true;
        this.#vimeoPlay = false;

        if (this.when.pause != null) {
            this.when.pause();
        };

        clearInterval(this.videoTimer);

        if (this.#isYoutube) {
            this.mask.classList.remove("hide");
        };

        this.panel.show();
    };

    #stateEnd() {
        this.#vimeoEnd = this.#vimeoPaused = true;
        this.#vimeoPlay = false;

        if (typeof this.when.end == "function") {
            this.when.end()
        };

        clearInterval(this.videoTimer);

        this.panel.reset();

        if (this.#isVideo) {
            this.#mediaPlayer.currentTime = 0;
        }
        else if (this.#isYoutube) {
            this.#seekTo(0);

            setTimeout(() => {
                // this.mask.class_("hide");
                this.start = true;
            }, 50);
        }
        else if (this.#isVimeo) {
            this.#seekTo(0);
        }
    };

    #stateFullPlaying() {
        // * 停止 `mediaplayer`
        this.pause();
        // * 跳轉至 `mediaplayer` 進度
        this.#seekTo(this.#getCurrentTime(), true);
        // * 更改為 `mediaplayer` 音量
        this.#setVolume(this.#getVolume(), true);
        // * 更改為 `mediaplayer` 速度
        this.#setPlaybackRate(this.#getPlaybackRate(), true);
        // * 繼續播放 `fullscreen` 影片 (`seekTo` 會暫停播放)
        this.play(true);
    };

    #stateFullPause() {
        // * `fullplayer` 秒數
        const sec = this.#getCurrentTime(true);
        // * 更改為 `fullplayer` 進度
        this.panel.setCurrent(sec);
        this.#seekTo(sec);
        // * 更改為 `fullplayer` 音量
        this.#setVolume(this.#getVolume(true));
        // * 更改為 `fullplayer` 速度
        this.#setPlaybackRate(this.#getPlaybackRate(true));
    };

    #initPanel() {
        this.panel = new playerPanel(this);

        if (this.panel.buttonPlay != null) {
            this.panel.buttonPlay.onclick = _ => this.#toggle();
        };
        if (this.panel.inputProgress != null) {
            let seekTimer, playTimer;
            this.panel.inputProgress.oninput = e => {
                clearTimeout(seekTimer);
                clearTimeout(playTimer);

                this.pause();

                const _this = e.target;
                const value = _this.value;

                this.panel.setCurrent(value);

                seekTimer = setTimeout(_ => {
                    this.#seekTo(value);
                    playTimer = setTimeout(_ => {
                        this.play();
                    }, 500);
                }, 500);
            }
        };
        if (this.panel.buttonVolume != null) {
            let timer;

            this.panel.buttonVolume.onclick = _ => {
                clearTimeout(timer);

                timer = setTimeout(_ => {
                    this.panel.buttonVolume.parentElement.parentElement.open = false;
                }, 1000);
            };
            this.panel.inputVolumeMini.onmouseover = _ => {
                clearTimeout(timer);
            };
            this.panel.inputVolumeMini[_onmouseleave] = _ => {
                clearTimeout(timer);

                timer = setTimeout(_ => {
                    this.panel.buttonVolume.parentElement.parentElement.open = false;
                }, 1000);
            };

            this.panel.inputVolumeMini.oninput = e => {
                const _this = e.target;
                const value = _this.value;

                this.#setVolume(value);
            };
            // this.panel.inputVolumeMini.onclick = e => {
            //     const x = e.offsetX;
            //     const w = this.panel.inputVolumeMini.clientWidth;
            //     const length = parseInt(this.panel.inputVolumeMini.children[0].max);
            //     const sec = $Math.floor(x / w * length);

            //     this.panel.inputVolumeMini.children[0].value = sec;
            //     this.#setVolume(sec);
            //     this.#setMute(sec === 0);
            //     this.panel.setMuteIcon(sec === 0);
            // };
        }

        if (this.panel.buttonMute != null) {
            this.panel.buttonMute.onclick = _ => this.#setMute();
        };

        if (this.panel.inputVolume != null) {
            this.panel.inputVolume.oninput = e => {
                const _this = e.target;
                const value = _this.value;

                this.#setVolume(value);
            };
        };

        if (this.panel.buttonRate != null) {
            this.panel.buttonRate.onclick = e => {
                const _this = e.target;
                if (_this.innerText === "1x_mobiledata") {
                    _this.innerText = "speed_1_25"
                    this.#setPlaybackRate(1.25);
                }
                else if (_this.innerText === "speed_1_25") {
                    _this.innerText = "speed_1_5x"
                    this.#setPlaybackRate(1.5);
                }
                else if (_this.innerText === "speed_1_5x") {
                    _this.innerText = "speed_2x"
                    this.#setPlaybackRate(2);
                }
                else if (_this.innerText === "speed_2x") {
                    _this.innerText = "speed_0_5x";
                    this.#setPlaybackRate(0.5);
                }
                else {
                    _this.innerText = "1x_mobiledata";
                    this.#setPlaybackRate(1);
                }
            };
        };
    };

    #showPanel(sec) {
        if (this.panel == null) {
            return;
        };

        this.panel.show();

        if (sec == null) {
            return;
        };

        this.panel.hide(sec);
    }

    #initAudio() {
        if (this[_audio] == null) {
            return;
        };

        this.#mediaPlayer = createElement("audio", { preload: "auto", controls: "" }, [
            createElement("source", { src: this[_audio] })
        ])

        this.#initPanel();

        this[_body][_appendChild](this.#mediaPlayer);
        this[_body][_appendChild](this.panel[_body]);

        this.#mediaPlayer.onloadedmetadata = () => this.#stateReady();
        this.#mediaPlayer.onplaying = () => this.#statePlaying();
        this.#mediaPlayer.onpause = () => this.#statePause();
        this.#mediaPlayer.onended = () => this.#stateEnd();
    };

    #initVideo() {
        // * video 不存在
        if (this[_video] == null) {
            return;
        };

        // * 初始化播放器
        this.#mediaPlayer = createElement("video", { preload: "auto", playsinline: "" }, [
            createElement("source", this[_video])
        ]);
        if (!isMobile) {
            this.#mediaPlayer.onclick = _ => this.#toggle();
        };
        // * 插入播放器
        this[_body][_appendChild](this.#mediaPlayer);

        // * 初始化控制面板
        this.#initPanel();
        // * 插入控制面板
        this[_body][_appendChild](this.panel[_body]);

        // * 加入狀態偵測
        this.#mediaPlayer.onloadedmetadata = _ => this.#stateReady();
        this.#mediaPlayer.onplaying = _ => this.#statePlaying();
        this.#mediaPlayer.onpause = _ => this.#statePause();
        this.#mediaPlayer.onended = _ => this.#stateEnd();

        if (!isMobile) {
            return;
        };

        // * 加入手機版全螢幕
        this.#fullPlayer = createElement("video.PDFullPlayer", { preload: "metadata", playsinline: null }, [
            createElement("source", this[_video])
        ]);

        // * 加入狀態偵測
        this.#fullPlayer.onplaying = _ => this.#stateFullPlaying();
        this.#fullPlayer.onpause = _ => this.#stateFullPause();
        this.#fullPlayer.onended = _ => this.#stateEnd();

        // * 偵測全螢幕狀態
        if (isIOS) {
            this.#fullPlayer.addEventListener("webkitpresentationmodechanged", _ => {
                this.stateFull = this.#fullPlayer.webkitPresentationMode === "fullscreen";
            });
        }
        else {
            this.#fullPlayer.addEventListener("fullscreenchange", _ => {
                this.stateFull = document.fullscreenElement === this.#fullPlayer;
            });
        };

        // * 加入全螢幕播放器
        this[_body][_appendChild](this.#fullPlayer);
    };

    #initYoutube() {
        // * youtube 不存在
        if (this[_youtube] == null) {
            return;
        };

        const id = UUID(24);
        const fullId = UUID(24);

        this.start = true;

        // * 初始化播放器容器
        const domPlayer = createElement("div#" + id);
        const dom = createElement("div[_body]", [
            domPlayer
        ]);
        if (!isMobile) {
            // * 添加點按動作
            dom.onclick = _ => this.#toggle();
        };
        // * 插入播放器容器
        this[_body][_appendChild](dom);

        // * 添加模糊背景
        this.mask = createElement("div.mask", { sec: this.live ? "live" : 0 });
        if (!isMobile) {
            // * 添加點按動作
            this.mask.onclick = _ => this.#toggle();
        };
        this[_body][_appendChild](this.mask);

        // * 初始化控制面板
        this.#initPanel();
        // * 插入控制面板
        this[_body][_appendChild](this.panel[_body]);

        // * 初始化播放器
        onYouTubeIframeAPIReady = async () => {
            await this.#setVideoId();
            this.#mediaPlayer = new YT.Player(id, {
                videoId: this[_youtube],
                width: "100%",
                height: "100%",
                playerVars: {
                    ...ytConfig,
                    playsinline: 1
                },
                events: {
                    onReady: _ => this.#stateReady(),
                    onStateChange: (e) => {
                        this.ytState = e.data;
                        if (e.data === 0) {
                            this.#stateEnd()
                        }
                        else if (e.data === 1) {
                            this.#statePlaying();
                        }
                        else if (e.data === 2) {
                            this.#statePause();
                        };
                    }
                }
            });

            if (!isMobile) {
                return
            };

            // * 初始化全螢幕播放器容器
            const domFullPlayer = createElement("div#" + fullId + ".PDFullPlayer");
            // * 插入全螢幕播放器容器
            this[_body][_appendChild](domFullPlayer);

            this.#fullPlayer = new YT.Player(fullId, {
                videoId: this[_youtube],
                width: "100%",
                height: "100%",
                playerVars: {
                    ...ytConfig,
                    playsinline: 0
                },
                events: {
                    onReady: _ => {
                        console.log("is Ready");
                        this.#isFullReady = true;
                    },
                    onStateChange: e => {
                        if (e.data === 0) {
                            this.#stateEnd();
                        }
                        else if (e.data === 2) {
                            this.#stateFullPause();
                        }
                        else if (e.data === 3) {
                            this.#stateFullPlaying();
                        };
                    }
                }
            });
        };

        onYouTubeIframeAPIReady();
    };

    #initVimeo() {
        // * vimeo 不存在
        if (this[_vimeo] == null) {
            return;
        };

        // * 初始化播放器容器
        const player = createElement("iframe", {
            src: (href_vimeo + "/video/" + this[_vimeo] + "?background=1&loop=0&autoplay=0&controls=0"),
            frameborder: "0",
            allowfullscreen: "",
            allow: "autoplay;"
        });
        const dom = createElement("div[_body]", [
            player
        ]);
        if (!isMobile) {
            // * 添加點按動作
            dom.onclick = _ => this.#toggle();
        };
        // * 插入播放器容器
        this[_body][_appendChild](dom);

        // * 添加模糊背景
        this.mask = createElement("div.mask.hide");
        if (!isMobile) {
            // * 添加點按動作
            this.mask.onclick = _ => this.#toggle();
        };
        this[_body][_appendChild](this.mask);

        // * 初始化控制面板
        this.#initPanel();
        // * 插入控制面板
        this[_body][_appendChild](this.panel[_body]);

        // * 初始化播放器
        this.#mediaPlayer = new Vimeo.Player(player);

        // * 加入狀態偵測
        this.#mediaPlayer.ready().then(_ => this.#stateReady())
        this.#mediaPlayer.on("play", _ => this.#statePlaying());
        this.#mediaPlayer.on("pause", _ => this.#statePause());
        this.#mediaPlayer.on("ended", _ => this.#stateEnd());

        if (isMobile) {
            this.#mediaPlayer.on('fullscreenchange', e => {
                this.panel.setPlayIcon(!e.fullscreen);
            });
        };
    };

    async #setVideoId(res) {
        const set = (res) => {
            if (this[_youtube]) return this[_youtube], res(res);

            this[_youtube] = prompt("Youtube 影片ID / 網址");

            if (/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.test(this[_youtube])) {
                let match = videoId.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
                this[_youtube] = (match && match[7][_length] == 11) ? match[7] : null;
                this[_youtube] ? (history.pushState(null, null, location.href.split("?")[0] + `?videoId=${this[_youtube]}`), res()) : fitVideoId(res)
            } else res(res);
        };

        if (res) set(res);
        else return new Promise((res, rej) => set(res));
    };

    destroy() {
        // 清理事件
        this[_body][_onmousemove] =
            this[_body][_onmouseleave] = null;

        // 停止計時器
        clearInterval(this.videoTimer);

        // 停止播放器相關資源
        if (this.#isVimeo) {
            this.#mediaPlayer.destroy();
        }
        else if (this.#isYoutube) {
            this.#mediaPlayer.destroy();
            if (this.#fullPlayer) {
                this.#fullPlayer.destroy();
            }
        }
        else if (this.#isVideo || this.#isAudio) {
            this.#mediaPlayer.pause();
            this.#mediaPlayer.src = "";
        };

        // 清除 DOM 元素
        this[_body].remove();

        if (typeof this.when.destroyed === "function") {
            this.when.destroyed();
        };
    };
};

// ! 2.0.0 移除 PDPlayer
window.PDPlayer = window.FPlyr = FPlyr;
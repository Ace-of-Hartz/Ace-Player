$(function () {
  var idCounter = 0;

  function _initiateAcePlayer(player) {
    var _this = this;
    var $player = $(player);

    this.source = $player.attr("src");
    this.type = $player.attr("type");
    this.poster = $player.attr("poster");
    this.autoplay = $player.attr("autoplay") != null;

    var _repeat = $player.attr("repeat") != null;

    ++idCounter;

    $player.after(`
      <div id="video-wrapper-${idCounter}" class="video-wrapper">
          <video id="video-${idCounter}" class="ace-video">
              <source id="source-${idCounter}"/>
              Your browser does not support the video tag
          </video>
          <div id="video-shield-${idCounter}" class="video-shield"></div>
          <div id="controls-${idCounter}" class="controls">
            <ace-seekbar id="seekbar-${idCounter}" data-count="${idCounter}" data-video-id="#video-${idCounter}"></ace-seekbar>
            <button id="mute-${idCounter}" class="mute-control">Mute</button>
            <button id="loop-${idCounter}" class="loop-control">Loop</button>
            <button id="play-pause-${idCounter}" clas="play-pause-control">Play/Pause</button>
          </div>
        </div>
    `);

    var $video = $("#video-" + idCounter)[0];
    var $source = $("#source-" + idCounter);
    var $muteBtn = $("#mute-" + idCounter);
    var $loopBtn = $("#loop-" + idCounter);
    var $playPauseBtn = $("#play-pause-" + idCounter);
    var seekBar = _seekBar($("#seekbar-" + idCounter));
    var $videoShield = $("#video-shield-" + idCounter);

    // ==== State Properties ====
    Object.defineProperty(this, 'isLoaded', { get: function () { return $video.readyState === 4; } });
    Object.defineProperty(this, 'isPlaying', { get: function () { return !!($video.currentTime > 0 && !$video.paused && !$video.ended && $video.readyState > 2); } });

    Object.defineProperty(this, 'isMuted', {
      get: function () { return $video.muted; },
      set: function (shouldMute) { $video.muted = shouldMute; }
    });
    Object.defineProperty(this, 'isLooping', {
      get: function () { return $video.loop; },
      set: function (shouldLoop) { $video.loop = shouldLoop; }
    });

    var _shouldShowCurrentTime = true;

    // ==== Custom Events ====

    this.videoLoaded = new Event('videoLoaded');

    // ==== Functions ====

    this.play = function () {
      if (isLoaded) {
        $video.play();
      }
    }

    this.pause = function () {
      if (isLoaded) {
        $video.pause();
      }
    }

    this.togglePlayPause = function () {
      if (isPlaying) { pause(); }
      else { play(); }
    }

    this.toggleMute = function () { isMuted = !isMuted; }
    this.toggleLoop = function () { isLooping = !isLooping; }

    // private 

    function load() {
      $video.load();
      return new Promise(function (resolve) {
        var interval = setInterval(function () {
          if ($video.readyState === 4) {
            window.clearInterval(interval);
            interval = null;
            _this.dispatchEvent(videoLoaded);
            resolve(true);
          }
        }, 100);
      });
    }

    function setShield() {
      var $$video = $($video);
      var videoOffset = $$video.offset();
      $videoShield
        .css("position", "absolute")
        .css("width", $$video.outerWidth())
        .css("height", $$video.outerHeight())
        .css("top", videoOffset.top)
        .css("left", videoOffset.left);
    }

    // ==== Events ====

    $muteBtn.click(function () { toggleMute(); });
    $loopBtn.click(function () { toggleLoop(); isLooping });
    $playPauseBtn.click(function () { togglePlayPause(); });

    this.addEventListener('videoLoaded', function () {
      setShield();
      isLooping = _repeat;
      if (autoplay) { play(); }
    });

    // ==== Load/init Video =====

    if (source && type) {
      $source.attr('src', source);
      $source.attr('type', type);
      load();
    }

    if (poster) {
      $video.attr("poster", _poster);
    }

    // ==== Return Object ====

    return this;
  }

  function _seekBar(seekBar) {
    var $seekBar = $(seekBar);
    var $video = $($seekBar.attr('data-video-id'))[0];
    var _count = $seekBar.attr('data-count');

    $seekBar.after(`
      <div id="seekbar-wrapper-${_count}" class="seekbar-wrapper">
        <div id="seekbar-length-${_count}" class="seekbar-length">
          <div id="seekbar-buffer-${_count}" class="seekbar-buffer"></div>
          <div id="seekbar-position-${_count}" class="seekbar-position"></div>
          <div id="seekbar-handle-${_count}" class="seekbar-handle"></div>
        </div>
      </div>
    `);

    var $seekbarLength = $("#seekbar-length-" + _count);
    var $seekbarBuffer = $("#seekbar-buffer-" + _count);
    var $seekbarPosition = $("#seekbar-position-" + _count);
    var $seekbarHandle = $("#seekbar-handle-" + _count);

    var _shouldShowCurrentTime = true;
    var _isMouseDown = false;

    Object.defineProperty(this, 'leftOfBar', { get: function () { return $seekbarLength.offset().left; } });
    Object.defineProperty(this, 'widthOfBar', { get: function () { return $seekbarLength.width(); } });

    this.max = 0;
    this.currentTime = 0;

    $(document).mousedown(function () { _isMouseDown = true; });
    $(document.mouseup(function () { _isMouseDown = false; });

    $video.onloadedmetadata = function () {
      max = $video.duration;
    };
    $video.ontimeupdate = function () {
      if (_shouldShowCurrentTime) {
        _updateTime($video.currentTime);
      }
    };

    $seekbarLength.mousedown(function (e) {
      $video.currentTime = (e.offsetX / widthOfBar) * max;
      _isMouseDown = true;
    });
    $seekbarLength.mouseup(function (e) {
      _isMouseDown = false;
      _shouldShowCurrentTime = true;
    });
    $seekbarLength.mousemove(function (e) {
      console.log(e);
      _shouldShowCurrentTime = !_isMouseDown;
      if (_isMouseDown) {
        $video.pause();
        var time = (e.offsetX / widthOfBar) * max;
        _updateTime(time);
      }
    });

    // $seek.change(function () { $video.currentTime = $seek.val(); });

    function _updateTime(_currentTime) {
      currentTime = _currentTime;
      var percentage = ((currentTime / max) * 100) + "%";
      $seekbarPosition.css('width', percentage);
      $seekbarHandle.css('left', percentage);
    }
  }

  //============== INIT ===============

  $("ace-player").each(function () {
    _initiateAcePlayer(this);
  });
});

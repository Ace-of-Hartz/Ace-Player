$(function () {
  var $mouseDown = null;
  var _throttler = new throttler();

  $(document).mouseup(function () {
    if ($mouseDown) {
      $mouseDown.resume();
      $mouseDown = null;
    }
  });

  $(document).mousemove(function (e) {
    if ($mouseDown) {
      _throttler.throttle(function () {
        if ($mouseDown) {
          $mouseDown.seek(e);
        }
      }, 10);
    }
  });

  var idCounter = 0;

  function _initiateAcePlayer(player) {
    var _this = {};
    var $player = $(player);

    _this.source = $player.attr("src");
    _this.type = $player.attr("type");
    _this.poster = $player.attr("poster");
    _this.autoplay = $player.attr("autoplay") != null;

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
            <button id="skip-back-${idCounter}" class="skip-back">Back</button>
            <button id="play-pause-${idCounter}" class="play-pause-control">Play/Pause</button>
            <button id="fast-forward-${idCounter}" class="fastforward">Fast Forward</button>
            <button id="skip-forward-${idCounter}" class="skip-forward">Skip Forward</button>
            <button id="mute-${idCounter}" class="mute-control">Mute</button>
            <button id="loop-${idCounter}" class="loop-control">Loop</button>
          </div>
        </div>
    `);

    var $video = $("#video-" + idCounter)[0];
    var $source = $("#source-" + idCounter);
    var $videoShield = $("#video-shield-" + idCounter);

    var seekBar = _seekBar($("#seekbar-" + idCounter), _this);

    var $skipBackBtn = $("#skip-back-" + idCounter);
    var $playPauseBtn = $("#play-pause-" + idCounter);
    var $ffBtn = $("#fast-forward-" + idCounter);
    var $skipForwardBtn = $("#skip-forward-" + idCounter);

    var $muteBtn = $("#mute-" + idCounter);
    var $loopBtn = $("#loop-" + idCounter);

    var _skipAmount = 0;

    // ==== State Properties ====
    Object.defineProperty(_this, 'isLoaded', { get: function () { return $video.readyState === 4; } });
    Object.defineProperty(_this, 'isPlaying', { get: function () { return !!($video.currentTime > 0 && !$video.paused && !$video.ended && $video.readyState > 2); } });

    Object.defineProperty(_this, 'isMuted', {
      get: function () { return $video.muted; },
      set: function (shouldMute) { $video.muted = shouldMute; }
    });
    Object.defineProperty(_this, 'isLooping', {
      get: function () { return $video.loop; },
      set: function (shouldLoop) { $video.loop = shouldLoop; }
    });

    // ==== Custom Events ====

    _this.videoLoaded = new Event('videoLoaded');

    // ==== Functions ====

    _this.play = function () {
      if (_this.isLoaded) {
        $video.play();
      }
    }

    _this.pause = function () {
      if (_this.isLoaded) {
        $video.pause();
      }
    }

    _this.togglePlayPause = function () {
      if (_this.isPlaying) { _this.pause(); }
      else { _this.play(); }
    }

    _this.skipBack = function() { $video.currentTime = Math.max($video.currentTime - _skipAmount, 0); }
    _this.skipForward = function() { $video.currentTime = Math.min($video.currentTime + _skipAmount, $video.duration); }

    _this.fastForward = function() { $video.playbackRate = 3; }
    _this.resetPlaybackRate = function() { $video.playbackRate = 1; }

    _this.toggleMute = function () { _this.isMuted = !_this.isMuted; }
    _this.toggleLoop = function () { _this.isLooping = !_this.isLooping; }

    // private 

    function load() {
      $video.load();
      return new Promise(function (resolve) {
        var interval = setInterval(function () {
          if ($video.readyState === 4) {
            window.clearInterval(interval);
            interval = null;
            this.dispatchEvent(_this.videoLoaded);
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

    $skipBackBtn.click(function() { _this.skipBack(); });
    $skipForwardBtn.click(function() { _this.skipForward(); });

    $ffBtn.mousedown(function() { _this.fastForward(); });
    $ffBtn.mouseup(function() { _this.resetPlaybackRate(); });

    $playPauseBtn.click(function () { _this.togglePlayPause(); });
    
    $muteBtn.click(function () { _this.toggleMute(); });
    $loopBtn.click(function () { _this.toggleLoop(); });

    this.addEventListener('videoLoaded', function () {
      setTimeout(function () {
        setShield();
        _this.isLooping = _repeat;
        _skipAmount = ($video.duration / 20);
        if (_this.autoplay) { _this.play(); }
      }, 200);
    });

    // ==== Load/init Video =====

    if (_this.source && _this.type) {
      $source.attr('src', _this.source);
      $source.attr('type', _this.type);
      load();
    }

    if (_this.poster) {
      $video.attr("poster", _this.poster);
    }

    // ==== Return Object ====

    return _this;
  }

  function _seekBar(seekBar, parentPlayer) {
    var _this = {};

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

    Object.defineProperty(_this, 'leftOfBar', { get: function () { return $seekbarLength.offset().left; } });
    Object.defineProperty(_this, 'widthOfBar', { get: function () { return $seekbarLength.width(); } });

    _this.max = 0;

    $video.onloadedmetadata = function () {
      _this.max = $video.duration;
    };
    $video.ontimeupdate = function () {
      _updateTime($video.currentTime);
    };

    $seekbarLength.mousedown(function (e) {
        if (e.which == 1) {
          if(_this.wasPlaying == null){
            _this.wasPlaying = parentPlayer.isPlaying;
          }
          parentPlayer.pause();
          _this.seek(e);
          $mouseDown = _this;
        }
    });

    _this.resume = function () {
      if (_this.wasPlaying) {
        parentPlayer.play();
      }
      _this.wasPlaying = null;
    }

    _this.seek = function (e) {
      var calculatedTime = ((e.pageX - $seekBar.position().left) / _this.widthOfBar) * _this.max;
      if (calculatedTime < 0) { calculatedTime = 0; }
      else if (calculatedTime >= _this.max) { calculatedTime = _this.max - .01; }
      $video.currentTime = calculatedTime;
    }

    function _updateTime(_currentTime) {
      currentTime = _currentTime;
      var percentage = ((currentTime / _this.max) * 100) + "%";
      $seekbarPosition.css('width', percentage);
      $seekbarHandle.css('left', percentage);
    }

    return this;
  }

  //============== INIT ===============

  $("ace-player").each(function () {
    _initiateAcePlayer(this);
  });
});

(function(){
  'use strict';

  // Disable only pinch/gesture zoom. Do not touch one-finger swipes,
  // gallery drag logic, product scroll, or normal clicks.
  function preventMultiTouchZoom(event){
    if (event && event.touches && event.touches.length > 1) {
      event.preventDefault();
    }
  }

  function preventGestureZoom(event){
    event.preventDefault();
  }

  // iOS/Safari/Telegram WebView gesture events.
  document.addEventListener('gesturestart', preventGestureZoom, { passive: false });
  document.addEventListener('gesturechange', preventGestureZoom, { passive: false });
  document.addEventListener('gestureend', preventGestureZoom, { passive: false });

  // Generic multi-touch pinch. Single-finger swipes continue to work.
  document.addEventListener('touchmove', preventMultiTouchZoom, { passive: false });

  // Prevent double-tap zoom on photo areas only. Single taps/swipes are not blocked.
  var lastTapAt = 0;
  document.addEventListener('touchend', function(event){
    var target = event.target;
    if (!target || !target.closest) return;
    var inPhoto = target.closest('.product-detail-gallery, .product-gallery-slide, .gallery');
    if (!inPhoto) return;

    var now = Date.now();
    if (now - lastTapAt < 280) {
      event.preventDefault();
    }
    lastTapAt = now;
  }, { passive: false });
})();

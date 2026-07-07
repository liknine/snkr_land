(function(){
  var ADMIN_IDS = ['1639462053','583019274'];
  function getTelegramUserId(){
    try { return String(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user && window.Telegram.WebApp.initDataUnsafe.user.id || ''); }
    catch(e){ return ''; }
  }
  window.__snkrShouldShowAdminId = function(){
    try {
      var params = new URLSearchParams(window.location.search || '');
      if (params.get('admin') === '1') return true;
      if (window.localStorage && window.localStorage.getItem('snkr_admin') === '1') return true;
    } catch(e) {}
    var tgId = getTelegramUserId();
    return !!tgId && ADMIN_IDS.indexOf(String(tgId)) !== -1;
  };
})();

// ==UserScript==
// @name         Wechat Hyperlink Tweak
// @namespace    k. Lee
// @version      0.4
// @description  Enhance hyperlinks in wechat (indended for Vimium link hints)
// @author       k. Lee
// @match        http*://weixin.sogou.com/weixin*
// @match        http*://mp.weixin.qq.com/profile*
// @match        http*://mp.weixin.qq.com/s*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
  'use strict';

  var postload = {
    '/weixin': function() {openNewLinkOnSearchPageSelf(); },
    '/profile': function() { addHyperLinks2MsgCards(); },
    '/s': function() {changeProfileIdLink(); }
  };

  var path_lv1 = '/' + (window.location.pathname.split('/')[1] || '');
  if(postload[path_lv1] !== undefined) {
    window.addEventListener('load', postload[path_lv1]);
  }


  function openNewLinkOnSearchPageSelf() {
    $('.news-box .txt-box a').attr('target', '_self');
  }


  function addHyperLinks2MsgCards() {
    // cascade hyper link css
    GM_addStyle('a.wh_title_link {color: inherit !important;}');

    var msgcard_titles = document.getElementsByClassName('weui_media_title');
    Array.prototype.forEach.call(msgcard_titles, function(title) {
      var href = title.getAttribute('hrefs');
      title.innerHTML = '<a class="wh_title_link" href="' + href + '" target="_blank">' + title.innerHTML + '</a>';
    });
  }


  function getOriginalUserId() {
    var scripts = document.getElementsByTagName('script');
    var user_id;
    Array.prototype.forEach.call(scripts, function(script) {
      var m;
      if(!user_id && (m = script.innerHTML.match(/var\s+user_name\s*=\s*'(.+)';/))) {
        user_id = m[1];
      }
    });
    return user_id;
  }


  function getUserDefinedId() {
    var metas = document.getElementById('profileBt').getElementsByClassName('profile_meta');
    var user_id;
    Array.prototype.forEach.call(metas, function(meta) {
      if (meta.firstElementChild.textContent.trim() === 'WeChat ID' ||
        meta.firstElementChild.textContent === '微信号') {
        user_id = meta.lastElementChild.textContent;
      }
    });
    return user_id;
  }


  function getUserNickName() {
    var el = document.getElementById('profileBt').getElementsByClassName('profile_nickname')[0];
    return el && el.textContent;
  }


  function changeProfileIdLink() {
    var profile = document.getElementById('profileBt');
    var a = profile.getElementsByTagName('a')[0];
    var user_id;
    if (a.getAttribute('href') === 'javascript:void(0);' && (user_id = getUserDefinedId() || getOriginalUserId())) {
      a.setAttribute('href', '//weixin.sogou.com/weixin?type=1&query=' + user_id);
      // force default action for click event
      a.addEventListener('click', function(e){e.stopPropagation(); }, false);

      //// git rid of the already-exist 'click' listeners
      //// by [removing all event listeners](https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type/19470348)
      //a.parentNode.replaceChild(a.cloneNode(true), a);
      //a = profile.getElementsByTagName('a')[0];
      //a.addEventListener('click', function(e){e.stopImmediatePropagation(); }, false);
    }
  }
})();

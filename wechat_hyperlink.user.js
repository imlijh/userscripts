// ==UserScript==
// @name         Wechat Hyperlink Tweak
// @namespace    https://github.com/imlijh/userscripts
// @version      0.5
// @description  Enhance hyperlinks in wechat (indended for Vimium link hints)
// @author       k. Lee
// @match        http*://weixin.sogou.com/weixin*
// @match        https://mp.weixin.qq.com/profile*
// @match        https://mp.weixin.qq.com/s*
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==


const openNewLinkOnSearchPageSelf = function() {
  const els = document.querySelectorAll('.news-box .txt-box a[uigs^="account_name_"]')
  for (let el of els) {
    el.setAttribute('target', '_self')
  }
}


const addHyperLinks2MsgCards = function() {
  // cascade hyper link css
  GM_addStyle('a.wh_title_link {color: inherit !important;}')

  const msgcard_titles = document.querySelectorAll('.weui_media_title')
  for (let title of msgcard_titles) {
    //title.innerHTML = `<a class="wh_title_link" href="${title.getAttribute('hrefs')}" target="_blank">${title.innerHTML}</a>`
    const link_node = document.createElement('a')
    link_node.setAttribute('target', '_blank')
    link_node.className = 'wh_title_link'
    link_node.href = title.getAttribute('hrefs')
    link_node.innerHTML = title.innerHTML
    title.parentNode.replaceChild(link_node, title)
  }
}


const getOriginalUserId = function() {
  // defined in an inline script in the document
  return user_name
}


const getUserDefinedId = function() {
  const metas = document.querySelectorAll('#profileBt .profile_meta > .profile_meta_label')
  let user_id
  for (let el of metas) {
    if (el.textContent.trim() === 'WeChat ID' || el.textContent.trim() === '微信号') {
      user_id = el.nextElementSibling.textContent.trim()
    }
  }
  return user_id
}


const getUserNickName = function() {
  const el = document.querySelector('#profileBt .profile_nickname')
  return el && el.textContent
}


const changeProfileIdLink = function() {
  const a = document.querySelector('#profileBt a')
  let user_id
  if (a && a.getAttribute('href') === 'javascript:void(0);' && (user_id = getUserDefinedId() || getOriginalUserId())) {
    a.setAttribute('href', '//weixin.sogou.com/weixin?type=1&query=' + user_id)
    // force default action for click event
    a.addEventListener('click', e => { e.stopPropagation() }, false)

    // get rid of the already-exist 'click' listeners
    // by [removing all event listeners](https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type/19470348)
    /*
    a.parentNode.replaceChild(a.cloneNode(true), a)
    cnost new_a = document.querySelector('#profileBt a')
    new_a.addEventListener('click', e => { e.stopImmediatePropagation() }, false)
    */
  }
}


const run = function() {
  const postload = {
    '/weixin': () => { openNewLinkOnSearchPageSelf() },
    '/profile':() => { addHyperLinks2MsgCards() },
    '/s': () => { changeProfileIdLink() }
  }

  const path_lv1 = '/' + (window.location.pathname.split('/')[1] || '')
  if(postload[path_lv1] !== undefined) {
    window.addEventListener('load', postload[path_lv1])
  }
}

run()

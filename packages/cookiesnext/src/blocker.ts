import type { ResolvedConfig } from './types.js'

/**
 * Vanilla-JS runtime injected as an inline <script> at the very top of
 * <body>, i.e. it runs before any third-party script or iframe below it is
 * parsed. It intercepts scripts/iframes in three ways:
 *
 * 1. `document.createElement` patch — dynamically created scripts/iframes
 *    (GTM-style injection) get a guarded `src` setter, so a blocked URL is
 *    never assigned and no request is made.
 * 2. MutationObserver — parser-inserted nodes from the server-rendered HTML.
 *    The observer callback is a microtask that runs before an external
 *    script executes / before the iframe navigation task starts.
 * 3. Manual markup — `<script type="text/plain" data-cookiesnext="id">` and
 *    `<iframe data-cookiesnext="id" data-cn-src="…">` are always honoured
 *    (zero-request guarantee, also works with autoBlock: false).
 *
 * Communication with the React side happens via DOM events:
 * - dispatches `cookiesnext:blocked` when something new was blocked
 * - dispatches `cookiesnext:unblocked` after restoring elements
 * - listens for `cookiesnext:consent` ({ version, services }) to unblock
 */
const RUNTIME = `
var consent = readCookie(CFG.cookieName);
var essentials = {};
for (var ei = 0; ei < CFG.services.length; ei++) {
  if (CFG.services[ei].essential) essentials[CFG.services[ei].id] = true;
}
var blocked = [];

function readCookie(name) {
  var parts = document.cookie ? document.cookie.split(';') : [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].replace(/^\\s+/, '');
    if (p.indexOf(name + '=') === 0) {
      try {
        var v = JSON.parse(decodeURIComponent(p.slice(name.length + 1)));
        if (v && typeof v.version === 'number' && v.services) return v;
      } catch (e) {}
      return null;
    }
  }
  return null;
}

function isAllowed(id) {
  if (essentials[id] === true) return true;
  if (!consent || consent.version !== CFG.version) return false;
  return consent.services[id] === true;
}

function matchUrl(url) {
  if (!url || !CFG.autoBlock) return null;
  for (var i = 0; i < CFG.services.length; i++) {
    var s = CFG.services[i];
    for (var j = 0; j < s.patterns.length; j++) {
      if (s.patterns[j] && url.indexOf(s.patterns[j]) !== -1) return s.id;
    }
  }
  return null;
}

function dispatch(name, detail) {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  } catch (e) {}
}

function registerBlocked(el, id, kind) {
  for (var i = 0; i < blocked.length; i++) {
    if (blocked[i].el === el) return;
  }
  blocked.push({ el: el, id: id, kind: kind });
  dispatch('cookiesnext:blocked', { id: id });
}

function blockScript(el, id) {
  var origType = el.getAttribute('type');
  if (origType && origType !== 'text/plain') el.setAttribute('data-cn-type', origType);
  el.type = 'text/plain';
  el.setAttribute('data-cn-blocked', id);
  var src = el.getAttribute('src');
  if (src) {
    el.setAttribute('data-cn-src', src);
    el.removeAttribute('src');
  }
  registerBlocked(el, id, 'script');
}

function blockIframe(el, id, src) {
  el.setAttribute('data-cn-blocked', id);
  if (src) el.setAttribute('data-cn-src', src);
  if (el.getAttribute('src')) el.setAttribute('src', 'about:blank');
  registerBlocked(el, id, 'iframe');
}

function restoreScript(el) {
  var s = document.createElement('script');
  var attrs = el.attributes;
  for (var i = 0; i < attrs.length; i++) {
    var a = attrs[i];
    if (
      a.name === 'type' ||
      a.name === 'src' ||
      a.name === 'data-cn-blocked' ||
      a.name === 'data-cn-src' ||
      a.name === 'data-cn-type'
    )
      continue;
    s.setAttribute(a.name, a.value);
  }
  var origType = el.getAttribute('data-cn-type');
  if (origType) s.setAttribute('type', origType);
  var src = el.getAttribute('data-cn-src');
  if (src) s.setAttribute('src', src);
  else s.textContent = el.textContent || '';
  s.__cnSeen = true;
  if (el.parentNode) el.parentNode.replaceChild(s, el);
  else document.head.appendChild(s);
}

function restoreIframe(el) {
  var src = el.getAttribute('data-cn-src');
  el.removeAttribute('data-cn-blocked');
  if (src) el.setAttribute('src', src);
}

function inspectScript(el) {
  if (el.__cnSeen) return;
  var blockedId = el.getAttribute('data-cn-blocked');
  if (blockedId) {
    el.__cnSeen = true;
    if (isAllowed(blockedId)) restoreScript(el);
    else registerBlocked(el, blockedId, 'script');
    return;
  }
  var manualId = el.getAttribute('data-cookiesnext');
  var srcAttr = el.getAttribute('src') || '';
  var pendingSrc = el.getAttribute('data-cn-src') || '';
  var id = manualId || matchUrl(srcAttr || pendingSrc);
  if (!id) {
    el.__cnSeen = true;
    return;
  }
  el.__cnSeen = true;
  if (isAllowed(id)) {
    var type = el.getAttribute('type');
    var inert = type === 'text/plain' || type === 'text/cookiesnext';
    if (inert || (!srcAttr && pendingSrc)) restoreScript(el);
    return;
  }
  blockScript(el, id);
}

function inspectIframe(el) {
  var blockedId = el.getAttribute('data-cn-blocked');
  if (blockedId) {
    if (isAllowed(blockedId)) restoreIframe(el);
    else registerBlocked(el, blockedId, 'iframe');
    return;
  }
  var manualId = el.getAttribute('data-cookiesnext');
  var srcAttr = el.getAttribute('src') || '';
  var pendingSrc = el.getAttribute('data-cn-src') || '';
  var id = manualId || matchUrl(srcAttr || pendingSrc);
  if (!id) return;
  if (isAllowed(id)) {
    if (!srcAttr && pendingSrc) el.setAttribute('src', pendingSrc);
    return;
  }
  blockIframe(el, id, srcAttr || pendingSrc);
}

function inspect(node) {
  if (!node || node.nodeType !== 1) return;
  var tag = node.tagName;
  if (tag === 'SCRIPT') inspectScript(node);
  else if (tag === 'IFRAME') inspectIframe(node);
  if (node.querySelectorAll) {
    var list = node.querySelectorAll('script,iframe');
    for (var i = 0; i < list.length; i++) {
      if (list[i].tagName === 'SCRIPT') inspectScript(list[i]);
      else inspectIframe(list[i]);
    }
  }
}

function guardElement(el, kind) {
  if (el.__cnGuard) return;
  var proto = kind === 'script' ? HTMLScriptElement.prototype : HTMLIFrameElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'src');
  if (!desc || !desc.set) return;
  el.__cnGuard = true;
  try {
    Object.defineProperty(el, 'src', {
      configurable: true,
      get: function () {
        return desc.get.call(el);
      },
      set: function (value) {
        var url = String(value);
        var id = matchUrl(url);
        if (id && !isAllowed(id)) {
          el.setAttribute('data-cn-src', url);
          el.setAttribute('data-cn-blocked', id);
          if (kind === 'script') {
            var origType = el.getAttribute('type');
            if (origType && origType !== 'text/plain') el.setAttribute('data-cn-type', origType);
            el.type = 'text/plain';
          } else {
            desc.set.call(el, 'about:blank');
          }
          el.__cnSeen = true;
          registerBlocked(el, id, kind);
          return;
        }
        desc.set.call(el, value);
      },
    });
    var origSetAttribute = el.setAttribute;
    el.setAttribute = function (name, value) {
      if (String(name).toLowerCase() === 'src') {
        el.src = value;
        return;
      }
      return origSetAttribute.call(el, name, value);
    };
  } catch (e) {}
}

if (CFG.autoBlock) {
  var origCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = function () {
    var el = origCreateElement.apply(this, arguments);
    var tag = String(arguments[0]).toLowerCase();
    if (tag === 'script' || tag === 'iframe') guardElement(el, tag);
    return el;
  };
}

var observer = new MutationObserver(function (mutations) {
  for (var i = 0; i < mutations.length; i++) {
    var added = mutations[i].addedNodes;
    for (var j = 0; j < added.length; j++) inspect(added[j]);
  }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

inspect(document.documentElement);

window.addEventListener('cookiesnext:consent', function (ev) {
  var detail = ev.detail || {};
  consent =
    detail.services && typeof detail.version === 'number'
      ? { version: detail.version, services: detail.services }
      : null;
  if (!consent) return;
  var remaining = [];
  var restored = false;
  for (var i = 0; i < blocked.length; i++) {
    var entry = blocked[i];
    if (!isAllowed(entry.id)) {
      remaining.push(entry);
      continue;
    }
    try {
      if (entry.kind === 'iframe') restoreIframe(entry.el);
      else restoreScript(entry.el);
      restored = true;
    } catch (e) {}
  }
  blocked = remaining;
  if (restored) dispatch('cookiesnext:unblocked', {});
});

window.__cookiesnext = {
  isAllowed: isAllowed,
  blockedIds: function () {
    var ids = [];
    for (var i = 0; i < blocked.length; i++) ids.push(blocked[i].id);
    return ids;
  },
};
`

export interface BlockerPayload {
  cookieName: string
  version: number
  autoBlock: boolean
  services: { id: string; patterns: string[]; essential: boolean }[]
}

export function buildBlockerPayload(config: ResolvedConfig): BlockerPayload {
  return {
    cookieName: config.cookieName,
    version: config.version,
    autoBlock: config.autoBlock,
    services: config.services.map((s) => ({
      id: s.id,
      patterns: s.patterns,
      essential: s.category === 'essential',
    })),
  }
}

/** Build the self-contained inline script source. */
export function buildBlockerScript(config: ResolvedConfig): string {
  const json = JSON.stringify(buildBlockerPayload(config)).replace(/</g, '\\u003c')
  return '(function(){if(window.__cookiesnext)return;var CFG=' + json + ';' + RUNTIME + '})();'
}

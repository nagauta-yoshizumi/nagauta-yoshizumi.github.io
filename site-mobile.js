/* ============================================================
   site-mobile.js ―― スマートフォン向けの共通スクリプト
   2026-08 追加

   1) メニューボタン（ハンバーガー）の開閉
   2) 電話番号・メールアドレスの自動リンク化（スマホからタップで発信）

   各HTMLの </body> 直前で読み込んでいます。
   不要になったら <script> の1行を消すだけで元に戻ります。
   ============================================================ */
(function () {
  "use strict";

  /* --------------------------------------------------------
     1) メニューボタンの開閉
     -------------------------------------------------------- */
  function setupMenuToggles() {
    var toggles = document.querySelectorAll(".menu-toggle");

    Array.prototype.forEach.call(toggles, function (toggle) {
      // 二重登録の防止（同じ要素に2回ハンドラを付けない）
      if (toggle.getAttribute("data-menu-bound") === "1") return;
      toggle.setAttribute("data-menu-bound", "1");

      var nav = toggle.closest ? toggle.closest("nav") : null;
      if (!nav) {
        // closest 非対応の古い端末向けフォールバック
        nav = toggle.parentNode;
        while (nav && nav.tagName !== "NAV") {
          nav = nav.parentNode;
        }
      }
      if (!nav) return;

      var menu = nav.querySelector("ul");
      if (!menu) return;

      // アクセシビリティ属性（見出しタグをボタンとして使っているため）
      toggle.setAttribute("role", "button");
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "メニューを開く");

      function setOpen(open) {
        if (open) {
          menu.classList.add("toggled-on");
        } else {
          menu.classList.remove("toggled-on");
        }
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      }

      function toggleMenu(e) {
        if (e) {
          e.preventDefault();
          // 旧「navigation.js」やHTMLに埋め込まれた古い開閉スクリプトが
          // 同じボタンに反応して即座に閉じてしまうのを防ぐ
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        }
        setOpen(!menu.classList.contains("toggled-on"));
      }

      toggle.addEventListener("click", toggleMenu);

      // キーボード操作（Enter / Space）にも対応
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          toggleMenu(e);
        }
      });

      // メニュー内のリンクを押したら閉じる
      Array.prototype.forEach.call(menu.querySelectorAll("a"), function (link) {
        link.addEventListener("click", function () {
          setOpen(false);
        });
      });

      // メニューの外側をタップしたら閉じる
      document.addEventListener("click", function (e) {
        if (!menu.classList.contains("toggled-on")) return;
        if (nav.contains(e.target)) return;
        setOpen(false);
      });
    });
  }

  /* --------------------------------------------------------
     2) 電話番号・メールアドレスの自動リンク化
        （既にリンクになっている箇所や、フォーム内は対象外）
     -------------------------------------------------------- */
  var TEL_RE = /(0\d{1,4}[-－ー―‐]\d{1,4}[-－ー―‐]\d{3,4})/g;
  var MAIL_RE = /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  var SKIP_TAGS = { A: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, BUTTON: 1, SELECT: 1 };

  function isSkippable(node) {
    var el = node.parentNode;
    while (el && el.nodeType === 1) {
      if (SKIP_TAGS[el.tagName]) return true;
      el = el.parentNode;
    }
    return false;
  }

  function linkifyTextNode(node) {
    var text = node.nodeValue;
    if (!text || (text.indexOf("@") === -1 && !/0\d{1,4}[-－ー―‐]/.test(text))) return;

    var html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    var changed = false;

    html = html.replace(MAIL_RE, function (m) {
      changed = true;
      return '<a class="auto-mail" href="mailto:' + m + '">' + m + "</a>";
    });

    html = html.replace(TEL_RE, function (m) {
      changed = true;
      var num = m.replace(/[-－ー―‐]/g, "");
      return '<a class="auto-tel" href="tel:' + num + '">' + m + "</a>";
    });

    if (!changed) return;

    var span = document.createElement("span");
    span.innerHTML = html;
    node.parentNode.replaceChild(span, node);
  }

  function linkifyContacts() {
    var roots = document.querySelectorAll("#content, .sp-site-branding-extra, .extra");
    Array.prototype.forEach.call(roots, function (root) {
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      var targets = [];
      var n;
      while ((n = walker.nextNode())) {
        if (!isSkippable(n)) targets.push(n);
      }
      targets.forEach(linkifyTextNode);
    });
  }

  /* --------------------------------------------------------
     起動
     -------------------------------------------------------- */
  function init() {
    try {
      setupMenuToggles();
    } catch (e) {
      /* メニューが動かなくても他の処理は続行 */
    }
    try {
      linkifyContacts();
    } catch (e) {
      /* リンク化の失敗はページ表示に影響させない */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

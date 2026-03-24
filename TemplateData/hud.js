/**
 * Soundsent HTML HUD + Unity WebGL bridge.
 *
 * Unity project (add GameObject named exactly):
 *   Name: SoundsentWebBridge
 *   Methods (public on a MonoBehaviour):
 *     - SelectCharacterFromWeb(string id)   // id: savedher | garcon | bacomartinez
 *     - OnHudEscape()                       // optional
 *
 * Unity → page: call from a .jslib plugin:
 *   SoundsentBridge.receiveFromUnity('garcon');
 */
(function () {
  var UNITY_GO = "SoundsentWebBridge";
  var ORDER = ["savedher", "garcon", "bacomartinez"];

  function qs(sel) {
    return document.querySelector(sel);
  }

  function sendUnity(method, value) {
    if (!window.unityInstance) return;
    try {
      window.unityInstance.SendMessage(
        UNITY_GO,
        method,
        value === undefined || value === null ? "" : String(value)
      );
    } catch (e) {
      console.warn("[SoundsentBridge] SendMessage failed:", method, e);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function parseBioHtml(text) {
    if (!text) return "";
    return text.split(/\n\n+/).map(function (block) {
      return (
        "<p>" +
        escapeHtml(block).replace(/\n/g, "<br/>") +
        "</p>"
      );
    }).join("");
  }

  function setHudCharacterClass(hasCharacter) {
    var root = qs("#soundsent-hud");
    if (!root) return;
    root.classList.toggle("soundsent-hud--no-character", !hasCharacter);
  }

  function renderEmpty() {
    qs("[data-bind='heroTitle']").textContent = "";
    qs("[data-bind='bioName']").textContent = "";
    qs("[data-bind='weapon']").textContent = "";
    qs("[data-bind='bio']").innerHTML = "";

    var avatar = qs("[data-bind='avatar']");
    avatar.removeAttribute("src");
    avatar.alt = "";
    qs("[data-bind='portrait']").removeAttribute("src");
    qs("[data-bind='portrait']").alt = "";
    qs("[data-bind='socialStrip']").removeAttribute("src");

    ORDER.forEach(function (key) {
      var btn = qs('.hud-nav__btn[data-character="' + key + '"]');
      if (!btn) return;
      btn.setAttribute("aria-pressed", "false");
      btn.classList.remove("hud-nav__btn--active");
    });

    ["bandcamp", "soundcloud", "instagram", "twitter", "youtube"].forEach(
      function (net) {
        var row = qs('.hud-social__link[data-network="' + net + '"]');
        if (!row) return;
        row.href = "#";
        row.classList.remove("hud-social__link--active");
      }
    );

    setHudCharacterClass(false);
  }

  function renderCharacter(id) {
    var data = window.SOUNDSENT_CHARACTERS[id];
    if (!data) return;

    qs("[data-bind='heroTitle']").textContent = data.heroTitle;
    qs("[data-bind='bioName']").textContent = data.bioName;
    qs("[data-bind='weapon']").textContent = data.weapon;
    qs("[data-bind='bio']").innerHTML = parseBioHtml(data.bioHtml);

    qs("[data-bind='avatar']").src = data.avatar;
    qs("[data-bind='avatar']").alt = data.heroTitle;
    qs("[data-bind='portrait']").src = data.portrait;
    qs("[data-bind='portrait']").alt = data.heroTitle;
    qs("[data-bind='socialStrip']").src = data.socialStrip;
    qs("[data-bind='socialStrip']").alt = "";

    ORDER.forEach(function (key) {
      var btn = qs('.hud-nav__btn[data-character="' + key + '"]');
      if (!btn) return;
      btn.setAttribute(
        "aria-pressed",
        key === id ? "true" : "false"
      );
      btn.classList.toggle("hud-nav__btn--active", key === id);
    });

    ["bandcamp", "soundcloud", "instagram", "twitter", "youtube"].forEach(
      function (net) {
        var row = qs('.hud-social__link[data-network="' + net + '"]');
        if (!row) return;
        row.href = data.links[net] || "#";
        row.classList.toggle(
          "hud-social__link--active",
          data.highlightSocial === net
        );
      }
    );

    setHudCharacterClass(true);
  }

  var state = {
    activeId: null,
    hudVisible: true,
  };

  function setHudVisible(visible) {
    state.hudVisible = !!visible;
    var root = qs("#soundsent-hud");
    if (!root) return;
    root.classList.toggle("soundsent-hud--hidden", !state.hudVisible);
    root.setAttribute("aria-hidden", state.hudVisible ? "false" : "true");
  }

  function setActiveCharacter(id, opts) {
    opts = opts || {};
    if (!window.SOUNDSENT_CHARACTERS[id]) return;
    state.activeId = id;
    renderCharacter(id);
    if (!opts.fromUnity) {
      sendUnity("SelectCharacterFromWeb", id);
    }
    window.dispatchEvent(
      new CustomEvent("soundsent:activeCharacter", { detail: { id: id } })
    );
  }

  function onEscape() {
    setHudVisible(false);
    sendUnity("OnHudEscape", "");
  }

  function onNavClick(e) {
    var id = e.currentTarget.getAttribute("data-character");
    if (id) setActiveCharacter(id, { fromUnity: false });
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      if (!state.hudVisible) return;
      e.preventDefault();
      onEscape();
    }
    if (!state.hudVisible) return;
    if (e.key === "1") setActiveCharacter("savedher", { fromUnity: false });
    if (e.key === "2") setActiveCharacter("garcon", { fromUnity: false });
    if (e.key === "3") setActiveCharacter("bacomartinez", { fromUnity: false });
  }

  function initDom() {
    ORDER.forEach(function (id) {
      var btn = qs('.hud-nav__btn[data-character="' + id + '"]');
      if (btn) btn.addEventListener("click", onNavClick);
    });

    var infoBtn = qs("[data-action='info']");
    if (infoBtn) {
      infoBtn.addEventListener("click", function () {
        sendUnity("OnInfoClick", "");
      });
    }

    document.addEventListener("keydown", onKeydown);
    renderEmpty();
  }

  window.SoundsentBridge = {
    receiveFromUnity: function (characterId) {
      if (!window.SOUNDSENT_CHARACTERS[characterId]) return;
      setActiveCharacter(characterId, { fromUnity: true });
    },
    setActiveCharacter: function (id) {
      setActiveCharacter(id, { fromUnity: false });
    },
    setHudVisible: setHudVisible,
    showHud: function () {
      setHudVisible(true);
    },
    hideHud: function () {
      setHudVisible(false);
    },
    getActiveId: function () {
      return state.activeId;
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDom);
  } else {
    initDom();
  }
})();

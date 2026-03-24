mergeInto(LibraryManager.library, {
  SoundsentBridge_SetCharacter: function (ptr) {
    var id = UTF8ToString(ptr);
    if (typeof SoundsentBridge !== "undefined" && SoundsentBridge.receiveFromUnity) {
      SoundsentBridge.receiveFromUnity(id);
    }
  },
});

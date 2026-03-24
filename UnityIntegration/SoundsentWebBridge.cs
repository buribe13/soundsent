using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// Place this on a GameObject named exactly "SoundsentWebBridge" in the WebGL player scene.
/// Wire your camera / character selection logic to SelectCharacterFromWeb and NotifyCharacterToPage.
/// Copy this file and the .jslib from UnityIntegration/Plugins/ into your Unity project Assets/.
/// </summary>
public class SoundsentWebBridge : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern void SoundsentBridge_SetCharacter(string id);
#endif

    public void SelectCharacterFromWeb(string id)
    {
        Debug.Log("[SoundsentWebBridge] Web selected: " + id);
    }

    public void OnHudEscape()
    {
        Debug.Log("[SoundsentWebBridge] HUD escape");
    }

    public void OnInfoClick()
    {
        Debug.Log("[SoundsentWebBridge] Info");
    }

    public static void NotifyCharacterToPage(string id)
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        SoundsentBridge_SetCharacter(id);
#endif
    }
}

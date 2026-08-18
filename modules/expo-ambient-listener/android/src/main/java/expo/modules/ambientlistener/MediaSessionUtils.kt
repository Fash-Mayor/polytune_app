package expo.modules.ambientlistener

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Build
import android.provider.Settings
import android.view.KeyEvent

object MediaSessionUtils {
  fun isNotificationAccessEnabled(context: Context): Boolean {
    val enabledListeners = Settings.Secure.getString(
      context.contentResolver,
      "enabled_notification_listeners",
    ) ?: return false

    val component = ComponentName(
      context,
      AmbientNotificationListenerService::class.java,
    ).flattenToString()

    return enabledListeners.split(":").any { it.contains(component) }
  }

  fun openNotificationAccessSettings(context: Context) {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }

  fun refreshActiveSessions(context: Context) {
    if (!isNotificationAccessEnabled(context)) return

    val sessionManager = context.getSystemService(Context.MEDIA_SESSION_SERVICE)
      as MediaSessionManager
    val componentName = ComponentName(context, AmbientNotificationListenerService::class.java)

    try {
      val controllers = sessionManager.getActiveSessions(componentName)
      updateFromControllers(controllers)
    } catch (_: SecurityException) {
      // Notification access not granted yet.
    }
  }

  fun updateFromControllers(controllers: List<MediaController>) {
    pickBestController(controllers)?.let { controller ->
      MediaSessionStateHolder.updateFromController(controller, null) {
        MediaEventDispatcher.dispatch()
      }
      MediaEventDispatcher.dispatch()
    }
  }

  fun togglePlayback(context: Context) {
    val controller = MediaSessionStateHolder.activeController
    if (controller != null) {
      val state = controller.playbackState?.state
      if (state == PlaybackState.STATE_PLAYING) {
        controller.transportControls.pause()
      } else {
        controller.transportControls.play()
      }
      return
    }

    dispatchMediaKey(context, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
  }

  fun skipToNext(context: Context) {
    val controller = MediaSessionStateHolder.activeController
    if (controller != null) {
      controller.transportControls.skipToNext()
      return
    }
    dispatchMediaKey(context, KeyEvent.KEYCODE_MEDIA_NEXT)
  }

  fun skipToPrevious(context: Context) {
    val controller = MediaSessionStateHolder.activeController
    if (controller != null) {
      controller.transportControls.skipToPrevious()
      return
    }
    dispatchMediaKey(context, KeyEvent.KEYCODE_MEDIA_PREVIOUS)
  }

  private fun dispatchMediaKey(context: Context, keyCode: Int) {
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val downEvent = KeyEvent(KeyEvent.ACTION_DOWN, keyCode)
    val upEvent = KeyEvent(KeyEvent.ACTION_UP, keyCode)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      audioManager.dispatchMediaKeyEvent(downEvent)
      audioManager.dispatchMediaKeyEvent(upEvent)
    }
  }

  private fun pickBestController(controllers: List<MediaController>): MediaController? {
    if (controllers.isEmpty()) return null

    return controllers.maxByOrNull { controller ->
      val state = controller.playbackState?.state ?: PlaybackState.STATE_NONE
      when (state) {
        PlaybackState.STATE_PLAYING -> 3
        PlaybackState.STATE_PAUSED -> 2
        else -> 1
      }
    }
  }
}

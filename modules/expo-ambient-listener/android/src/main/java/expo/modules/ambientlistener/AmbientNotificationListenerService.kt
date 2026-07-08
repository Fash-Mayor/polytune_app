package expo.modules.ambientlistener

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.media.session.MediaController
import android.media.session.MediaSession
import android.app.Notification
import android.os.Build
import androidx.annotation.Keep

@Keep // <-- THIS IS THE BULLETPROOF SHIELD
class AmbientNotificationListenerService : NotificationListenerService() {
  override fun onListenerConnected() {
    super.onListenerConnected()
    refreshFromNotifications()
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    if (!isMediaNotification(sbn)) return
    readMediaFromNotification(sbn)
  }

  override fun onNotificationRemoved(_sbn: StatusBarNotification?) {
    // Keep last known track; OS may remove old notifications while audio continues.
  }

  private fun refreshFromNotifications() {
    val notifications = try {
      activeNotifications
    } catch (_: SecurityException) {
      return
    }

    notifications
      ?.filter { isMediaNotification(it) }
      ?.forEach { readMediaFromNotification(it) }
  }

  private fun isMediaNotification(sbn: StatusBarNotification): Boolean {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      val token = readMediaSessionToken(sbn.notification)
      if (token != null) return true
    }

    val category = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      sbn.notification.category
    } else {
      null
    }

    return category == Notification.CATEGORY_TRANSPORT
  }

  private fun readMediaFromNotification(sbn: StatusBarNotification) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return

    val token = readMediaSessionToken(sbn.notification) ?: return
    val controller = MediaController(this, token)
    
    // Pass the notification down for instant fallback, and a callback for the 600ms delayed retry
    MediaSessionStateHolder.updateFromController(controller, sbn.notification) {
        MediaEventDispatcher.dispatch(controller.packageName)
    }
    
    // Immediately dispatch whatever data we grabbed right now
    MediaEventDispatcher.dispatch(controller.packageName)
  }

  private fun readMediaSessionToken(notification: Notification): MediaSession.Token? {
    val extras = notification.extras
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      extras.getParcelable(Notification.EXTRA_MEDIA_SESSION, MediaSession.Token::class.java)
    } else {
      @Suppress("DEPRECATION")
      extras.getParcelable(Notification.EXTRA_MEDIA_SESSION)
    }
  }
}
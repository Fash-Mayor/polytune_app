package expo.modules.ambientlistener

import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.session.MediaSessionManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoAmbientListenerModule : Module() {
  private var receiver: BroadcastReceiver? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  private var positionPollRunnable: Runnable? = null
  private var sessionsListener: MediaSessionManager.OnActiveSessionsChangedListener? = null
  private var emitMediaEvent: ((Map<String, Any?>) -> Unit)? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoAmbientListener")

    Events("onMediaChanged")

    AsyncFunction("togglePlayback") {
      val context = appContext.reactContext
      if (context != null) {
        MediaSessionUtils.togglePlayback(context)
      }
    }

    AsyncFunction("getCurrentPlaybackPosition") {
      MediaSessionStateHolder.getCurrentPositionMs()
    }

    AsyncFunction("refreshActiveSession") {
      val context = appContext.reactContext
      if (context == null) {
        emptyMap<String, Any?>()
      } else {
        MediaSessionUtils.refreshActiveSessions(context)
        emitCurrentState()
        MediaSessionStateHolder.toEventMap()
      }
    }

    AsyncFunction("isNotificationAccessEnabled") {
      val context = appContext.reactContext
      context != null && MediaSessionUtils.isNotificationAccessEnabled(context)
    }

    AsyncFunction("openNotificationAccessSettings") {
      val context = appContext.reactContext
      if (context != null) {
        MediaSessionUtils.openNotificationAccessSettings(context)
      }
    }

    OnCreate {
      emitMediaEvent = { event ->
        sendEvent("onMediaChanged", event)
      }

      MediaEventDispatcher.setEmitCallback { event ->
        emitMediaEvent?.invoke(event)
      }

      registerBroadcastReceiver()
      registerActiveSessionsListener()
      startPositionPolling()
    }

    OnDestroy {
      stopPositionPolling()
      unregisterActiveSessionsListener()
      receiver?.let { appContext.reactContext?.unregisterReceiver(it) }
      receiver = null
      emitMediaEvent = null
      MediaEventDispatcher.setEmitCallback { }
    }
  }

  private fun registerActiveSessionsListener() {
    val context = appContext.reactContext ?: return
    if (!MediaSessionUtils.isNotificationAccessEnabled(context)) return

    val sessionManager = context.getSystemService(Context.MEDIA_SESSION_SERVICE)
      as MediaSessionManager
    val componentName = ComponentName(context, AmbientNotificationListenerService::class.java)

    sessionsListener = MediaSessionManager.OnActiveSessionsChangedListener { controllers ->
      MediaSessionUtils.updateFromControllers(controllers?.toList() ?: emptyList())
    }

    try {
      sessionManager.addOnActiveSessionsChangedListener(sessionsListener!!, componentName)
      MediaSessionUtils.refreshActiveSessions(context)
    } catch (_: SecurityException) {
      sessionsListener = null
    }
  }

  private fun unregisterActiveSessionsListener() {
    val context = appContext.reactContext ?: return
    val listener = sessionsListener ?: return
    val sessionManager = context.getSystemService(Context.MEDIA_SESSION_SERVICE)
      as MediaSessionManager

    try {
      sessionManager.removeOnActiveSessionsChangedListener(listener)
    } catch (_: Exception) {
      // Ignore teardown errors.
    }

    sessionsListener = null
  }

  private fun registerBroadcastReceiver() {
    val filter = IntentFilter().apply {
      addAction("com.spotify.music.metadatachanged")
      addAction("com.spotify.music.playbackstatechanged")
      addAction("com.android.music.metadatachanged")
      addAction("com.sec.android.app.music.metadatachanged")
      addAction("com.apple.android.music.metadatachanged")
    }

    receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent?) {
        if (intent == null) return
        handleBroadcast(intent)
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      appContext.reactContext?.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
    } else {
      appContext.reactContext?.registerReceiver(receiver, filter)
    }
  }

  private fun handleBroadcast(intent: Intent) {
    val track = intent.getStringExtra("track")
      ?: intent.getStringExtra("id")
      ?: intent.getStringExtra("title")

    val artist = intent.getStringExtra("artist")
      ?: intent.getStringExtra("albumArtist")

    val playingExtra = when {
      intent.hasExtra("playing") -> intent.getBooleanExtra("playing", false)
      intent.hasExtra("play") -> intent.getBooleanExtra("play", false)
      else -> null
    }

    val albumArt = intent.getStringExtra("albumArt")
      ?: intent.getStringExtra("artwork")
      ?: intent.getStringExtra("album_art")
      ?: intent.getStringExtra("image")

    val positionMs = extractPositionMs(intent)

    if (track.isNullOrBlank() && playingExtra == null && positionMs == null) return

    MediaSessionStateHolder.updateMetadata(
      trackTitle = track,
      trackArtist = artist,
      artUri = albumArt,
      playing = playingExtra,
      positionMs = positionMs,
    )

    emitCurrentState()
  }

  private fun extractPositionMs(intent: Intent): Long? {
    val candidates = listOf(
      intent.getLongExtra("position", -1L),
      intent.getLongExtra("positionInMs", -1L),
      intent.getIntExtra("positionInMs", -1).toLong(),
      intent.getLongExtra("playbackPosition", -1L),
      intent.getIntExtra("position", -1).toLong(),
    )

    return candidates.firstOrNull { it >= 0 }
  }

  private fun emitCurrentState() {
    emitMediaEvent?.invoke(MediaSessionStateHolder.toEventMap())
  }

  private fun startPositionPolling() {
    stopPositionPolling()

    positionPollRunnable = object : Runnable {
      override fun run() {
        if (MediaSessionStateHolder.isPlaying && !MediaSessionStateHolder.title.isNullOrBlank()) {
          emitMediaEvent?.invoke(MediaSessionStateHolder.toEventMap())
        }
        mainHandler.postDelayed(this, POSITION_POLL_MS)
      }
    }

    mainHandler.postDelayed(positionPollRunnable!!, POSITION_POLL_MS)
  }

  private fun stopPositionPolling() {
    positionPollRunnable?.let { mainHandler.removeCallbacks(it) }
    positionPollRunnable = null
  }

  companion object {
    private const val POSITION_POLL_MS = 250L
  }
}

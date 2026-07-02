package expo.modules.ambientlistener

import android.app.Notification
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.PlaybackState
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import java.io.ByteArrayOutputStream

object MediaSessionStateHolder {
  @Volatile var title: String? = null
  @Volatile var artist: String? = null
  @Volatile var albumArtUri: String? = null
  @Volatile var isPlaying: Boolean = false
  @Volatile var lastPositionMs: Long = 0
  @Volatile var lastPositionUpdateTimeMs: Long = 0
  @Volatile var activeController: MediaController? = null

  // Handler for delayed art fetching
  private val handler = Handler(Looper.getMainLooper())
  private var retryRunnable: Runnable? = null

  fun updateFromController(
    controller: MediaController, 
    notification: Notification? = null,
    onRetryDispatch: (() -> Unit)? = null
  ) {
    // 1. Cancel pending retries immediately to avoid race conditions if tracks are skipped rapidly
    retryRunnable?.let { handler.removeCallbacks(it) }
    retryRunnable = null

    activeController = controller
    val metadata = controller.metadata
    val playbackState = controller.playbackState

    // 2. Safely capture text updates
    val incomingTitle = metadata?.getString(MediaMetadata.METADATA_KEY_TITLE)
    val incomingArtist = metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST)
      ?: metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)

    val trackChanged = incomingTitle != null && incomingTitle != title
    title = incomingTitle ?: title
    artist = incomingArtist ?: artist

    // 3. Smart Artwork Resolution Pipeline
    var artFound = false
    val artBitmap = metadata?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
      ?: metadata?.getBitmap(MediaMetadata.METADATA_KEY_ART)

    if (artBitmap != null) {
      albumArtUri = bitmapToDataUri(artBitmap)
      artFound = true
    } else {
      val artUriStr = metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI)
        ?: metadata?.getString(MediaMetadata.METADATA_KEY_ART_URI)

      if (!artUriStr.isNullOrBlank()) {
        albumArtUri = artUriStr
        artFound = true
      } else {
        // Fallback: Check the system notification itself for a large icon bitmap
        val notifBitmap = extractBitmapFromNotification(notification)
        if (notifBitmap != null) {
          albumArtUri = bitmapToDataUri(notifBitmap)
          artFound = true
        } else if (trackChanged) {
          albumArtUri = null // Prevent leaking previous track's art
        }
      }
    }

    // 4. Delayed Auto-Fetch: If art is still missing, poll again in 600ms
    if (!artFound && !title.isNullOrBlank() && onRetryDispatch != null) {
      retryRunnable = Runnable {
        updateFromController(controller, null, null)
        onRetryDispatch.invoke() // Send fresh event payload to React Native UI
      }
      handler.postDelayed(retryRunnable!!, 600)
    }

    // 5. Commit playback states
    val state = playbackState?.state ?: PlaybackState.STATE_NONE
    isPlaying = state == PlaybackState.STATE_PLAYING

    val position = playbackState?.position ?: lastPositionMs
    updatePosition(position)
  }

  fun updateMetadata(
    trackTitle: String?,
    trackArtist: String?,
    artUri: String?,
    playing: Boolean?,
    positionMs: Long?,
  ) {
    if (!trackTitle.isNullOrBlank()) title = trackTitle
    if (!trackArtist.isNullOrBlank()) artist = trackArtist
    if (!artUri.isNullOrBlank()) albumArtUri = artUri
    if (playing != null) isPlaying = playing
    if (positionMs != null && positionMs >= 0) updatePosition(positionMs)
  }

  fun updatePosition(positionMs: Long) {
    lastPositionMs = positionMs.coerceAtLeast(0)
    lastPositionUpdateTimeMs = System.currentTimeMillis()
  }

  fun getCurrentPositionMs(): Long {
    if (!isPlaying) return lastPositionMs
    val elapsed = System.currentTimeMillis() - lastPositionUpdateTimeMs
    return (lastPositionMs + elapsed).coerceAtLeast(0)
  }

  fun toEventMap(): Map<String, Any?> = mapOf(
    "title" to (title ?: ""),
    "artist" to (artist ?: "Unknown Artist"),
    "albumArt" to albumArtUri,
    "isPlaying" to isPlaying,
    "playbackPositionMs" to getCurrentPositionMs(),
  )

  private fun bitmapToDataUri(bitmap: Bitmap): String {
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 85, stream)
    val encoded = Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    return "data:image/jpeg;base64,$encoded"
  }

  @Suppress("DEPRECATION")
  private fun extractBitmapFromNotification(notification: Notification?): Bitmap? {
    if (notification?.extras == null) return null
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        notification.extras.getParcelable(Notification.EXTRA_LARGE_ICON, Bitmap::class.java)
      } else {
        notification.extras.getParcelable(Notification.EXTRA_LARGE_ICON) as? Bitmap
      }
    } catch (e: Exception) {
      null
    }
  }
}
package expo.modules.ambientlistener

import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.PlaybackState
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

  fun updateFromController(controller: MediaController) {
    activeController = controller
    val metadata = controller.metadata
    val playbackState = controller.playbackState

    title = metadata?.getString(MediaMetadata.METADATA_KEY_TITLE) ?: title
    artist = metadata?.getString(MediaMetadata.METADATA_KEY_ARTIST)
      ?: metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)
      ?: artist

    val artBitmap = metadata?.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
      ?: metadata?.getBitmap(MediaMetadata.METADATA_KEY_ART)
    if (artBitmap != null) {
      albumArtUri = bitmapToDataUri(artBitmap)
    }

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
}

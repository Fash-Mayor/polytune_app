package expo.modules.ambientlistener

object MediaEventDispatcher {
  private var emitCallback: ((Map<String, Any?>) -> Unit)? = null

  fun setEmitCallback(callback: (Map<String, Any?>) -> Unit) {
    emitCallback = callback
  }

  fun dispatch(_source: String? = null) {
    emitCallback?.invoke(MediaSessionStateHolder.toEventMap())
  }
}

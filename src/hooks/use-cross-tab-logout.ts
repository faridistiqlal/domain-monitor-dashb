import { useCallback, useEffect, useRef } from 'react'

interface UseCrossTabLogoutParams {
  storageKey: string
  channelName: string
  onRemoteLogout: () => void
}

export function useCrossTabLogout({
  storageKey,
  channelName,
  onRemoteLogout,
}: UseCrossTabLogoutParams) {
  const authChannelRef = useRef<BroadcastChannel | null>(null)

  const broadcastLogoutSignal = useCallback(() => {
    const payload = { type: 'logout', at: Date.now() }
    localStorage.setItem(storageKey, JSON.stringify(payload))
    authChannelRef.current?.postMessage(payload)
  }, [storageKey])

  useEffect(() => {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(channelName)
      authChannelRef.current = channel
      channel.onmessage = (event: MessageEvent<{ type?: string }>) => {
        if (event.data?.type === 'logout') {
          onRemoteLogout()
        }
      }
    }

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        onRemoteLogout()
      }
    }

    window.addEventListener('storage', handleStorageEvent)

    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      authChannelRef.current?.close()
      authChannelRef.current = null
    }
  }, [channelName, onRemoteLogout, storageKey])

  return { broadcastLogoutSignal }
}

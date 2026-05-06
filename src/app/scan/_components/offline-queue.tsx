'use client'

import { useEffect, useCallback } from 'react'
import { recordScanEvent } from '@/modules/scanning'
import type { RecordScanEventInput } from '@/modules/scanning'

const DB_NAME = 'scan-offline-queue'
const STORE_NAME = 'events'
const DB_VERSION = 1

interface QueuedEvent {
  id?: number
  payload: RecordScanEventInput
  queuedAt: string
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueOfflineScanEvent(payload: RecordScanEventInput): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const event: QueuedEvent = { payload, queuedAt: new Date().toISOString() }
    const req = store.add(event)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
  })
}

async function flushQueue(): Promise<void> {
  const db = await openDb()
  const events: QueuedEvent[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result as QueuedEvent[])
    req.onerror = () => reject(req.error)
  })

  for (const event of events) {
    try {
      await recordScanEvent(event.payload)
      // Remove from queue on success
      await new Promise<void>((resolve, reject) => {
        if (event.id === undefined) { resolve(); return }
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const req = tx.objectStore(STORE_NAME).delete(event.id)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    } catch {
      // Leave in queue — will retry on next reconnect
    }
  }
  db.close()
}

export function OfflineQueueFlusher() {
  const flush = useCallback(() => {
    flushQueue().catch(() => {
      // Silent — queue will retry
    })
  }, [])

  useEffect(() => {
    window.addEventListener('online', flush)
    // Also attempt flush on mount (handles case where we come back online)
    if (navigator.onLine) flush()
    return () => window.removeEventListener('online', flush)
  }, [flush])

  return null
}

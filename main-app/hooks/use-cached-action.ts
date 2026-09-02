import { useState, useEffect, useCallback, useRef } from 'react'

const cache = new Map<string, any>()
const activeFetches = new Map<string, Promise<any>>()

export function useCachedAction<T>(key: string, actionFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(cache.get(key) || null)
  const [isLoading, setIsLoading] = useState<boolean>(!cache.has(key))
  const [error, setError] = useState<Error | null>(null)
  
  // We use a ref to keep track of the latest actionFn to avoid unnecessary re-renders
  const actionFnRef = useRef(actionFn)
  actionFnRef.current = actionFn

  const fetchAction = useCallback(() => {
    return actionFnRef.current()
  }, [])

  useEffect(() => {
    let mounted = true
    
    // Always trigger a background fetch (stale-while-revalidate)
    // If we don't have it in cache, we're explicitly loading.
    if (!cache.has(key)) {
      setIsLoading(true)
    }

    let fetchPromise = activeFetches.get(key)
    if (!fetchPromise) {
      fetchPromise = fetchAction()
      activeFetches.set(key, fetchPromise)
    }

    fetchPromise
      .then((res) => {
        if (!mounted) return
        cache.set(key, res)
        setData(res)
        setIsLoading(false)
        setError(null)
        if (activeFetches.get(key) === fetchPromise) {
            activeFetches.delete(key)
        }
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof Error ? err : new Error(String(err)))
        setIsLoading(false)
        if (activeFetches.get(key) === fetchPromise) {
            activeFetches.delete(key)
        }
      })

    return () => {
      mounted = false
    }
  }, [key, fetchAction])

  return { data, isLoading, error }
}

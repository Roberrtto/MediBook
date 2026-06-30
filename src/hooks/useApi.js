import { useCallback, useEffect, useState } from 'react'

/**
 * Wraps an async fetcher with loading / error / data state, and an
 * imperative `refetch`. Used by every page that lists data from the
 * backend (appointments, schedules, records).
 *
 * @param {() => Promise<any>} fetcher
 * @param {Array} deps - re-runs the fetch when these change
 * @param {boolean} immediate - fetch on mount (default true)
 */
export function useApi(fetcher, deps = [], immediate = true) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const run = useCallback(() => {
    setIsLoading(true)
    setError(null)
    return fetcher()
      .then((result) => {
        setData(result)
        return result
      })
      .catch((err) => {
        setError(err)
        return null
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, isLoading, error, refetch: run }
}

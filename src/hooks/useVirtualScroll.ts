import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface UseVirtualScrollOptions {
  itemCount: number
  itemHeight: number | ((index: number) => number)
  overscan?: number
  containerHeight?: number
}

interface VirtualItem {
  index: number
  start: number
  size: number
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  overscan = 3,
  containerHeight: initialContainerHeight,
}: UseVirtualScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(initialContainerHeight || 0)

  // Calculate item positions
  const { totalHeight, itemPositions } = useMemo(() => {
    const positions: { start: number; size: number }[] = []
    let totalHeight = 0

    for (let i = 0; i < itemCount; i++) {
      const height = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight
      positions.push({ start: totalHeight, size: height })
      totalHeight += height
    }

    return { totalHeight, itemPositions: positions }
  }, [itemCount, itemHeight])

  // Calculate visible range
  const { startIndex, endIndex, virtualItems } = useMemo(() => {
    if (!containerHeight || itemCount === 0) {
      return { startIndex: 0, endIndex: 0, virtualItems: [] }
    }

    // Find start index using binary search
    let startIndex = 0
    let low = 0
    let high = itemCount - 1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const itemStart = itemPositions[mid]?.start ?? 0

      if (itemStart < scrollTop) {
        startIndex = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    // Apply overscan
    startIndex = Math.max(0, startIndex - overscan)

    // Find end index
    let endIndex = startIndex
    let currentHeight = itemPositions[startIndex]?.start ?? 0

    while (endIndex < itemCount && currentHeight < scrollTop + containerHeight) {
      currentHeight += itemPositions[endIndex]?.size ?? 0
      endIndex++
    }

    // Apply overscan
    endIndex = Math.min(itemCount - 1, endIndex + overscan)

    // Generate virtual items
    const virtualItems: VirtualItem[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: itemPositions[i]?.start ?? 0,
        size: itemPositions[i]?.size ?? 0,
      })
    }

    return { startIndex, endIndex, virtualItems }
  }, [scrollTop, containerHeight, itemCount, itemPositions, overscan])

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  // Attach scroll listener and observe container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Attach scroll listener
    const onScroll = () => {
      setScrollTop(container.scrollTop)
    }
    container.addEventListener('scroll', onScroll, { passive: true })

    // Observe container size
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    setContainerHeight(container.clientHeight)

    return () => {
      container.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
    }
  }, [])

  // Scroll to index
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current || index < 0 || index >= itemCount) return

    const itemStart = itemPositions[index]?.start ?? 0
    const itemSize = itemPositions[index]?.size ?? 0

    let scrollTo = itemStart
    if (align === 'center') {
      scrollTo = itemStart - containerHeight / 2 + itemSize / 2
    } else if (align === 'end') {
      scrollTo = itemStart - containerHeight + itemSize
    }

    containerRef.current.scrollTop = Math.max(0, scrollTo)
  }, [itemCount, itemPositions, containerHeight])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight
    }
  }, [totalHeight])

  return {
    containerRef,
    virtualItems,
    totalHeight,
    scrollTop,
    containerHeight,
    handleScroll,
    scrollToIndex,
    scrollToBottom,
    startIndex,
    endIndex,
  }
}

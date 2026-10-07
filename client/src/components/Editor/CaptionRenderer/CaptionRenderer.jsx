import React, { useMemo, useRef, useState, useEffect } from 'react';
import CaptionSegment from './CaptionSegment';

export default function CaptionRenderer({
  segments = [],
  currentTime = 0,
  captionStyle = {},
  selectedSegmentId = null,
  isPaused = false,
  containerRef = null   // ref to the video wrapper div for size-aware scaling
}) {
  const [containerWidth, setContainerWidth] = useState(640);
  const localRef = useRef(null);

  // Observe container size changes to scale font relative to video width
  useEffect(() => {
    const target = containerRef?.current || localRef.current;
    if (!target) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setContainerWidth(w);
      }
    });

    ro.observe(target);
    return () => ro.disconnect();
  }, [containerRef]);

  // 1. Find active segment for the current timestamp
  const activeSegment = useMemo(() => {
    if (!segments || segments.length === 0) return null;

    const found = segments.find(
      (seg) => currentTime >= seg.start && currentTime <= seg.end + 0.1
    );
    if (found) return found;

    // If paused and a segment is selected, preview the selected segment
    if (isPaused && selectedSegmentId) {
      return segments.find((seg) => seg.id === selectedSegmentId) || null;
    }

    return null;
  }, [segments, currentTime, isPaused, selectedSegmentId]);

  if (!activeSegment) {
    return <div ref={localRef} className="absolute inset-0 pointer-events-none" />;
  }

  // Scale font: baseFontSize is authored for a 640px-wide container.
  // At 1280px it doubles, etc. Clamped so it never gets tiny or huge.
  const BASE_REF_WIDTH = 640;
  const scale = Math.max(0.5, Math.min(2.4, containerWidth / BASE_REF_WIDTH));
  const scaledFontSize = Math.round((captionStyle.fontSize || 26) * scale);

  // Position
  const position = captionStyle.position || 'bottom';
  const verticalOffset = captionStyle.verticalOffset ?? 10;

  let positionStyles = {};
  if (position === 'top') {
    positionStyles = { top: `${verticalOffset}%`, left: '50%', transform: 'translateX(-50%)' };
  } else if (position === 'center') {
    positionStyles = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  } else {
    positionStyles = { bottom: `${verticalOffset}%`, left: '50%', transform: 'translateX(-50%)' };
  }

  return (
    <div ref={localRef} className="absolute inset-0 pointer-events-none">
      <div
        className="absolute z-20 pointer-events-none select-none flex justify-center"
        style={{ ...positionStyles, width: '90%', maxWidth: '90%' }}
        data-testid="caption-overlay"
      >
        <CaptionSegment
          segment={activeSegment}
          currentTime={currentTime}
          captionStyle={captionStyle}
          scaledFontSize={scaledFontSize}
        />
      </div>
    </div>
  );
}

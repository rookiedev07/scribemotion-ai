import React from 'react';
import CaptionWord from './CaptionWord';

export default function CaptionSegment({ segment, currentTime, captionStyle, scaledFontSize }) {
  if (!segment) return null;

  const {
    fontFamily = 'Poppins',
    fontSize = 26,         // base size; use scaledFontSize if provided
    backgroundColor = 'transparent',
    boxPadding = 10,
    boxRadius = 12,
    textAlign = 'center',
    textShadow = '0 2px 10px rgba(0,0,0,0.9)',
    fontWeight = '800',
    letterSpacing = '0.02em',
    strokeColor = null,
    strokeWidth = 0,
    fontStyle = 'normal',
    textTransform = 'none',
  } = captionStyle;

  const words = segment.words || [];

  // Determine active word based on currentTime
  let activeWordIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (currentTime >= words[i].start && currentTime <= words[i].end + 0.05) {
      activeWordIndex = i;
      break;
    }
  }

  // If between words, keep last word lit
  if (activeWordIndex === -1 && words.length > 0) {
    for (let i = words.length - 1; i >= 0; i--) {
      if (currentTime >= words[i].end) {
        activeWordIndex = i;
        break;
      }
    }
  }

  // Windowing: If a segment has more than 4 words, display only 3 to 4 words at a time
  let displayWords = words;
  let displayActiveIndex = activeWordIndex;

  if (words.length > 4) {
    const CHUNK_SIZE = 3; // display 3 words at a time
    const activeIdx = activeWordIndex >= 0 ? activeWordIndex : 0;
    const chunkStart = Math.floor(activeIdx / CHUNK_SIZE) * CHUNK_SIZE;
    const chunkEnd = Math.min(words.length, chunkStart + CHUNK_SIZE);

    displayWords = words.slice(chunkStart, chunkEnd);
    displayActiveIndex = activeWordIndex >= 0 ? activeWordIndex - chunkStart : -1;
  }

  const usedFontSize = scaledFontSize || fontSize;
  const hasBg = backgroundColor && backgroundColor !== 'transparent';

  const containerPx = boxPadding;
  const paddingStyle = hasBg
    ? `${containerPx}px ${containerPx * 2}px`
    : '0px';

  const webkitStroke = strokeColor && strokeWidth
    ? `${strokeWidth}px ${strokeColor}`
    : undefined;

  return (
    <div
      className="caption-segment inline-block text-center pointer-events-none"
      style={{
        fontFamily: `"${fontFamily}", system-ui, sans-serif`,
        fontSize: `${usedFontSize}px`,
        fontWeight,
        letterSpacing,
        fontStyle,
        textShadow,
        textAlign,
        backgroundColor: hasBg ? backgroundColor : 'transparent',
        padding: paddingStyle,
        borderRadius: `${boxRadius}px`,
        lineHeight: 1.2,
        maxWidth: '94%',
        whiteSpace: 'nowrap',
        WebkitTextStroke: webkitStroke,
      }}
    >
      {displayWords.length > 0 ? (
        displayWords.map((wordObj, idx) => (
          <CaptionWord
            key={`${wordObj.word}-${idx}-${wordObj.start}`}
            wordObj={wordObj}
            isActive={idx === displayActiveIndex}
            captionStyle={{ ...captionStyle, fontSize: usedFontSize }}
            wordIndex={idx}
          />
        ))
      ) : (
        <span style={{ color: captionStyle.color || '#FFFFFF' }}>
          {textTransform === 'uppercase' ? segment.text.toUpperCase() : segment.text}
        </span>
      )}
    </div>
  );
}

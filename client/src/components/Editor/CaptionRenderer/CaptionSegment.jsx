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
        // Keep captions on ONE line — segments are short (2-4 words)
        whiteSpace: 'nowrap',
        // text stroke for 'bold' style
        WebkitTextStroke: webkitStroke,
      }}
    >
      {words.length > 0 ? (
        words.map((wordObj, idx) => (
          <CaptionWord
            key={`${wordObj.word}-${idx}-${wordObj.start}`}
            wordObj={wordObj}
            isActive={idx === activeWordIndex}
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

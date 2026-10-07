import React from 'react';

export default function CaptionWord({
  wordObj,
  isActive,
  captionStyle,
  wordIndex
}) {
  const {
    template = 'highlight',
    color = '#FFFFFF',
    highlightColor = '#FACC15',
    animation = 'pop',
    textTransform = 'uppercase'
  } = captionStyle;

  // Determine display text
  let wordText = wordObj.word || '';
  if (textTransform === 'uppercase') {
    wordText = wordText.toUpperCase();
  }

  // Determine styling based on active state and template
  const isHighlightEnabled = template === 'highlight' || template === 'bold' || template === 'glow';
  const shouldHighlight = isActive && isHighlightEnabled;

  const wordColor = shouldHighlight ? highlightColor : color;

  // Animation classes
  let animationClass = '';
  if (shouldHighlight) {
    if (animation === 'pop') animationClass = 'animate-caption-pop inline-block origin-center';
    else if (animation === 'bounce') animationClass = 'animate-caption-bounce inline-block';
  }

  // Glow filter
  const glowStyle = (shouldHighlight && template === 'glow') ? {
    textShadow: `0 0 16px ${highlightColor}, 0 0 28px ${highlightColor}88, 0 2px 4px #000`
  } : {};

  return (
    <span
      className={`inline-block mx-1 transition-all duration-75 select-none font-semibold ${animationClass}`}
      style={{
        color: wordColor,
        transform: shouldHighlight && animation === 'pop' ? 'scale(1.08)' : 'scale(1)',
        ...glowStyle
      }}
      data-word={wordObj.word}
      data-start={wordObj.start}
      data-end={wordObj.end}
    >
      {wordText}
    </span>
  );
}

import fs from 'fs';
import path from 'path';

/**
 * Convert standard hex color (#RRGGBB or #RGB) to ASS color format (&HAABBGGRR)
 * In ASS: &HAABBGGRR, where AA is alpha (00 = opaque, FF = transparent), BB is blue, GG is green, RR is red
 */
function hexToAssColor(hex, alphaHex = '00') {
  if (!hex) return `&H${alphaHex}FFFFFF`;

  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length === 8) {
    // Has alpha #RRGGBBAA
    const rr = clean.slice(0, 2);
    const gg = clean.slice(2, 4);
    const bb = clean.slice(4, 6);
    const aa = clean.slice(6, 8);
    // ASS alpha is inverted (00 = opaque, FF = transparent)
    const invAlpha = (255 - parseInt(aa, 16)).toString(16).padStart(2, '0').toUpperCase();
    return `&H${invAlpha}${bb.toUpperCase()}${gg.toUpperCase()}${rr.toUpperCase()}`;
  }
  if (clean.length >= 6) {
    const rr = clean.slice(0, 2);
    const gg = clean.slice(2, 4);
    const bb = clean.slice(4, 6);
    return `&H${alphaHex}${bb.toUpperCase()}${gg.toUpperCase()}${rr.toUpperCase()}`;
  }
  return `&H${alphaHex}FFFFFF`;
}

/**
 * Format seconds to ASS timestamp: H:MM:SS.cs (e.g. 0:00:02.45)
 */
function formatAssTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);
  const centis = Math.floor((safeSeconds % 1) * 100);

  const formattedMins = mins.toString().padStart(2, '0');
  const formattedSecs = secs.toString().padStart(2, '0');
  const formattedCentis = centis.toString().padStart(2, '0');

  return `${hrs}:${formattedMins}:${formattedSecs}.${formattedCentis}`;
}

class SubtitleService {
  /**
   * Generate an Advanced SubStation Alpha (.ass) file for FFmpeg burning
   */
  generateAssFile({ segments, captionStyle, width = 1920, height = 1080, outputPath }) {
    const {
      template = 'highlight',
      fontFamily = 'Arial',
      fontSize = 44,
      color = '#FFFFFF',
      highlightColor = '#FACC15',
      backgroundColor = '#111827',
      position = 'bottom',
      verticalOffset = 12,
      textTransform = 'uppercase'
    } = captionStyle || {};

    // Map position to ASS alignment (Numpad format: 2 = bottom-center, 5 = mid-center, 8 = top-center)
    let alignment = 2; // bottom center
    if (position === 'center') alignment = 5;
    if (position === 'top') alignment = 8;

    // Calculate vertical margin from height and percentage
    const marginV = Math.round(height * (verticalOffset / 100));

    // ASS Colors
    const primaryAssColor = hexToAssColor(color, '00');
    const highlightAssColor = hexToAssColor(highlightColor, '00');
    const shadowAssColor = '&H80000000'; // 50% black shadow
    const outlineAssColor = '&H00000000'; // Solid black outline
    const boxAssColor = hexToAssColor(backgroundColor, '20'); // 80% opacity box

    let borderStyle = 1; // 1 = outline + drop shadow, 3 = opaque box
    let outlineWidth = 2.5;
    let shadowDepth = 1.5;

    if (template === 'bold') {
      outlineWidth = 3.5;
      shadowDepth = 2;
    } else if (template === 'box') {
      borderStyle = 3; // Opaque box background
      outlineWidth = 8; // padding around text
      shadowDepth = 0;
    } else if (template === 'clean') {
      outlineWidth = 1.5;
      shadowDepth = 1;
    }

    const playResX = width || 1920;
    const playResY = height || 1080;
    const baseFontSize = Math.round((fontSize || 44) * (playResY / 1080));

    // ASS Header
    let ass = `[Script Info]
ScriptType: v4.00+
Title: ScribeMotion AI Subtitles
PlayResX: ${playResX}
PlayResY: ${playResY}
ScaledBorderAndShadow: yes
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontFamily},${baseFontSize},${primaryAssColor},${highlightAssColor},${borderStyle === 3 ? boxAssColor : outlineAssColor},${shadowAssColor},-1,0,0,0,100,100,0.5,0,${borderStyle},${outlineWidth},${shadowDepth},${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // Process segments and generate dialogue lines
    if (Array.isArray(segments)) {
      for (const segment of segments) {
        if (!segment.words || segment.words.length === 0) {
          // Plain segment without word timestamps
          let text = segment.text || '';
          if (textTransform === 'uppercase') text = text.toUpperCase();
          const start = formatAssTime(segment.start);
          const end = formatAssTime(segment.end);
          ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
        } else if (template === 'highlight') {
          // Word-level highlighting: For each word interval, render the segment with the active word in highlightColor
          for (let i = 0; i < segment.words.length; i++) {
            const currentWordObj = segment.words[i];
            const wStart = formatAssTime(currentWordObj.start);
            const wEnd = formatAssTime(currentWordObj.end);

            // Construct line where current word has highlight color and slight scale
            const lineText = segment.words.map((w, idx) => {
              let wText = w.word;
              if (textTransform === 'uppercase') wText = wText.toUpperCase();

              if (idx === i) {
                return `{\\c${highlightAssColor}\\t(0,100,\\fscx108\\fscy108)}${wText}{\\r}`;
              }
              return wText;
            }).join(' ');

            ass += `Dialogue: 0,${wStart},${wEnd},Default,,0,0,0,,${lineText}\n`;
          }
        } else {
          // Clean, Bold, Box, or standard: one event line per segment
          let text = segment.words.map(w => {
            let t = w.word;
            return textTransform === 'uppercase' ? t.toUpperCase() : t;
          }).join(' ');

          const start = formatAssTime(segment.start);
          const end = formatAssTime(segment.end);
          ass += `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}\n`;
        }
      }
    }

    fs.writeFileSync(outputPath, ass, 'utf8');
    return outputPath;
  }
}

export const subtitleService = new SubtitleService();

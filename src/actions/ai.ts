'use server'

import { generateObject } from 'ai'
import { z } from 'zod'
import { openrouter, MODELS } from '@/lib/ai/openrouter'
import type { TranscriptionSegment } from '@/shared/types/database'

const keypointSchema = z.object({
  visual_style: z.object({
    palette: z.string(),
    layout_style: z.string(),
    animation_family: z.string(),
    typography_notes: z.string(),
  }),
  keypoints: z.array(
    z.object({
      timestamp_start: z.number(),
      timestamp_end: z.number(),
      description: z.string(),
      animation_suggestion: z.string(),
      importance: z.enum(['high', 'medium', 'low']),
    })
  ),
})

export interface VisualStyle {
  palette: string
  layout_style: string
  animation_family: string
  typography_notes: string
}

const animationCodeSchema = z.object({
  componentName: z.string(),
  code: z.string(),
  durationInFrames: z.number(),
  description: z.string(),
})

export async function suggestKeypoints(
  transcription: TranscriptionSegment[],
  videoDurationSeconds: number
) {
  const maxKeypoints = Math.max(3, Math.ceil(videoDurationSeconds / 90))

  // Convert ms timestamps to seconds for the AI
  const transcriptionText = transcription
    .map((seg) => `[${(seg.start / 1000).toFixed(1)}s]: ${seg.text}`)
    .join('\n')

  const result = await generateObject({
    model: openrouter(MODELS.powerful),
    schema: keypointSchema,
    maxOutputTokens: 16384,
    system: `You are a senior motion graphics director analyzing a video transcription to identify the BEST moments for animated overlays. Think like a top YouTuber editor (Vox, Kurzgesagt, MKBHD) who adds graphics to make videos more engaging.

RULES FOR KEYPOINTS:
- Each keypoint MUST span 5-15 seconds — tight enough to match one concept, long enough for a nice animation
- timestamp_start MUST align with the FIRST word of the relevant phrase (use the [Xs] timestamps from the transcription!)
- timestamp_end MUST align with the LAST word of the concept
- Suggest between 3 and ${maxKeypoints} keypoints spread across the entire video
- Space them out — minimum 30 seconds between keypoints
- NEVER overlap keypoints

TYPES OF MOMENTS (in priority order):
1. **Numbers/Statistics** — "el 85% de los usuarios", "más de 2 millones" → animated counter/infographic
2. **Lists/Steps** — "primero... segundo... tercero..." → staggered list reveal synced to speech
3. **Key Concepts** — A core idea being explained → kinetic typography with key words highlighted
4. **Comparisons** — "antes vs después", "A frente a B" → side-by-side comparison
5. **Emotional Peaks** — Surprising facts, humor, dramatic reveals → impactful visual

FOR EACH KEYPOINT:
- description: Quote the EXACT words from the transcription that will be visualized. Include the key phrases the speaker says. (2-3 sentences in Spanish)
- animation_suggestion: A DETAILED creative brief in Spanish that the animation generator will follow as a BLUEPRINT. It MUST include ALL of the following sections in this exact format:

  TIPO: [kinetic-typography | infographic | list-reveal | comparison | title-card]
  TEXTOS: List every text string to show on screen, in order of appearance. Extract EXACT words/numbers from the transcription.
    - "Texto principal del titulo"
    - "85%" (dato clave)
    - "Item 1: descripcion", "Item 2: descripcion", etc.
  ELEMENTOS: Number and type of visual items (e.g., "1 titulo + 3 items de lista con iconos", "1 contador animado + 1 barra de progreso + 1 label")
  LAYOUT: Where on screen — bottom-third, right-panel, center-card, corner-badge, left-sidebar, split-screen
  COLORES: Dominant color scheme from: amarillo #FFE500, rosa #FF6B9C, cyan #00D4FF, violeta #7C3AED, verde #10B981, negro #000
  SYNC: For each text/element, note the EXACT second from the transcription when it should appear:
    - "[12.5s] Aparece titulo 'Ventajas principales'"
    - "[14.2s] Item 1 entra cuando dice 'velocidad'"
    - "[16.8s] Item 2 entra cuando dice 'precision'"
    - "[19.0s] Contador animado llega a 85% cuando dice 'el ochenta y cinco por ciento'"

  This brief is the SINGLE SOURCE OF TRUTH for the animation generator. Be EXTREMELY specific. Vague suggestions = bad animations.

- importance: high = must-have, medium = nice-to-have, low = optional

VISUAL STYLE (CRITICAL FOR COHERENCE):
Before defining keypoints, you MUST define a visual_style that ALL animations will share. This ensures every overlay looks like it belongs to the SAME video. Think of it as the "brand guide" for this video's graphics.

- palette: Pick 2-3 dominant colors from the neobrutalism palette that match the video's TONE:
  * Professional/tech → cyan #00D4FF + negro #000 + blanco
  * Energetic/creative → amarillo #FFE500 + rosa #FF6B9C + negro #000
  * Educational/calm → violeta #7C3AED + verde #10B981 + blanco
  * Bold/impactful → rosa #FF6B9C + amarillo #FFE500 + negro #000
  Write the exact hex codes. ALL keypoints MUST use ONLY these colors.
- layout_style: Pick ONE dominant position for consistency (e.g., "right-panel para listas, bottom-third para datos"). Animations that use the same screen area feel cohesive.
- animation_family: Pick ONE entrance style (e.g., "spring entrances con damping 12 + slide from right"). ALL animations should enter the same way.
- typography_notes: Font size hierarchy (e.g., "titulos 56px bold, subtitulos 36px semibold, datos 72px black"). Consistent sizing = professional look.

Each keypoint's animation_suggestion MUST reference and follow the visual_style. If the style says "cyan + negro", do NOT suggest pink for one keypoint.

CRITICAL:
- Write ALL text in SPANISH
- timestamp_start and timestamp_end MUST be in SECONDS (e.g., 21.5, not 21500)
- Use the [Xs] timestamps from the transcription to set PRECISE start/end times
- The timestamps you pick will determine WHEN the animation overlay appears on the video`,
    prompt: `Video duration: ${videoDurationSeconds} seconds. Find up to ${maxKeypoints} key moments for animated overlays.

All text MUST be in Spanish. Timestamps MUST be in seconds, derived from the [Xs] timestamps below.

TRANSCRIPTION WITH TIMESTAMPS:
${transcriptionText}`,
  })

  return {
    visual_style: result.object.visual_style,
    keypoints: result.object.keypoints,
  }
}

export async function generateAnimationCode(
  keypoint: { timestamp_start: number; timestamp_end: number; description: string; animation_suggestion?: string },
  transcriptionContext: string,
  visualStyle?: VisualStyle
) {
  const durationSeconds = Math.max(keypoint.timestamp_end - keypoint.timestamp_start, 5)
  const fps = 30
  const totalFrames = Math.round(durationSeconds * fps)

  // Build speech-to-frame mapping from transcription context
  // Each line is "[startS - endS]: text", convert to frame numbers relative to animation start
  const speechTimeline = transcriptionContext
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[(\d+\.?\d*)s\s*-\s*(\d+\.?\d*)s\]:\s*(.+)$/)
      if (!match) return null
      const segStart = parseFloat(match[1])
      const segEnd = parseFloat(match[2])
      const text = match[3]
      // Convert absolute timestamps to frame numbers relative to animation start
      const frameStart = Math.max(0, Math.round((segStart - keypoint.timestamp_start) * fps))
      const frameEnd = Math.min(totalFrames, Math.round((segEnd - keypoint.timestamp_start) * fps))
      return `  Frame ${frameStart}-${frameEnd}: "${text}"`
    })
    .filter(Boolean)
    .join('\n')

  const systemPrompt = `You are an ELITE motion graphics animator creating broadcast-quality animations with Remotion. Your animations look like professional YouTube overlays (think Vox, Kurzgesagt, MKBHD style).

TECHNICAL ENVIRONMENT:
- Available globals (do NOT import): React, useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill, Sequence, FadeIn, ScaleUp, SlideIn, TextReveal, HighlightBox
- You MUST use React.createElement() — NOT JSX (code runs in new Function())
- Do NOT write import or export statements
- Define component as: const ComponentName = () => { ... };
- Frame numbers start from 0. Total: ${totalFrames} frames at ${fps}fps (${durationSeconds}s)
- CRITICAL: Get the current frame with useCurrentFrame(), NOT from useVideoConfig(). Correct pattern:
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  NEVER write: const { frame, fps } = useVideoConfig() — this WILL BREAK because useVideoConfig does NOT return frame.
- Use inline styles only. Font: 'Space Grotesk, sans-serif'
- CRITICAL TRANSPARENCY RULES (this animation will be rendered as a TRANSPARENT overlay on top of the original video):
  1. The outermost AbsoluteFill MUST have NO backgroundColor — it MUST be fully transparent
  2. Do NOT use full-screen opaque backgrounds — the viewer MUST see the video behind
  3. Inner elements (cards, boxes, text) CAN have background colors but should be COMPACT and positioned (not covering the entire screen)
  4. Position elements strategically: bottom-third, side panels, corner badges, centered cards — NOT full-screen fills
  5. Use semi-transparent backgrounds where appropriate: 'rgba(0,0,0,0.7)' or 'rgba(255,229,0,0.9)'

HELPER COMPONENTS (optional — use them for common patterns, or build from scratch):
- FadeIn: React.createElement(FadeIn, { durationInFrames: 30 }, children) — fades children in
- ScaleUp: React.createElement(ScaleUp, { durationInFrames: 20 }, children) — spring scale entrance
- SlideIn: React.createElement(SlideIn, { direction: 'left', durationInFrames: 20 }, children) — slide from direction
- TextReveal: React.createElement(TextReveal, { text: 'Hello', fontSize: 60, color: '#000' }) — character-by-character reveal
- HighlightBox: React.createElement(HighlightBox, { text: 'Key Point', bgColor: '#FFE500', textColor: '#000' }) — neobrutalist card with spring
These are convenience wrappers. You can also build everything from scratch with React.createElement + interpolate/spring.

SPEECH-TO-FRAME SYNC (CRITICAL — this is EXACTLY what the speaker says at each frame):
${speechTimeline || '  No speech data available'}

*** USE THIS TIMELINE to sync your animation elements with the speech ***
- When the speaker mentions a NUMBER, show the animated counter at THAT frame
- When the speaker lists items, reveal each item at the frame when it's mentioned
- When the speaker emphasizes a KEY WORD, highlight it visually at THAT frame
- Elements should APPEAR just before or exactly when the speaker mentions them
- This creates the "editor heard you" effect that makes professional overlays feel magical

ANIMATION TIMELINE:
- Frames 0-${Math.round(totalFrames * 0.12)}: ENTRANCE — Main container/title animates in
- Frames ${Math.round(totalFrames * 0.12)}-${Math.round(totalFrames * 0.88)}: MAIN — Content synced to speech (use the frame timeline above!)
- Frames ${Math.round(totalFrames * 0.88)}-${totalFrames}: EXIT — Everything animates out

${visualStyle ? `PROJECT VISUAL STYLE (MANDATORY — this animation is part of a series, ALL must look cohesive):
- COLOR PALETTE: ${visualStyle.palette} — Use ONLY these colors. Do NOT introduce new colors.
- LAYOUT: ${visualStyle.layout_style} — Follow this positioning for consistency across animations.
- ENTRANCE STYLE: ${visualStyle.animation_family} — ALL animations in this project enter the same way.
- TYPOGRAPHY: ${visualStyle.typography_notes} — Use these exact sizes for visual hierarchy.
This style was defined for the ENTIRE video. Following it ensures all overlays look like they belong together.

` : ''}DESIGN PRINCIPLES:
- ${visualStyle ? `Use ONLY the project palette above: ${visualStyle.palette}` : 'Use BOLD colors: #FFE500 (yellow), #FF6B9C (pink), #00D4FF (cyan), #7C3AED (purple), #10B981 (green), #000 (black)'}
- Neobrutalism style: thick borders (3-4px solid black), box shadows ('6px 6px 0px #000'), bold fonts
- Use Sequence for staggered reveals SYNCED to when the speaker mentions each item
- Create visual HIERARCHY: big title → supporting elements → details
- Add subtle continuous motion (floating, pulsing, rotating) to keep it alive
- Use spring() for bouncy organic entrances, interpolate for precise timing

ANIMATION STYLES (pick the best one for the content):

1. KINETIC TYPOGRAPHY — For quotes, key statements
   - Key phrases appear as the speaker says them (use speech timeline!)
   - Important words highlighted with colored backgrounds
   - Words scale up or flash when emphasized

2. ANIMATED INFOGRAPHIC — For statistics, numbers
   - Counter animates TO the number exactly when the speaker says it
   - Progress bars fill as the speaker explains data
   - Labels appear synced to speech

3. LIST REVEAL — For steps, features, items
   - Each item slides in when the speaker mentions it (use Sequence with from: matching the speech frame)
   - Active item highlighted, previous items stay visible but dimmed

4. COMPARISON LAYOUT — For vs, before/after
   - Each side appears when the speaker mentions it
   - Animated divider line
   - Labels synced to speech

5. TITLE CARD — For topic transitions, section intros
   - Bold title with animated geometric decorations
   - Subtitle fades in after title

EXAMPLE — Speech-Synced List (items appear when speaker mentions them):
const SyncedList = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Items timed to when speaker says them (from speech timeline)
  const items = [
    { text: 'Velocidad', from: 25 },   // speaker says "velocidad" at frame ~25
    { text: 'Precision', from: 68 },     // speaker says "precision" at frame ~68
    { text: 'Escalabilidad', from: 110 } // speaker says "escalabilidad" at frame ~110
  ];
  const titleEntrance = spring({ frame, fps, config: { damping: 12 } });
  const exitOpacity = interpolate(frame, [${totalFrames - 25}, ${totalFrames}], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return React.createElement(AbsoluteFill, { style: { justifyContent: 'center', alignItems: 'flex-end', paddingRight: 40, opacity: exitOpacity } },
    React.createElement('div', { style: { width: 380 } },
      React.createElement('div', { style: { fontSize: 28, fontWeight: 900, marginBottom: 16, fontFamily: 'Space Grotesk, sans-serif', color: '#fff', textShadow: '2px 2px 0px #000', transform: 'scale(' + titleEntrance + ')' } }, 'Ventajas clave'),
      items.map(function(item, i) {
        var isVisible = frame >= item.from;
        var itemSpring = isVisible ? spring({ frame: frame - item.from, fps, config: { damping: 12 } }) : 0;
        var isLatest = isVisible && (i === items.length - 1 || frame < items[i + 1].from);
        return React.createElement('div', { key: i, style: {
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
          padding: '10px 18px',
          background: isLatest ? 'rgba(255,229,0,0.95)' : isVisible ? 'rgba(255,255,255,0.85)' : 'transparent',
          border: isVisible ? '3px solid #000' : '3px solid transparent',
          boxShadow: isVisible ? '4px 4px 0px #000' : 'none',
          fontFamily: 'Space Grotesk, sans-serif',
          transform: 'scale(' + itemSpring + ') translateX(' + (isVisible ? 0 : 40) + 'px)',
          opacity: itemSpring
        } },
          React.createElement('div', { style: { fontSize: 20, fontWeight: 800, color: isLatest ? '#000' : '#333' } }, (i + 1) + '. ' + item.text)
        );
      })
    )
  );
};

CRITICAL REMINDERS:
- SYNC animation elements to the SPEECH TIMELINE above — this is the #1 priority
- Use Sequence or frame checks to time elements to when the speaker says each thing
- ALWAYS add exit animation in the last ~25 frames (fade out or scale down)
- Make it VISUALLY RICH: multiple elements, colors, motion — not just a single text
- Text in the animation MUST be in SPANISH
- TRANSPARENT OVERLAY: Outermost AbsoluteFill MUST have NO background. Position elements as compact overlays (bottom-third, side panels, corners). The original video must remain visible.`

  const result = await generateObject({
    model: openrouter(MODELS.codegen),
    schema: animationCodeSchema,
    maxOutputTokens: 16384,
    system: systemPrompt,
    prompt: `Create a professional motion graphics animation for this moment in a video.

CONTEXT — What the speaker is talking about:
${keypoint.description}

${keypoint.animation_suggestion ? `CREATIVE BLUEPRINT (FOLLOW THIS EXACTLY — this is your primary instruction):
${keypoint.animation_suggestion}

^^^ The blueprint above specifies the TYPE, TEXTS, ELEMENTS, LAYOUT, COLORS, and SYNC timing.
Follow it as closely as possible. Use the exact texts listed. Place elements where indicated.
Match the color scheme. Time each element to appear at the specified seconds.` : ''}

EXACT SPEECH DURING THIS SEGMENT (with timestamps):
${transcriptionContext}

Duration: ${durationSeconds}s (${totalFrames} frames at ${fps}fps).

IMPORTANT: The Creative Blueprint above is your PRIMARY guide. Use the speech timestamps to convert the sync timings (in seconds) to frame numbers. Each visual element should appear exactly when specified in the blueprint sync section.`,
  })

  return result.object
}

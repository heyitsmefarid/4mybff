# ♥ Retro Birthday Arcade

A pixel-art birthday site: PIN gate → arcade level-select → gallery, message,
song dedication, and 102 reasons.

## Run it

```bash
npm install     # once
npm run dev     # http://localhost:5173
npm run media   # re-scan public/media and rebuild the gallery list
npm run build   # production files land in dist/
```

## Everything you need to edit is in ONE file

**`src/content.js`.** That's it. It holds her name, the PIN, the message pages,
the song info, the gallery list, and all 102 reasons. No component
code needs touching.

**Still to fill in:** just `yourName` — it signs both letters. Everything else
is written.

### The PIN

```js
lock: {
  pin: '0829',   // MMDD of the day you met — August 29 -> '0829'
}
```

Heads up: the PIN lives in the JavaScript, so anyone who opens dev tools can
read it. It's a ritual, not a vault — which is fine for a gift. If she gets it
wrong three times the hint appears and the hearts refill; she is never actually
locked out.

### Photos and videos

Drop files into `public/media/` and run:

```bash
npm run media
```

That rewrites the gallery list from whatever is actually in the folder — no
editing by hand. It prints how many photos and videos it found. Reorder or
delete lines afterwards if you want a particular sequence (running it again
resets the order: cover photo first, then alphabetical).

If you'd rather do it manually, the list is just filenames — **one line each**:

```js
items: [
  'media/aleck.jpg',
  'media/us.jpg',
  'media/laughing.mp4',
],
```

Photo or video is worked out from the extension. There are no captions: the
gallery is deliberately text-free. Order in the list is the order shown.

The grid is a mosaic — tile sizes follow a fixed rhythm (`is-tall`, `is-wide`,
`is-big`) and pack densely, so it never reads as a plain table. Photos resolve
in coarse-to-sharp in a few discrete steps, like an image loading on a slow
connection; each tile carries its own accent colour from the palette; hovering
one quiets the rest; and the feature tiles get viewfinder brackets. In the
lightbox a photo drifts slowly (Ken Burns), the tile you clicked expands into
place, and the icon-only tools are close, slideshow (space bar also toggles it)
and random. Hovering also leans the photo away from the cursor.

The grid also runs an **attract-mode spotlight**: with no mouse present, a
highlight walks across the photos that are on screen, one at a time. It exists
because a phone has no hover at all, so without it the gallery would look inert
on the device she'll actually use. A real mouse takes over the instant it
enters, and the spotlight pauses while the lightbox is open.

Pace lives in `content.js`: `gallery.slideshowMs` (lightbox slideshow) and
`gallery.spotlightMs` (the drifting highlight). Lower is faster. Videos play
silently on a loop in the grid and with sound in the lightbox. If a file is
missing or misnamed, that tile removes itself rather than showing a broken
image. With fewer than four items the grid switches to a centred feature
layout so one photo doesn't sit in a lonely corner.

### The song

Set up for **Aphrodite — The Ridleys**, dedicated to Aleck. Both files are in
place: `public/media/aleck.jpg` (album art, and the first gallery tile) and
`public/media/aphrodite.mp3` (the track itself).

If the mp3 is ever missing the player falls back to `PREVIEW MODE` on a timer so
every animation still works. Using a different filename? Change `song.file`.

**No lyrics.** `song.lyrics` is an empty list, so the lyrics panel isn't
rendered at all and the cover pairs up with the track info instead. To turn it
back on, just add lines — the panel reappears on its own:

```js
lyrics: [
  { t: 0,  line: 'first line' },   // t = the second that line starts
  { t: 12, line: 'second line' },
],
```

### What audio format?

**MP3.** It's what `song.file` already points at, and it's the only format that
plays everywhere — every desktop browser plus Safari on her iPhone.

Also fine if that's what you have: `.m4a` / `.aac`, `.ogg` / `.opus`, `.wav`,
`.flac`. Change `song.file` to match the filename and it works.

**Won't work:** anything downloaded from Spotify or Apple Music. Those files are
DRM-encrypted and no browser will play them, even renamed to `.mp3`. You need a
plain unprotected audio file.

128–192 kbps is plenty — it keeps the file around 3–5 MB so it starts fast on
her phone.

#### The dedication letter

`song.dedication` is an array — **one string per paragraph**:

```js
dedicationLabel: 'WHY I CHOSE THIS SONG',
dedication: [
  'First paragraph.',
  'Second paragraph.',
  '"You are my Aphrodite."',   // wrapped in quotes = big gold pull quote
],
```

Any paragraph wrapped in `"double quotes"` renders as a centred pull quote with
hearts either side instead of body text. Your letter is already in there with
the quote on the line you marked.

Set `yourName` at the top of the file and it signs the letter for you.

### The reasons

`content.reasons.list` — one string per reason. The grid, the counter and the
heading all follow the array, so adding or deleting a line needs no other edit.

**Heads up on the count.** Your list was numbered 1-101, but `21` was used
twice ("boost my confidence" and "you're so prettyyyy"), so there are actually
**102 lines**. Every one of them is in — nothing was dropped — which is why the
title reads `102 REASONS`. Delete any one line and it becomes `101 REASONS` on
its own, because `reasons.heading` is `''` and counts the list for you. Set it
to a fixed string if you'd rather it say something else.

#### The closing note

`content.reasons.letter` is the long message shown underneath the grid, in the
same panel style as the song dedication. One string per paragraph; a paragraph
wrapped in `"double quotes"` becomes a gold pull quote; newlines inside one
paragraph are kept, so the "For the random chikas / For the pang-aasar / ..."
stanza is a single entry.

It is always readable — she doesn't have to unlock all 102 tiles to reach it.
The confetti and the `YOU FOUND THEM ALL` banner still fire at 100%.

## Day mode / night mode

The sun/moon button in the top right flips between two full themes. Her choice
is remembered, and an inline script in `index.html` applies it before first
paint so day mode never flashes dark on load.

| | **Night** (default) | **Day** |
|---|---|---|
| Palette | neon on deep purple | pastel on warm pink |
| Light | everything glows | hard offset shadows, like stickers |
| Sky | parallax starfield | drifting pixel clouds |
| Scanlines | strong | barely there |
| Placeholder art | neon sprites | pastel sprites |

Night is the default because the whole thing is meant to read as an arcade
cabinet. Day exists so it's comfortable to read outdoors.

**If you change colours, change them in `src/styles/theme.css` and nowhere
else.** Every colour in the project is a token defined once per theme; no
screen hardcodes a hex value, and even the pixel icons take tokens
(`color="var(--ink)"`). Add a colour to one theme block and you must add it to
the other, or that theme falls back to the night value.

Two tokens are easy to confuse:

- `--faint` — quiet **borders** and inactive structure.
- `--dim` — dim **text** that still has to be readable (idle lyrics, tile
  numbers, hint lines). Both themes keep it above a 3:1 contrast ratio.

## The song page

**Layout.** Sleeve and track info across the top; below that the player on one
side and the dedication on the other. On screens 900px and wider the page
itself does not scroll — only the letter does. On a phone that would mean two
nested scrollbars, so it stacks instead and the page scrolls normally with the
player pinned to the bottom.

The spectrum is not an animation. The `<audio>` element is routed through a Web
Audio `AnalyserNode`, so the bars are the real FFT of the track, the reflection
underneath mirrors them, and the low end drives both the bloom behind the sleeve
and the gentle scaling of her photo.

Two things to be careful of if you touch `Visualizer.jsx`:

- The `AudioContext` is created and resumed **inside the play click** and is
  confirmed `running` *before* the audio element is rerouted. Rerouting into a
  suspended context makes the song play silently.
- If any of that fails it sets a dead flag, never touches the element again, and
  the bars fall back to a canned CSS animation. Audio keeps working either way.

## How it's put together

```
src/
  content.js              <- the only file you edit
  App.jsx                 routing, PIN gate, screen transitions
  main.jsx
  screens/                one .jsx + one .css per screen
    TitleScreen  LockScreen  MenuScreen
    GalleryScreen  MessageScreen  SongScreen  ReasonsScreen
  components/
    PixelIcon.jsx         8x8 sprites drawn in code
    Backdrop.jsx          starfield, floating hearts, CRT overlay
    TypeWriter.jsx        character-by-character text
    Letter.jsx            the long-form letter panel (used twice)
    Visualizer.jsx        real audio spectrum via AnalyserNode
    TopBar.jsx
  hooks/
    useHashRoute.js       hash routing (keeps the phone back button working)
    useSound.jsx          chiptune blips synthesised with Web Audio
    useTheme.jsx          day/night, persisted
  lib/util.js             asset paths, time formatting, pixel-art generator
  styles/
    theme.css             BOTH palettes + keyframes — all colour lives here
    global.css            reset, app shell, buttons
    letter.css            shared letter panel
```

Three things worth knowing before you edit CSS:

- `src/main.jsx` imports `theme.css` and `global.css` **before** `App.jsx` on
  purpose. Vite injects stylesheets in module-evaluation order, and the screen
  sheets have to win over the shared `.btn` / `.px-box` defaults they override.
- `box-shadow` draws the pixel frames, so an element can only have one
  `box-shadow` rule. If something needs a frame *and* an inner shadow, write
  both in a single declaration (see `.lock__slot`).
- Anything painted over the page (the CRT sweep, scanlines, scrims) needs a
  per-theme value. A white overlay that is invisible on the dark theme will
  bleach the text on the light one.
- **Backdrop drift must be a `transform`, never `background-position`.**
  Animating the background repaints the whole viewport every frame — it cost
  the whole site 15fps until it was changed to a composited translate.
- **A custom property that references another one is resolved where it is
  DECLARED, not where it is used.** `--bloom: 0 0 30px -4px var(--bc)` on
  `:root` computes *invalid* (there is no `--bc` there), and every descendant
  then inherits nothing — which silently turned `box-shadow` off for every
  `.px-box.is-glow` in the night theme. Write `var(--bloom, <fallback>)` at the
  use site instead, so the fallback resolves locally where `--bc` exists.
- `@media (hover: hover)` reports **false** under DevTools device emulation and
  on touch-capable laptops. Don't hide anything behind it that matters.
- **Hover cannot work in DevTools "Responsive" mode.** With touch emulation on,
  Chrome dispatches *no* events for an unpressed pointer — not `mousemove`, not
  `pointermove` — and `:hover` never matches. Measured. To check hover states,
  set the device-type dropdown next to the dimensions to **Desktop**, or just
  resize a normal window. Touch gets a `:active` press state instead, which is
  the only feedback a real phone can give.
- Prefer `animation-fill-mode: backwards` over `both` on anything repeated
  many times. A filled `both` holds the *interpolated identity* — `transform:
  matrix(1,0,0,1,0,0)`, `filter: blur(0px) saturate(1)…` — rather than `none`,
  which pins every one of those elements to its own paint path forever.
- Keep an eye on how many elements run **infinite** animations. A decorative
  pulse on each of 102 tiles is 102 of them, and it shows.

- **Never leave a `transform` or `filter` on `.app` or `.screen`.** Both use
  `animation-fill-mode: backwards` for this reason. A filled-forwards transform
  makes the element a containing block for `position: fixed`, which un-pins the
  backdrop *and* drops modals (the lightbox, the reason card) thousands of
  pixels down a long page instead of centring them in the viewport.
- The top-right corner belongs to the fixed theme/sound HUD (`z-index: 950`).
  Anything a modal puts up there will be unclickable underneath it.
- **Never leave a `transform` or `filter` on `.app`.** The boot animation uses
  `animation-fill-mode: backwards` for exactly this reason — a filled-forwards
  transform makes `.app` a containing block for `position: fixed`, which
  silently un-pins the starfield and CRT overlay from the viewport and lets
  them add to the page height.

## Notes

- Sound is on by default, toggled with the speaker button (top right), and the
  choice is remembered.
- Her unlocked reasons are saved in her browser, so progress survives a refresh.
- Works down to 390px wide; the song player pins to the bottom of the screen.
- No fonts, images, or audio are fetched from anywhere except Google Fonts.

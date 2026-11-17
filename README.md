# A Kingdom for You

A 3D gift website: a little castle island with ten "memories" to discover, a love letter, and a fireworks finale. It is built with Next.js, React Three Fiber and Three.js, and runs on phones and desktops.

Every model is built in code from simple shapes, the music is generated in the browser, and the card illustrations are inline SVG. There are no image, model or audio files to download, so the site works offline once it's built.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build
```

## Make it yours

Edit **`src/story.ts`**. It holds:

- her name and your name
- the ten memories: button label, small heading, title and message
- the letter
- the finale line

Nothing else needs to change.

## How it works

| Part | File |
|---|---|
| Tour logic: stops, timing, Auto mode, letter, finale | `src/Experience.tsx` |
| On-screen UI: cards, controls, menu, letter, hold-to-crown button | `src/ui/Overlay.tsx`, `app/globals.css` |
| Card illustrations (SVG) | `src/ui/Illustrations.tsx` |
| Camera positions and where the characters stand at each stop | `src/scene/layout.ts` |
| Sky, water, island, wind-swayed grass, trees, clouds | `src/scene/World.tsx` |
| Castle, gates, rose garden, tea party, dragon, well, swan boat, easel, gazebo, throne | `src/scene/Props.tsx` |
| Princess, prince and cat, with walking, hugging, kneeling and the boat ride | `src/scene/Characters.tsx` |
| Floating hearts and fireworks | `src/scene/fx.tsx` |
| Music-box waltz (Web Audio) | `src/lib/music.ts` |

## The ten stops

1. **Open the gates**: the gold gates swing open and the couple walk in.
2. **Pick a rose**: hearts rise from the rose bushes and she ends up holding a rose.
3. **Pour the tea**: the teapot tips over the cups.
4. **Wake the dragon**: the sleeping dragon opens his eyes, sits up and flaps his wings.
5. **Toss a coin**: a coin arcs into the wishing well and the well glows.
6. **Ride the swan boat**: they sail a lap of the lake while the camera follows.
7. **Paint her portrait**: a portrait paints itself onto the easel.
8. **Ask her to dance**: they hug in the gazebo as hearts float up.
9. **Light up the castle**: every window lights up.
10. **Hold to crown her**: press and hold, and the crown floats down onto her head while he kneels.

After the tenth stop comes the letter, then the finale: the sky turns to dusk and fireworks go off over the castle.

## Not built yet

- A "Make it yours" editor, so people can personalise it without editing code
- Photo uploads, share links, passwords and payments
- Free-roam "walk around" mode
- Proper 3D models. The current ones are simple shapes; real models can replace them stop by stop.

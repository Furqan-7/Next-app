/**
 * Everything personal lives in this file.
 * Change the names, the memories and the letter, and the whole site updates.
 */

export type StopId =
  | "gates"
  | "roses"
  | "tea"
  | "dragon"
  | "well"
  | "swan"
  | "easel"
  | "gazebo"
  | "castle"
  | "throne";

export interface Memory {
  id: StopId;
  /** Label on the button that plays this stop's moment. */
  action: string;
  /** "hold" makes the button a press-and-hold. */
  actionType?: "tap" | "hold";
  kicker: string;
  title: string;
  text: string;
}

export const story = {
  herName: "Rida",
  hisName: "Zaid",
  introKicker: "A little kingdom for",
  introLine: "Someone built you a castle. Come in, the gates are waiting.",
  memories: [
    {
      id: "gates",
      action: "Open the gates",
      kicker: "The castle gates",
      title: "Welcome home",
      text: "I couldn't find you a real castle, so I built one. The gates only open for you.",
    },
    {
      id: "roses",
      action: "Pick a rose",
      kicker: "The rose garden",
      title: "The prettiest one",
      text: "I walked past a thousand roses looking for the prettiest. Then I remembered I'd already found her.",
    },
    {
      id: "tea",
      action: "Pour the tea",
      kicker: "A royal tea party",
      title: "A table for two",
      text: "Cupcakes, warm tea and your terrible jokes. My favourite kind of afternoon.",
    },
    {
      id: "dragon",
      action: "Wake the dragon",
      kicker: "The castle dragon",
      title: "Fierce, apparently",
      text: "Every kingdom needs a dragon. Ours is a big softie who only gets grumpy when he's hungry. Sound familiar?",
    },
    {
      id: "well",
      action: "Toss a coin",
      kicker: "The wishing well",
      title: "One coin, one wish",
      text: "I wished for you long before I met you. This coin is just me saying thank you.",
    },
    {
      id: "swan",
      action: "Ride the swan boat",
      kicker: "The lake",
      title: "Slow afternoons",
      text: "Nowhere to be, nothing to do, just you next to me. That's the whole wish.",
    },
    {
      id: "easel",
      action: "Paint her portrait",
      kicker: "The royal painter",
      title: "The kingdom's treasure",
      text: "The painter asked what the greatest treasure in the kingdom was. He painted you.",
    },
    {
      id: "gazebo",
      action: "Ask her to dance",
      kicker: "The garden gazebo",
      title: "No music needed",
      text: "We don't need a ballroom. Anywhere becomes a dance floor when you're in it.",
    },
    {
      id: "castle",
      action: "Light up the castle",
      kicker: "The castle",
      title: "Every window, for you",
      text: "Every light in this castle is on because you're home.",
    },
    {
      id: "throne",
      action: "Hold to crown her",
      actionType: "hold",
      kicker: "The throne",
      title: "Long live the princess",
      text: "Not because of the castle or the crown. You're royalty because of the way you love.",
    },
  ] satisfies Memory[],
  letter: {
    greeting: "My Princess,",
    paragraphs: [
      "They say princesses live in faraway castles. Mine lives in my phone, my head and every plan I make.",
      "You turn ordinary days into fairytales. The way you laugh, the way you look after everyone, the way you make me feel like someone worth looking at.",
      "So today the whole kingdom celebrates you. The roses, the dragon, the fireworks, all of it. You deserve every bit, and so much more.",
    ],
    signOff: "Forever your loyal subject,",
  },
  finaleLine: "Long live my princess",
  /**
   * Background song, looped seamlessly. public/song.mp3 holds "Tum Ho Toh" (Saiyaara)
   * from 0:24.2 to 1:14.55, the same section the reference video loops.
   * If the file is missing, a built-in music-box tune plays instead.
   */
  song: "/song.mp3",
  /**
   * Photos are off in this version. To add some, put them in public/photos,
   * list them here in order, and turn on the places you want them.
   * Portrait (tall) photos look best. Each switch below turns one place on or off.
   */
  photos: {
    files: [] as string[],
    /** Each memory card shows a photo (they're used in order, repeating if there are fewer than 10). */
    onCards: false,
    /** The easel paints the first photo instead of the cartoon portrait. */
    onEasel: false,
    /** A photo wall after the letter, before the fireworks. */
    galleryAtEnd: false,
    galleryTitle: "Our little moments",
    /** Framed photos hang on the front of the castle. */
    inCastle: false,
  },
};

/** The photo for memory card i (or null if photos are off for cards). */
export function cardPhoto(i: number): string | null {
  const f = story.photos.files;
  if (!story.photos.onCards || f.length === 0) return null;
  return f[i % f.length];
}

export type Story = typeof story;

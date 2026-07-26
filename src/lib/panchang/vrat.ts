/**
 * Vrat (fasting) guidance: exact local start / parana windows and simple
 * dietary rules, derived from the day's solar and tithi timings.
 */

export type VratTimes = {
  sunrise: Date;
  sunset: Date;
  moonrise: Date | null;
  /** End of the current tithi. */
  tithiEnd: Date;
  /** Sunrise of the following day, for parana windows. */
  nextSunrise: Date | null;
};

export type VratGuide = {
  label: string;
  about: string;
  /** When the fast begins. */
  start: { label: string; at: Date | null };
  /** When it is broken (parana). */
  end: { label: string; at: Date | null; note?: string };
  dietary: string[];
};

const HOUR = 3_600_000;

export function vratGuide(
  tithiName: string,
  paksha: string,
  times: VratTimes,
): VratGuide | null {
  switch (tithiName) {
    case "Ekadashi":
      return {
        label: "Ekadashi Vrat",
        about:
          "The eleventh lunar day is kept as a grain-free fast for Vishnu. It is the most widely observed vrat of the fortnight and is broken the next morning at parana.",
        start: { label: "Fast begins", at: times.sunrise },
        end: {
          label: "Parana (break fast)",
          at: times.nextSunrise,
          note: "Break within the first two and a half hours after tomorrow's sunrise.",
        },
        dietary: [
          "No rice, wheat, lentils or any grain.",
          "Fruit, milk, nuts, potato and sabudana are allowed (phalahar).",
          "Rock salt (sendha namak) only; avoid onion and garlic.",
          "Nirjala observers take no water at all until parana.",
        ],
      };
    case "Chaturthi":
      return paksha === "Krishna"
        ? {
            label: "Sankashti Chaturthi Vrat",
            about:
              "A monthly fast to Ganesha for the removal of obstacles. It is broken only after sighting the moon and offering arghya.",
            start: { label: "Fast begins", at: times.sunrise },
            end: {
              label: "Moonrise — break fast",
              at: times.moonrise,
              note: "Offer arghya to the moon, then eat.",
            },
            dietary: [
              "One phalahar meal after the evening Ganesha puja.",
              "Fruit, milk and sabudana khichdi are usual.",
              "Modak or laddu offered as naivedya.",
            ],
          }
        : {
            label: "Vinayaka Chaturthi Vrat",
            about:
              "The waxing-moon Chaturthi is dedicated to Ganesha and is kept only until the midday puja.",
            start: { label: "Fast begins", at: times.sunrise },
            end: {
              label: "Midday puja — break fast",
              at: new Date(times.sunrise.getTime() + (times.sunset.getTime() - times.sunrise.getTime()) / 2),
            },
            dietary: [
              "Light phalahar until the puja.",
              "Avoid grains and non-vegetarian food for the day.",
              "Do not look at the moon tonight, by tradition.",
            ],
          };
    case "Trayodashi":
      return {
        label: "Pradosh Vrat",
        about:
          "Shiva is worshipped in the Pradosh window that straddles sunset on the thirteenth lunar day. The fast is kept through the day and broken after the evening abhishekam.",
        start: { label: "Fast begins", at: times.sunrise },
        end: {
          label: "Pradosh puja — break fast",
          at: new Date(times.sunset.getTime() + 1.5 * HOUR),
          note: `Pradosh kaal runs roughly from ${fmtRangeHint(times.sunset)}.`,
        },
        dietary: [
          "Grain-free through the day; fruit and milk are allowed.",
          "Break the fast after the abhishekam with satvik food.",
          "No alcohol, onion or garlic.",
        ],
      };
    case "Purnima":
      return {
        label: "Purnima Vrat",
        about:
          "The full-moon fast is kept for Satyanarayana and Lakshmi, and is broken only after the moon is seen.",
        start: { label: "Fast begins", at: times.sunrise },
        end: { label: "Moonrise — break fast", at: times.moonrise },
        dietary: [
          "Satvik, grain-free food during the day.",
          "Satyanarayana katha followed by sheera / panchamrita prasad.",
        ],
      };
    case "Amavasya":
      return {
        label: "Amavasya Observance",
        about:
          "The new moon is kept for the ancestors — tarpan and pinda-dana are offered, and many families take a single satvik meal.",
        start: { label: "Observance begins", at: times.sunrise },
        end: { label: "Tarpan by midday", at: new Date(times.sunrise.getTime() + 6 * HOUR) },
        dietary: [
          "One satvik meal, taken after the tarpan.",
          "No onion, garlic, alcohol or non-vegetarian food.",
          "Feed a guest, a cow or a crow before eating.",
        ],
      };
    case "Ashtami":
      return paksha === "Krishna"
        ? {
            label: "Kalashtami Vrat",
            about: "An optional monthly fast dedicated to Kala Bhairava, kept through the day and broken at night.",
            start: { label: "Fast begins", at: times.sunrise },
            end: { label: "Night puja — break fast", at: new Date(times.sunset.getTime() + 2 * HOUR) },
            dietary: ["Fruit and milk during the day.", "Satvik meal after the night puja."],
          }
        : {
            label: "Durgashtami Vrat",
            about: "The waxing-moon Ashtami is kept for Durga, with a fast broken after the midday or evening puja.",
            start: { label: "Fast begins", at: times.sunrise },
            end: { label: "After Durga puja", at: new Date(times.sunset.getTime() - 2 * HOUR) },
            dietary: ["Phalahar until the puja.", "Kanya-pujan and halwa-puri prasad where observed."],
          };
    default:
      return null;
  }
}

function fmtRangeHint(sunset: Date): string {
  const from = new Date(sunset.getTime() - 1.5 * HOUR);
  const to = new Date(sunset.getTime() + 1.5 * HOUR);
  return `${from.toISOString()}|${to.toISOString()}`;
}

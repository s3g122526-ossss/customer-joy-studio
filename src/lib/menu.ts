import pizzaWhite from "@/assets/pizza-white.png";
import pulao from "@/assets/pulao.png";
import karahi from "@/assets/karahi.jpg";
import steak from "@/assets/steak.png";
import skewers from "@/assets/skewers.png";

export type Dish = {
  slug: string;
  tag: string;
  name: string;
  desc: string;
  image: string;
  price: string;
  oldPrice: string;
  heat: string;
  time: string;
  accent: "flame" | "ember" | "gold" | "char" | "leaf";
  ribbon?: "hot" | "new" | "demand" | "signature";
  /** long-form details shown on the dedicated product page */
  story: string;
  ingredients: string[];
  allergens: string[];
  serves: string;
  weight: string;
  calories: number;
  spiceLevel: number; // 1..5
  chef: string;
};

export const DISHES: Dish[] = [
  {
    slug: "spicy-white-pizza",
    tag: "Signature",
    name: "Spicy White Pizza",
    desc: "Creamy garlic base, charred chicken, basil and a fiery chili finish.",
    image: pizzaWhite,
    price: "1450",
    oldPrice: "1750",
    heat: "Hot",
    time: "18m",
    accent: "flame",
    ribbon: "hot",
    story:
      "Our house dough is cold-fermented for 48 hours, then stretched by hand and slid straight onto the stone deck. A white garlic cream replaces tomato, so the charred chicken, smoked mozzarella and crushed red chili can hit you in layers — creamy first, then smoke, then heat.",
    ingredients: [
      "48-hour cold-fermented dough",
      "Roasted garlic cream",
      "Smoked mozzarella",
      "Charcoal-charred chicken",
      "Fresh basil",
      "Crushed red chili",
    ],
    allergens: ["Gluten", "Dairy"],
    serves: "2 people",
    weight: "780 g",
    calories: 1120,
    spiceLevel: 4,
    chef: "Chef Kennedy",
  },
  {
    slug: "seekh-malai-boti",
    tag: "Charcoal",
    name: "Seekh & Malai Boti",
    desc: "Hand-skewered, smoked over live charcoal until edges catch fire.",
    image: skewers,
    price: "1150",
    oldPrice: "1400",
    heat: "Medium",
    time: "22m",
    accent: "ember",
    ribbon: "demand",
    story:
      "Minced twice, kneaded with roasted spices and rested overnight. Skewers go over live charcoal so the fat drips, flares and perfumes the meat. The malai boti is marinated in cream and cheese for a soft, buttery contrast.",
    ingredients: [
      "Hand-minced chicken",
      "Cream & cheddar marinade",
      "Roasted cumin and coriander",
      "Green chili paste",
      "Charcoal smoke finish",
    ],
    allergens: ["Dairy"],
    serves: "2 people",
    weight: "650 g",
    calories: 890,
    spiceLevel: 3,
    chef: "Ustad Nadeem",
  },
  {
    slug: "chicken-karahi",
    tag: "House Classic",
    name: "Chicken Karahi",
    desc: "Wok-fired tomatoes, ginger julienne and crushed red chili.",
    image: karahi,
    price: "1650",
    oldPrice: "1950",
    heat: "Extra Hot",
    time: "25m",
    accent: "char",
    ribbon: "hot",
    story:
      "Cooked to order in a black iron karahi over a roaring burner. Nothing but tomatoes, chicken, ginger and whole spices — no cream, no shortcuts — reduced until the oil separates and the gravy clings to every piece.",
    ingredients: [
      "Farm chicken, bone-in",
      "Vine tomatoes",
      "Ginger julienne",
      "Crushed red chili",
      "Black pepper & coriander seed",
    ],
    allergens: [],
    serves: "3 people",
    weight: "1.1 kg",
    calories: 1340,
    spiceLevel: 5,
    chef: "Chef Kennedy",
  },
  {
    slug: "kabuli-pulao",
    tag: "Slow Cooked",
    name: "Kabuli Pulao",
    desc: "Golden basmati, tender lamb shank, cashew, almond and raisin.",
    image: pulao,
    price: "1350",
    oldPrice: "1600",
    heat: "Mild",
    time: "30m",
    accent: "gold",
    ribbon: "signature",
    story:
      "Lamb shank simmers for five hours in its own stock, and that stock is what cooks the aged basmati. Caramelised carrot, raisin and toasted nuts go on last so every spoon has sweetness against the meat.",
    ingredients: [
      "Aged basmati rice",
      "Slow-braised lamb shank",
      "Caramelised carrot & raisin",
      "Cashew and almond",
      "Whole garam masala",
    ],
    allergens: ["Tree nuts"],
    serves: "3 people",
    weight: "1.2 kg",
    calories: 1260,
    spiceLevel: 1,
    chef: "Ustad Nadeem",
  },
  {
    slug: "flame-grilled-steak",
    tag: "Premium",
    name: "Flame Grilled Steak",
    desc: "Prime cut, rosemary butter basted, cracked pepper crust.",
    image: steak,
    price: "2450",
    oldPrice: "2900",
    heat: "Medium",
    time: "20m",
    accent: "leaf",
    ribbon: "new",
    story:
      "A thick prime cut, dry-brined for 24 hours, seared hard on the grill bars and basted with rosemary butter until the pepper crust crackles. Rested eight minutes before it leaves the pass.",
    ingredients: [
      "Prime beef cut",
      "Rosemary butter",
      "Cracked black pepper",
      "Sea salt",
      "Grilled seasonal vegetables",
    ],
    allergens: ["Dairy"],
    serves: "1 person",
    weight: "420 g",
    calories: 980,
    spiceLevel: 2,
    chef: "Chef Kennedy",
  },
];

export function getDish(slug: string): Dish | undefined {
  return DISHES.find((d) => d.slug === slug);
}

export const MENU_TEXT = DISHES.map(
  (d) =>
    `${d.name} (${d.tag}) — Rs ${d.price}, heat: ${d.heat}, ready in ${d.time}. ${d.desc}`,
).join("\n");

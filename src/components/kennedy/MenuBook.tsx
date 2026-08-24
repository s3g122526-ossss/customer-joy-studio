import { useCallback, useState, type CSSProperties } from "react";

import { DISHES } from "@/lib/menu";
import { isMuted, playSfx } from "@/lib/sfx";

const dishes = DISHES.map((dish) => ({
  name: dish.name,
  course: dish.tag,
  price: `PKR ${dish.price}`,
  description: dish.desc,
  notes: [`${dish.serves} · ${dish.weight}`, `Ready in ${dish.time}`, dish.ingredients[0]!],
  image: dish.image,
}));

const pageCount = dishes.length + 1;

/** Soft page-turn whoosh + a whispered dish name when a page is uncovered. */
function speak(text: string) {
  if (typeof window === "undefined" || isMuted()) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 0.9;
  utter.volume = 0.6;
  synth.speak(utter);
}

export function MenuBook() {
  const [open, setOpen] = useState<boolean[]>(() => Array(pageCount).fill(false));
  const coverOpen = open[0];

  const toggle = useCallback(
    (index: number, voice?: string) => {
      // Decide the outcome here (not inside the state updater) so the sound
      // always matches the page that is being revealed right now.
      const willOpen = !open[index];
      setOpen((prev) => prev.map((value, i) => (i === index ? !value : value)));
      playSfx(willOpen ? "swoosh" : "pop");
      if (willOpen && voice) speak(voice);
    },
    [open],
  );


  const closeAll = useCallback(() => {
    setOpen((prev) => {
      if (prev.some(Boolean)) playSfx("pop");
      return Array(pageCount).fill(false);
    });
  }, []);

  return (
    <section id="menu-book" className="menu-scene" onClick={closeAll}>
      <div className="menu-scene__glow" aria-hidden="true" />

      <div className="menu-bg-type" aria-hidden="true">
        <span>MENU</span>
        <span>BOOK</span>
      </div>

      <header className="menu-head">
        <span className="menu-head__kicker">Est. 2014 · Charcoal &amp; Dum Kitchen</span>
        <h2 className="menu-head__title">The Menu Book</h2>
        <p className="menu-head__hint">
          {coverOpen
            ? "Keep flipping — tap outside to close the book"
            : "Tap the cover to open the menu"}
        </p>
      </header>

      <div className={`menu-book${open.some(Boolean) ? " is-open" : ""}`}>
        {/* Cover */}
        <button
          type="button"
          className={`menu-book__page menu-book__page--cover${coverOpen ? " is-open" : ""}`}
          style={{ "--i": 0 } as CSSProperties}
          onClick={(event) => {
            event.stopPropagation();
            toggle(
              0,
              `Welcome to the Kennedy menu book. First up, ${dishes[0]!.name}`,
            );

          }}
          aria-pressed={coverOpen}
          aria-label="Open the menu book"
        >
          <div className="menu-page menu-page--cover-front">
            <span className="menu-cover__frame" aria-hidden="true" />
            <span className="menu-cover__crest">K</span>
            <span className="menu-cover__kicker">Moon Grill Narowal</span>
            <span className="menu-cover__title">Kennedy</span>
            <span className="menu-cover__flourish" aria-hidden="true">
              <span />
              <i />
              <span />
            </span>
            <span className="menu-cover__sub">Charcoal · Dum · Wood-Fired</span>

            <span className="menu-cover__cta">
              <span className="menu-cover__finger" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V12m0-1a1.5 1.5 0 0 1 3 0v5a5 5 0 0 1-5 5h-2.2a4 4 0 0 1-3.1-1.5L5 15.5a1.6 1.6 0 0 1 2.3-2.2L9 15" />
                </svg>
              </span>
              Tap to explore
            </span>
            <span className="menu-cover__pulse" aria-hidden="true" />
          </div>

          <div className="menu-page menu-page--cover-back">
            <span className="menu-page__no">How it works</span>
            <span className="menu-page__backname">Flip each page</span>
            <span className="menu-page__rule" />
            <p className="menu-page__desc">
              Every page is a dish. Tap a photo page to lift it and read the recipe, notes and price
              on the back. Tap anywhere outside the book to lay all pages flat again.
            </p>
            <div className="menu-page__notes">
              <span>{dishes.length} plates on the pass tonight</span>
              <span>Prices in Pakistani Rupees</span>
              <span>Kitchen open till 1:00 AM</span>
            </div>
          </div>
        </button>

        {/* Dish pages */}
        {dishes.map((dish, i) => {
          const index = i + 1;
          return (
            <button
              type="button"
              key={dish.name}
              className={`menu-book__page${open[index] ? " is-open" : ""}`}
              style={{ "--i": index } as CSSProperties}
              onClick={(event) => {
                event.stopPropagation();
                toggle(index, dish.name);
              }}
              aria-pressed={open[index]}
              aria-label={`${dish.name} — ${dish.price}`}
            >
              <div className="menu-page menu-page--front">
                <img src={dish.image} alt={dish.name} loading="lazy" />
                <span className="menu-page__veil" aria-hidden="true" />
                <span className="menu-page__gloss" aria-hidden="true" />
                <span className="menu-page__label">
                  <span className="menu-page__course">{dish.course}</span>
                  <span className="menu-page__name">{dish.name}</span>
                  <span className="menu-page__price">{dish.price}</span>
                </span>
              </div>

              <div className="menu-page menu-page--back">
                <span className="menu-page__no">
                  {String(index).padStart(2, "0")} / {String(dishes.length).padStart(2, "0")}
                </span>
                <span className="menu-page__backname">{dish.name}</span>
                <span className="menu-page__rule" />
                <p className="menu-page__desc">{dish.description}</p>
                <div className="menu-page__notes">
                  {dish.notes.map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
                <span className="menu-page__backprice">{dish.price}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="menu-foot">
        <span>Charcoal grill</span>
        <span className="menu-foot__dot" aria-hidden="true" />
        <span>Dum biryani</span>
        <span className="menu-foot__dot" aria-hidden="true" />
        <span>Wood-fired oven</span>
      </div>
    </section>
  );
}

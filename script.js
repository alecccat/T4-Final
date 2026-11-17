const themeToggle = document.querySelector("#theme-toggle");

if (themeToggle) {
  const root = document.documentElement;
  // hvis dark mode er sat som fave, brug dark mode
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  // valgt tema, ellers systemets
  const current = () =>
    root.dataset.theme ?? (systemDark.matches ? "dark" : "light");

  const update = () => {
    const dark = current() === "dark";
    themeToggle.setAttribute("aria-pressed", dark); //aria pressed fortæller skærmlæser at knappen er klikket
    themeToggle.textContent = dark ? "Light" : "Dark"; //skift mellem temaer
  };

  themeToggle.addEventListener("click", () => {
    // lyt efter klick og skift tema
    const next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    update();
  });

  update();
}

// Interaktiv SVG-side
const svgPlaceholder = document.querySelector(".svg-placeholder");

const propGroups = [
  {
    name: "small-props",
    //sætter visningsrækkefølgen
    classes: [
      "cat",
      "cog",
      "flowe",
      "star",
      "heart",
      "circle",
      "rounded",
      "rectangle",
    ],
  },
  {
    name: "medium-props",
    classes: ["heart1", "circle1", "star1", "flowe1"],
  },
  { name: "large-props", classes: ["rounded2", "rectangle2"] },
];
const MAX_PROPS = 8; //max antal

function getCount(name) {
  //hvor mange er valgt,
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? parseInt(checked.value.replace(/\D/g, ""), 10) : 0;
}
function updateAllProps() {
  //hvis ingen = 0
  const counts = propGroups.map((g) => getCount(g.name));
  const total = counts.reduce((sum, n) => sum + n, 0);

  propGroups.forEach((group, gi) => {
    // Vis/skjul props i SVG
    group.classes.forEach((cls, i) => {
      const el = document.querySelector(`.svg-scene .${cls}`);
      if (el) el.style.display = i < counts[gi] ? "" : "none";
    });

    //  Skjul radios der ville give mere end 8
    const remaining = MAX_PROPS - (total - counts[gi]);

    document
      .querySelectorAll(`input[name="${group.name}"]`)
      .forEach((radio) => {
        const n = parseInt(radio.value.replace(/\D/g, ""), 10);
        (radio.closest("label") ?? radio).hidden = n > remaining;
      });
  });
}
const allPropRadios = document.querySelectorAll(
  propGroups.map((g) => `input[name="${g.name}"]`).join(", "),
);

if (allPropRadios.length) {
  //opdaterer
  allPropRadios.forEach((r) => r.addEventListener("change", updateAllProps));
  updateAllProps();
}

//Flytbag svg

const scene = document.querySelector(".svg-scene");

if (scene) {
  const KEY = "prop-positions";
  const PROP = "use:not(.scene)";
  const props = [...scene.querySelectorAll(PROP)];
  const originalOrder = [...props];

  // én tilstand pr. prop, gemt under propens href
  const state = JSON.parse(localStorage.getItem(KEY) || "{}");
  const get = (el) =>
    (state[el.getAttribute("href")] ??= { x: 0, y: 0, a: 0, cx: 0, cy: 0 });
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

  let selected = null; // sidst valgte prop, den som Q og E drejer
  let grab = null; // propen der trækkes lige nu

  const apply = (el) => {
    const { x, y, a, cx, cy } = get(el);
    el.setAttribute(
      "transform",
      `translate(${x} ${y}) rotate(${a} ${cx} ${cy})`,
    );
  };

  // musens placering omregnet til SVGens koordinater
  const toLocal = (e, el) =>
    new DOMPoint(e.clientX, e.clientY).matrixTransform(
      el.parentNode.getScreenCTM().inverse(),
    );

  const rotate = (el, deg) => {
    const s = get(el);
    try {
      // propens midte, som den drejer om. Skjulte props kan ikke måles
      const b = el.getBBox();
      if (b.width) {
        s.cx = b.x + b.width / 2;
        s.cy = b.y + b.height / 2;
      }
    } catch {
      // propen beholder sin gamle midte
    }
    s.a = (s.a + deg) % 360;
    apply(el);
    save();
  };

  // gendan gemte placeringer
  props.forEach((el) => {
    if (state[el.getAttribute("href")]) apply(el);
  });

  // trækker proppen v mousedown
  scene.addEventListener("pointerdown", (e) => {
    const el = e.target.closest(PROP);
    if (!el) return;

    const s = get(el);
    const p = toLocal(e, el);
    grab = { el, dx: p.x - s.x, dy: p.y - s.y };
    selected = el;

    el.parentNode.appendChild(el); // løfter propen op over de andre
    el.setPointerCapture(e.pointerId); // følger musen, selv uden for propen
    el.classList.add("dragging");
  });

  scene.addEventListener("pointermove", (e) => {
    if (!grab) return;
    const s = get(grab.el);
    const p = toLocal(e, grab.el);
    s.x = p.x - grab.dx;
    s.y = p.y - grab.dy;
    apply(grab.el);
  });

  const drop = () => {
    if (!grab) return;
    grab.el.classList.remove("dragging");
    save();
    grab = null;
  };
  scene.addEventListener("pointerup", drop);
  scene.addEventListener("pointercancel", drop);

  // dreje på scroll
  scene.addEventListener("wheel", (e) => {
    const el = e.target.closest(PROP);
    if (!el) return;
    e.preventDefault(); // stopper siden fra at scrolle
    selected = el;
    rotate(el, e.deltaY > 0 ? 5 : -5);
  });

  document.addEventListener("keydown", (e) => {
    if (!selected || e.target.matches("input, textarea, select")) return;
    if (e.key === "q") rotate(selected, -5);
    if (e.key === "e") rotate(selected, 5);
  });

  // nulstil props knap
  document.querySelector("#reset-props")?.addEventListener("click", () => {
    //kli på knap
    props.forEach((el) => {
      delete state[el.getAttribute("href")];
      el.removeAttribute("transform"); //fjerner alle lagrede attributter
    });
    originalOrder.forEach((el) => el.parentNode.appendChild(el));
    localStorage.removeItem(KEY); //fjerner infoen fra lokal
    selected = null;
  });
}

// Opsamlingsside
const opsamlingPlaceholder = document.querySelector(".opsamling-placeholder");

if (opsamlingPlaceholder) {
  const params = new URLSearchParams(window.location.search);
  // Eksempel: params.get("navn") henter værdien fra et formularfelt med name="navn".
}

function initPriorityGroup(group) {
  const checkboxes = group.querySelectorAll(
    '.qualifiers input[type="checkbox"]',
  );
  const priorityFieldset = group.querySelector(".priority");
  const priorityRows = priorityFieldset.querySelectorAll(".priority-row");
  const prioritySelects = priorityFieldset.querySelectorAll("select");

  prioritySelects.forEach((select, i) => {
    select.name = `${group.dataset.name}-priority${i + 1}`;
  });

  function updatePriorities() {
    const chosen = [...checkboxes]
      .filter((c) => c.checked && !c.disabled)
      .map((c) => ({
        value: c.value,
        label: c.parentElement.textContent.trim(),
      }));
    priorityFieldset.hidden = chosen.length < 2;

    priorityRows.forEach((row, i) => {
      const select = prioritySelects[i];
      const active = chosen.length >= 2 && i < chosen.length;

      row.hidden = !active;
      select.disabled = !active;
      select.required = active;

      const previous = select.value;
      select.innerHTML = '<option value="">Choose...</option>';
      chosen.forEach((c) => select.add(new Option(c.label, c.value)));

      if (chosen.some((c) => c.value === previous)) select.value = previous;
    });

    updateDuplicates();
  }

  function updateDuplicates() {
    const taken = [...prioritySelects]
      .filter((s) => !s.disabled)
      .map((s) => s.value)
      .filter(Boolean);

    prioritySelects.forEach((select) => {
      [...select.options].forEach((option) => {
        option.disabled =
          option.value !== "" &&
          taken.includes(option.value) &&
          select.value !== option.value;
      });
    });
  }

  checkboxes.forEach((c) => c.addEventListener("change", updatePriorities));
  prioritySelects.forEach((s) =>
    s.addEventListener("change", updateDuplicates),
  );

  updatePriorities();
}

document.querySelectorAll(".priority-group").forEach(initPriorityGroup);

// Forside
const countdown = document.getElementById("countdown");

if (countdown) {
  const countDownDate = new Date("Feb 20, 2027 15:37:25").getTime();

  const x = setInterval(function () {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("countdown").innerHTML =
      days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

    if (distance < 0) {
      clearInterval(x);
      document.getElementById("countdown").innerHTML = "Venter på J-Dag";
    }
  }, 1000);
}

const sizeSelect = document.getElementById("field-group-size");

//hvis størrelse = min størrelse til max størrelse//
if (sizeSelect) {
  const sizeItems = document.querySelectorAll(
    "[data-min-size], [data-max-size]",
  );

  //updateres når GroupSize opdateres
  function updateGroupSize() {
    // aflæser størrelsen. Hvis ingen valgt udfyldes value med 0
    const size = parseInt(sizeSelect.value, 10) || 0;
    //tjekker alle elementer m. data-min og max-size
    sizeItems.forEach((el) => {
      const min = Number(el.dataset.minSize ?? 0);
      const max = Number(el.dataset.maxSize ?? Infinity);
      //bestemmer om elementerne er synlige eller ej. Skald udfylde alle krav
      const visible = size > 0 && size >= min && size <= max;
      // gemmer elementer når overstående regler ikke opfyldes. Viser dem når de er
      el.hidden = !visible;
      //fjerner hak i checkboxes der er gjort usynlige
      el.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = !visible;
        if (!visible && field.checked) {
          field.checked = false;
          field.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }
  sizeSelect.addEventListener("change", updateGroupSize); // ← ADD
  updateGroupSize(); // ← ADD
}

//event

const eventPass = document.querySelector(".event-pass");
if (eventPass) {
  const params = new URLSearchParams(window.location.search);

  const output_names = document.querySelector("#member-name-1");

  if (output_names) {
    output_names.textContent = [params.get("firstName"), params.get("lastName")]
      .filter(Boolean) //fjerner false values
      .join(" "); //sætter de to input sammen
  }

  const output_alias1 = document.querySelector("#member-alias-1");
  const alias1 = params.get("cosName");
  output_alias1.textContent = alias1;

  const output_pronoun1 = document.querySelector("#member-pron-1");
  const pronoun1 = params.get("pronoun");
  const customPronoun1 = params.get("pronounAlt");

  output_pronoun1.textContent =
    pronoun1 === "other" ? customPronoun1 : pronoun1; // pronomin er radio, hvis other så indtastet værdi

  const birthday1 = params.get("bday");
  const output_age1 = document.querySelector("#member-age-1");

  if (birthday1 && output_age1) {
    //udregn og vis alder
    const birthDate = new Date(birthday1 + "T00:00:00"); //info til js dato og midnat
    const today = new Date(); //finder dags dato

    let age = today.getFullYear() - birthDate.getFullYear(); //får i år og trækker fødselsår fra det

    const hasHadBirthday =
      today.getMonth() > birthDate.getMonth() || //er fødselsmåned passeret
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate()); //de næste to er om fødselsdato er passeret i nuværende måned

    if (!hasHadBirthday) {
      age--; //hvis fødselsdato og måned ikke passeret, trækkes 1 fra tidligere udregnede dato
    }

    output_age1.textContent = age; //viser udregnet alder
  }
}

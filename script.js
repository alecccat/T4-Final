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
  const draggables = scene.querySelectorAll("use:not(.scene)");
  const saved = JSON.parse(localStorage.getItem("prop-positions") || "{}");

  const toLocal = (evt, el) => {
    //omregner musens placering, så det passer til svgens
    const m = el.parentNode.getScreenCTM().inverse();
    return new DOMPoint(evt.clientX, evt.clientY).matrixTransform(m);
  };

  let selected = null; // vælger den prop der sidst blev klikket på så den kan drejes
  const resetters = [];
  const originalOrder = [
    "cat",
    "cog",
    "flowe",
    "star",
    "heart",
    "circle",
    "rounded",
    "rectangle",
    "heart1",
    "circle1",
    "star1",
    "flowe1",
    "rounded2",
    "rectangle2",
  ];

  draggables.forEach((el) => {
    const key = el.getAttribute("href");
    const s = saved[key] ?? {};
    let x = s.x ?? 0;
    let y = s.y ?? 0;
    let angle = s.a ?? 0;
    let cx = s.cx ?? 0; // midten af propen, som den drejer om
    let cy = s.cy ?? 0;
    let grab = null;

    const apply = () =>
      el.setAttribute(
        "transform",
        `translate(${x} ${y}) rotate(${angle} ${cx} ${cy})`,
      );

    const save = () => {
      saved[key] = { x, y, a: angle, cx, cy };
      localStorage.setItem("prop-positions", JSON.stringify(saved));
    };

    // finder midten, mens propen er synlig. Gemmes så den kan bruges ved genindlæsning
    const measure = () => {
      try {
        const b = el.getBBox();
        if (b.width > 0) {
          cx = b.x + b.width / 2;
          cy = b.y + b.height / 2;
        }
      } catch {
        // stopper script fra at crashe hvis der findes en fejl
      }
    };

    const rotateBy = (deg) => {
      //hvor meget der drejes
      measure();
      angle = (angle + deg) % 360;
      apply();
      save();
    };
    resetters.push(() => {
      x = 0;
      y = 0;
      angle = 0;
      cx = 0;
      cy = 0;
      el.removeAttribute("transform"); // tilbage til udgangspunktet
    });

    if (x || y || angle) apply(); // gendan gemt placering og drejning

    el.addEventListener("pointerdown", (e) => {
      //mus hold
      selected = { rotateBy };
      const p = toLocal(e, el);
      grab = { dx: p.x - x, dy: p.y - y };
      el.parentNode.appendChild(el);
      el.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
    });

    el.addEventListener("pointermove", (e) => {
      //mus hold move
      if (!grab) return;
      const p = toLocal(e, el);
      x = p.x - grab.dx;
      y = p.y - grab.dy;
      apply();
    });

    const drop = () => {
      //mus slip
      if (!grab) return;
      grab = null;
      el.classList.remove("dragging");
      measure();
      save();
    };

    el.addEventListener("pointerup", drop); //begge slipper elementet hvis mussehold anulleres
    el.addEventListener("pointercancel", drop);

    // scroll for at dreje
    el.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault(); // prevents scroll
        selected = { rotateBy };
        rotateBy(e.deltaY > 0 ? 5 : -5);
      },
      { passive: false },
    );
  });

  document.querySelector("#reset-props")?.addEventListener("click", () => {
    resetters.forEach((reset) => reset());

    // genskab den oprindelige lagplacering
    originalOrder.forEach((el) => el.parentNode.appendChild(el));

    // fjern gemte placeringer
    Object.keys(saved).forEach((key) => delete saved[key]);
    localStorage.removeItem("prop-positions");

    selected = null;
  });

  document.addEventListener("keydown", (e) => {
    //brug q og e til at dreje
    if (!selected || e.target.matches("input, textarea, select")) return;
    if (e.key === "q") selected.rotateBy(-5);
    if (e.key === "e") selected.rotateBy(5);
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

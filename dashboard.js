const featured = ["curiosity", "annoyance", "fear"];
const colors = {
   curiosity: "#1764a3",
   annoyance: "#bd5421",
   fear: "#6c43a3"
};

const groups = {
   "Curiosity & uncertainty": ["curiosity", "confusion", "surprise", "realization"],
   "Anger & frustration": ["anger", "annoyance", "disapproval", "disgust"],
   "Joy & optimism": ["joy", "amusement", "excitement", "optimism", "relief", "pride"],
   "Sadness & regret": ["sadness", "grief", "disappointment", "remorse", "embarrassment"],
   "Fear & anxiety": ["fear", "nervousness"],
   "Warmth & appreciation": ["love", "caring", "admiration", "approval", "gratitude"],
   "Other categories": ["desire", "neutral"]
};

const $ = id => document.getElementById(id);
const chart = $("timeline");
const emotionSelect = $("emotion-select");
const monthSelect = $("month-select");
const number = new Intl.NumberFormat("en-US");
const monthFormat = new Intl.DateTimeFormat("en-US", {
   month: "long", year: "numeric", timeZone: "UTC"
});

let rows = [];
let categories = [];
let selectedIndex = 0;

function label(key) {
   return key.charAt(0).toUpperCase() + key.slice(1);
}

function monthLabel(month) {
   return monthFormat.format(new Date(`${month}-01T00:00:00Z`));
}

function color(key) {
   return colors[key] || "#247269";
}

// Create an SVG shape or text node inside the chart.
function svg(tag, attributes = {}, content = "") {
   const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
   for (const [key, value] of Object.entries(attributes)) {
      node.setAttribute(key, value);
   }
   if (content) node.textContent = content;
   chart.append(node);
   return node;
}

function drawChart() {
   const keys = emotionSelect.value === "featured"
      ? featured
      : [emotionSelect.value];

   const left = 54, right = 935, top = 20, bottom = 295;
   const step = (right - left) / Math.max(rows.length - 1, 1);
   const x = i => left + i * step;

   // Rescale when one emotion is selected so small changes stay visible.
   const peak = Math.max(0, ...rows.flatMap(row => keys.map(key => row[`${key}_pct`])));
   const rawStep = Math.max(peak / 4, 0.05);
   const magnitude = 10 ** Math.floor(Math.log10(rawStep));
   const tick = [1, 2, 2.5, 5, 10].find(v => v * magnitude >= rawStep) * magnitude;
   const ceiling = 4 * tick;
   const y = pct => bottom - (pct / ceiling) * (bottom - top);

   chart.replaceChildren();
   $("legend").replaceChildren();

   for (let i = 0; i <= 4; i++) {
      const value = i * tick;
      svg("line", {
         x1: left, x2: right, y1: y(value), y2: y(value),
         stroke: "#dde4ec"
      });
      svg("text", { x: left - 9, y: y(value) + 4, "text-anchor": "end" },
         `${+value.toFixed(2)}%`);
   }

   rows.forEach((row, i) => {
      if (i === 0 || row.month.endsWith("-06") ||
         (row.month.endsWith("-01") && i > 1) || i === rows.length - 1) {
         svg("text", { x: x(i), y: bottom + 25, "text-anchor": "middle" },
            row.month);
      }
   });

   const guide = svg("line", {
      x1: left, x2: left, y1: top, y2: bottom,
      stroke: "#687687", "stroke-dasharray": "4 5"
   });

   for (const key of keys) {
      svg("polyline", {
         points: rows.map((row, i) => `${x(i)},${y(row[`${key}_pct`])}`).join(" "),
         fill: "none", stroke: color(key), "stroke-width": 2.5
      });

      rows.forEach((row, i) => {
         svg("circle", {
            cx: x(i), cy: y(row[`${key}_pct`]), r: 2.6, fill: color(key)
         });
      });

      const item = document.createElement("span");
      const swatch = document.createElement("i");
      swatch.className = "swatch";
      swatch.style.backgroundColor = color(key);
      item.append(swatch, label(key));
      $("legend").append(item);
   }

   function showReadout(i) {
      const row = rows[i];
      guide.setAttribute("x1", x(i));
      guide.setAttribute("x2", x(i));
      const values = keys.map(key =>
         `${label(key)}: ${row[`${key}_pct`].toFixed(2)}% ` +
         `(${number.format(row[`${key}_count`])})`
      );
      $("chart-readout").textContent =
         `${monthLabel(row.month)} · ${number.format(row.post_count)} scored posts · ` +
         values.join(" · ");
   }

   // Add event captions here later, using YYYY-MM as the key.
   const monthEvents = {
      "2019-12": "WHO learns of a cluster of unexplained pneumonia cases in Wuhan, China.",
      "2020-01": "WHO declares the coronavirus outbreak an international public health emergency.",
      "2020-02": "WHO names the disease COVID-19.",
      "2020-03": "WHO characterizes COVID-19 as a pandemic.",
      "2020-04": "CDC recommends cloth face coverings in public settings where distancing is difficult.",
      "2020-05": "The reported U.S. COVID-19 death toll passes 100,000.",
      "2020-06": "The FDA revokes emergency authorization for hydroxychloroquine as a COVID-19 treatment.",
      "2020-07": "WHO acknowledges that airborne transmission may occur in crowded, poorly ventilated indoor spaces.",
      "2020-08": "The FDA authorizes emergency use of convalescent plasma for hospitalized COVID-19 patients.",
      "2020-09": "The reported global COVID-19 death toll passes one million.",
      "2020-10": "President Donald Trump is hospitalized after testing positive for COVID-19.",
      "2020-11": "Pfizer and BioNTech announce promising early results from their COVID-19 vaccine trial.",
      "2020-12": "The first U.S. COVID-19 vaccinations begin after the FDA authorizes the Pfizer–BioNTech vaccine.",
      "2021-01": "The reported U.S. COVID-19 death toll passes 400,000.",
      "2021-02": "The FDA authorizes Johnson & Johnson’s single-dose COVID-19 vaccine.",
      "2021-03": "CDC says fully vaccinated people can gather indoors with other fully vaccinated people without masks.",
      "2021-04": "U.S. health officials pause use of the Johnson & Johnson vaccine to investigate reports of rare blood clots.",
      "2021-05": "The FDA expands Pfizer–BioNTech vaccine eligibility to children ages 12–15.",
      "2021-06": "CDC extends the federal eviction moratorium through July 31.",
      "2021-07": "As Delta spreads, CDC recommends indoor masking in areas with substantial or high transmission, including for vaccinated people.",
      "2021-08": "The FDA grants full approval to the Pfizer–BioNTech vaccine for people ages 16 and older.",
      "2021-09": "CDC recommends Pfizer boosters for older adults and certain people at higher risk.",
      "2021-10": "WHO releases a clinical definition of long COVID.",
      "2021-11": "WHO designates Omicron a variant of concern.",
      "2021-12": "CDC shortens recommended isolation to five days for people with no symptoms or improving symptoms, followed by five days of masking.",
      "2022-01": "The U.S. reports nearly one million new COVID-19 cases in a single day during the Omicron surge.",
      "2022-02": "The reported U.S. COVID-19 death toll passes 900,000.",
      "2022-03": "The Omicron BA.2 subvariant becomes dominant in the U.S.",
      "2022-04": "A federal judge strikes down the U.S. mask mandate for public transportation.",
      "2022-05": "The reported U.S. COVID-19 death toll reaches one million.",
      "2022-06": "CDC recommends COVID-19 vaccination for children as young as six months.",
      "2022-07": "The Omicron BA.5 subvariant becomes dominant in the U.S.",
      "2022-08": "The FDA authorizes updated Pfizer and Moderna boosters targeting the original virus and Omicron BA.4 and BA.5.",
      "2022-09": "CDC recommends the updated Omicron boosters for eligible adults and adolescents.",
      "2022-10": "CDC expands its recommendation for updated Omicron boosters to children as young as five.",
      "2022-11": "CDC publishes early U.S. data showing that the updated boosters offered additional protection against symptomatic infection.",
      "2022-12": "China scales back routine COVID-19 testing and allows some infected people to isolate at home."
   };

   const eventBox = svg("foreignObject", {
      visibility: "hidden",
      "pointer-events": "none",
      overflow: "hidden",
      height: bottom - top,
      "aria-hidden": "true"
   });

   const eventText = document.createElement("div");
   Object.assign(eventText.style, {
      boxSizing: "border-box",
      padding: "10px",
      background: "#fff",
      border: "2px solid #111",
      color: "#253247",
      font: "14px/1.4 system-ui, sans-serif",
      textAlign: "center",
      overflowWrap: "anywhere"
   });
   eventBox.append(eventText);

   function showEventBox(i) {
      const caption = monthEvents[rows[i].month] ?? "";
      const plotWidth = right - left;
      const plotHeight = bottom - top;
      const width = Math.min(plotWidth, Math.max(4 * step, caption ? 220 : 0));

      eventText.textContent = caption;
      eventText.style.minHeight = `${Math.min(3 * step, plotHeight)}px`;
      eventBox.setAttribute("width", width);

      const gap = 8;
      const leftOfGuide = x(i) - gap - width;
      const boxX = leftOfGuide >= left ? leftOfGuide : x(i) + gap;

      eventBox.setAttribute("x", Math.max(left, Math.min(boxX, right - width)));
      eventBox.setAttribute("y", top);
      eventBox.setAttribute("height", Math.min(plotHeight, eventText.offsetHeight));
      eventBox.setAttribute("visibility", "visible");
   }

   // Keep the whole month slice hoverable and clickable.
   rows.forEach((row, i) => {
      const start = i === 0 ? left : x(i) - step / 2;
      const end = i === rows.length - 1 ? right : x(i) + step / 2;
      const target = svg("rect", {
         x: start,
         y: top,
         width: Math.max(1, end - start),
         height: bottom - top,
         fill: "transparent",
         cursor: "pointer"
      });

      target.addEventListener("pointerenter", () => {
         showReadout(i);
         showEventBox(i);
      });
      target.addEventListener("click", () => openMonth(i));
   });

   chart.append(eventBox);
   chart.onpointerleave = () => {
      eventBox.setAttribute("visibility", "hidden");
      showReadout(selectedIndex);
   };
   showReadout(selectedIndex);
}

function openMonth(index) {
   selectedIndex = index;
   monthSelect.value = String(index);

   const row = rows[index];
   $("month-heading").textContent = monthLabel(row.month);
   $("month-count").textContent = `${number.format(row.post_count)} scored posts`;
   const body = $("emotion-rows");
   body.replaceChildren();

   const ranked = [...categories].sort((a, b) =>
      row[`${b}_count`] - row[`${a}_count`] || a.localeCompare(b)
   );

   for (const key of ranked) {
      const tr = body.insertRow();
      tr.insertCell().textContent = label(key);
      tr.insertCell().textContent = number.format(row[`${key}_count`]);

      const share = tr.insertCell();
      share.className = "share-cell";
      const pct = row[`${key}_pct`];
      share.textContent = `${pct.toFixed(2)}%`;
      const bar = document.createElement("div");
      bar.className = "share-bar";
      bar.style.width = `${pct}%`;
      bar.setAttribute("aria-hidden", "true");
      share.append(bar);
   }

   $("overview").hidden = true;
   $("details").hidden = false;
   $("month-heading").focus();
}

const topicFiles = {
   all: "./timeline_metrics_unfiltered.json",
   healthcare: "./topic_healthcare.json",
   lockdown: "./topic_lockdown.json",
   service_industry: "./topic_service_industry.json"
};

async function loadTopic(topic) {
   const path = topicFiles[topic];
   const response = await fetch(path);
   if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);

   const nextRows = await response.json();
   if (!Array.isArray(nextRows) || !nextRows.length) {
      throw new Error(`${path} has no monthly rows.`);
   }
   nextRows.sort((a, b) => a.month.localeCompare(b.month));

   const previousMonth = rows[selectedIndex]?.month;
   const previousEmotion = emotionSelect.value;

   rows = nextRows;
   categories = Object.keys(rows[0])
      .filter(key => key.endsWith("_pct"))
      .map(key => key.slice(0, -4));

   emotionSelect.replaceChildren(
      new Option("Featured: curiosity, annoyance, fear", "featured")
   );
   for (const [name, keys] of Object.entries(groups)) {
      const group = document.createElement("optgroup");
      group.label = name;
      for (const key of keys) {
         if (categories.includes(key)) group.append(new Option(label(key), key));
      }
      if (group.children.length) emotionSelect.append(group);
   }
   emotionSelect.value = categories.includes(previousEmotion)
      ? previousEmotion : "featured";

   monthSelect.replaceChildren();
   rows.forEach((row, i) => monthSelect.add(new Option(monthLabel(row.month), i)));
   selectedIndex = Math.max(0, rows.findIndex(row => row.month === previousMonth));
   monthSelect.value = String(selectedIndex);

   drawChart();
}

async function init() {
   const topicSelect = $("topic-select");
   const status = $("status");
   let activeTopic = "all";

   try {
      await loadTopic(activeTopic);
      $("overview").hidden = false;
      status.hidden = true;
   } catch (error) {
      status.textContent = error.message;
      return;
   }

   topicSelect.addEventListener("change", async () => {
      const nextTopic = topicSelect.value;
      topicSelect.disabled = true;
      status.hidden = false;
      status.textContent = "Loading topic…";

      try {
         await loadTopic(nextTopic);
         activeTopic = nextTopic;
         status.hidden = true;
      } catch (error) {
         topicSelect.value = activeTopic;
         status.textContent = error.message;
      } finally {
         topicSelect.disabled = false;
      }
   });

   emotionSelect.addEventListener("change", drawChart);
   monthSelect.addEventListener("change", () => {
      selectedIndex = Number(monthSelect.value);
      drawChart();
   });
   $("open-month").addEventListener("click", () => openMonth(Number(monthSelect.value)));
   $("back").addEventListener("click", () => {
      $("details").hidden = true;
      $("overview").hidden = false;
      drawChart();
      monthSelect.focus();
   });
}

init();
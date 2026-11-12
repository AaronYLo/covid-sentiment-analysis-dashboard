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

   // Leave the captions empty while testing the box.
   const monthEvents = {};
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
      border: "1px solid #a7b4c3",
      borderRadius: "8px",
      color: "#253247",
      font: "14px/1.4 system-ui, sans-serif",
      overflowWrap: "anywhere"
   });
   eventBox.append(eventText);

   function showEventBox(i, event) {
      const matrix = chart.getScreenCTM();
      if (!matrix) return;

      const cursor = new DOMPoint(event.clientX, event.clientY)
         .matrixTransform(matrix.inverse());

      // When several emotions are shown, anchor to the closest point.
      const pointX = x(i);
      const pointY = keys.map(key => y(rows[i][`${key}_pct`]))
         .reduce((nearest, current) =>
            Math.abs(current - cursor.y) < Math.abs(nearest - cursor.y)
               ? current : nearest
         );

      const caption = monthEvents[rows[i].month] ?? "";
      const width = Math.min(right - left, Math.max(4 * step, caption ? 220 : 0));
      eventText.textContent = caption;
      eventText.style.minHeight = `${Math.min(3 * step, bottom - top)}px`;
      eventBox.setAttribute("width", width);

      const height = Math.min(bottom - top, eventText.offsetHeight);
      const gap = 10;
      const preferredX = pointX - gap - width;
      const boxX = preferredX >= left ? preferredX : pointX + gap;

      eventBox.setAttribute("x", Math.max(left, Math.min(boxX, right - width)));
      eventBox.setAttribute("y", Math.max(top, Math.min(pointY - height / 2, bottom - height)));
      eventBox.setAttribute("height", height);
      eventBox.setAttribute("visibility", "visible");
   }

   // Transparent targets keep the whole vertical slice clickable.
   rows.forEach((row, i) => {
      const start = i === 0 ? left : x(i) - step / 2;
      const end = i === rows.length - 1 ? right : x(i) + step / 2;
      const target = svg("rect", {
         x: start, y: top, width: Math.max(1, end - start),
         height: bottom - top, fill: "transparent", cursor: "pointer"
      });

      target.addEventListener("pointerenter", event => {
         showReadout(i);
         showEventBox(i, event);
      });
      target.addEventListener("pointermove", event => showEventBox(i, event));
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

async function init() {
   try {
      const response = await fetch("./timeline_metrics_unfiltered.json");
      if (!response.ok) throw new Error(`Couldn't load JSON (${response.status}).`);
      rows = await response.json();
      if (!Array.isArray(rows) || !rows.length) throw new Error("The JSON has no monthly rows.");
      rows.sort((a, b) => a.month.localeCompare(b.month));

      categories = Object.keys(rows[0])
         .filter(key => key.endsWith("_pct"))
         .map(key => key.slice(0, -4));

      emotionSelect.add(new Option("Featured: curiosity, annoyance, fear", "featured"));
      for (const [name, keys] of Object.entries(groups)) {
         const group = document.createElement("optgroup");
         group.label = name;
         for (const key of keys) {
            if (categories.includes(key)) group.append(new Option(label(key), key));
         }
         emotionSelect.append(group);
      }

      rows.forEach((row, i) => monthSelect.add(new Option(monthLabel(row.month), i)));
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

      drawChart();
      $("overview").hidden = false;
      $("status").hidden = true;
   } catch (error) {
      $("status").textContent =
         `${error.message} Put the JSON beside index.html and open the site through localhost.`;
   }
}

init();
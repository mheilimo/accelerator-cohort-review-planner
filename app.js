"use strict";

const dimensions = [
  "Business Idea",
  "Offering",
  "Team",
  "Market",
  "Competitors",
  "Technology & IP",
  "Scalability",
  "Legal & Regulatory",
  "Exit",
  "Presentation",
  "Financial Critique",
  "Fundability",
];

const stages = [
  { value: "intake", label: "Intake baseline", hint: "Week 0 · shared starting point" },
  { value: "mid", label: "Mid-programme", hint: "Halfway · mentor focus" },
  { value: "demo", label: "Pre-demo-day", hint: "Final 2 weeks · evidence recheck" },
];

const rows = document.querySelector("#dimension-rows");
const cohortName = document.querySelector("#cohort-name");
const kickoffDate = document.querySelector("#kickoff-date");
const programmeWeeks = document.querySelector("#programme-weeks");
const stageCards = document.querySelector("#stage-cards");
const summaryGrid = document.querySelector("#summary-grid");
const agenda = document.querySelector("#agenda");
const statusMessage = document.querySelector("#status-message");

function escapeCsv(value) {
  const normalized = String(value ?? "").replaceAll('"', '""');
  return `"${normalized}"`;
}

function addDays(date, days) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.valueOf())) return "Set kickoff date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function stageDates() {
  const start = kickoffDate.value;
  const weeks = Number(programmeWeeks.value || 12);
  if (!start) return [null, null, null];
  return [addDays(start, 0), addDays(start, Math.round((weeks * 7) / 2)), addDays(start, (weeks - 2) * 7)];
}

function renderRows() {
  rows.innerHTML = dimensions
    .map(
      (dimension, index) => `
        <tr data-row="${index}">
          <td>${dimension}</td>
          <td>
            <select data-field="stage" aria-label="${dimension} review checkpoint">
              <option value="">Not assigned</option>
              ${stages.map((stage) => `<option value="${stage.value}">${stage.label}</option>`).join("")}
            </select>
          </td>
          <td>
            <input data-field="owner" type="text" aria-label="${dimension} mentor or owner" placeholder="Name or role" />
          </td>
          <td>
            <input data-field="evidence" type="text" aria-label="${dimension} evidence or change" placeholder="What should be different or documented?" />
          </td>
        </tr>`,
    )
    .join("");
}

function collectRows() {
  return [...rows.querySelectorAll("tr")].map((row, index) => ({
    dimension: dimensions[index],
    stage: row.querySelector('[data-field="stage"]').value,
    owner: row.querySelector('[data-field="owner"]').value.trim(),
    evidence: row.querySelector('[data-field="evidence"]').value.trim(),
  }));
}

function renderStageCards() {
  const dates = stageDates();
  stageCards.innerHTML = stages
    .map(
      (stage, index) => `
        <article class="stage-card">
          <strong>${stage.label}</strong>
          <span>${stage.hint}<br />${formatDate(dates[index])}</span>
        </article>`,
    )
    .join("");
}

function agendaText(selected) {
  const name = cohortName.value.trim() || "Unnamed cohort";
  const dates = stageDates();
  const lines = [`# ${name} — cohort review cadence`, ""];
  stages.forEach((stage, index) => {
    lines.push(`## ${stage.label} — ${formatDate(dates[index])}`);
    const items = selected.filter((item) => item.stage === stage.value);
    if (!items.length) lines.push("- No focus dimensions assigned.");
    items.forEach((item) => {
      const owner = item.owner || "owner not assigned";
      const evidence = item.evidence || "define evidence request";
      lines.push(`- ${item.dimension}: ${evidence} (${owner})`);
    });
    lines.push("");
  });
  lines.push("This plan supports mentor and programme judgement; it does not score or select companies.");
  return lines.join("\n");
}

function renderOutput() {
  const selected = collectRows().filter((item) => item.stage);
  summaryGrid.innerHTML = stages
    .map((stage) => {
      const count = selected.filter((item) => item.stage === stage.value).length;
      return `<article class="summary-card"><strong>${stage.label}</strong><span>Assigned focus dimensions</span><b>${count}</b></article>`;
    })
    .join("");

  if (!selected.length) {
    agenda.innerHTML = '<div class="empty-state">Assign at least one dimension to build the review agenda.</div>';
    return;
  }

  agenda.innerHTML = stages
    .map((stage) => {
      const items = selected.filter((item) => item.stage === stage.value);
      if (!items.length) return "";
      return `
        <section class="agenda-section" data-stage="${stage.value}">
          <h3>${stage.label}</h3>
          <ul>
            ${items
              .map(
                (item) => `<li><strong>${item.dimension}</strong> — ${item.evidence || "Define the evidence request"} <span>(${item.owner || "owner not assigned"})</span></li>`,
              )
              .join("")}
          </ul>
        </section>`;
    })
    .join("");
}

function update() {
  renderStageCards();
  renderOutput();
}

function setRow(index, values) {
  const row = rows.querySelector(`[data-row="${index}"]`);
  row.querySelector('[data-field="stage"]').value = values.stage;
  row.querySelector('[data-field="owner"]').value = values.owner;
  row.querySelector('[data-field="evidence"]').value = values.evidence;
}

function clearWorksheet() {
  cohortName.value = "";
  kickoffDate.value = "";
  programmeWeeks.value = "12";
  rows.querySelectorAll("select").forEach((element) => {
    element.value = "";
  });
  rows.querySelectorAll("input").forEach((element) => {
    element.value = "";
  });
  statusMessage.textContent = "Worksheet cleared.";
  update();
}

function loadExample() {
  clearWorksheet();
  cohortName.value = "Northstar Cohort (fictional)";
  kickoffDate.value = "2026-09-07";
  programmeWeeks.value = "12";
  setRow(2, { stage: "intake", owner: "Lead coach", evidence: "Named founder roles and uncovered capability gaps" });
  setRow(3, { stage: "intake", owner: "Market mentor", evidence: "Customer interviews behind the initial segment choice" });
  setRow(5, { stage: "mid", owner: "Technical mentor", evidence: "IP ownership and the riskiest build assumption" });
  setRow(10, { stage: "mid", owner: "Finance mentor", evidence: "Runway, unit economics and assumptions that changed" });
  setRow(9, { stage: "demo", owner: "Pitch coach", evidence: "Claims in the deck match current operating evidence" });
  setRow(11, { stage: "demo", owner: "Programme lead", evidence: "Unresolved gaps before investor introductions" });
  statusMessage.textContent = "Loaded a completely fictional six-item example.";
  update();
}

async function copyAgenda() {
  const text = agendaText(collectRows().filter((item) => item.stage));
  await navigator.clipboard.writeText(text);
  statusMessage.textContent = "Agenda copied to clipboard.";
}

function downloadCsv() {
  const dates = stageDates();
  const stageDateMap = Object.fromEntries(stages.map((stage, index) => [stage.value, formatDate(dates[index])]));
  const header = ["cohort", "checkpoint", "review_date", "dimension", "mentor_owner", "evidence_or_change"];
  const selected = collectRows().filter((item) => item.stage);
  const data = selected.length ? selected : collectRows();
  const lines = [header.map(escapeCsv).join(",")];
  data.forEach((item) => {
    const stage = stages.find((candidate) => candidate.value === item.stage);
    lines.push(
      [
        cohortName.value.trim(),
        stage?.label || "Not assigned",
        stageDateMap[item.stage] || "",
        item.dimension,
        item.owner,
        item.evidence,
      ]
        .map(escapeCsv)
        .join(","),
    );
  });
  const blob = new Blob([`${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "accelerator-cohort-review-cadence.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  statusMessage.textContent = `Downloaded ${data.length} review row${data.length === 1 ? "" : "s"}.`;
}

renderRows();
update();

document.querySelector("#load-example").addEventListener("click", loadExample);
document.querySelector("#clear").addEventListener("click", clearWorksheet);
document.querySelector("#copy-agenda").addEventListener("click", copyAgenda);
document.querySelector("#download-csv").addEventListener("click", downloadCsv);
cohortName.addEventListener("input", update);
kickoffDate.addEventListener("input", update);
programmeWeeks.addEventListener("change", update);
rows.addEventListener("input", update);
rows.addEventListener("change", update);

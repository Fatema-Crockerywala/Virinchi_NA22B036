(() => {
  const storageKey = "campus-stores.shift.v2";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
      collectors: [
        ["Isha Rao", "Filed this request"],
        ["Kabir Sen", "Named by Isha Rao in the desk book, Friday 3:20 pm"],
      ],
      collectFrom: 0,
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
      collectors: [["Tara Shah", "Filed this request"]],
      collectFrom: 0,
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
      collectors: [["Dev Menon", "Filed this request"]],
      collectFrom: 2,
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      short: "Fri 3:45 pm",
      label: "Pickup",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
      todo: "Issue the Film Society kit to Kabir.",
    },
    {
      time: "Friday · 7:30 pm",
      short: "Fri 7:30 pm",
      label: "Partial return",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
      todo: "Take Kabir’s return and record who has the adapter.",
    },
    {
      time: "Saturday · 9:00 am",
      short: "Sat 9:00 am",
      label: "Morning handover",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
      todo: "Receive the adapter from Leela and close the kit.",
    },
  ];
  const clockHours = [15.75, 19.5, 33];
  const dueHours = {
    "Fri 8 pm": 20,
    "Sat 9 am": 33,
    "Sat 10 am": 34,
    "Sat noon": 36,
  };
  const originalPages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const proposedPages = [["Counter", "package-open"], ...originalPages];
  const freshBook = (tab) => ({
    tab,
    phase: 0,
    selected: "",
    filter: "All items",
    person: "",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        holder: "Tara Shah",
        due: "Sat 10 am",
        back: false,
      },
    ],
    notes: [],
    editing: false,
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  const books = {
    original: freshBook("Requests"),
    proposed: freshBook("Counter"),
  };
  let view = "proposed";
  let s = books.proposed;
  let undoSnapshot = null;

  const isProposed = () => view === "proposed";
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const loanType = (l) => getAsset(l.asset).type;
  const onShelf = (type) =>
    assets.filter((a) => a.type === type && !a.repair && !out(a.id));
  const isOverdue = (l) => !l.back && clockHours[s.phase] > dueHours[l.due];
  const deadline = (l) => dueHours[l.promised || l.due];
  const nextSlip = () => Math.max(...s.loans.map((l) => l.num)) + 1;
  const canCollect = (r, person) => r.collectors.some(([n]) => n === person);
  const unissued = (r) =>
    r.items.filter(
      (type) => !s.loans.some((l) => l.req === r.id && loanType(l) === type),
    );
  const kitLoans = (r) => s.loans.filter((l) => l.req === r.id);
  const kitBack = (r) => kitLoans(r).filter((l) => l.back).length;
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    '</small></div><div class="rowend">' +
    right +
    "</div></div>";
  const badge = (t, kind = false) =>
    '<span class="tag' +
    (kind === true ? " good" : kind ? " " + kind : "") +
    '">' +
    esc(t) +
    "</span>";
  const slipBadge = (l) => {
    if (isOverdue(l)) return badge("Overdue since " + l.due, "bad");
    if (l.promised) return badge("Promised " + l.promised, "warn");
    return badge("Due " + l.due);
  };

  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        r.id +
        " · Approved</small><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        "</p><p><b>Return by</b> " +
        esc(r.due) +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items.map((x) => "<li>" + esc(x) + "</li>").join("") +
        "</ul><p>" +
        esc(r.note) +
        "</p>" +
        (isProposed()
          ? "<p><b>Can collect</b> " +
            r.collectors.map(([n]) => esc(n)).join(", ") +
            "</p>"
          : "") +
        "</div>";
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club,
            (isProposed() ? kitBadge(r) : "") +
              btn("View form", "request", r.id),
          ),
        )
        .join("");
    return html;
  }
  function kitBadge(r) {
    const issued = kitLoans(r).length;
    if (!issued) return badge("Not issued");
    const back = kitBack(r);
    if (back === r.items.length) return badge("Complete", true);
    return badge(back + " of " + r.items.length + " back", back ? "warn" : "");
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of assets) {
      const loan = out(a.id);
      const status = a.repair ? "In repair" : loan ? "On loan" : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model +
          " · " +
          a.bin +
          (isProposed() && loan ? " · With " + loan.holder : ""),
        badge(status, status === "On shelf"),
      );
    }
    return html;
  }
  function issueSlipForm(html) {
    const available = assets.filter((a) => !a.repair && !out(a.id));
    const select = (label, key, options) =>
      "<label><span>" +
      label +
      '</span><select name="' +
      key +
      '" required><option value="">Select…</option>' +
      opts(options) +
      "</select></label>";
    return (
      html +
      '<form data-issue><div class="form">' +
      select(
        "Approved request",
        "req",
        requests.map((r) => [r.id, r.id + " · " + r.club]),
      ) +
      select(
        "Unit leaving the desk",
        "asset",
        available.map((a) => [a.id, a.id + " · " + a.type]),
      ) +
      select(
        "Collected by",
        "who",
        people.map((p) => [p, p]),
      ) +
      select(
        "Return by",
        "due",
        Object.keys(dueHours).map((d) => [d, d]),
      ) +
      '</div><button type="submit" class="primary">Save issue slip</button></form>'
    );
  }
  function register() {
    const proposed = isProposed();
    let html = head(
      "Loan register",
      proposed
        ? "One slip per physical unit · shows who has it now"
        : "One slip per physical unit",
      proposed
        ? ""
        : s.editing
          ? btn("Cancel", "cancel")
          : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing && !proposed) return issueSlipForm(html);
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) {
      if (!proposed) {
        html += row(
          "L-" + l.num + " · " + l.asset,
          l.req + " · " + l.who + " · Due " + l.due,
          l.back
            ? badge("Returned")
            : btn("Record return", "return", String(l.num)),
        );
        continue;
      }
      html += row(
        "L-" + l.num + " · " + l.asset + " · " + loanType(l),
        l.back
          ? l.req +
              " · Returned by " +
              l.returnedBy +
              (l.tagChecked ? " · Tag checked" : "")
          : l.req +
              " · Issued to " +
              l.who +
              " · With " +
              l.holder +
              " · Due " +
              l.due,
        l.back
          ? badge("Returned", true)
          : slipBadge(l) + btn("Open at counter", "person", l.holder),
      );
    }
    return html;
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([
        shifts[n.phase].time,
        n.author || "Counter handover",
        n.text,
      ]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }

  /* Proposed desk: the counter starts from the person and follows the unit. */
  function issueCard(r, person, missing) {
    const authority = r.collectors.find(([n]) => n === person)[1];
    if (s.phase < r.collectFrom)
      return `<section class="card"><small>${r.id} · ${esc(r.club)}</small>
        <h3>${esc(r.event)}</h3><p>${esc(r.note)} Nothing to issue yet.</p></section>`;
    const lines = missing
      .map((type, i) => {
        const units = onShelf(type);
        const repair = assets.filter((a) => a.type === type && a.repair);
        return `<div class="line">
          <label class="check"><input type="checkbox" name="take" value="${i}" ${units.length ? "checked" : "disabled"} /><span>${esc(type)}</span></label>
          <div><select name="unit-${i}" aria-label="Unit for ${esc(type)}" ${units.length ? "" : "disabled"}>
            ${opts(units.map((a) => [a.id, a.id + " · " + a.model + " · Bin " + a.bin])) || '<option value="">None on shelf</option>'}
          </select>${repair.length ? `<small>${repair.map((a) => a.id).join(", ")} is in the workshop</small>` : ""}</div>
        </div>`;
      })
      .join("");
    return `<form class="card" data-kit-issue data-req="${r.id}">
      <small>${r.id} · ${esc(r.club)} · Return by ${esc(r.due)}</small>
      <h3>Issue ${esc(r.event.toLowerCase())} kit</h3>
      <p class="callout">${esc(r.note)}</p>
      <p class="authority"><b>${esc(person)} can collect.</b> ${esc(authority)}.</p>
      ${lines}
      <p class="formerror" role="alert" hidden></p>
      <button type="submit" class="primary">Issue checked units to ${esc(person)}</button>
    </form>`;
  }
  function returnCard(r, person, slips) {
    const promises = Object.keys(dueHours).filter(
      (d) => dueHours[d] > clockHours[s.phase],
    );
    const lines = slips
      .map(
        (l) => `<fieldset class="unit">
        <legend>${l.asset} · ${esc(loanType(l))} <small>L-${l.num} · Bin ${esc(getAsset(l.asset).bin)}</small></legend>
        <div class="choices">
          <label class="choice"><input type="radio" name="state-${l.num}" value="back" data-state required /><span>Back at the counter</span></label>
          <label class="choice"><input type="radio" name="state-${l.num}" value="out" data-state /><span>Still out</span></label>
        </div>
        <div class="form outfields" hidden>
          <label><span>Who has it now?</span><select name="holder-${l.num}" disabled><option value="">Select…</option>${opts(people.map((p) => [p, p]))}</select></label>
          <label><span>Promised back</span><select name="promise-${l.num}" disabled><option value="">Select…</option>${opts(promises.map((d) => [d, d]))}</select></label>
        </div>
      </fieldset>`,
      )
      .join("");
    return `<form class="card" data-kit-return data-req="${r.id}">
      <small>${r.id} · ${esc(r.club)} · Return by ${esc(r.due)}</small>
      <h3>Take return from ${esc(person)}</h3>
      <p>Account for every unit before this person leaves.</p>
      ${lines}
      <button type="submit" class="primary">Save return and handover</button>
    </form>`;
  }
  function receiveCard(l, person) {
    const r = getReq(l.req);
    const type = loanType(l);
    return `<form class="card urgent" data-receive data-num="${l.num}">
      <small>L-${l.num} · ${r.id} · ${esc(r.club)}</small>
      <h3>${esc(person)} is bringing back ${esc(type)}</h3>
      <dl class="facts">
        <div><dt>Slip expects</dt><dd>${l.asset}</dd></div>
        <div><dt>Issued to</dt><dd>${esc(l.who)}</dd></div>
        <div><dt>Status</dt><dd>${slipBadge(l)}</dd></div>
        <div><dt>Promised</dt><dd>${esc(l.promised)}</dd></div>
      </dl>
      <label class="tagcheck"><span>Tag on the unit in hand</span>
        <select name="tag" required><option value="">Read the tag…</option>${opts(assets.filter((a) => a.type === type).map((a) => [a.id, a.id + " · " + a.model]))}</select>
      </label>
      <p class="formerror" role="alert" hidden></p>
      <button type="submit" class="primary">Confirm tag and close slip</button>
    </form>`;
  }
  function personPanel(person) {
    const cards = [];
    const held = s.loans.filter((l) => !l.back && l.holder === person);
    for (const l of held.filter((x) => x.promised))
      cards.push(receiveCard(l, person));
    for (const r of requests) {
      const slips = held.filter((l) => l.req === r.id && !l.promised);
      if (slips.length) cards.push(returnCard(r, person, slips));
    }
    for (const r of requests) {
      if (!canCollect(r, person)) continue;
      const missing = unissued(r);
      if (missing.length) cards.push(issueCard(r, person, missing));
    }
    for (const l of s.loans.filter(
      (x) => !x.back && x.who === person && x.holder !== person,
    ))
      cards.push(`<section class="card"><small>L-${l.num} · ${l.req}</small>
        <h3>${l.asset} is with ${esc(l.holder)}</h3>
        <p>Issued to ${esc(person)}, now recorded with ${esc(l.holder)}. Promised for ${esc(l.promised)}.</p></section>`);
    return (
      cards.join("") ||
      `<p class="empty">Nothing is waiting for ${esc(person)} right now.</p>`
    );
  }
  function counter() {
    let html = head("Counter", "Start with the person in front of you");
    html += `<div class="people" role="group" aria-label="Person at the counter">${people
      .map(
        (p) =>
          `<button type="button" data-action="person" data-val="${esc(p)}" aria-pressed="${s.person === p}">${esc(p)}</button>`,
      )
      .join("")}</div>`;
    html += s.person
      ? personPanel(s.person)
      : '<p class="empty">Choose who has walked up to see what to issue, take back, or receive.</p>';
    const open = s.loans
      .filter((l) => !l.back)
      .sort((a, b) => deadline(a) - deadline(b));
    html += `<div class="board"><h3>Still out <span>${open.length}</span></h3>`;
    if (!open.length) html += "<p>Every unit is back on the shelf.</p>";
    for (const l of open)
      html += row(
        l.asset + " · " + loanType(l),
        "L-" +
          l.num +
          " · " +
          getReq(l.req).club +
          " · With " +
          l.holder +
          (l.holder === l.who ? "" : " (issued to " + l.who + ")"),
        slipBadge(l) +
          (l.holder === s.person ? "" : btn("Serve", "person", l.holder)),
      );
    return html + "</div>";
  }
  const screens = {
    Counter: counter,
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function stageDone(i) {
    const r = requests[0];
    const loans = kitLoans(r);
    if (i === 0) return !unissued(r).length;
    if (i === 1)
      return (
        !unissued(r).length &&
        loans.some((l) => l.back) &&
        loans.every((l) => l.back || l.promised)
      );
    return !unissued(r).length && loans.every((l) => l.back);
  }
  function paintSteps() {
    q("[data-steps]").innerHTML = shifts
      .map((p, i) => {
        const done = isProposed() && stageDone(i);
        const state = done ? "done" : i === s.phase ? "now" : "";
        return `<li class="${state}" ${i === s.phase ? 'aria-current="step"' : ""}><i aria-hidden="true">${done ? "✓" : i + 1}</i><span><b>${p.label}</b><small>${p.short}</small></span></li>`;
      })
      .join("");
    const todo = q("[data-todo]");
    todo.hidden = !isProposed();
    if (isProposed())
      todo.textContent = stageDone(s.phase)
        ? "Done at this counter."
        : "Next: " + shifts[s.phase].todo;
  }
  function paint() {
    const active = document.activeElement;
    const focus =
      active && root.contains(active) && active.dataset.action
        ? [active.dataset.action, active.dataset.val]
        : null;
    root.dataset.view = view;
    root.querySelectorAll("[data-views] button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.val === view));
    });
    const notes = view === "notes";
    q("[data-notes]").hidden = !notes;
    for (const selector of [".clock", ".steps", ".shift", ".shell", ".statusbar"])
      q(selector).hidden = notes;
    if (notes) return;
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    paintSteps();
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = (isProposed() ? proposedPages : originalPages)
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;
    q('[data-action="undo"]').hidden = !(isProposed() && undoSnapshot);
    if (focus) {
      const selector =
        '[data-action="' +
        CSS.escape(focus[0]) +
        '"]' +
        (focus[1] === undefined
          ? ""
          : '[data-val="' + CSS.escape(focus[1]) + '"]');
      const again = q(selector);
      if (again && !again.hidden) again.focus();
    }
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ version: 2, view, ...books }),
      );
    } catch {
      if (view !== "notes")
        q("[data-status]").textContent +=
          " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  const checkpoint = () => {
    undoSnapshot = JSON.stringify(s);
  };
  function useBook(next) {
    view = next;
    if (next !== "notes") s = books[next];
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "view":
        useBook(v);
        break;
      case "restart":
        books[view] = freshBook(isProposed() ? "Counter" : "Requests");
        s = books[view];
        undoSnapshot = null;
        break;
      case "undo":
        if (!undoSnapshot) return;
        s = books.proposed = JSON.parse(undoSnapshot);
        undoSnapshot = null;
        s.notice = "Last counter action undone.";
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.person = "";
        undoSnapshot = null;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        break;
      case "person":
        s.person = v;
        s.tab = "Counter";
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        l.back = true;
        s.notice = l.asset + " returned to stock. Slip L-" + l.num + " closed.";
        break;
      }
      default:
        return;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
    if (e.target.matches("[data-state]")) {
      const fields = e.target.closest("fieldset").querySelector(".outfields");
      const stillOut = e.target.value === "out";
      fields.hidden = !stillOut;
      fields.querySelectorAll("select").forEach((select) => {
        select.disabled = !stillOut;
        select.required = stillOut;
      });
    }
  });
  const showFormError = (f, text) => {
    const error = f.querySelector(".formerror");
    error.textContent = text;
    error.hidden = false;
  };
  function issueKit(f, form) {
    const r = getReq(f.dataset.req);
    const person = s.person;
    if (!r || !canCollect(r, person) || s.phase < r.collectFrom) return;
    const missing = unissued(r);
    const chosen = form
      .getAll("take")
      .map((i) => [missing[Number(i)], form.get("unit-" + i)]);
    if (!chosen.length) {
      showFormError(f, "Check at least one unit to issue.");
      return;
    }
    if (
      chosen.some(([type, id]) => !onShelf(type).some((a) => a.id === id))
    ) {
      showFormError(f, "One of those units is no longer on the shelf.");
      return;
    }
    checkpoint();
    for (const [, asset] of chosen)
      s.loans.push({
        num: nextSlip(),
        req: r.id,
        asset,
        who: person,
        holder: person,
        due: r.due,
        back: false,
      });
    commit(
      "Issued " +
        chosen.map(([, id]) => id).join(", ") +
        " to " +
        person +
        ". Return by " +
        r.due +
        ".",
    );
  }
  function returnKit(f, form) {
    const r = getReq(f.dataset.req);
    const person = s.person;
    const slips = s.loans.filter(
      (l) => l.req === r.id && !l.back && l.holder === person && !l.promised,
    );
    checkpoint();
    const summary = [];
    for (const l of slips) {
      if (form.get("state-" + l.num) === "back") {
        l.back = true;
        l.returnedBy = person;
        summary.push(l.asset + " returned");
        continue;
      }
      l.holder = form.get("holder-" + l.num);
      l.promised = form.get("promise-" + l.num);
      summary.push(
        l.asset + " with " + l.holder + " until " + l.promised,
      );
      s.notes.push({
        phase: s.phase,
        author: "Desk record · L-" + l.num,
        text:
          l.asset +
          " (" +
          loanType(l) +
          ") from " +
          r.id +
          " is still out. " +
          person +
          " reports it is with " +
          l.holder +
          ", promised for " +
          l.promised +
          ".",
      });
    }
    commit(summary.join(". ") + ".");
  }
  function receiveUnit(f, form) {
    const l = s.loans.find((x) => x.num === Number(f.dataset.num));
    if (!l || l.back) return;
    const tag = form.get("tag");
    if (tag !== l.asset) {
      const loan = out(tag);
      showFormError(
        f,
        tag +
          (loan
            ? " is on slip L-" + loan.num + ", held by " + loan.holder + "."
            : " is recorded on the shelf.") +
          " Slip L-" +
          l.num +
          " stays open. Ask " +
          l.holder +
          " where " +
          l.asset +
          " is.",
      );
      return;
    }
    checkpoint();
    l.back = true;
    l.returnedBy = l.holder;
    l.tagChecked = true;
    const r = getReq(l.req);
    const complete = kitBack(r) === r.items.length;
    s.notes.push({
      phase: s.phase,
      author: "Desk record · L-" + l.num,
      text:
        l.asset +
        " received from " +
        l.holder +
        ", tag checked. " +
        (complete ? r.club + " kit is complete." : "Slip closed."),
    });
    commit(
      "Slip L-" +
        l.num +
        " closed. " +
        (complete
          ? r.club + " kit is complete: " + r.items.length + " of " + r.items.length + " back."
          : l.asset + " is back on the shelf."),
    );
  }
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-kit-issue]")) return issueKit(f, form);
    if (f.matches("[data-kit-return]")) return returnKit(f, form);
    if (f.matches("[data-receive]")) return receiveUnit(f, form);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = nextSlip();
    s.loans.push({ num, req, asset, who, holder: who, due, back: false });
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function validBook(d, pages) {
    return (
      d &&
      pages.some(([n]) => n === d.tab) &&
      shifts[d.phase] &&
      (!d.selected || getReq(d.selected)) &&
      (!d.person || people.includes(d.person)) &&
      Array.isArray(d.notes) &&
      d.notes.every((n) => n && shifts[n.phase] && typeof n.text === "string") &&
      Array.isArray(d.loans) &&
      d.loans.length &&
      d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          getAsset(l.asset) &&
          Number.isInteger(l.num) &&
          dueHours[l.due] &&
          people.includes(l.holder) &&
          (!l.promised || dueHours[l.promised]),
      )
    );
  }
  function restore(d) {
    if (
      !d ||
      d.version !== 2 ||
      !["original", "proposed", "notes"].includes(d.view) ||
      !validBook(d.original, originalPages) ||
      !validBook(d.proposed, proposedPages)
    )
      return;
    books.original = { ...freshBook("Requests"), ...d.original };
    books.proposed = { ...freshBook("Counter"), ...d.proposed };
    s = books.proposed;
    useBook(d.view);
    paint();
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();

/*
Project: Mohamed Abbas Pricing
Developed by: Mohamed Ahmed Abbas
Role: Front-End Development
Copyright (c) 2026 Mohamed Ahmed Abbas. All rights reserved.
*/
const price = p => /^\d/.test(p) ? p + J : p.replace(/(\d[\d,]*)$/, "$1" + J);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const num = s => parseInt(String(s).replace(/,/g, ""), 10) || 0;
const $ = id => document.getElementById(id);
const tabs = $("tabs"), main = $("main");
const picked = new Map(); // key -> {name, price}

D.forEach((s, i) => {
  const b = document.createElement("button");
  b.className = "tab"; b.role = "tab"; b.id = "t-" + s.id; b.textContent = s.t;
  b.setAttribute("aria-selected", i === 0); b.onclick = () => show(s.id, true);
  tabs.appendChild(b);
  let h = `<section class="panel" id="${s.id}" role="tabpanel" aria-labelledby="t-${s.id}" ${i ? "hidden" : ""}><h2>${s.t}</h2><p class="sub">${s.sub || s.en}</p>`;
  if (s.items) h += `<input class="search" type="search" placeholder="ابحث في خدمات هذا القسم" aria-label="بحث" data-s="${s.id}"><div class="list" id="l-${s.id}">${s.items.map((r, k) => `<div class="row rv" style="--i:${k}"><b>${esc(r[0])}</b><span class="price">${esc(price(r[1]))}</span></div>`).join("")}</div>`;
  if (s.pk) {
    if (s.items) h += `<h3>الباقات</h3>`;
    h += `<div class="grid">${s.pk.map((p, k) => `<article class="pkg rv ${p[3] ? "pop" : ""}" style="--i:${k}" data-k="${s.id}-${k}">${p[3] ? '<span class="tag">الأكثر طلبًا</span>' : ""}<h4>${esc(p[0])}</h4><div class="big">${esc(p[1].replace("+", ""))} <small>جنيه${p[1].includes("+") ? " · يبدأ من" : ""}</small></div><ul>${p[2].map(x => `<li>${esc(x)}</li>`).join("")}</ul><button class="add" aria-pressed="false" data-k="${s.id}-${k}">أضف لعرضي</button></article>`).join("")}</div>`;
  }
  if (s.note) h += `<p class="note rv">${s.note}</p>`;
  if (s.terms) h += `<div class="list terms rv" style="padding:16px 20px"><ol>${s.terms.map(x => `<li>${x}</li>`).join("")}</ol></div>`;
  main.insertAdjacentHTML("beforeend", h + "</section>");
});

/* stats + marquee */
const svc = D.flatMap(s => s.items || []), pkn = D.reduce((a, s) => a + (s.pk ? s.pk.length : 0), 0);
$("sv").dataset.n = svc.length; $("pk").dataset.n = pkn;
const mqHtml = svc.map(r => `<span>${esc(r[0])}</span>`).join("•");
$("mq").innerHTML = mqHtml + "•" + mqHtml;
const words = $("h1").textContent.split(" ");
$("h1").innerHTML = words.map((w, i) => `<span style="animation-delay:${i * 80}ms">${esc(w)}</span>`).join(" ");
document.querySelectorAll("[data-n]").forEach(el => {
  const to = +el.dataset.n, t0 = performance.now();
  const step = t => { const k = Math.min((t - t0) / 1200, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
});

/* scroll reveal */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), {threshold: .1});
const watch = root => root.querySelectorAll(".rv:not(.in)").forEach(el => io.observe(el));

/* tabs */
function show(id, scroll) {
  D.forEach(s => {
    $(s.id).hidden = s.id !== id;
    $("t-" + s.id).setAttribute("aria-selected", s.id === id);
  });
  watch($(id));
  $("t-" + id).scrollIntoView({inline: "center", block: "nearest"});
  try { history.replaceState(null, "", "#" + id); } catch (e) {}
  if (scroll) window.scrollTo({top: document.querySelector(".tabs").offsetTop, behavior: "smooth"});
}
const start = location.hash.slice(1);
show(D.some(s => s.id === start) ? start : D[0].id, false);
window.addEventListener("hashchange", () => { const h = location.hash.slice(1); if (D.some(s => s.id === h)) show(h, false); });

/* search */
main.addEventListener("input", e => {
  if (!e.target.dataset.s) return;
  const q = e.target.value.trim().toLowerCase();
  $("l-" + e.target.dataset.s).querySelectorAll(".row").forEach(r => { r.classList.toggle("hide", q && !r.textContent.toLowerCase().includes(q)); r.classList.add("in"); });
});

/* card tilt (pointer only) */
main.addEventListener("pointermove", e => {
  const c = e.target.closest(".pkg"); if (!c || e.pointerType !== "mouse") return;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  c.style.transform = `perspective(700px) rotateY(${-x * 6}deg) rotateX(${y * 6}deg) translateY(-4px)`;
});
main.addEventListener("pointerout", e => { const c = e.target.closest(".pkg"); if (c) c.style.transform = ""; });

/* quote builder */
const info = k => { const [id, i] = k.split("-"); const s = D.find(x => x.id === id), p = s.pk[+i]; return {name: p[0], price: p[1]}; };
main.addEventListener("click", e => {
  const b = e.target.closest(".add"); if (!b) return;
  const k = b.dataset.k, on = !picked.has(k);
  on ? picked.set(k, info(k)) : picked.delete(k);
  b.setAttribute("aria-pressed", on); b.textContent = on ? "تمت الإضافة ✓" : "أضف لعرضي";
  b.closest(".pkg").classList.toggle("sel", on);
  update();
});
function total() { let t = 0, plus = false; picked.forEach(p => { t += num(p.price); if (p.price.includes("+")) plus = true; }); return {t, plus}; }
function update() {
  const n = picked.size, {t, plus} = total();
  $("bar").classList.toggle("show", n > 0);
  $("bt").textContent = `${n} باقة · ${plus ? "يبدأ من " : ""}${t.toLocaleString("en-US")}${J}`;
}
const WA = "201080892215";
function summary() {
  const {t, plus} = total(), name = $("cn").value.trim(), note = $("cm").value.trim();
  return "طلب جديد من موقع الأسعار\n" + (name ? `الاسم: ${name}\n` : "") + "الطلب:\n" + [...picked.values()].map(p => `- ${p.name}: ${p.price.replace("+", "")}${J}${p.price.includes("+") ? " (يبدأ من)" : ""}`).join("\n") + `\nالإجمالي: ${plus ? "يبدأ من " : ""}${t.toLocaleString("en-US")}${J}` + (note ? `\nملاحظات: ${note}` : "");
}
const setWa = () => { $("wa").href = `https://wa.me/${WA}?text=${encodeURIComponent(summary())}`; };
["cn", "cm"].forEach(i => $(i).addEventListener("input", setWa));
$("open").onclick = () => {
  $("dl").innerHTML = [...picked.values()].map(p => `<li><span>${esc(p.name)}</span><b>${esc(p.price.replace("+", ""))}${J}</b></li>`).join("");
  const {t, plus} = total(); $("dt").textContent = `الإجمالي: ${plus ? "يبدأ من " : ""}${t.toLocaleString("en-US")}${J}`;
  $("copy").textContent = "انسخ الملخص"; setWa(); $("dlg").showModal();
};
$("close").onclick = () => $("dlg").close();
$("copy").onclick = async () => {
  try { await navigator.clipboard.writeText(summary()); $("copy").textContent = "تم النسخ ✓"; }
  catch (e) { $("copy").textContent = "النسخ غير متاح، حدد النص يدويًا"; }
};

/* Interactive robot: eyes and head follow the pointer; click, tap or a fast shake near it breaks it apart, then it springs back */
(function () {
  const bot = $("bot"); if (!bot) return;
  const parts = [...bot.querySelectorAll(".p")], look = bot.querySelector(".look"), say = $("say");
  const ph = $("ph"), pb = $("pb"), pl = $("pl"), pr = $("pr");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lines = ["أهلاً! أنا مساعد محمد 👋", "ضيف الباقات اللي تعجبك وابعت طلبك واتساب", "تصميم وموقع وذكاء اصطناعي في مكان واحد", "بتحب الشغل المتقن؟ جاي للمكان الصح 😄", "اضغط عليّا تاني!"];
  let busy = false, last = {x: 0, y: 0, t: 0}, n = 0, hideT;
  const clamp = v => Math.max(-1, Math.min(1, v));
  const rnd = (a, b) => (a + Math.random() * (b - a)) * (Math.random() < .5 ? -1 : 1);
  function talk(t) { say.textContent = t; say.classList.add("on"); clearTimeout(hideT); hideT = setTimeout(() => say.classList.remove("on"), 3200); }
  function track(x, y) {
    if (busy || reduce) return;
    const r = bot.getBoundingClientRect(), dx = clamp((x - (r.left + r.width / 2)) / 400), dy = clamp((y - (r.top + r.height * .35)) / 400);
    look.style.transform = `translate(${dx * 5}px,${dy * 4}px)`;
    ph.style.setProperty("--tx", dx * 5 + "px"); ph.style.setProperty("--tr", dx * 7 + "deg");
    pb.style.setProperty("--tx", dx * 2 + "px");
    pl.style.setProperty("--tr", dx * 10 + "deg"); pr.style.setProperty("--tr", dx * 10 + "deg");
  }
  function explode() {
    if (busy || reduce) { talk(lines[n++ % lines.length]); return; }
    busy = true; bot.classList.add("boom");
    parts.forEach(p => { p.style.setProperty("--dx", rnd(50, 130) + "px"); p.style.setProperty("--dy", rnd(40, 110) + "px"); p.style.setProperty("--rot", rnd(40, 160) + "deg"); p.style.setProperty("--tx", "0px"); p.style.setProperty("--tr", "0deg"); });
    look.style.transform = "translate(0,0)";
    talk(n % 2 ? "ااه! اتفككت 😵" : "استنى هجمّع نفسي!");
    setTimeout(() => {
      bot.classList.remove("boom");
      parts.forEach(p => { p.style.setProperty("--dx", "0px"); p.style.setProperty("--dy", "0px"); p.style.setProperty("--rot", "0deg"); });
      talk(lines[n++ % lines.length]);
      setTimeout(() => { busy = false; }, 1000);
    }, 1300);
  }
  addEventListener("pointermove", e => {
    track(e.clientX, e.clientY);
    const now = performance.now(), dt = now - last.t, d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
    if (!busy && dt > 0 && dt < 80 && d / dt > 2.6 && e.pointerType === "mouse") {
      const r = bot.getBoundingClientRect();
      if (e.clientX > r.left - 60 && e.clientX < r.right + 60 && e.clientY > r.top - 60 && e.clientY < r.bottom + 60) explode();
    }
    last = {x: e.clientX, y: e.clientY, t: now};
  }, {passive: true});
  bot.addEventListener("click", explode);
  setTimeout(() => talk(lines[0]), 1800);
})();

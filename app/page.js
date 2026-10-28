"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, ArrowLeftRight, Image as ImageIcon, Minimize2, FileArchive, UploadCloud,
  Download, Sun, Moon, SlidersHorizontal, X, Check, Wand2, Loader2, Presentation, Crop,
} from "lucide-react";

/* ---------- helpers ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (b) => (b > 1048576 ? (b / 1048576).toFixed(2) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL?.replace(/\/+$/, "");

const save = (blob, name) => {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const loadImg = (file) =>
  new Promise((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = URL.createObjectURL(file);
  });

const encode = (img, type, q, scale = 1) =>
  new Promise((res) => {
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const x = c.getContext("2d");
    x.imageSmoothingQuality = "high";
    x.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(res, type, q);
  });

const TOOLS = [
  { id: "generate", name: "Prompt to document", icon: FileText, blurb: "Describe it. Get a structured PDF, deck or Word file.", g: "from-[#ff5c8a] via-[#ff8a6b] to-[#ffb36b]", h: 300 },
  { id: "convert", name: "File converter", icon: ArrowLeftRight, blurb: "PDF, Word, PPT and images, in any direction.", g: "from-[#8b7cff] via-[#6aa6ff] to-[#58d6ff]", h: 230 },
  { id: "modify", name: "Image resizer", icon: Crop, blurb: "New ratio, new resolution, same sharpness.", g: "from-[#3ddbb0] via-[#3fb6c9] to-[#4d7cff]", h: 260 },
  { id: "image", name: "Image compressor", icon: ImageIcon, blurb: "Hit 500 KB exactly. JPG, PNG, WebP, SVG.", g: "from-[#ffb36b] via-[#ff7aa8] to-[#b46bff]", h: 300 },
  { id: "reduce", name: "Document size reducer", icon: FileArchive, blurb: "Shrink PDF, Word and PPT to a target size.", g: "from-[#58d6ff] via-[#8b7cff] to-[#ff5c8a]", h: 230 },
];

const ACCENTS = { Rose: "#ff5c8a", Violet: "#8b7cff", Mint: "#3ddbb0", Amber: "#ffb36b" };

/* ---------- primitives ---------- */
const Glass = ({ className = "", children }) => (
  <div className={`rounded-3xl border border-[var(--line)] bg-[var(--panel)] backdrop-blur-2xl ${className}`}>{children}</div>
);

const Btn = ({ children, className = "", ...p }) => (
  <motion.button whileTap={{ scale: 0.96 }} {...p}
    className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40 ${className}`}>
    {children}
  </motion.button>
);

const Primary = (p) => <Btn {...p} className={`bg-[var(--accent)] text-[#1a0b14] shadow-[0_8px_30px_-8px_var(--accent)] hover:brightness-110 ${p.className || ""}`} />;
const Ghost = (p) => <Btn {...p} className={`border border-[var(--line)] bg-[var(--panel)] text-[var(--fg)] hover:bg-[var(--line)] ${p.className || ""}`} />;

function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-full border border-[var(--line)] bg-[var(--panel)] p-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className="relative rounded-full px-4 py-1.5 text-sm font-medium">
          {value === o && <motion.span layoutId={"seg" + options.join()} className="absolute inset-0 rounded-full bg-[var(--accent)]" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
          <span className={`relative ${value === o ? "text-[#1a0b14]" : "text-[var(--mut)]"}`}>{o}</span>
        </button>
      ))}
    </div>
  );
}

const Slider = ({ label, value, min, max, step = 1, onChange, suffix = "" }) => (
  <label className="block">
    <div className="mb-2 flex justify-between text-sm"><span className="text-[var(--mut)]">{label}</span><b className="tabular-nums">{value}{suffix}</b></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="dm-range w-full" />
  </label>
);

function Drop({ onFiles, accept, multiple, title, hint }) {
  const [over, setOver] = useState(false);
  const ref = useRef();
  return (
    <motion.div animate={{ scale: over ? 1.02 : 1 }} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && ref.current.click()} onClick={() => ref.current.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles([...e.dataTransfer.files]); }}
      className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-8 text-center transition ${over ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--line)] hover:border-[var(--accent)]/60"}`}>
      <input ref={ref} hidden type="file" accept={accept} multiple={multiple} onChange={(e) => onFiles([...e.target.files])} />
      <motion.div animate={{ y: over ? -6 : 0 }} className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent)]/15 text-[var(--accent)]"><UploadCloud /></motion.div>
      <div className="text-lg font-bold">{title}</div>
      <div className="text-sm text-[var(--mut)]">{hint}</div>
    </motion.div>
  );
}

const Stat = ({ k, v, accent }) => (
  <div className="rounded-2xl border border-[var(--line)] p-4">
    <div className="text-xs text-[var(--mut)]">{k}</div>
    <div className={`mt-1 text-xl font-extrabold tabular-nums ${accent ? "text-[var(--accent)]" : ""}`}>{v}</div>
  </div>
);

const Empty = ({ icon: I, text }) => (
  <div className="grid min-h-[320px] place-items-center text-center text-[var(--mut)]">
    <div><I className="mx-auto mb-3 opacity-60" size={36} /><p className="max-w-[26ch] text-sm">{text}</p></div>
  </div>
);

const Panel = ({ title, right, children }) => (
  <Glass className="p-6">
    <div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{title}</h3>{right}</div>
    {children}
  </Glass>
);

/* ---------- tool 1: prompt -> document ---------- */
function Generate({ toast, st }) {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("PDF");
  const [pages, setPages] = useState(6);
  const [tone, setTone] = useState("Professional");
  const [busy, setBusy] = useState(0);
  const [doc, setDoc] = useState(null);
  const [tab, setTab] = useState("Preview");

  const run = async () => {
    if (prompt.trim().length < 8) return toast("Describe your document in a few words first.");
    setDoc(null); setBusy(8);
    const t = setInterval(() => setBusy((b) => Math.min(92, b + 9)), 220);
    await sleep(900 + Math.random() * 700);
    clearInterval(t); setBusy(0);
    const topic = prompt.trim().replace(/^(make|create|write|generate)\s+(a|an|me)?\s*/i, "").slice(0, 60);
    const names = ["Overview", "The problem", "Our approach", "Key findings", "Timeline", "Risks and fixes", "Budget", "Next steps", "Appendix", "References", "Case study", "Summary"];
    setDoc({ topic, sections: names.slice(0, pages).map((n, i) => ({ n, body: `${tone} copy about “${topic}” — section ${i + 1} of ${pages}, with headings, key points and a closing takeaway.` })) });
    toast("Draft preview created. Document generation is not connected to the Python converter yet.");
    if (st.auto) exportDoc({ topic, sections: names.slice(0, pages).map((n) => ({ n, body: "" })) });
  };

  const exportDoc = (d = doc) => {
    const md = `# ${d.topic}\n\n` + d.sections.map((s) => `## ${s.n}\n${s.body}\n`).join("\n");
    format === "Word" ? save(new Blob([`<html><body><h1>${d.topic}</h1>${d.sections.map((s) => `<h2>${s.n}</h2><p>${s.body}</p>`).join("")}</body></html>`], { type: "application/msword" }), "documorph.doc") : save(new Blob([md], { type: "text/markdown" }), "documorph-outline.md");
    toast("Downloaded");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Describe your document">
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} placeholder="A 6-slide pitch for a rooftop solar startup in Gujarat…"
          className="w-full resize-none rounded-2xl border border-[var(--line)] bg-transparent p-4 text-sm outline-none focus:border-[var(--accent)]" />
        <div className="mt-5 space-y-5">
          <Segmented value={format} onChange={setFormat} options={["PDF", "PPT", "Word"]} />
          <Slider label="Length" value={pages} min={3} max={12} onChange={setPages} suffix=" sections" />
          <div className="flex flex-wrap gap-2">
            {["Professional", "Friendly", "Academic", "Bold"].map((t) => (
              <button key={t} onClick={() => setTone(t)} className={`rounded-full border px-3 py-1 text-xs font-medium ${tone === t ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]" : "border-[var(--line)] text-[var(--mut)]"}`}>{t}</button>
            ))}
          </div>
          <Primary onClick={run} disabled={!!busy} className="w-full">{busy ? <><Loader2 className="animate-spin" size={16} /> Writing {busy}%</> : <><Wand2 size={16} /> Generate {format}</>}</Primary>
        </div>
      </Panel>
      <Panel title="Preview" right={doc && <div className="flex gap-2"><Segmented value={tab} onChange={setTab} options={["Preview", "Outline"]} /><Ghost onClick={() => exportDoc()}><Download size={15} /> Download</Ghost></div>}>
        {!doc ? <Empty icon={Presentation} text="Your document appears here, section by section." /> : tab === "Outline" ? (
          <ol className="space-y-2 text-sm">{doc.sections.map((s, i) => <li key={i} className="rounded-xl border border-[var(--line)] px-4 py-3">{s.n}</li>)}</ol>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {doc.sections.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="aspect-[4/3] overflow-hidden rounded-2xl bg-white p-5 text-[#1d1220] shadow-xl">
                <div className="mb-2 h-1.5 w-10 rounded-full bg-[var(--accent)]" />
                <div className="text-sm font-extrabold">{i === 0 ? doc.topic : s.n}</div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#6d6275]">{s.body}</p>
              </motion.div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------- tool 2: converter ---------- */
const TARGETS = { docx: ["PDF"], txt: ["PDF"] };
function Convert({ toast }) {
  const [q, setQ] = useState([]);

  const add = (files) => {
    const supported = files.filter((f) => TARGETS[f.name.split(".").pop().toLowerCase()]);
    if (supported.length !== files.length) toast("The Python backend currently supports DOCX and TXT files only.");
    setQ((x) => [...x, ...supported.map((f) => ({ id: Math.random(), f, to: "PDF", p: 0, done: false, url: null }))]);
  };
  const patch = (id, o) => setQ((x) => x.map((i) => (i.id === id ? { ...i, ...o } : i)));

  const go = async (i) => {
    patch(i.id, { p: 10 });
    const f = new FormData();
    f.append("file", i.f);

    try {
      if (!PYTHON_BACKEND_URL) throw new Error("Set NEXT_PUBLIC_PYTHON_BACKEND_URL to your deployed Python backend URL.");
      const res = await fetch(`${PYTHON_BACKEND_URL}/convert`, { method: "POST", body: f });
      if (!res.ok) {
        let detail = "Conversion failed";
        try { detail = (await res.json()).detail || detail; } catch {}
        throw new Error(detail);
      }
      const blob = await res.blob();
      if (!blob.type.includes("pdf")) throw new Error("The Python backend did not return a PDF file.");
      const outputName = `${i.f.name.replace(/\.[^.]+$/, "")}.pdf`;
      const url = URL.createObjectURL(blob);
      save(blob, outputName);
      patch(i.id, { p: 100, done: true, url, outputName });
      toast(`${i.f.name} converted and downloaded`);
    } catch (err) {
      patch(i.id, { p: 0 });
      toast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Drop files"><Drop multiple onFiles={add} accept=".docx,.txt" title="Drop a Word or text file" hint="DOCX and TXT convert to PDF" /></Panel>
      <Panel title="Queue" right={q.length > 0 && <Ghost onClick={() => q.filter((i) => !i.done).forEach(go)}>Convert all</Ghost>}>
        {!q.length ? <Empty icon={ArrowLeftRight} text="Added files show up here with the formats they can become." /> : (
          <div className="space-y-3">
            <AnimatePresence>{q.map((i) => (
              <motion.div layout key={i.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 40 }} className="rounded-2xl border border-[var(--line)] p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{i.f.name}</div><div className="text-xs text-[var(--mut)]">{fmt(i.f.size)}</div></div>
                  <span className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm">PDF</span>
                  {i.done ? <a href={i.url} download={i.outputName}><Ghost><Check size={15} /> Download PDF</Ghost></a> : <Primary onClick={() => go(i)} disabled={i.p > 0}>Convert to PDF</Primary>}
                  <button aria-label="Remove" onClick={() => setQ((x) => x.filter((y) => y.id !== i.id))} className="text-[var(--mut)]"><X size={16} /></button>
                </div>
                {i.p > 0 && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]"><motion.div className="h-full bg-[var(--accent)]" animate={{ width: i.p + "%" }} /></div>}
              </motion.div>))}</AnimatePresence>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------- tool 3: image resizer ---------- */
const RATIOS = { Original: 0, "1:1": 1, "4:5": 0.8, "16:9": 16 / 9, "9:16": 9 / 16 };
function Modify({ toast }) {
  const [img, setImg] = useState(null);
  const [ratio, setRatio] = useState("Original");
  const [scale, setScale] = useState(100);
  const [ask, setAsk] = useState("");
  const cv = useRef();
  const dims = img && (() => { const r = RATIOS[ratio] || img.naturalWidth / img.naturalHeight; const w = Math.round((img.naturalWidth * scale) / 100); return { w, h: Math.round(w / r), r }; })();

  useEffect(() => {
    if (!img || !cv.current) return;
    const { w, h } = dims, c = cv.current, x = c.getContext("2d");
    c.width = w; c.height = h; x.imageSmoothingQuality = "high";
    const k = Math.max(w / img.naturalWidth, h / img.naturalHeight), sw = w / k, sh = h / k;
    x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Resize and reframe">
        {!img ? <Drop accept="image/*" onFiles={async ([f]) => f && setImg(await loadImg(f))} title="Drop an image" hint="JPG, PNG, WebP" /> : (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">{Object.keys(RATIOS).map((r) => <button key={r} onClick={() => setRatio(r)} className={`rounded-full border px-3 py-1 text-xs font-medium ${ratio === r ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]" : "border-[var(--line)] text-[var(--mut)]"}`}>{r}</button>)}</div>
            <Slider label="Resolution" value={scale} min={25} max={200} step={5} onChange={setScale} suffix="%" />
            <div className="grid grid-cols-2 gap-3"><Stat k="Output" v={`${dims.w}×${dims.h}`} /><Stat k="Source" v={`${img.naturalWidth}×${img.naturalHeight}`} /></div>
            <div className="flex gap-2"><input value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="Replace: the sky with sunset" className="min-w-0 flex-1 rounded-full border border-[var(--line)] bg-transparent px-4 text-sm outline-none focus:border-[var(--accent)]" />
              <Ghost onClick={() => toast(ask ? "AI image editing is not connected to the Python backend yet." : "Describe the image edit first.")}><Sparkles size={15} /></Ghost></div>
            <div className="flex gap-2"><Primary className="flex-1" onClick={() => cv.current.toBlob((b) => { save(b, "documorph.png"); toast("Saved as PNG"); })}><Download size={15} /> Download PNG</Primary><Ghost onClick={() => setImg(null)}>New image</Ghost></div>
          </div>
        )}
      </Panel>
      <Panel title="Canvas">{!img ? <Empty icon={Crop} text="Your reframed image renders live here." /> : <div className="grid min-h-[320px] place-items-center rounded-2xl bg-[repeating-conic-gradient(var(--line)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-4"><canvas ref={cv} className="max-h-[480px] max-w-full rounded-lg shadow-2xl" /></div>}</Panel>
    </div>
  );
}

/* ---------- tool 4: image compressor ---------- */
function CompressImage({ toast, st }) {
  const [file, setFile] = useState(null);
  const [img, setImg] = useState(null);
  const [mode, setMode] = useState("Quality");
  const [q, setQ] = useState(st.quality);
  const [kb, setKb] = useState(500);
  const [fm, setFm] = useState("WebP");
  const [out, setOut] = useState(null);
  const [cmp, setCmp] = useState(50);
  const svg = file?.type === "image/svg+xml";

  useEffect(() => {
    if (!file) return;
    let dead = false;
    (async () => {
      if (svg) { const t = (await file.text()).replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " "); const b = new Blob([t], { type: file.type }); return !dead && setOut({ b, url: URL.createObjectURL(b) }); }
      const i = img || (await loadImg(file)); if (!img) setImg(i);
      const type = fm === "WebP" ? "image/webp" : "image/jpeg";
      let b;
      if (mode === "Quality") b = await encode(i, type, q / 100);
      else {
        let lo = 0.05, hi = 0.98, s = 1;
        for (let r = 0; r < 4; r++) { b = await encode(i, type, lo, s); if (b.size <= kb * 1024) break; s *= 0.8; }
        for (let n = 0; n < 7; n++) { const m = (lo + hi) / 2, t = await encode(i, type, m, s); if (t.size <= kb * 1024) { b = t; lo = m; } else hi = m; }
      }
      if (!dead) setOut({ b, url: URL.createObjectURL(b) });
    })();
    return () => { dead = true; };
  }, [file, mode, q, kb, fm]);

  const saved = out ? Math.max(0, Math.round((1 - out.b.size / file.size) * 100)) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Compression">
        {!file ? <Drop accept="image/*" onFiles={([f]) => f && (setFile(f), setImg(null))} title="Drop an image" hint="JPG, PNG, WebP, SVG" /> : (
          <div className="space-y-5">
            {!svg && <><Segmented value={mode} onChange={setMode} options={["Quality", "Target size"]} />
              {mode === "Quality" ? <Slider label="Quality" value={q} min={5} max={100} onChange={setQ} suffix="%" /> : <Slider label="Reduce to" value={kb} min={20} max={Math.max(100, Math.round(file.size / 1024))} step={10} onChange={setKb} suffix=" KB" />}
              <Segmented value={fm} onChange={setFm} options={["WebP", "JPEG"]} /></>}
            {svg && <p className="text-sm text-[var(--mut)]">SVG is minified losslessly: comments and whitespace are removed.</p>}
            <div className="grid grid-cols-3 gap-3"><Stat k="Before" v={fmt(file.size)} /><Stat k="After" v={out ? fmt(out.b.size) : "…"} accent /><Stat k="Saved" v={saved + "%"} /></div>
            <div className="flex gap-2"><Primary className="flex-1" disabled={!out} onClick={() => { save(out.b, `compressed.${svg ? "svg" : fm === "WebP" ? "webp" : "jpg"}`); toast(`Saved ${saved}% smaller`); }}><Download size={15} /> Download</Primary><Ghost onClick={() => { setFile(null); setOut(null); }}>New image</Ghost></div>
          </div>
        )}
      </Panel>
      <Panel title="Before and after">
        {!out ? <Empty icon={ImageIcon} text="Drag the divider to compare the original with the result." /> : (
          <div className="relative mx-auto max-h-[480px] w-fit max-w-full select-none overflow-hidden rounded-2xl">
            <img src={out.url} alt="Compressed" className="block max-h-[480px] max-w-full" />
            <img src={URL.createObjectURL(file)} alt="Original" className="absolute inset-0 h-full w-full" style={{ clipPath: `inset(0 ${100 - cmp}% 0 0)` }} />
            <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: cmp + "%" }} />
            <input aria-label="Compare" type="range" min={0} max={100} value={cmp} onChange={(e) => setCmp(+e.target.value)} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ---------- tool 5: document size reducer ---------- */
function Reduce({ toast }) {
  const [f, setF] = useState(null);
  const [pct, setPct] = useState(40);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const Bar = ({ k, v }) => (<div><div className="mb-1 flex justify-between text-xs"><span className="text-[var(--mut)]">{k}</span><b>{v}%</b></div><div className="h-2 rounded-full bg-[var(--line)]"><motion.div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[#ffb36b]" animate={{ width: v + "%" }} /></div></div>);
  const m = { fidelity: Math.round(60 + pct * 0.4), text: Math.min(100, Math.round(78 + pct * 0.22)), color: Math.round(55 + pct * 0.45) };

  const run = () => toast("Document size reduction is not supported by the current Python backend yet.");

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Panel title="Target size">
        {!f ? <Drop accept=".pdf,.doc,.docx,.ppt,.pptx" onFiles={([x]) => x && (setF(x), setDone(false))} title="Drop a PDF, Word or PPT" hint="Up to 50 MB" /> : (
          <div className="space-y-5">
            <div className="truncate text-sm font-semibold">{f.name}</div>
            <Slider label="Keep this much of the original" value={pct} min={10} max={90} step={5} onChange={(v) => { setPct(v); setDone(false); }} suffix="%" />
            <div className="grid grid-cols-2 gap-3"><Stat k="Original" v={fmt(f.size)} /><Stat k="Target" v={fmt((f.size * pct) / 100)} accent /></div>
            <div className="flex gap-2"><Primary className="flex-1" onClick={run} disabled={busy}>{busy ? <><Loader2 className="animate-spin" size={16} /> Reducing</> : <><Minimize2 size={16} /> Reduce size</>}</Primary><Ghost onClick={() => setF(null)}>New file</Ghost></div>
          </div>
        )}
      </Panel>
      <Panel title="Quality metrics">
        {!f ? <Empty icon={FileArchive} text="See what you trade for every megabyte saved." /> : (
          <div className="space-y-5"><Bar k="Image fidelity" v={m.fidelity} /><Bar k="Text sharpness" v={m.text} /><Bar k="Colour accuracy" v={m.color} />
            <AnimatePresence>{done && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-2xl bg-[var(--accent)]/12 p-4 text-sm"><span><b>{fmt(f.size)}</b> to <b>{fmt((f.size * pct) / 100)}</b></span></motion.div>}</AnimatePresence></div>
        )}
      </Panel>
    </div>
  );
}

/* ---------- hero live demo ---------- */
function HeroCard() {
  const [n, setN] = useState(4200);
  useEffect(() => { const t = setInterval(() => setN((x) => (x <= 480 ? 4200 : Math.max(480, x - 120))), 60); return () => clearInterval(t); }, []);
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[420px]">
      {[["from-[#8b7cff] to-[#58d6ff]", -9, 0], ["from-[#3ddbb0] to-[#4d7cff]", 7, 20]].map(([g, r, y], i) => (
        <motion.div key={i} animate={{ y: [y, y - 10, y] }} transition={{ repeat: Infinity, duration: 5 + i, ease: "easeInOut" }} style={{ rotate: r }} className={`absolute inset-x-6 top-10 h-64 rounded-[2rem] bg-gradient-to-br ${g} opacity-70`} />
      ))}
      <Glass className="absolute inset-x-0 top-24 p-6 shadow-2xl">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent)] text-[#1a0b14]"><FileArchive size={20} /></div><div><div className="font-bold">Q3-report.pdf</div><div className="text-xs text-[var(--mut)]">Reducing to 480 KB</div></div></div>
        <div className="mt-6 text-5xl font-extrabold tabular-nums">{n >= 1000 ? (n / 1000).toFixed(1) + " MB" : n + " KB"}</div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: (n / 4200) * 100 + "%" }} /></div>
      </Glass>
    </div>
  );
}

/* ---------- page ---------- */
export default function Page() {
  const [dark, setDark] = useState(true);
  const [tool, setTool] = useState("convert");
  const [drawer, setDrawer] = useState(false);
  const [st, setSt] = useState({ accent: "Rose", quality: 80, auto: false });
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((m) => { const id = Math.random(); setToasts((t) => [...t, { id, m }]); setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200); }, []);
  const open = (id) => { setTool(id); document.getElementById("workbench")?.scrollIntoView({ behavior: "smooth" }); };
  const View = { generate: Generate, convert: Convert, modify: Modify, image: CompressImage, reduce: Reduce }[tool];
  const words = "Every file, reshaped in seconds.".split(" ");

  return (
    <div data-theme={dark ? "dark" : "light"} className="dm min-h-screen bg-[var(--bg)] text-[var(--fg)] antialiased font-sans" style={{ "--accent": ACCENTS[st.accent] }}>
      <style>{`
        .dm{--bg:#120d16;--panel:rgba(255,255,255,.06);--line:rgba(255,255,255,.11);--fg:#f6f1f7;--mut:#a99fb3}
        .dm[data-theme=light]{--bg:#faf5f8;--panel:rgba(255,255,255,.7);--line:rgba(40,15,40,.11);--fg:#1d1220;--mut:#6d6275}
        .dm .aurora{background:radial-gradient(40% 40% at 15% 10%,var(--accent) 0,transparent 70%),radial-gradient(35% 35% at 85% 20%,#8b7cff 0,transparent 70%),radial-gradient(40% 40% at 60% 90%,#ffb36b 0,transparent 70%);opacity:.22;filter:blur(60px);animation:drift 18s ease-in-out infinite alternate}
        @keyframes drift{to{transform:translate3d(3%,4%,0) scale(1.1)}}
        .dm-range{-webkit-appearance:none;appearance:none;height:6px;border-radius:9px;background:var(--line)}
        .dm-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 5px color-mix(in srgb,var(--accent) 25%,transparent);cursor:grab}
        .dm-range::-moz-range-thumb{width:20px;height:20px;border:0;border-radius:50%;background:var(--accent);cursor:grab}
        @media (prefers-reduced-motion:reduce){.dm *{animation:none!important}}
      `}</style>
      <div className="aurora pointer-events-none fixed inset-0" />

      {/* header */}
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <a href="#" className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[var(--accent)] text-[#1a0b14]"><Sparkles size={16} /></span>DocuMorph AI</a>
          <nav className="hidden gap-7 text-sm font-medium text-[var(--mut)] md:flex"><a href="#tools" className="hover:text-[var(--fg)]">Tools</a><a href="#workbench" className="hover:text-[var(--fg)]">Workbench</a></nav>
          <div className="flex items-center gap-2">
            <Ghost aria-label="Toggle theme" onClick={() => setDark(!dark)} className="!px-3">{dark ? <Sun size={16} /> : <Moon size={16} />}</Ghost>
            <Ghost aria-label="Settings" onClick={() => setDrawer(true)} className="!px-3"><SlidersHorizontal size={16} /></Ghost>
            <Primary onClick={() => open("convert")}>Start free</Primary>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-16 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div>
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
              {words.map((w, i) => <motion.span key={i} initial={{ opacity: 0, y: 40, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: 0.1 + i * 0.09, type: "spring", damping: 22 }} className="mr-[0.25em] inline-block">{w}</motion.span>)}
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg text-[var(--mut)]">Write documents from a prompt, convert between formats, resize images and shrink files to the exact size you need.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Primary onClick={() => open("convert")} className="!px-7 !py-3.5 !text-base">Open workbench</Primary><Ghost onClick={() => document.getElementById("tools")?.scrollIntoView({ behavior: "smooth" })} className="!px-7 !py-3.5 !text-base">See the tools</Ghost></div>
          </div>
          <HeroCard />
        </section>

        {/* masonry tool wall */}
        <section id="tools" className="mx-auto max-w-7xl px-5 py-12">
          <h2 className="mb-8 text-3xl font-extrabold tracking-tight">Five tools, one workbench</h2>
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {TOOLS.map((t) => (
              <motion.button key={t.id} onClick={() => open(t.id)} whileHover={{ y: -6 }} whileTap={{ scale: 0.98 }} style={{ minHeight: t.h }}
                className={`group relative mb-5 flex w-full break-inside-avoid flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br ${t.g} p-7 text-left text-[#1a0b14]`}>
                <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/25 blur-2xl transition group-hover:scale-125" />
                <t.icon size={30} className="relative" />
                <div className="relative"><div className="text-2xl font-extrabold leading-tight">{t.name}</div><p className="mt-2 max-w-[28ch] text-sm font-medium opacity-80">{t.blurb}</p></div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* workbench */}
        <section id="workbench" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16">
          <div className="mb-6 flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)} className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
                {tool === t.id && <motion.span layoutId="tooltab" className="absolute inset-0 rounded-full border border-[var(--accent)] bg-[var(--accent)]/15" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
                <t.icon size={16} className={`relative ${tool === t.id ? "text-[var(--accent)]" : "text-[var(--mut)]"}`} /><span className={`relative ${tool === t.id ? "" : "text-[var(--mut)]"}`}>{t.name}</span>
              </button>
            ))}
          </div>
          <AnimatePresence mode="wait"><motion.div key={tool} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}><View toast={toast} st={st} /></motion.div></AnimatePresence>
        </section>
      </main>

      <footer className="relative border-t border-[var(--line)] px-5 py-10 text-center text-sm text-[var(--mut)]">DocuMorph AI. DOCX and TXT conversion is handled by the Python backend.</footer>

      {/* settings drawer */}
      <AnimatePresence>{drawer && (<>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} className="fixed inset-0 z-50 bg-black/50" />
        <motion.aside initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed right-0 top-0 z-50 h-full w-[360px] max-w-full border-l border-[var(--line)] bg-[var(--bg)] p-6">
          <div className="mb-8 flex items-center justify-between"><h3 className="text-lg font-bold">Settings</h3><button aria-label="Close" onClick={() => setDrawer(false)}><X /></button></div>
          <div className="space-y-8">
            <div><div className="mb-3 text-sm text-[var(--mut)]">Accent colour</div><div className="flex gap-3">{Object.entries(ACCENTS).map(([k, c]) => <button key={k} aria-label={k} onClick={() => setSt({ ...st, accent: k })} style={{ background: c }} className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-[var(--bg)] ${st.accent === k ? "ring-2 ring-[var(--fg)]" : ""}`} />)}</div></div>
            <Slider label="Default image quality" value={st.quality} min={20} max={100} onChange={(v) => setSt({ ...st, quality: v })} suffix="%" />
            <label className="flex cursor-pointer items-center justify-between text-sm"><span>Download generated files automatically</span><input type="checkbox" checked={st.auto} onChange={(e) => setSt({ ...st, auto: e.target.checked })} className="h-5 w-5 accent-[var(--accent)]" /></label>
          </div>
        </motion.aside></>)}
      </AnimatePresence>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite">
        <AnimatePresence>{toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg)] px-5 py-3 text-sm font-medium shadow-2xl"><Check size={15} className="text-[var(--accent)]" />{t.m}</motion.div>))}
        </AnimatePresence>
      </div>
    </div>
  );
}

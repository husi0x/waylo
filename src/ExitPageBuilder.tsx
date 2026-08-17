import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronUp, Eye, Plus, Save, Trash2, Upload, X } from "lucide-react";
import {
  defaultExitTemplate,
  normalizeExitTemplate,
  type ExitTemplate,
} from "../exit-template.mjs";

type TemplateListItem = { id: string; name: string; usedBy: number; isDefault?: boolean };

const PALETTE_FIELDS: [keyof ExitTemplate["palette"], string][] = [
  ["bg", "Background"],
  ["card", "Card"],
  ["cardBorder", "Card border"],
  ["text", "Text"],
  ["sub", "Subtext"],
  ["accent", "Accent"],
  ["btnBg", "Button"],
  ["btnText", "Button text"],
  ["btnBorder", "Button border"],
];

function hexA(hex: string, opacityPercent: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, opacityPercent / 100)).toFixed(3)})`;
}

/** Live preview — mirrors renderExitTemplatePage output structure. */
export function TemplatePreview({ t, phone }: { t: ExitTemplate; phone?: boolean }) {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (t.background.photos.length < 2 || !t.background.slideshow) return;
    const timer = setInterval(
      () => setSlide((v) => (v + 1) % t.background.photos.length),
      Math.max(3, t.background.interval) * 1000,
    );
    return () => clearInterval(timer);
  }, [t.background.photos.length, t.background.slideshow, t.background.interval]);
  const hasPhotos = t.background.type === "photo" && t.background.photos.length > 0;
  const vars = {
    ["--xt-bg-color" as string]: t.palette.bg,
    ["--xt-card" as string]: hexA(t.palette.card, t.card.opacity),
    ["--xt-card-border" as string]: hexA(t.palette.cardBorder, Math.max(35, t.card.opacity)),
    ["--xt-text" as string]: t.palette.text,
    ["--xt-sub" as string]: t.palette.sub,
    ["--xt-accent" as string]: t.palette.accent,
    ["--xt-btn-bg" as string]: t.palette.btnBg,
    ["--xt-btn-text" as string]: t.palette.btnText,
    ["--xt-btn-border" as string]: t.palette.btnBorder,
    ["--xt-radius" as string]: t.palette.radius + "px",
  } as React.CSSProperties;
  return (
    <div className={"xt-preview-shell" + (phone ? " phone" : "")} style={vars}>
      {hasPhotos && (
        <div className="xt-bg">
          {t.background.photos.map((photo, index) => (
            <div
              key={photo}
              className={"xt-bg-img" + (index === slide ? " is-active" : "")}
              style={{ backgroundImage: `url(/exitmedia/${photo})`, filter: `blur(${t.background.blur}px) saturate(1.06)` }}
            />
          ))}
          <div className="xt-dim" style={{ background: `rgba(0,0,0,${(t.background.dim / 100).toFixed(2)})` }} />
        </div>
      )}
      <div className={"xt-card" + (t.card.visible ? " xt-card--boxed" : "")}>
        {t.badge.show && <div className="xt-badge">{t.badge.text}</div>}
        {t.heading && <div className="xt-title">{t.heading}</div>}
        {t.subtext && <div className="xt-sub">{t.subtext}</div>}
        <div className="xt-actions">
          {t.buttons.map((button) =>
            button.url ? (
              <a
                key={button.id}
                className={`xt-btn xt-btn--${button.style}`}
                href={button.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.preventDefault()}
              >
                {button.label}
              </a>
            ) : (
              <button key={button.id} type="button" className={`xt-btn xt-btn--${button.style}`}>
                {button.label}
              </button>
            ),
          )}
        </div>
        <p className="xt-status">
          {t.auto
            ? `Opening automatically in ${t.countdown} ${t.countdown === 1 ? "second" : "seconds"}…`
            : ""}
        </p>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="colorfield">
      <span>{label}</span>
      <span className="colorline2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <code>{value}</code>
      </span>
    </label>
  );
}

function Section({
  title,
  hint,
  children,
  defaultOpen = true,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="buildersection">
      <button type="button" className="secthead" onClick={() => setOpen((v) => !v)}>
        <span>
          <b>{title}</b>
          {hint && <small>{hint}</small>}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="sectbody">{children}</div>}
    </div>
  );
}

export function ExitPageBuilder({ notify }: { notify: (s: string) => void }) {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [current, setCurrent] = useState<ExitTemplate | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadList = React.useCallback(async () => {
    const res = await fetch("/api/exit-templates");
    if (res.ok) setTemplates(await res.json());
  }, []);
  useEffect(() => {
    void loadList();
  }, [loadList]);

  const patch = (changes: Partial<ExitTemplate>) => {
    setCurrent((prev) => (prev ? { ...prev, ...changes } : prev));
    setDirty(true);
  };
  const patchPalette = (key: keyof ExitTemplate["palette"], value: string | number) => {
    setCurrent((prev) => (prev ? { ...prev, palette: { ...prev.palette, [key]: value } } : prev));
    setDirty(true);
  };

  const openTemplate = async (id: string) => {
    const stateRes = await fetch("/api/state");
    if (!stateRes.ok) return;
    const state = await stateRes.json();
    const found = (state.exitTemplates || []).find((t: ExitTemplate) => t.id === id);
    if (found) {
      setCurrent(normalizeExitTemplate(found));
      setDirty(false);
    }
  };

  const createTemplate = () => {
    const t = defaultExitTemplate();
    t.id = "";
    t.name = "New template";
    setCurrent(t);
    setDirty(true);
  };

  const saveTemplate = async () => {
    if (!current) return;
    const body = JSON.stringify(current);
    const res = await fetch(
      current.id ? "/api/exit-templates/" + current.id : "/api/exit-templates",
      { method: current.id ? "PUT" : "POST", headers: { "content-type": "application/json" }, body },
    );
    if (!res.ok) return notify((await res.json().catch(() => ({}))).error || "Could not save template");
    const saved: ExitTemplate = await res.json();
    setCurrent(normalizeExitTemplate(saved));
    setDirty(false);
    await loadList();
    notify(current.id && current.id === "default" ? "Default template updated" : "Template saved");
  };

  const deleteTemplate = async (id: string) => {
    const res = await fetch("/api/exit-templates/" + id, { method: "DELETE" });
    if (!res.ok) return notify((await res.json().catch(() => ({}))).error || "Could not delete");
    if (current?.id === id) setCurrent(null);
    await loadList();
    notify("Template deleted");
  };

  const duplicateTemplate = async (source: ExitTemplate) => {
    const copy = normalizeExitTemplate({ ...source, id: "" });
    copy.name = source.name + " copy";
    setCurrent(copy);
    setDirty(true);
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        const res = await fetch("/api/exit-templates/photos", {
          method: "POST",
          headers: { "content-type": file.type },
          body: file,
        });
        if (!res.ok) {
          notify((await res.json().catch(() => ({}))).error || "Upload failed");
          continue;
        }
        added.push((await res.json()).name);
      }
      if (added.length && current) {
        patch({
          background: {
            ...current.background,
            type: "photo",
            photos: [...current.background.photos, ...added].slice(0, 6),
          },
        });
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!current) {
    return (
      <section className="content exitbuilder-workspace">
        <div className="pagebar">
          <div>
            <h2>Exit page builder</h2>
            <p>Design exit page templates: content, buttons, colors and photo backgrounds.</p>
          </div>
          <button className="primary" onClick={createTemplate}>
            <Plus size={18} /> New template
          </button>
        </div>
        <div className="templatelist card">
          {templates.map((t) => (
            <div className="templateitem" key={t.id}>
              <button className="templatename" onClick={() => void openTemplate(t.id)}>
                <span>
                  {t.name}
                  {t.isDefault && <em className="tplbadge">default</em>}
                </span>
                <small>{t.usedBy ? `used by ${t.usedBy} link${t.usedBy > 1 ? "s" : ""}` : "unused"}</small>
              </button>
              {!t.isDefault && (
                <button className="icon danger" title="Delete template" onClick={() => void deleteTemplate(t.id)}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
          {!templates.length && (
            <div className="emptymini">No templates yet. Create the first one — start from the classic 18+ card.</div>
          )}
        </div>
      </section>
    );
  }

  const t = current;
  const isDefault = t.id === "default";
  return (
    <section className="content exitbuilder-workspace">
      <div className="pagebar">
        <div>
          <h2>Exit page builder</h2>
          <p>{isDefault ? "Default template — used when a link has no template assigned" : (dirty ? "Unsaved changes" : "Editing template")}</p>
        </div>
        <div className="pagebaractions">
          <button className="backbtn" onClick={() => { setCurrent(null); setDirty(false); }}>
            <ChevronLeft size={16} /> Back
          </button>
          <button className="primary" onClick={() => void saveTemplate()} disabled={!dirty}>
            <Save size={16} /> {dirty ? "Save" : "Saved"}
          </button>
        </div>
      </div>
      <div className="buildergrid">
        <div className="builderform">
          <Section title="Template" defaultOpen>
            <label>
              Name
              <input
                value={t.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Summer promo 18+"
                maxLength={60}
              />
            </label>
            <label>
              Opening mode
              <select
                value={t.mode}
                onChange={(e) => patch({ mode: e.target.value as "browser" | "app" })}
              >
                <option value="browser">Open in external browser</option>
                <option value="app">Deep link into an app</option>
              </select>
            </label>
            {t.mode === "app" && (
              <label>
                App deep link scheme
                <input
                  value={t.scheme}
                  onChange={(e) => patch({ scheme: e.target.value })}
                  placeholder="onlyfans://user"
                  maxLength={120}
                />
                <small className="hint">Custom URL scheme (e.g. onlyfans://user).</small>
              </label>
            )}
            {isDefault && (
              <small className="hint">
                This is the default template. Edit it to change how every link without an
                assigned template looks. It cannot be deleted.
              </small>
            )}
          </Section>

          <Section title="Content" hint="Heading, text, badge, auto-redirect">
            <label>
              Heading
              <input value={t.heading} onChange={(e) => patch({ heading: e.target.value })} maxLength={80} placeholder="Adults Only" />
            </label>
            <label>
              Subtext
              <textarea
                value={t.subtext}
                onChange={(e) => patch({ subtext: e.target.value })}
                maxLength={300}
                placeholder="This content is intended for adults…"
              />
            </label>
            <div className="fieldrow fieldrow4">
              <label>
                Badge
                <input
                  value={t.badge.text}
                  onChange={(e) => patch({ badge: { ...t.badge, text: e.target.value } })}
                  maxLength={8}
                  placeholder="18+"
                />
              </label>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={t.badge.show}
                  onChange={(e) => patch({ badge: { ...t.badge, show: e.target.checked } })}
                />
                Show badge
              </label>
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={t.auto}
                  onChange={(e) => patch({ auto: e.target.checked })}
                />
                Auto-redirect
              </label>
              <label>
                Delay (sec)
                <input
                  type="number"
                  min={3}
                  step={1}
                  value={t.countdown}
                  onChange={(e) => patch({ countdown: Math.max(3, Number(e.target.value) || 3) })}
                />
              </label>
            </div>
          </Section>

          <Section title="Buttons" hint={`${t.buttons.length}/6 · one button without a link continues`}>
            {t.buttons.map((button, index) => (
              <div className="buttonrow" key={button.id}>
                <input
                  value={button.label}
                  onChange={(e) => {
                    const next = [...t.buttons];
                    next[index] = { ...button, label: e.target.value };
                    patch({ buttons: next });
                  }}
                  placeholder="Button label"
                  maxLength={40}
                />
                <input
                  value={button.url}
                  onChange={(e) => {
                    const next = [...t.buttons];
                    next[index] = { ...button, url: e.target.value };
                    patch({ buttons: next });
                  }}
                  placeholder="https:// (empty = continue action)"
                />
                <select
                  value={button.style}
                  onChange={(e) => {
                    const next = [...t.buttons];
                    next[index] = { ...button, style: e.target.value as ExitTemplate["buttons"][number]["style"] };
                    patch({ buttons: next });
                  }}
                >
                  <option value="solid">Solid</option>
                  <option value="outline">Outline</option>
                  <option value="ghost">Ghost</option>
                </select>
                <button
                  className="icon danger"
                  title="Remove button"
                  onClick={() => patch({ buttons: t.buttons.filter((x) => x.id !== button.id) })}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
            {t.buttons.length < 6 && (
              <button
                className="addblock"
                onClick={() =>
                  patch({
                    buttons: [
                      ...t.buttons,
                      { id: "b" + Date.now(), label: "New button", url: "", style: "ghost" },
                    ],
                  })
                }
              >
                <Plus size={16} /> Add button
              </button>
            )}
          </Section>

          <Section title="Background" hint="Solid color or photos with blur and dim">
            <label>
              Type
              <select
                value={t.background.type}
                onChange={(e) => patch({ background: { ...t.background, type: e.target.value as "color" | "photo" } })}
              >
                <option value="color">Solid color</option>
                <option value="photo">Photo</option>
              </select>
            </label>
            {t.background.type === "photo" && (
              <div className="photomanage">
                <div className="photothumbs">
                  {t.background.photos.map((photo) => (
                    <div className="photothumb" key={photo}>
                      <img src={"/exitmedia/" + photo} alt={photo} />
                      <button
                        className="icon danger"
                        title="Remove photo"
                        onClick={() =>
                          patch({
                            background: {
                              ...t.background,
                              photos: t.background.photos.filter((x) => x !== photo),
                            },
                          })
                        }
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  <button className="photoupload" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload size={17} />
                    <span>{uploading ? "Uploading…" : "Upload"}</span>
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(e) => void uploadPhotos(e.target.files)}
                />
                {t.background.photos.length > 1 && (
                  <label className="checkline">
                    <input
                      type="checkbox"
                      checked={t.background.slideshow}
                      onChange={(e) => patch({ background: { ...t.background, slideshow: e.target.checked } })}
                    />
                    Slideshow
                  </label>
                )}
                {t.background.slideshow && t.background.photos.length > 1 && (
                  <label className="sliderline">
                    Interval (sec)
                    <input
                      type="range"
                      min={3}
                      max={30}
                      value={t.background.interval}
                      onChange={(e) => patch({ background: { ...t.background, interval: Number(e.target.value) } })}
                    />
                    <code>{t.background.interval}s</code>
                  </label>
                )}
                <small className="hint">Up to 6 photos, 8 MB each.</small>
              </div>
            )}
            <div className="fieldrow">
              <label className="sliderline">
                Blur
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={t.background.blur}
                  onChange={(e) => patch({ background: { ...t.background, blur: Number(e.target.value) } })}
                />
                <code>{t.background.blur}px</code>
              </label>
              <label className="sliderline">
                Dim
                <input
                  type="range"
                  min={0}
                  max={90}
                  value={t.background.dim}
                  onChange={(e) => patch({ background: { ...t.background, dim: Number(e.target.value) } })}
                />
                <code>{t.background.dim}%</code>
              </label>
            </div>
          </Section>

          <Section title="Colors" hint="Palette and corner radius">
            <div className="palettegrid">
              {PALETTE_FIELDS.map(([key, label]) => (
                <ColorField
                  key={key}
                  label={label}
                  value={t.palette[key] as string}
                  onChange={(hex) => patchPalette(key, hex)}
                />
              ))}
              <label className="sliderline">
                Corner radius
                <input
                  type="range"
                  min={0}
                  max={28}
                  value={t.palette.radius}
                  onChange={(e) => patchPalette("radius", Number(e.target.value))}
                />
                <code>{t.palette.radius}px</code>
              </label>
            </div>
          </Section>

          <Section title="Card" hint="Panel behind the content">
            <div className="fieldrow">
              <label className="checkline">
                <input
                  type="checkbox"
                  checked={t.card.visible}
                  onChange={(e) => patch({ card: { ...t.card, visible: e.target.checked } })}
                />
                Show card panel
              </label>
              <label className="sliderline">
                Card opacity
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={t.card.opacity}
                  onChange={(e) => patch({ card: { ...t.card, opacity: Number(e.target.value) } })}
                />
                <code>{t.card.opacity}%</code>
              </label>
            </div>
          </Section>

          {!isDefault && (
            <button className="textbutton" onClick={() => void duplicateTemplate(t)}>
              Duplicate as new template
            </button>
          )}
        </div>

        <div className="builderpreview">
          <div className="previewtoolbar">
            <Eye size={15} />
            <span>Live preview</span>
            <small>Updates as you edit</small>
          </div>
          <TemplatePreview t={t} phone />
        </div>
      </div>
    </section>
  );
}
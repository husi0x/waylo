import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  ExternalLink,
  Globe2,
  GripVertical,
  LayoutDashboard,
  Link2,
  Menu,
  Monitor,
  MousePointer2,
  Plus,
  Route,
  RotateCw,
  Save,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAndroid, faApple } from "@fortawesome/free-brands-svg-icons";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EXIT_PAGE_DEFAULTS, isValidCountdownInput, normalizeCountdown, withExitPageDefaults } from "../exit-page-config.mjs";
import { ExitPagePreview } from "./ExitPagePreview";
import "./styles.css";
type RouteRule = {
  id: string;
  country: string;
  device: string;
  os: string;
  destination: string;
};
type Link = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  destination: string;
  clicks: number;
  status: string;
  rules: number;
  routes?: RouteRule[];
  landing?: boolean;
  landingMode?: "browser" | "app";
  landingScheme?: string;
  landingHeading?: string;
  landingSubtext?: string;
  landingButton?: string;
  landingCopy?: string;
  landingDirect?: string;
  landingCountdown?: number;
  bulk?: boolean;
};
type Domain = {
  id: string;
  host: string;
  status: string;
  ssl: boolean;
  verificationToken?: string;
  verificationHost?: string;
  target?: string;
};
type Block = { id: string; title: string; url: string };
type State = {
  links: Link[];
  domains: Domain[];
  page: {
    slug: string;
    name: string;
    bio: string;
    accent: string;
    blocks: Block[];
  };
};
type ClickEvent = {
  id: string;
  link_id: string;
  route_id: string | null;
  country: string;
  region: string;
  city: string;
  device: string;
  device_model: string;
  os: string;
  browser: string;
  source: string;
  referrer: string;
  destination: string;
  created_at: string;
};
type AnalyticsData = {
  summary: {
    clicks: number;
    unique_visitors: number;
    countries: number;
    links?: number;
  };
  events: ClickEvent[];
  daily: { day: string; clicks: number; unique_visitors: number }[];
  timeline?: {
    bucket: string;
    clicks: number;
    unique_visitors: number;
  }[];
  countries: {
    country: string;
    clicks: number;
    unique_visitors?: number;
  }[];
  devices?: {
    device: string;
    os: string;
    clicks: number;
    unique_visitors: number;
  }[];
  links?: {
    link_id: string;
    clicks: number;
    unique_visitors: number;
  }[];
  sources: { source: string; clicks: number }[];
  period?: "day" | "week" | "month";
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
    offset: number;
  };
};
type AnalyticsPeriod = "day" | "week" | "month";
type AnalyticsView = "overview" | "geo" | "devices" | "links" | "visits";

function CountryFlag({ code, size = 22 }: { code: string; size?: number }) {
  const country = String(code || "").toLowerCase();
  if (!/^[a-z]{2}$/.test(country) || country === "xx")
    return <Globe2 size={size} aria-label="Unknown country" />;
  return (
    <img
      className="countryflag"
      src={`/flags/${country}.svg`}
      alt={country.toUpperCase()}
      loading="lazy"
      style={{ width: size, height: Math.round(size * 0.75) }}
      title={country.toUpperCase()}
    />
  );
}
function DeviceIcon({ device, os, size = 18 }: any) {
  if (os === "Android")
    return <FontAwesomeIcon icon={faAndroid} aria-label="Android" style={{ fontSize: size }} />;
  if (os === "iOS" || os === "macOS")
    return <FontAwesomeIcon icon={faApple} aria-label={os} style={{ fontSize: size }} />;
  if (device === "Mobile") return <Smartphone size={size} />;
  if (device === "Tablet") return <Tablet size={size} />;
  return <Monitor size={size} />;
}
function App() {
  const [tab, setTab] = useState("Overview");
  const [auth, setAuth] = useState<{
    authenticated: boolean;
    needsSetup: boolean;
  } | null>(null);
  const [data, setData] = useState<State | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [modal, setModal] = useState<null | "new" | Link>(null);
  const [toast, setToast] = useState("");
  const refresh = () =>
    Promise.all([
      fetch("/api/state")
        .then((r) => {
          if (!r.ok) throw Error();
          return r.json();
        })
        .then(setData),
      fetch("/api/analytics?period=month&limit=100")
        .then((r) => r.json())
        .then(setAnalytics),
    ]);
  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((x) => {
        setAuth(x);
        if (x.authenticated) void refresh();
      });
  }, []);
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2200);
  };
  if (auth === null)
    return (
      <div className="loading">
        <div className="logo">R</div> Checking secure session…
      </div>
    );
  if (!auth.authenticated)
    return (
      <AuthScreen
        needsSetup={auth.needsSetup}
        done={() => {
          setAuth({ authenticated: true, needsSetup: false });
          void refresh();
        }}
      />
    );
  if (!data)
    return (
      <div className="loading">
        <div className="logo">R</div> Loading workspace…
      </div>
    );
  return (
    <div className="app">
      <Sidebar tab={tab} setTab={setTab} />
      <main>
        <Top tab={tab} />
        {tab === "Overview" && (
          <Overview data={data} analytics={analytics} setTab={setTab} />
        )}{" "}
        {tab === "Smart links" && (
          <Links
            data={data}
            onAdd={() => setModal("new")}
            onEdit={(l: Link) => setModal(l)}
            refresh={refresh}
            notify={notify}
          />
        )}{" "}
        {tab === "Domains" && (
          <Domains data={data} refresh={refresh} notify={notify} />
        )}{" "}
        {tab === "Page builder" && (
          <Builder data={data} setData={setData} notify={notify} />
        )}{" "}
        {tab === "Analytics" && (
          <Analytics data={data} analytics={analytics} refresh={refresh} />
        )}{" "}
        {tab === "Settings" && <SettingsPage />}
      </main>
      {modal && (
        <LinkModal
          initial={modal === "new" ? null : modal}
          domains={data.domains}
          close={() => setModal(null)}
          notify={notify}
          done={() => {
            const created = modal === "new";
            setModal(null);
            refresh();
            notify(created ? "Smart link created" : "Link updated");
          }}
        />
      )}{" "}
      {toast && (
        <div className="toast">
          <ShieldCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function Sidebar({
  tab,
  setTab,
}: {
  tab: string;
  setTab: (x: string) => void;
}) {
  const items = [
    [LayoutDashboard, "Overview"],
    [Link2, "Smart links"],
    [Globe2, "Domains"],
    [Sparkles, "Page builder"],
    [BarChart3, "Analytics"],
    [Settings, "Settings"],
  ] as const;
  return (
    <aside>
      <div className="brand">
        <div className="brandmark">
          <Route />
        </div>
        <span>Waylo</span>
        <em>PRO</em>
      </div>
      <nav>
        {items.map(([I, n]) => (
          <button
            key={n}
            className={tab === n ? "active" : ""}
            onClick={() => setTab(n)}
          >
            <I size={19} />
            {n}
          </button>
        ))}
      </nav>
      <div className="sidecard">
        <Zap size={20} />
        <b>7.2% conversion lift</b>
        <span>Smart routing is outperforming your baseline.</span>
        <button onClick={() => setTab("Analytics")}>View insight →</button>
      </div>
      <div className="user">
        <div>AM</div>
        <span>
          <b>Administrator</b>
          <small>Secure workspace</small>
        </span>
        <ChevronDown size={16} />
      </div>
    </aside>
  );
}
function Top({ tab }: { tab: string }) {
  const descriptions: Record<string, string> = {
    Overview: "Live performance across links, domains and visitors.",
    "Smart links": "Create destinations and control routing from one place.",
    Domains: "Connect, verify and monitor every traffic domain.",
    "Page builder": "Shape the public profile and preview every change.",
    Analytics: "Explore first-party traffic by period, audience and link.",
    Settings: "Workspace preferences, retention and access status.",
  };
  return (
    <header>
      <div>
        <h1>{tab}</h1>
        <p>{descriptions[tab] || "Manage your traffic workspace."}</p>
      </div>
      <div className="topactions">
        <button className="icon">
          <Activity size={18} />
        </button>
        <button className="avatar">AM</button>
      </div>
    </header>
  );
}
function Overview({
  data,
  analytics,
  setTab,
}: {
  data: State;
  analytics: AnalyticsData | null;
  setTab: (x: string) => void;
}) {
  const a = analytics;
  return (
    <section className="content overview-workspace">
      <div className="notice">
        <div>
          <ShieldCheck />
          <span>
            <b>Live first-party analytics</b>
            <small>
              Every number below is calculated from recorded redirect events.
            </small>
          </span>
        </div>
        <button onClick={() => setTab("Analytics")}>Open click log</button>
      </div>
      <div className="stats">
        <Stat
          icon={MousePointer2}
          label="Recorded clicks · 30 days"
          value={(a?.summary.clicks || 0).toLocaleString()}
        />
        <Stat
          icon={Users}
          label="Unique visitors · 30 days"
          value={(a?.summary.unique_visitors || 0).toLocaleString()}
        />
        <Stat
          icon={Globe2}
          label="Countries observed"
          value={(a?.summary.countries || 0).toLocaleString()}
        />
        <Stat
          icon={Link2}
          label="Active smart links"
          value={data.links
            .filter((x) => x.status === "active")
            .length.toLocaleString()}
        />
      </div>
      <div className="grid2">
        <div className="card chartcard">
          <CardTitle
            title="Real traffic"
            sub="Recorded clicks by UTC day"
            action="Last 30 days"
          />
          <ResponsiveContainer width="100%" height={265}>
            <LineChart data={a?.daily || []}>
              <CartesianGrid stroke="#ececf2" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e6e4f2" }} />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#7357ff"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#7357ff", strokeWidth: 3, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
          {!a?.daily.length && (
            <div className="emptychart">
              No clicks recorded yet. Open one of your `/r/slug` links to
              generate an event.
            </div>
          )}
        </div>
        <div className="card">
          <CardTitle
            title="Traffic sources"
            sub="UTM source or referrer host"
            action="Actual data"
          />
          <div className="sourceList">
            {a?.sources.map((x) => (
              <div key={x.source}>
                <b>{x.source}</b>
                <strong>{x.clicks}</strong>
              </div>
            ))}
            {!a?.sources.length && (
              <div className="emptymini">No source data yet</div>
            )}
          </div>
        </div>
      </div>
      <RecentClicks analytics={a} links={data.links} limit={8} />
    </section>
  );
}
function Stat({ icon: I, label, value }: any) {
  return (
    <div className="stat card">
      <div className="stathead">
        <span>
          <I size={19} />
        </span>
      </div>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  );
}
function CardTitle({ title, sub, action }: any) {
  return (
    <div className="cardtitle">
      <span>
        <h3>{title}</h3>
        <p>{sub}</p>
      </span>
      <span className="cardaction">{action}</span>
    </div>
  );
}
function Links({ data, onAdd, onEdit, refresh, notify }: any) {
  const [selected, setSelected] = useState<Link | null>(null);
  const del = async (id: string) => {
    await fetch("/api/links/" + id, { method: "DELETE" });
    refresh();
    notify("Link removed");
  };
  return (
    <section className="content links-workspace">
      <div className="pagebar">
        <div>
          <h2>Smart links</h2>
          <p>Route every visitor to the most relevant destination.</p>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus size={18} />
          New smart link
        </button>
      </div>
      <div className="workspacefacts" aria-label="Link summary">
        <div>
          <span>Active links</span>
          <b>{data.links.filter((link: Link) => link.status === "active").length}</b>
        </div>
        <div>
          <span>Total clicks</span>
          <b>{data.links.reduce((sum: number, link: Link) => sum + link.clicks, 0).toLocaleString()}</b>
        </div>
        <div>
          <span>Routing rules</span>
          <b>{data.links.reduce((sum: number, link: Link) => sum + (link.rules || 0), 0)}</b>
        </div>
      </div>
      <div className="card workspace-table-card">
        <table>
          <thead>
            <tr>
              <th>NAME & URL</th>
              <th>DESTINATION</th>
              <th>CLICKS</th>
              <th>ROUTING</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.links.map((l: Link) => (
              <tr key={l.id}>
                <td>
                  <span className="linkicon">
                    <Link2 size={17} />
                  </span>
                  <b>{l.name}</b>
                  {l.landing && (
                    <span className="pill exitpill">exit page</span>
                  )}
                  <small>
                    https://{l.domain}/{l.slug}
                  </small>
                </td>
                <td className="truncate">{l.destination}</td>
                <td>
                  <b>{l.clicks.toLocaleString()}</b>
                </td>
                <td>
                  <button className="textbutton" onClick={() => setSelected(l)}>
                    {l.rules ? `${l.rules} active rules` : "Add rule"}
                  </button>
                </td>
                <td>
                  <span className={"pill " + l.status}>{l.status}</span>
                </td>
                <td>
                  <button className="icon" title="Edit link" onClick={() => onEdit(l)}>
                    <Settings size={16} />
                  </button>
                  <button
                    className="icon"
                    onClick={() =>
                      navigator.clipboard
                        ?.writeText(`https://${l.domain}/${l.slug}`)
                        .then(() => notify("URL copied"))
                    }
                  >
                    <Copy size={16} />
                  </button>
                  <button className="icon danger" onClick={() => del(l.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rules card">
        <div>
          <Route />
          <span>
            <h3>Rule engine</h3>
            <p>
              Route by country, device and OS. Every matched route is recorded
              for transparent reporting.
            </p>
          </span>
        </div>
        <button onClick={() => setSelected(data.links[0])}>
          Configure rules
        </button>
      </div>
      {selected && (
        <RuleModal
          link={selected}
          close={() => setSelected(null)}
          done={() => {
            setSelected(null);
            refresh();
            notify("Routing rule saved");
          }}
        />
      )}
    </section>
  );
}

function RuleModal({
  link,
  close,
  done,
}: {
  link: Link;
  close: () => void;
  done: () => void;
}) {
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const rule = {
      id: crypto.randomUUID(),
      country: f.get("country"),
      device: f.get("device"),
      os: f.get("os"),
      destination: f.get("destination"),
    };
    const res = await fetch("/api/links/" + link.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ routes: [...(link.routes || []), rule] }),
    });
    if (res.ok) done();
  };
  return (
    <div className="overlay">
      <form className="modal" onSubmit={submit}>
        <div>
          <span>
            <h2>Smart routing rule</h2>
            <p>{link.name} · rules are evaluated from top to bottom.</p>
          </span>
          <button type="button" className="icon" onClick={close}>
            <X />
          </button>
        </div>
        <div className="rulegrid">
          <label>
            Country
            <select name="country">
              <option value="Any">Any country</option>
              <option value="US">United States</option>
              <option value="DE">Germany</option>
              <option value="GB">United Kingdom</option>
              <option value="BR">Brazil</option>
              <option value="CA">Canada</option>
            </select>
          </label>
          <label>
            Device
            <select name="device">
              <option>Any</option>
              <option>Mobile</option>
              <option>Desktop</option>
            </select>
          </label>
          <label>
            Operating system
            <select name="os">
              <option>Any</option>
              <option>iOS</option>
              <option>Android</option>
              <option>Windows</option>
              <option>macOS</option>
            </select>
          </label>
        </div>
        <label>
          Route destination
          <input
            name="destination"
            type="url"
            placeholder="https://example.com/local-offer"
            required
          />
        </label>
        <div className="secureline">
          <ShieldCheck size={16} />
          Only public HTTPS destinations are accepted.
        </div>
        <div className="modalactions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary">Save rule</button>
        </div>
      </form>
    </div>
  );
}
function Domains({ data, refresh, notify }: any) {
  const [busy, setBusy] = useState("");
  const add = async (e: any) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const host = new FormData(form).get("host");
    setBusy("add");
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ host }),
      });
      if (!res.ok)
        return notify((await res.json()).error || "Could not add domain");
      form.reset();
      await refresh();
      notify("Domain added. Publish the DNS records shown below.");
    } catch {
      notify("Could not reach the server. Please try again.");
    } finally {
      setBusy("");
    }
  };
  const verify = async (d: Domain) => {
    setBusy(d.id);
    const res = await fetch(`/api/domains/${d.id}/verify`, { method: "POST" });
    setBusy("");
    if (!res.ok)
      return notify((await res.json()).error || "DNS verification failed");
    await refresh();
    notify("Domain ownership verified");
  };
  const remove = async (d: Domain) => {
    if (!confirm(`Delete ${d.host}?`)) return;
    const res = await fetch("/api/domains/" + d.id, { method: "DELETE" });
    if (!res.ok)
      return notify((await res.json()).error || "Could not delete domain");
    await refresh();
    notify("Domain deleted");
  };
  return (
    <section className="content domains-workspace">
      <div className="pagebar">
        <div>
          <h2>Domains</h2>
          <p>Add a domain, publish its DNS records, then verify ownership.</p>
        </div>
      </div>
      <div className="workspacefacts" aria-label="Domain summary">
        <div>
          <span>Connected</span>
          <b>{data.domains.length}</b>
        </div>
        <div>
          <span>Verified</span>
          <b>{data.domains.filter((domain: Domain) => domain.status === "active").length}</b>
        </div>
        <div>
          <span>Awaiting DNS</span>
          <b>{data.domains.filter((domain: Domain) => domain.status !== "active").length}</b>
        </div>
      </div>
      <div className="domainlayout">
        <div className="domainstack">
          {data.domains.map((d: Domain) => (
            <div className="card domainitem" key={d.id}>
              <div className="domainrow">
                <span className="domainicon">
                  <Globe2 />
                </span>
                <span>
                  <b>{d.host}</b>
                  <small>
                    {d.status === "active"
                      ? d.ssl
                        ? "Verified · SSL active"
                        : "Ownership verified · TLS handled by proxy"
                      : "Waiting for DNS verification"}
                  </small>
                </span>
                <span className={"pill " + d.status}>{d.status}</span>
                <button
                  className="icon danger"
                  title="Delete domain"
                  onClick={() => remove(d)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {d.status !== "active" && (
                <div className="dnsrecords">
                  <p>Add these records at your DNS provider:</p>
                  <DnsRecord
                    type="TXT"
                    name={
                      d.verificationHost || `_routekit-verification.${d.host}`
                    }
                    value={d.verificationToken || ""}
                  />
                  <DnsRecord
                    type="CNAME"
                    name={d.host}
                    value={d.target || "tracker.your-service.com"}
                  />
                  <div className="dnsactions">
                    <small>
                      For a root domain, use ALIAS/ANAME or the A record
                      supplied by your deployment provider.
                    </small>
                    <button
                      className="primary"
                      disabled={busy === d.id}
                      onClick={() => verify(d)}
                    >
                      {busy === d.id ? "Checking DNS…" : "Verify DNS"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <form className="card adddomain" onSubmit={add}>
          <h3>Connect a domain</h3>
          <p>Enter only the hostname, without protocol or path.</p>
          <label>
            Domain name
            <input
              name="host"
              placeholder="go.yourdomain.com"
              autoComplete="off"
              required
            />
          </label>
          <button className="primary" disabled={busy === "add"}>
            <Plus size={18} />
            {busy === "add" ? "Adding…" : "Add domain"}
          </button>
          <div className="dns">
            <ShieldCheck />
            <span>
              <b>Ownership verification</b>
              <small>
                A unique TXT token prevents somebody else from connecting a
                domain they do not own.
              </small>
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
function DnsRecord({
  type,
  name,
  value,
}: {
  type: string;
  name: string;
  value: string;
}) {
  return (
    <div className="dnsrecord">
      <b>{type}</b>
      <code>{name}</code>
      <code>{value}</code>
      <button
        className="icon"
        onClick={() => navigator.clipboard?.writeText(value)}
      >
        <Copy size={15} />
      </button>
    </div>
  );
}
function Builder({ data, setData, notify }: any) {
  const p = data.page;
  const update = (x: any) => setData({ ...data, page: { ...p, ...x } });
  const save = async () => {
    await fetch("/api/page", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(p),
    });
    notify("Page published");
  };
  return (
    <section className="builder builder-workspace">
      <div className="editor">
        <div className="pagebar">
          <div>
            <h2>Page builder</h2>
            <p>Edit your mobile landing page.</p>
          </div>
          <button className="primary" onClick={save}>
            <Save size={17} />
            Publish
          </button>
        </div>
        <div className="workspacefacts builderfacts" aria-label="Page summary">
          <div>
            <span>Public path</span>
            <b>/p/{p.slug || "—"}</b>
          </div>
          <div>
            <span>Link blocks</span>
            <b>{p.blocks.length}</b>
          </div>
          <div>
            <span>Status</span>
            <b>Ready to publish</b>
          </div>
        </div>
        <div className="card form">
          <label>
            Display name
            <input
              value={p.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </label>
          <label>
            Profile address
            <div className="prefix">
              <span>/p/</span>
              <input
                value={p.slug}
                onChange={(e) =>
                  update({
                    slug: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40),
                  })
                }
                placeholder="profile"
              />
              <button
                type="button"
                className="icon slugrandom"
                title="Random address"
                onClick={() =>
                  update({
                    slug: Array.from(crypto.getRandomValues(new Uint8Array(6)))
                      .map((b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36])
                      .join(""),
                  })
                }
              >
                <RotateCw size={15} />
              </button>
            </div>
            <span className="hint">
              Your page: <a href={"/p/" + p.slug} target="_blank" rel="noreferrer">/p/{p.slug}</a>
            </span>
          </label>
          <label>
            Bio
            <textarea
              value={p.bio}
              onChange={(e) => update({ bio: e.target.value })}
            />
          </label>
          <label>
            Brand color
            <div className="colorline">
              <input
                type="color"
                value={p.accent}
                onChange={(e) => update({ accent: e.target.value })}
              />
              <input
                value={p.accent}
                onChange={(e) => update({ accent: e.target.value })}
              />
            </div>
          </label>
          <h3>Link blocks</h3>
          {p.blocks.map((b: Block, i: number) => (
            <div className="block" key={b.id}>
              <GripVertical />
              <span>
                <input
                  value={b.title}
                  onChange={(e) =>
                    update({
                      blocks: p.blocks.map((x: Block, j: number) =>
                        j === i ? { ...x, title: e.target.value } : x,
                      ),
                    })
                  }
                />
                <input
                  value={b.url}
                  onChange={(e) =>
                    update({
                      blocks: p.blocks.map((x: Block, j: number) =>
                        j === i ? { ...x, url: e.target.value } : x,
                      ),
                    })
                  }
                />
              </span>
              <button
                className="icon"
                onClick={() =>
                  update({
                    blocks: p.blocks.filter((_: Block, j: number) => j !== i),
                  })
                }
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button
            className="addblock"
            onClick={() =>
              update({
                blocks: [
                  ...p.blocks,
                  {
                    id: crypto.randomUUID(),
                    title: "New link",
                    url: "https://",
                  },
                ],
              })
            }
          >
            <Plus size={17} />
            Add link block
          </button>
        </div>
      </div>
      <div className="previewwrap">
        <div className="previewtop">
          <b>Live preview</b>
          <a href={"/p/" + p.slug} target="_blank">
            Open page <ExternalLink size={14} />
          </a>
        </div>
        <div className="phone">
          <div className="notch" />
          <div className="mobile" style={{ "--accent": p.accent } as any}>
            <div className="av">
              {p.name
                .split(" ")
                .map((x: string) => x[0])
                .join("")
                .slice(0, 2)}
            </div>
            <h2>{p.name}</h2>
            <p>{p.bio}</p>
            {p.blocks.map((b: Block) => (
              <a key={b.id}>{b.title}</a>
            ))}
            <small>Powered by Waylo</small>
          </div>
        </div>
      </div>
    </section>
  );
}
function Analytics({
  data,
  analytics: initialAnalytics,
}: {
  data: State;
  analytics: AnalyticsData | null;
  refresh?: () => Promise<any>;
}) {
  const [stats, setStats] = useState<AnalyticsData | null>(initialAnalytics);
  const [period, setPeriod] = useState<AnalyticsPeriod>("day");
  const [view, setView] = useState<AnalyticsView>("overview");
  const [linkId, setLinkId] = useState("");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paramsFor = (requestedPage = page, pageSize = 25) => {
    const params = new URLSearchParams({
      period,
      page: String(requestedPage),
      pageSize: String(pageSize),
    });
    if (linkId) params.set("linkId", linkId);
    if (appliedQuery) params.set("q", appliedQuery);
    return params;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedQuery(query.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/analytics?" + paramsFor().toString(), {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw Error(
            (await response.json().catch(() => null))?.error ||
              "Analytics request failed",
          );
        return response.json();
      })
      .then(setStats)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [period, linkId, page, appliedQuery, data.links.length]);

  const exportCsv = async () => {
    let exportPage = 1;
    let pages = 1;
    const events: ClickEvent[] = [];
    do {
      const response = await fetch(
        "/api/analytics?" + paramsFor(exportPage, 100),
      );
      if (!response.ok) return;
      const part: AnalyticsData = await response.json();
      events.push(...part.events);
      pages = part.pagination?.pages || 1;
      exportPage += 1;
    } while (exportPage <= pages);
    const rows = [
      [
        "Time",
        "Link",
        "Source",
        "Referrer",
        "Country",
        "Region",
        "City",
        "Device",
        "Model",
        "OS",
        "Browser",
        "Destination",
      ],
      ...events.map((event) => [
        event.created_at,
        data.links.find((link) => link.id === event.link_id)?.name ||
          event.link_id,
        event.source,
        event.referrer,
        event.country,
        event.region,
        event.city,
        event.device,
        event.device_model,
        event.os,
        event.browser,
        event.destination,
      ]),
    ];
    const csv = rows
      .map((row: any[]) =>
        row
          .map((value) =>
            '"' + String(value).replaceAll('"', '""') + '"',
          )
          .join(","),
      )
      .join("\n");
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    anchor.download = `waylo-clicks-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const timeline =
    stats?.timeline ||
    (stats?.daily || []).map((item) => ({ bucket: item.day, ...item }));
  const total = stats?.summary.clicks || 0;
  const pages = stats?.pagination?.pages || 1;
  const periodLabel =
    period === "day"
      ? "Last 24 hours"
      : period === "week"
        ? "Last 7 days"
        : "Last month";
  const formatBucket = (value: string) => {
    const date = new Date(
      period === "day"
        ? `${value.replace(" ", "T")}:00Z`
        : `${value}T00:00:00Z`,
    );
    return Number.isNaN(date.getTime())
      ? value
      : period === "day"
        ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
        : date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            ...(period === "week" ? { weekday: "short" } : {}),
            timeZone: "UTC",
          });
  };
  const metricRow = (
    key: string,
    icon: React.ReactNode,
    label: React.ReactNode,
    meta: React.ReactNode,
    clicks: number,
  ) => (
    <div className="metricrow" key={key}>
      <span className="metricicon">{icon}</span>
      <span className="metriclabel">
        <b>{label}</b>
        <small>{meta}</small>
      </span>
      <span className="metricvalue">
        <b>{clicks.toLocaleString()}</b>
        <small>{total ? Math.round((clicks / total) * 100) : 0}%</small>
      </span>
      <i>
        <em style={{ width: `${total ? (clicks / total) * 100 : 0}%` }} />
      </i>
    </div>
  );
  const countryRows = (stats?.countries || []).map((item) =>
    metricRow(
      item.country,
      <CountryFlag code={item.country} />,
      item.country || "Unknown",
      `${item.unique_visitors || 0} unique`,
      item.clicks,
    ),
  );
  const deviceRows = (stats?.devices || []).map((item) =>
    metricRow(
      `${item.device}-${item.os}`,
      <DeviceIcon device={item.device} os={item.os} />,
      `${item.device} · ${item.os}`,
      `${item.unique_visitors} unique`,
      item.clicks,
    ),
  );
  const linkRows = (stats?.links || []).map((item) => {
    const link = data.links.find((candidate) => candidate.id === item.link_id);
    return metricRow(
      item.link_id,
      <Link2 size={18} />,
      link?.name || "Deleted link",
      link ? `${link.domain}/${link.slug}` : item.link_id,
      item.clicks,
    );
  });

  return (
    <section className="content">
      <div className="pagebar">
        <div>
          <h2>Analytics</h2>
          <p>Traffic performance by period and smart link.</p>
        </div>
      </div>
      <div className="analyticsbar card">
        <div className="segment" aria-label="Analytics period">
          {(["day", "week", "month"] as AnalyticsPeriod[]).map((item) => (
            <button
              key={item}
              className={period === item ? "active" : ""}
              onClick={() => {
                setPeriod(item);
                setPage(1);
              }}
            >
              {item === "day" ? "Day" : item === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
        <label>
          <span>Smart link</span>
          <select
            value={linkId}
            onChange={(event) => {
              setLinkId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All links</option>
            {data.links.map((link) => (
              <option key={link.id} value={link.id}>
                {link.name} · /{link.slug}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="analyticsnav">
        {(
          [
            ["overview", "Overview"],
            ["geo", "Geography"],
            ["devices", "Devices & OS"],
            ["links", "Links"],
            ["visits", "Visits"],
          ] as [AnalyticsView, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className={view === id ? "active" : ""}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <div className="analyticserror">{error}</div>}
      {view === "overview" && <div className="analytics-overview">
      <div className="stats analytics-summary">
        <Stat
          icon={MousePointer2}
          label={`Recorded clicks · ${periodLabel.toLowerCase()}`}
          value={(stats?.summary.clicks || 0).toLocaleString()}
        />
        <Stat
          icon={Users}
          label={`Unique visitors · ${periodLabel.toLowerCase()}`}
          value={(stats?.summary.unique_visitors || 0).toLocaleString()}
        />
        <Stat
          icon={Globe2}
          label="Countries observed"
          value={(stats?.summary.countries || 0).toLocaleString()}
        />
        <Stat
          icon={Link2}
          label="Links with traffic"
          value={(stats?.summary.links || 0).toLocaleString()}
        />
      </div>
      <div
        className={`card chartcard analyticschart ${loading ? "loadingdata" : ""}`}
      >
        <CardTitle
          title="Click activity"
          sub={period === "day" ? "Clicks and unique visitors by hour" : "Clicks and unique visitors by day"}
          action={periodLabel}
        />
        <ResponsiveContainer width="100%" height={270}>
          <LineChart
            data={timeline}
            margin={{ top: 12, right: 18, bottom: 4, left: -8 }}
          >
            <CartesianGrid
              stroke="#ececf2"
              strokeDasharray="4 6"
              vertical={false}
            />
            <XAxis
              dataKey="bucket"
              tickFormatter={formatBucket}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8f8f9c", fontSize: 10 }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8f8f9c", fontSize: 10 }}
            />
            <Tooltip
              labelFormatter={formatBucket}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #e3e0f2",
                boxShadow: "0 12px 35px #28243f18",
              }}
            />
            <Legend iconType="circle" iconSize={8} />
            <Line
              type="monotone"
              dataKey="clicks"
              name="Clicks"
              stroke="#7357ff"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#7357ff",
                stroke: "#fff",
                strokeWidth: 3,
              }}
            />
            <Line
              type="monotone"
              dataKey="unique_visitors"
              name="Unique visitors"
              stroke="#27a879"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#27a879",
                stroke: "#fff",
                strokeWidth: 3,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      </div>}
      {view === "geo" && (
        <div className="card breakdown breakdownwide">
          <CardTitle title="Geography" sub="Country-level traffic and unique visitors" action={`${stats?.countries.length || 0} countries`} />
          {countryRows.length ? countryRows : <div className="emptymini">No geography data</div>}
        </div>
      )}
      {view === "devices" && (
        <div className="card breakdown breakdownwide">
          <CardTitle title="Devices & operating systems" sub="Desktop, mobile, Android and iOS traffic" action={`${stats?.devices?.length || 0} groups`} />
          {deviceRows.length ? deviceRows : <div className="emptymini">No device data</div>}
        </div>
      )}
      {view === "links" && (
        <div className="card breakdown breakdownwide">
          <CardTitle title="Link performance" sub="Select a link above to isolate its analytics" action={`${stats?.links?.length || 0} links`} />
          {linkRows.length ? linkRows : <div className="emptymini">No link traffic</div>}
        </div>
      )}
      {view === "visits" && (
        <div className="visitsview">
          <div className="tabletools">
            <div>
              <h3>Visit log</h3>
              <span>Raw redirect events</span>
            </div>
            <div className="visitactions">
              <button onClick={() => void exportCsv()}>Export CSV</button>
              <input
                placeholder="Search visits…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          <RecentClicks analytics={stats} links={data.links} />
          <div className="pagination">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span>
              Page <b>{page}</b> of <b>{pages}</b>
            </span>
            <button
              disabled={page >= pages || loading}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function RecentClicks({
  analytics,
  links,
  limit,
}: {
  analytics: AnalyticsData | null;
  links: Link[];
  limit?: number;
}) {
  const events = (analytics?.events || []).slice(0, limit);
  return (
    <div className="card clicktable">
      <table>
        <thead>
          <tr>
            <th>TIME</th>
            <th>LINK / ROUTE</th>
            <th>SOURCE / REFERRER</th>
            <th>GEO</th>
            <th>DEVICE / OS</th>
            <th>DESTINATION</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const link = links.find((l) => l.id === e.link_id);
            return (
              <tr key={e.id}>
                <td>
                  <b>{new Date(e.created_at).toLocaleDateString()}</b>
                  <small>{new Date(e.created_at).toLocaleTimeString()}</small>
                </td>
                <td>
                  <b>{link?.name || "Deleted link"}</b>
                  <small>
                    /{link?.slug || e.link_id} ·{" "}
                    {e.route_id ? "smart rule" : "default route"}
                  </small>
                </td>
                <td>
                  <b>{e.source}</b>
                  <small title={e.referrer}>{e.referrer}</small>
                </td>
                <td className="iconcell">
                  <span className="tableicon countryflagwrap">
                    <CountryFlag code={e.country} size={21} />
                  </span>
                  <span>
                    <b>
                      {[e.city, e.region]
                        .filter((x) => x && x !== "Unknown")
                        .join(", ") || e.country || "Unknown"}
                    </b>
                    <small>{e.country || "Unknown"}</small>
                  </span>
                </td>
                <td className="iconcell">
                  <span className="tableicon">
                    <DeviceIcon device={e.device} os={e.os} />
                  </span>
                  <span>
                    <b>{e.device} · {e.os}</b>
                    <small>{e.device_model} · {e.browser}</small>
                  </span>
                </td>
                <td>
                  <b className="destination" title={e.destination}>
                    {e.destination}
                  </b>
                  <small>
                    {e.route_id ? "Rule destination" : "Default destination"}
                  </small>
                </td>
              </tr>
            );
          })}
          {!events.length && (
            <tr>
              <td colSpan={6}>
                <div className="emptyrows">
                  <MousePointer2 />
                  <b>No click events yet</b>
                  <span>Use a live smart link to record the first visit.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
function SettingsPage() {
  return (
    <section className="content settings-workspace">
      <div className="pagebar">
        <div>
          <h2>Workspace settings</h2>
          <p>Keep the workspace identity and data policy in one clear place.</p>
        </div>
      </div>
      <div className="settingslayout">
        <div className="card form settings">
          <div className="settingsheading">
            <span className="metricicon"><Settings size={18} /></span>
            <span>
              <h3>General preferences</h3>
              <p>Names, reporting timezone and event retention.</p>
            </span>
          </div>
          <label>
            Workspace name
            <input defaultValue="Northstar Studio" />
          </label>
          <label>
            Timezone
            <select defaultValue="Europe/Berlin">
              <option>Europe/Berlin</option>
              <option>Europe/Samara</option>
              <option>UTC</option>
            </select>
          </label>
          <label>
            Data retention
            <select defaultValue="90">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </label>
          <button className="primary" type="button"><Save size={16} /> Save changes</button>
        </div>
      </div>
    </section>
  );
}
function LinkModal({
  domains,
  initial,
  close,
  notify,
  done,
}: {
  domains: Domain[];
  initial: Link | null;
  close: () => void;
  notify: (s: string) => void;
  done: () => void;
}) {
  const isEdit = !!initial;
  const exitPage = withExitPageDefaults({ ...(initial || {}) });
  const [landingOn, setLandingOn] = useState(Boolean(initial?.landing));
  const [mode, setMode] = useState(exitPage.mode);
  const [landingHeading, setLandingHeading] = useState(exitPage.heading);
  const [landingSubtext, setLandingSubtext] = useState(exitPage.subtext);
  const [landingButton, setLandingButton] = useState(exitPage.button);
  const [landingCopy, setLandingCopy] = useState(exitPage.copyLabel);
  const [landingDirect, setLandingDirect] = useState(exitPage.directLabel);
  const [landingCountdown, setLandingCountdown] = useState(String(exitPage.countdown));
  const [countdownError, setCountdownError] = useState("");
  const available = domains.filter((d) => d.status === "active");
  const [bulk, setBulk] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      name: f.get("name"),
      destination: f.get("destination"),
    };
    if (!isEdit) {
      body.slug = f.get("slug");
      body.domain = f.get("domain");
    }
    if (landingOn) {
      if (!isValidCountdownInput(landingCountdown)) {
        setCountdownError(`Auto-redirect must be at least ${EXIT_PAGE_DEFAULTS.countdown} seconds.`);
        return;
      }
      body.landing = true;
      body.landingMode = mode;
      if (mode === "app") body.landingScheme = f.get("landingScheme") || "";
      body.landingHeading = landingHeading;
      body.landingSubtext = landingSubtext;
      body.landingButton = landingButton;
      body.landingCopy = landingCopy;
      body.landingDirect = landingDirect;
      body.landingCountdown = normalizeCountdown(landingCountdown);
    } else {
      body.landing = false;
    }
    if (bulk && !isEdit) {
      body.prefix = String(f.get("slug") || "")
        .replace(/^\//, "")
        .replace(/\/$/, "");
      body.bulk = true;
    }
    const res = await fetch(
      bulk && !isEdit
        ? "/api/links/bulk"
        : isEdit
          ? "/api/links/" + initial!.id
          : "/api/links",
      {
        method: bulk && !isEdit ? "POST" : isEdit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      let message = "Could not save link";
      try {
        message = JSON.parse(text).error || message;
      } catch {
        if (text && !text.trimStart().startsWith("<")) message = text;
      }
      return notify(message);
    }
    done();
  };
  return (
    <div
      className="overlay"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form className="modal wide" onSubmit={submit}>
        <div>
          <span>
            <h2>{isEdit ? "Edit smart link" : "Create smart link"}</h2>
            <p>
              {isEdit
                ? "Update the destination or exit page settings."
                : "Choose exactly which connected domain will serve this link."}
            </p>
          </span>
          <button type="button" className="icon" onClick={close}>
            <X />
          </button>
        </div>
        <label>
          Link name
          <input
            name="name"
            defaultValue={initial?.name || ""}
            placeholder="Instagram campaign"
            required
          />
        </label>
        <label>
          Domain
          <select
            name="domain"
            defaultValue={initial?.domain || ""}
            disabled={isEdit}
            required
          >
            <option value="" disabled>
              Select an active domain…
            </option>
            {available.map((d) => (
              <option key={d.id} value={d.host}>
                {d.host}
              </option>
            ))}
          </select>
        </label>
        <label>
          {bulk ? "Bulk prefix" : "Short path"}
          <div className="prefix">
            <span>/</span>
            <input
              name="slug"
              defaultValue={initial?.slug || ""}
              placeholder={bulk ? "of" : "summer"}
              pattern="[a-zA-Z0-9_/-]*"
              required={bulk}
              disabled={isEdit}
            />
          </div>
          {!isEdit && (
            <span className="hint">
              {bulk
                ? "Any URL under this prefix redirects to the same destination (e.g. /of/a, /of/anything, /of/a/b)."
                : "Leave empty to redirect the domain root. Slash creates a nested path (e.g. of/jsjdc)."}
            </span>
          )}
        </label>
        <label>
          Default destination
          <input
            name="destination"
            defaultValue={initial?.destination || ""}
            type="url"
            placeholder="https://example.com/offer"
            required
          />
        </label>
        {!isEdit && (
          <label className="switchline bulkswitch">
            <span>
              <b>Bulk wildcard</b>
              <small>
                Use one prefix for unlimited paths, all leading to the same
                destination and statistics.
              </small>
            </span>
            <input
              type="checkbox"
              checked={bulk}
              onChange={(e) => setBulk(e.target.checked)}
            />
          </label>
        )}

        <div className="modalsect">
          <div className="secttitle">
            <span>EXIT PAGE</span>
            <small>
              Intercept in-app browsers and hand the visitor to the device's
              real browser — or straight into a native app.
            </small>
          </div>
          <label className="switchline">
            <span>
              <b>Smart exit page</b>
              <small>
                When the link is tapped inside Instagram, TikTok, Facebook, X or
                other in-app browsers, a branded page opens the destination
                outside the app. Normal browsers are redirected instantly.
              </small>
            </span>
            <input
              type="checkbox"
              checked={landingOn}
              onChange={(e) => setLandingOn(e.target.checked)}
            />
          </label>
          {landingOn && (
            <div className="landingbox">
              <label>
                Mode
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value === "app" ? "app" : "browser")}
                >
                  <option value="browser">Open in external browser</option>
                  <option value="app">Deep link into an app</option>
                </select>
              </label>
              {mode === "app" && (
                <label>
                  App deep link
                  <input
                    name="landingScheme"
                    defaultValue={initial?.landingScheme || ""}
                    placeholder="onlyfans://username"
                  />
                  <span className="hint">
                    Custom URL scheme (e.g. onlyfans://user). Opens the app when
                    installed, falls back to the destination otherwise.
                  </span>
                </label>
              )}
              <div className="fieldrow">
                <label>
                  Heading
                  <input
                    name="landingHeading"
                    value={landingHeading}
                    onChange={(e) => setLandingHeading(e.target.value)}
                    placeholder={EXIT_PAGE_DEFAULTS.heading}
                    maxLength={80}
                  />
                </label>
                <label>
                  Auto-redirect (sec)
                  <input
                    name="landingCountdown"
                    type="number"
                    min={3}
                    step={1}
                    value={landingCountdown}
                    onChange={(e) => {
                      setLandingCountdown(e.target.value);
                      setCountdownError(isValidCountdownInput(e.target.value) ? "" : "Auto-redirect must be at least 3 seconds.");
                    }}
                    onBlur={() => {
                      if (!isValidCountdownInput(landingCountdown)) {
                        setCountdownError("Auto-redirect must be at least 3 seconds.");
                        return;
                      }
                      setLandingCountdown(String(normalizeCountdown(landingCountdown)));
                      setCountdownError("");
                    }}
                    aria-invalid={Boolean(countdownError)}
                    aria-describedby={countdownError ? "landing-countdown-error" : undefined}
                  />
                  {countdownError && <span className="field-error" id="landing-countdown-error">{countdownError}</span>}
                </label>
              </div>
              <label>
                Subtext
                <input
                  name="landingSubtext"
                  value={landingSubtext}
                  onChange={(e) => setLandingSubtext(e.target.value)}
                  placeholder={EXIT_PAGE_DEFAULTS.subtext}
                  maxLength={220}
                />
              </label>
              <div className="fieldrow2">
                <label>
                  Button label
                  <input
                    name="landingButton"
                    value={landingButton}
                    onChange={(e) => setLandingButton(e.target.value)}
                    placeholder={EXIT_PAGE_DEFAULTS.button}
                    maxLength={40}
                  />
                </label>
                <label>
                  Copy button label
                  <input
                    name="landingCopy"
                    value={landingCopy}
                    onChange={(e) => setLandingCopy(e.target.value)}
                    placeholder={EXIT_PAGE_DEFAULTS.copyLabel}
                    maxLength={40}
                  />
                </label>
              </div>
              <label>
                Direct link label
                <input
                  name="landingDirect"
                  value={landingDirect}
                  onChange={(e) => setLandingDirect(e.target.value)}
                  placeholder={EXIT_PAGE_DEFAULTS.directLabel}
                  maxLength={40}
                />
              </label>
              <ExitPagePreview
                heading={landingHeading}
                subtext={landingSubtext}
                button={landingButton}
                copyLabel={landingCopy}
                directLabel={landingDirect}
                countdown={landingCountdown}
              />
            </div>
          )}
        </div>
        {!available.length && (
          <div className="autherror">
            Add and verify at least one domain first.
          </div>
        )}
        <div className="modalactions">
          <button type="button" onClick={close}>
            Cancel
          </button>
          <button className="primary" disabled={!available.length}>
            {isEdit ? "Save changes" : "Create link"}
          </button>
        </div>
      </form>
    </div>
  );
}
function AuthScreen({
  needsSetup,
  done,
}: {
  needsSetup: boolean;
  done: () => void;
}) {
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const password = String(new FormData(e.currentTarget).get("password"));
    const res = await fetch(
      needsSetup ? "/api/auth/setup" : "/api/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );
    if (res.ok) return done();
    setError((await res.json()).error || "Authentication failed");
  };
  return (
    <div className="authpage">
      <form className="authcard" onSubmit={submit}>
        <div className="brandmark">
          <Route />
        </div>
        <h1>{needsSetup ? "Secure your admin" : "Welcome back"}</h1>
        <p>
          {needsSetup
            ? "Create the first administrator password. Use at least 10 characters."
            : "Sign in to manage domains, links and analytics."}
        </p>
        <label>
          Admin password
          <input
            name="password"
            type="password"
            minLength={10}
            autoFocus
            autoComplete={needsSetup ? "new-password" : "current-password"}
            required
          />
        </label>
        {error && <div className="autherror">{error}</div>}
        <button className="primary">
          {needsSetup ? "Create password" : "Sign in"}
        </button>
        <small>
          <ShieldCheck size={14} />
          HTTP-only session · 24 hour expiry
        </small>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

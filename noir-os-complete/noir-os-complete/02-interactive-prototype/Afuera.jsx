import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, LayoutGrid, Calendar as CalIcon, Table as TableIcon, BarChart3,
  Sparkles, Megaphone, ShieldCheck, Palette, Image as ImageIcon, Users, Zap,
  Search, Bell, Plus, Filter, MoreHorizontal, ChevronDown, ArrowUpRight, Clock,
  MessageSquare, Paperclip, GripVertical, Send, Command, X, CheckCircle2, Circle,
  TrendingUp, Hash, Wand2, Menu, FolderOpen, FileText, ChevronLeft, ChevronRight,
  Layers, Check, ArrowRight, Dot, Star, Play, Mail, Link2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, RadialBarChart, RadialBar, PieChart, Pie
} from "recharts";

/* ============================== DESIGN SYSTEM ============================== *
 * Afuera — "outward, open air". The signature is the horizon: a cool azure→
 * warm-dawn gradient. Cool = the human workflow. Warm = where AI helps.
 * Everything else stays quiet, dense, and precise. Apple-calm, ops-console
 * exactness (monospace for data), no cream/terracotta, no acid-green.
 * ========================================================================== */
const CSS = `
:root{
  --canvas:#F3F5F8; --surface:#FFFFFF; --surface-2:#FAFBFC; --surface-3:#F6F8FA;
  --ink:#171A21; --ink-2:#4B515E; --ink-3:#878E9C; --ink-4:#AEB4C0;
  --line:#E7EAF0; --line-2:#EFF2F6;
  --accent:#2E63F6; --accent-ink:#1D4ED8; --accent-soft:#EAF0FE; --accent-soft-2:#F4F7FF;
  --ok:#12B76A; --ok-soft:#E6F7EF; --warn:#F79009; --warn-soft:#FEF3E2; --bad:#F04438; --bad-soft:#FDECEC;
  --dawn-a:#5B8CFF; --dawn-b:#FFB27A; --ai-a:#FF9F6B; --ai-b:#FF6F91;
  --font:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono","JetBrains Mono","Cascadia Code",Menlo,monospace;
  --sh-1:0 1px 2px rgba(16,18,29,.05);
  --sh-2:0 1px 2px rgba(16,18,29,.05), 0 8px 24px -14px rgba(16,18,29,.18);
  --sh-3:0 2px 4px rgba(16,18,29,.06), 0 24px 48px -20px rgba(16,18,29,.28);
}
*{box-sizing:border-box}
.afa{font-family:var(--font);color:var(--ink);background:var(--canvas);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;height:100%;}
.afa button{font-family:inherit;cursor:pointer}
.mono{font-family:var(--mono);font-feature-settings:"tnum" 1;letter-spacing:-.01em}
.afa ::-webkit-scrollbar{width:10px;height:10px}
.afa ::-webkit-scrollbar-thumb{background:#D5DAE3;border-radius:20px;border:3px solid transparent;background-clip:content-box}
.afa ::-webkit-scrollbar-thumb:hover{background:#BCC3CF;background-clip:content-box}
.afa :focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:8px}

/* shell */
.shell{display:grid;grid-template-columns:236px 1fr;height:100vh;overflow:hidden}
.rail{background:var(--surface);border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0}
.brand{display:flex;align-items:center;gap:10px;padding:16px 16px 12px}
.mark{width:30px;height:30px;border-radius:9px;position:relative;overflow:hidden;box-shadow:var(--sh-1);flex:none}
.mark:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,var(--dawn-a),var(--dawn-b))}
.mark:after{content:"";position:absolute;left:0;right:0;bottom:0;height:42%;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.55));backdrop-filter:blur(1px)}
.brand h1{font-size:16px;font-weight:650;letter-spacing:-.02em;margin:0}
.brand .sub{font-size:11px;color:var(--ink-3);letter-spacing:.02em;margin-top:-1px}
.ws{margin:2px 12px 8px;padding:8px 10px;border:1px solid var(--line);border-radius:11px;display:flex;align-items:center;gap:9px;background:var(--surface-2);cursor:pointer;transition:.15s}
.ws:hover{background:var(--surface-3)}
.ws-badge{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:#fff;font-weight:700;font-size:12px;flex:none}
.ws .n{font-size:12.5px;font-weight:600;line-height:1.1}
.ws .r{font-size:10.5px;color:var(--ink-3)}
.nav{padding:6px 10px;overflow-y:auto;flex:1;min-height:0}
.nav-h{font-size:10.5px;font-weight:650;color:var(--ink-4);text-transform:uppercase;letter-spacing:.07em;padding:12px 8px 6px}
.nav-i{display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:9px;font-size:13px;color:var(--ink-2);font-weight:500;transition:.13s;position:relative;width:100%;background:none;border:none;text-align:left}
.nav-i:hover{background:var(--surface-3);color:var(--ink)}
.nav-i.on{background:var(--accent-soft);color:var(--accent-ink);font-weight:600}
.nav-i .ct{margin-left:auto;font-size:11px;color:var(--ink-4);font-family:var(--mono)}
.nav-i.on .ct{color:var(--accent)}
.rail-foot{border-top:1px solid var(--line);padding:10px 12px;display:flex;align-items:center;gap:9px}

/* top bar */
.main{min-width:0;display:flex;flex-direction:column;min-height:0;position:relative}
.top{height:56px;background:var(--surface);border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;padding:0 18px;flex:none}
.horizon{height:2px;background:linear-gradient(90deg,var(--dawn-a),var(--dawn-b) 45%,transparent);opacity:.9;flex:none}
.crumb{font-size:14.5px;font-weight:640;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
.crumb .k{font-size:11px;color:var(--ink-3);font-weight:500;font-family:var(--mono);background:var(--surface-3);padding:2px 7px;border-radius:6px}
.searchbox{margin-left:6px;flex:1;max-width:420px;display:flex;align-items:center;gap:8px;background:var(--surface-3);border:1px solid transparent;border-radius:10px;padding:7px 11px;color:var(--ink-3);transition:.15s;cursor:text}
.searchbox:hover{background:#F0F3F7}
.searchbox .kbd{margin-left:auto;font-size:10.5px;font-family:var(--mono);background:var(--surface);border:1px solid var(--line);border-radius:5px;padding:1px 5px;color:var(--ink-3)}
.searchbox span{font-size:13px}
.top-r{margin-left:auto;display:flex;align-items:center;gap:6px}
.iconbtn{width:34px;height:34px;border-radius:9px;border:1px solid transparent;background:none;display:grid;place-items:center;color:var(--ink-2);transition:.13s;position:relative}
.iconbtn:hover{background:var(--surface-3);color:var(--ink)}
.dotbadge{position:absolute;top:7px;right:8px;width:6px;height:6px;border-radius:50%;background:var(--bad);border:1.5px solid var(--surface)}
.ai-btn{display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:10px;color:#fff;font-size:12.5px;font-weight:600;border:none;background:linear-gradient(120deg,var(--ai-a),var(--ai-b));box-shadow:0 4px 14px -6px rgba(255,111,145,.7);transition:.15s}
.ai-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px -8px rgba(255,111,145,.8)}
.avatar{width:30px;height:30px;border-radius:50%;color:#fff;font-weight:650;font-size:12px;display:grid;place-items:center;flex:none;box-shadow:var(--sh-1)}

/* segmented view switch */
.seg{display:inline-flex;background:var(--surface-3);border-radius:10px;padding:3px;gap:2px}
.seg button{border:none;background:none;font-size:12.5px;font-weight:550;color:var(--ink-2);padding:5px 11px;border-radius:8px;display:flex;align-items:center;gap:6px;transition:.13s}
.seg button.on{background:var(--surface);color:var(--ink);box-shadow:var(--sh-1)}
.seg button:hover:not(.on){color:var(--ink)}

/* content area */
.body{flex:1;min-height:0;overflow:auto;position:relative}
.pad{padding:22px 26px 40px}
.viewbar{display:flex;align-items:center;gap:12px;padding:16px 26px 6px;flex-wrap:wrap}
.view-title{font-size:19px;font-weight:670;letter-spacing:-.02em}
.chipbtn{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:550;color:var(--ink-2);background:var(--surface);border:1px solid var(--line);padding:6px 11px;border-radius:9px;transition:.13s}
.chipbtn:hover{border-color:#D6DBE4;background:var(--surface-2)}
.primary{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:#fff;background:var(--accent);border:none;padding:7px 13px;border-radius:9px;transition:.15s;box-shadow:0 3px 10px -4px rgba(46,99,246,.6)}
.primary:hover{background:var(--accent-ink)}
.fadein{animation:fade .3s ease}
@keyframes fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

/* cards */
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--sh-1)}
.card-h{display:flex;align-items:center;gap:8px;padding:14px 16px 8px}
.card-h h3{font-size:13px;font-weight:640;letter-spacing:-.01em;margin:0}
.card-h .more{margin-left:auto}

.grid{display:grid;gap:16px}
.badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:7px;line-height:1.2;white-space:nowrap}
.pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;line-height:1.4}
.sdot{width:7px;height:7px;border-radius:50%;flex:none}
.meta{font-size:11px;color:var(--ink-3);font-family:var(--mono)}

/* kanban */
.board{display:flex;gap:14px;padding:16px 26px 34px;overflow-x:auto;min-height:100%;align-items:flex-start}
.col{width:280px;flex:none;display:flex;flex-direction:column;gap:10px}
.col-h{display:flex;align-items:center;gap:8px;padding:2px 4px}
.col-h .nm{font-size:12.5px;font-weight:640}
.col-h .ct{font-size:11px;color:var(--ink-3);font-family:var(--mono)}
.col-h .wip{margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--ink-4);border:1px solid var(--line);border-radius:6px;padding:1px 5px}
.col-h .wip.over{color:var(--bad);border-color:var(--bad-soft);background:var(--bad-soft)}
.drop{background:transparent;border-radius:12px;display:flex;flex-direction:column;gap:9px;min-height:60px;padding:2px;transition:.15s;flex:1}
.drop.over{background:var(--accent-soft-2);outline:1.5px dashed var(--accent);outline-offset:-1px}
.kcard{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:11px 12px;box-shadow:var(--sh-1);cursor:grab;transition:.14s;position:relative}
.kcard:hover{box-shadow:var(--sh-2);border-color:#DCE1EA;transform:translateY(-1px)}
.kcard:active{cursor:grabbing}
.kcard.dragging{opacity:.4}
.kcard .t{font-size:13px;font-weight:600;line-height:1.35;letter-spacing:-.01em;margin:2px 0 9px}
.kcard .r{display:flex;align-items:center;gap:8px;margin-top:9px}
.kcard .r .sp{margin-left:auto}
.thumb{height:96px;border-radius:9px;margin-bottom:10px;position:relative;overflow:hidden}
.thumb .ty{position:absolute;left:8px;top:8px}
.aiscore{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-family:var(--mono);font-weight:600;padding:2px 6px;border-radius:6px}
.addcard{border:1px dashed var(--line);border-radius:11px;padding:9px;font-size:12px;color:var(--ink-3);font-weight:550;display:flex;align-items:center;gap:6px;justify-content:center;transition:.13s;background:none;width:100%}
.addcard:hover{border-color:var(--accent);color:var(--accent);background:var(--accent-soft-2)}

/* dashboard */
.kpi{padding:15px 16px}
.kpi .lbl{font-size:11px;color:var(--ink-3);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.kpi .val{font-size:26px;font-weight:700;letter-spacing:-.03em;margin-top:6px;font-family:var(--mono)}
.kpi .dl{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;margin-top:4px}
.rowitem{display:flex;align-items:center;gap:11px;padding:9px 16px;border-top:1px solid var(--line-2);transition:.12s}
.rowitem:hover{background:var(--surface-2)}
.rowitem .tt{font-size:12.5px;font-weight:560;line-height:1.3;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.meter{height:7px;border-radius:20px;background:var(--surface-3);overflow:hidden;position:relative}
.meter i{position:absolute;inset:0;border-radius:20px;background:linear-gradient(90deg,var(--dawn-a),var(--dawn-b))}
.airec{display:flex;gap:10px;padding:11px 14px;border-radius:11px;background:linear-gradient(180deg,#FFF7F2,#FFFDFC);border:1px solid #FBE2D4;margin:0 14px 10px}
.airec .ico{width:26px;height:26px;border-radius:8px;flex:none;display:grid;place-items:center;color:#fff;background:linear-gradient(120deg,var(--ai-a),var(--ai-b))}
.airec p{font-size:12px;color:var(--ink-2);line-height:1.4;margin:0}
.airec b{color:var(--ink);font-weight:640}
.actline{display:flex;gap:9px;align-items:flex-start;padding:8px 16px}
.actline .dotcol{width:26px;display:flex;flex-direction:column;align-items:center;flex:none;padding-top:2px}
.actline .ln{width:1.5px;flex:1;background:var(--line);margin-top:3px}

/* calendar */
.calgrid{display:grid;grid-template-columns:repeat(7,1fr);border-left:1px solid var(--line);border-top:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--surface)}
.caldow{padding:8px 10px;font-size:10.5px;font-weight:650;color:var(--ink-3);text-transform:uppercase;letter-spacing:.05em;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--surface-2)}
.calcell{min-height:118px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);padding:6px;display:flex;flex-direction:column;gap:4px;transition:.13s}
.calcell.off{background:var(--surface-2)}
.calcell.over{background:var(--accent-soft-2)}
.calcell .dn{font-size:11.5px;font-weight:600;color:var(--ink-2);font-family:var(--mono)}
.calcell .dn.today{background:var(--accent);color:#fff;width:22px;height:22px;border-radius:50%;display:grid;place-items:center}
.calchip{font-size:10.5px;font-weight:600;padding:3px 7px;border-radius:6px;display:flex;align-items:center;gap:5px;cursor:grab;line-height:1.2;color:#fff;overflow:hidden}
.calchip .cd{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.85);flex:none}
.calchip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* table */
.tbl{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px}
.tbl th{text-align:left;font-size:10.5px;font-weight:640;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em;padding:10px 14px;border-bottom:1px solid var(--line);cursor:pointer;user-select:none;white-space:nowrap}
.tbl th:hover{color:var(--ink)}
.tbl td{padding:11px 14px;border-bottom:1px solid var(--line-2);vertical-align:middle}
.tbl tr:hover td{background:var(--surface-2)}
.tbl .tt{font-weight:600;letter-spacing:-.01em}

/* generic module page */
.section-h{font-size:12px;font-weight:660;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-3);margin:2px 0 12px}
.swatch{height:70px;border-radius:11px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}
.assettile{border-radius:12px;overflow:hidden;border:1px solid var(--line);background:var(--surface);box-shadow:var(--sh-1);transition:.14s}
.assettile:hover{box-shadow:var(--sh-2);transform:translateY(-2px)}
.assetimg{height:120px;position:relative}
.autonode{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:var(--sh-1)}
.toggle{width:34px;height:20px;border-radius:20px;background:var(--line);position:relative;transition:.15s;flex:none;border:none}
.toggle.on{background:var(--accent)}
.toggle i{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:.15s;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.toggle.on i{left:16px}

/* AI drawer */
.scrim{position:fixed;inset:0;background:rgba(17,20,30,.28);backdrop-filter:blur(2px);z-index:40;animation:fade .2s}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(460px,94vw);background:var(--surface);border-left:1px solid var(--line);z-index:50;display:flex;flex-direction:column;box-shadow:var(--sh-3);animation:slidein .28s cubic-bezier(.2,.8,.2,1)}
@keyframes slidein{from{transform:translateX(30px);opacity:.6}to{transform:none;opacity:1}}
.ai-head{padding:16px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:11px}
.ai-orb{width:34px;height:34px;border-radius:11px;background:linear-gradient(120deg,var(--ai-a),var(--ai-b));display:grid;place-items:center;color:#fff;box-shadow:0 6px 16px -6px rgba(255,111,145,.7)}
.ai-body{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:14px}
.ai-msg{max-width:88%;font-size:13px;line-height:1.5}
.ai-msg.u{align-self:flex-end;background:var(--accent);color:#fff;padding:9px 13px;border-radius:14px 14px 4px 14px}
.ai-msg.a{align-self:flex-start;color:var(--ink-2)}
.ai-msg.a .bubble{background:var(--surface-3);border-radius:14px 14px 14px 4px;padding:11px 14px;color:var(--ink)}
.promptchip{font-size:11.5px;font-weight:560;color:var(--ink-2);background:var(--surface-3);border:1px solid var(--line);padding:6px 10px;border-radius:9px;transition:.12s;text-align:left}
.promptchip:hover{border-color:var(--ai-b);color:var(--ink);background:#FFF7F3}
.ai-foot{border-top:1px solid var(--line);padding:12px 14px}
.ai-input{display:flex;align-items:flex-end;gap:8px;background:var(--surface-3);border:1px solid var(--line);border-radius:13px;padding:8px 8px 8px 13px}
.ai-input textarea{flex:1;border:none;background:none;resize:none;font-family:inherit;font-size:13px;color:var(--ink);max-height:100px;line-height:1.4;outline:none}
.ai-send{width:32px;height:32px;border-radius:9px;border:none;background:linear-gradient(120deg,var(--ai-a),var(--ai-b));color:#fff;display:grid;place-items:center;flex:none;transition:.13s}
.ai-send:disabled{opacity:.4}
.cursorblink{display:inline-block;width:2px;height:14px;background:var(--ai-b);margin-left:1px;vertical-align:text-bottom;animation:bl 1s steps(2) infinite}
@keyframes bl{50%{opacity:0}}

/* command palette */
.cmdwrap{position:fixed;inset:0;z-index:60;display:flex;justify-content:center;align-items:flex-start;padding-top:14vh;background:rgba(17,20,30,.3);backdrop-filter:blur(3px);animation:fade .15s}
.cmd{width:min(560px,92vw);background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--sh-3);overflow:hidden}
.cmd-in{display:flex;align-items:center;gap:10px;padding:15px 18px;border-bottom:1px solid var(--line)}
.cmd-in input{flex:1;border:none;outline:none;font-size:15px;font-family:inherit;color:var(--ink);background:none}
.cmd-list{max-height:340px;overflow-y:auto;padding:6px}
.cmd-i{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:10px;font-size:13px;color:var(--ink);transition:.1s}
.cmd-i.sel,.cmd-i:hover{background:var(--surface-3)}
.cmd-i .kind{margin-left:auto;font-size:10.5px;color:var(--ink-4);font-family:var(--mono)}

.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 20px;color:var(--ink-3)}
.empty .ic{width:52px;height:52px;border-radius:14px;background:var(--surface-3);display:grid;place-items:center;margin-bottom:14px;color:var(--ink-4)}

@media (max-width:900px){
  .shell{grid-template-columns:1fr}
  .rail{position:fixed;left:0;top:0;bottom:0;width:236px;z-index:70;transform:translateX(-100%);transition:.24s;box-shadow:var(--sh-3)}
  .rail.open{transform:none}
  .searchbox{display:none}
  .menu-btn{display:grid !important}
}
.menu-btn{display:none}
`;

/* ============================== DATA ============================== */
const now = new Date();
const dISO = (d) => d.toISOString().slice(0, 10);
const rel = (days) => { const d = new Date(now); d.setDate(d.getDate() + days); return d; };
const fmtDay = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const STAGES = [
  { k: "ideas", n: "Ideas", c: "#8B93A7" },
  { k: "research", n: "Research", c: "#6E8BEF" },
  { k: "writing", n: "Writing", c: "#2E63F6", wip: 4 },
  { k: "design", n: "Design", c: "#8B5CF6", wip: 3 },
  { k: "review", n: "Review", c: "#F79009" },
  { k: "legal", n: "Legal", c: "#B4530A" },
  { k: "approval", n: "Approval", c: "#EC4899" },
  { k: "scheduled", n: "Scheduled", c: "#0EA5A4" },
  { k: "published", n: "Published", c: "#12B76A" },
  { k: "repurpose", n: "Repurpose", c: "#0891B2" },
  { k: "archived", n: "Archived", c: "#98A2B3" },
];
const stage = (k) => STAGES.find((s) => s.k === k);

const CAMPAIGNS = [
  { id: "c1", n: "Spring Product Launch", c: "#2E63F6", obj: "Drive pre-orders for the Aurora line", health: 82, status: "On track", kpi: "Pre-orders", target: 2500, current: 1840, window: "Mar 1 – Apr 15" },
  { id: "c2", n: "Always-On Brand", c: "#12B76A", obj: "Sustain reach and community growth", health: 91, status: "Healthy", kpi: "Weekly reach", target: 400000, current: 372000, window: "Ongoing" },
  { id: "c3", n: "Q3 Thought Leadership", c: "#8B5CF6", obj: "Establish authority on cold-weather design", health: 64, status: "Needs attention", kpi: "Qualified leads", target: 600, current: 268, window: "Jul 1 – Sep 30" },
  { id: "c4", n: "Trail Stories", c: "#F79009", obj: "UGC-led storytelling from real hikes", health: 77, status: "On track", kpi: "Saves", target: 50000, current: 34500, window: "Rolling" },
];
const camp = (id) => CAMPAIGNS.find((c) => c.id === id);

const TEAM = [
  { id: "sam", n: "Sam Okafor", i: "SO", c: "#2E63F6", role: "You · Content lead", load: 62, on: true },
  { id: "maya", n: "Maya Reyes", i: "MR", c: "#EC4899", role: "Design lead", load: 78, on: true },
  { id: "theo", n: "Theo Kallas", i: "TK", c: "#8B5CF6", role: "Writer", load: 84, on: true },
  { id: "priya", n: "Priya Shah", i: "PS", c: "#0EA5A4", role: "Social lead", load: 71, on: false },
  { id: "dan", n: "Dan Obi", i: "DO", c: "#F79009", role: "Video producer", load: 55, on: true },
  { id: "lena", n: "Lena Vos", i: "LV", c: "#12B76A", role: "Marketing manager · Approver", load: 40, on: false },
];
const person = (id) => TEAM.find((t) => t.id === id);

const CHANNELS = {
  Instagram: "#E1306C", LinkedIn: "#0A66C2", X: "#111111", TikTok: "#111111",
  Blog: "#2E63F6", Email: "#F79009", YouTube: "#FF0000",
};

let uid = 100;
const seed = [
  ["Sunrise summit reel — 15s vertical", "Video", "Instagram", "design", "c4", "dan", rel(2), 82, 3, 2],
  ["Trail-tested: 3 packs for winter thru-hikes", "Article", "Blog", "writing", "c1", "theo", rel(4), 74, 1, 0],
  ["Base layer buying guide", "Email", "Email", "review", "c2", "priya", rel(1), 88, 5, 1],
  ["Why we switched to recycled zippers", "Post", "LinkedIn", "approval", "c3", "theo", rel(1), 91, 2, 0],
  ["UGC repost — @wildlines summit shot", "Post", "Instagram", "scheduled", "c2", "priya", rel(1), 79, 0, 1],
  ["Spring collection teaser", "Ad", "Instagram", "legal", "c1", "maya", rel(3), 68, 4, 3],
  ["Founder Q&A: designing for the cold", "Video", "YouTube", "ideas", "c3", "dan", rel(9), 55, 0, 0],
  ["Weekend gear giveaway", "Post", "X", "writing", "c2", "priya", rel(2), 63, 1, 0],
  ["How to layer for −10°C", "Article", "Blog", "published", "c2", "theo", rel(-3), 94, 8, 1],
  ["Pack-fit explainer carousel", "Post", "Instagram", "design", "c1", "maya", rel(3), 77, 2, 4],
  ["Ambassador spotlight: Noa", "Post", "LinkedIn", "research", "c3", "theo", rel(6), 60, 0, 0],
  ["Holiday gift guide (repurpose)", "Article", "Blog", "repurpose", "c4", "theo", rel(-20), 85, 3, 1],
  ["New trail app — launch announcement", "Post", "Instagram", "approval", "c1", "priya", rel(2), 80, 1, 2],
  ["Restock: Aurora down jacket", "Email", "Email", "scheduled", "c2", "priya", rel(3), 71, 0, 0],
  ["Behind the seams — factory tour", "Video", "YouTube", "review", "c3", "dan", rel(5), 66, 2, 1],
  ["Winter care tips thread", "Post", "X", "archived", "c2", "priya", rel(-9), 58, 4, 0],
  ["First-frost photo dump", "Post", "Instagram", "scheduled", "c4", "maya", rel(0), 73, 1, 6],
  ["Sizing FAQ short", "Video", "TikTok", "writing", "c1", "dan", rel(5), 62, 0, 0],
].map(([title, type, channel, stg, cid, aid, due, ai, cm, at]) => ({
  id: "t" + (uid++), title, type, channel, stage: stg, campaign: cid, assignee: aid,
  due: dISO(due), publishAt: ["scheduled", "published"].includes(stg) ? dISO(due) : null,
  ai, comments: cm, attachments: at,
  priority: ai > 85 ? "High" : ai > 65 ? "Medium" : "Low",
}));

const thumbGrad = (item) => {
  const a = camp(item.campaign)?.c || "#2E63F6";
  const b = CHANNELS[item.channel] || "#8B5CF6";
  return `linear-gradient(135deg, ${a}, ${b})`;
};

/* ============================== PRIMITIVES ============================== */
const Avatar = ({ id, size = 24 }) => {
  const p = person(id) || { i: "?", c: "#98A2B3" };
  return <div className="avatar" style={{ width: size, height: size, background: p.c, fontSize: size * 0.42 }} title={p.n}>{p.i}</div>;
};
const StageDot = ({ k }) => <span className="sdot" style={{ background: stage(k)?.c }} />;
const AiScore = ({ v }) => {
  const col = v >= 85 ? "var(--ok)" : v >= 65 ? "var(--warn)" : "var(--ink-3)";
  const bg = v >= 85 ? "var(--ok-soft)" : v >= 65 ? "var(--warn-soft)" : "var(--surface-3)";
  return <span className="aiscore" style={{ color: col, background: bg }}><Sparkles size={10} />{v}</span>;
};
const ChannelBadge = ({ ch }) => (
  <span className="badge" style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}>
    <span className="sdot" style={{ background: CHANNELS[ch] }} />{ch}
  </span>
);
const TypeBadge = ({ t }) => (
  <span className="badge" style={{ background: "rgba(255,255,255,.9)", color: "var(--ink)", backdropFilter: "blur(4px)" }}>{t}</span>
);

/* ============================== KANBAN ============================== */
function Kanban({ items, move, open }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const byStage = useMemo(() => {
    const m = {}; STAGES.forEach((s) => (m[s.k] = []));
    items.forEach((it) => m[it.stage]?.push(it));
    return m;
  }, [items]);

  return (
    <div className="board fadein">
      {STAGES.map((s) => {
        const list = byStage[s.k] || [];
        const over = s.wip && list.length > s.wip;
        return (
          <div className="col" key={s.k}>
            <div className="col-h">
              <span className="sdot" style={{ background: s.c }} />
              <span className="nm">{s.n}</span>
              <span className="ct">{list.length}</span>
              {s.wip && <span className={"wip" + (over ? " over" : "")}>WIP {list.length}/{s.wip}</span>}
            </div>
            <div
              className={"drop" + (overCol === s.k ? " over" : "")}
              onDragOver={(e) => { e.preventDefault(); setOverCol(s.k); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) setOverCol(null); }}
              onDrop={() => { if (dragId) move(dragId, s.k); setOverCol(null); setDragId(null); }}
            >
              {list.map((it) => (
                <div
                  key={it.id}
                  className={"kcard" + (dragId === it.id ? " dragging" : "")}
                  draggable
                  onDragStart={() => setDragId(it.id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onClick={() => open(it)}
                >
                  {["design", "scheduled", "published", "repurpose"].includes(it.stage) && (
                    <div className="thumb" style={{ background: thumbGrad(it) }}>
                      <div className="ty"><TypeBadge t={it.type} /></div>
                      {it.type === "Video" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff" }}><Play size={22} fill="#fff" /></div>}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="pill" style={{ background: camp(it.campaign).c + "18", color: camp(it.campaign).c }}>
                      <Dot size={14} style={{ margin: -4 }} />{camp(it.campaign).n.split(" ")[0]}
                    </span>
                    {it.priority === "High" && <span className="pill" style={{ background: "var(--bad-soft)", color: "var(--bad)" }}>High</span>}
                  </div>
                  <div className="t">{it.title}</div>
                  <div className="r">
                    <ChannelBadge ch={it.channel} />
                    <span className="sp" />
                    <AiScore v={it.ai} />
                  </div>
                  <div className="r" style={{ marginTop: 8, borderTop: "1px solid var(--line-2)", paddingTop: 9 }}>
                    <Avatar id={it.assignee} />
                    <span className="meta" style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{fmtDay(new Date(it.due))}</span>
                    <span className="sp" />
                    {it.comments > 0 && <span className="meta" style={{ display: "flex", alignItems: "center", gap: 3 }}><MessageSquare size={11} />{it.comments}</span>}
                    {it.attachments > 0 && <span className="meta" style={{ display: "flex", alignItems: "center", gap: 3 }}><Paperclip size={11} />{it.attachments}</span>}
                  </div>
                </div>
              ))}
              <button className="addcard"><Plus size={13} />Add card</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================== CALENDAR ============================== */
function CalendarView({ items, reschedule, open }) {
  const [mOff, setMOff] = useState(0);
  const [over, setOver] = useState(null);
  const [drag, setDrag] = useState(null);
  const base = new Date(now.getFullYear(), now.getMonth() + mOff, 1);
  const first = new Date(base.getFullYear(), base.getMonth(), 1);
  const startDow = first.getDay();
  const days = [];
  const start = new Date(first); start.setDate(1 - startDow);
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d); }
  const scheduled = items.filter((i) => i.publishAt);
  const onDay = (d) => scheduled.filter((i) => i.publishAt === dISO(d));
  const todayISO = dISO(now);

  return (
    <div className="pad fadein">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <button className="iconbtn" onClick={() => setMOff(mOff - 1)}><ChevronLeft size={17} /></button>
        <div className="view-title" style={{ minWidth: 190 }}>{base.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
        <button className="iconbtn" onClick={() => setMOff(mOff + 1)}><ChevronRight size={17} /></button>
        <button className="chipbtn" onClick={() => setMOff(0)}>Today</button>
        <span className="meta" style={{ marginLeft: "auto" }}>Drag a chip to reschedule · colours map to channel</span>
      </div>
      <div className="calgrid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div className="caldow" key={d}>{d}</div>)}
        {days.map((d, i) => {
          const off = d.getMonth() !== base.getMonth();
          const iso = dISO(d);
          return (
            <div key={i}
              className={"calcell" + (off ? " off" : "") + (over === iso ? " over" : "")}
              onDragOver={(e) => { e.preventDefault(); setOver(iso); }}
              onDrop={() => { if (drag) reschedule(drag, iso); setOver(null); setDrag(null); }}
            >
              <div className={"dn" + (iso === todayISO ? " today" : "")}>{d.getDate()}</div>
              {onDay(d).map((it) => (
                <div key={it.id} className="calchip" draggable
                  style={{ background: CHANNELS[it.channel] }}
                  onDragStart={() => setDrag(it.id)}
                  onClick={() => open(it)}
                >
                  {it.stage === "published" ? <Check size={10} /> : <span className="cd" />}
                  <span>{it.title}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== TABLE ============================== */
function TableView({ items, open }) {
  const [sort, setSort] = useState({ k: "due", dir: 1 });
  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let x = a[sort.k], y = b[sort.k];
      if (sort.k === "assignee") { x = person(a.assignee).n; y = person(b.assignee).n; }
      if (sort.k === "campaign") { x = camp(a.campaign).n; y = camp(b.campaign).n; }
      return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
    });
    return arr;
  }, [items, sort]);
  const th = (k, label) => (
    <th onClick={() => setSort({ k, dir: sort.k === k ? -sort.dir : 1 })}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{label}
        {sort.k === k && <ChevronDown size={12} style={{ transform: sort.dir < 0 ? "rotate(180deg)" : "none" }} />}</span>
    </th>
  );
  return (
    <div className="pad fadein">
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead><tr>
              {th("title", "Content")}{th("type", "Type")}{th("channel", "Channel")}
              {th("stage", "Stage")}{th("campaign", "Campaign")}{th("assignee", "Owner")}
              {th("due", "Due")}{th("ai", "AI score")}
            </tr></thead>
            <tbody>
              {sorted.map((it) => (
                <tr key={it.id} style={{ cursor: "pointer" }} onClick={() => open(it)}>
                  <td className="tt" style={{ maxWidth: 320 }}>{it.title}</td>
                  <td><span className="meta">{it.type}</span></td>
                  <td><ChannelBadge ch={it.channel} /></td>
                  <td><span className="badge" style={{ background: stage(it.stage).c + "18", color: stage(it.stage).c }}><StageDot k={it.stage} />{stage(it.stage).n}</span></td>
                  <td><span className="pill" style={{ background: camp(it.campaign).c + "16", color: camp(it.campaign).c }}>{camp(it.campaign).n}</span></td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar id={it.assignee} size={22} /><span style={{ fontSize: 12 }}>{person(it.assignee).n.split(" ")[0]}</span></div></td>
                  <td><span className="meta">{fmtDay(new Date(it.due))}</span></td>
                  <td><AiScore v={it.ai} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
const spark = [42, 48, 45, 60, 58, 72, 80, 76, 92, 88, 104].map((v, i) => ({ i, v }));
function Dashboard({ items, open, setModule, setView }) {
  const wip = items.filter((i) => !["published", "archived", "scheduled"].includes(i.stage));
  const approvals = items.filter((i) => ["review", "legal", "approval"].includes(i.stage));
  const deadlines = [...items].filter((i) => new Date(i.due) >= new Date(dISO(now)) && !["published", "archived"].includes(i.stage))
    .sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const scheduled = items.filter((i) => i.stage === "scheduled").sort((a, b) => a.publishAt.localeCompare(b.publishAt));
  const activity = [
    { who: "maya", txt: "moved <b>Pack-fit explainer carousel</b> to Design", t: "8m" },
    { who: "lena", txt: "approved <b>How to layer for −10°C</b>", t: "22m" },
    { who: "theo", txt: "commented on <b>Recycled zippers</b>", t: "1h" },
    { who: "priya", txt: "scheduled <b>UGC repost — @wildlines</b>", t: "2h" },
    { who: "dan", txt: "uploaded 2 assets to <b>Sunrise summit reel</b>", t: "3h" },
  ];

  const Kpi = ({ lbl, val, dl, up, onClick }) => (
    <div className="card kpi" style={{ cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div className="lbl">{lbl}</div>
      <div className="val">{val}</div>
      <div className="dl" style={{ color: up ? "var(--ok)" : "var(--ink-3)" }}>
        {up != null && <TrendingUp size={13} style={{ transform: up ? "none" : "scaleY(-1)" }} />}{dl}
      </div>
    </div>
  );

  return (
    <div className="pad fadein">
      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 16 }}>
        <Kpi lbl="Work in progress" val={wip.length} dl={`across ${new Set(wip.map(i=>i.campaign)).size} campaigns`} onClick={() => { setModule("kanban"); }} />
        <Kpi lbl="Awaiting approval" val={approvals.length} dl="2 overdue · needs you" up={false} onClick={() => setModule("approvals")} />
        <Kpi lbl="Scheduled" val={scheduled.length} dl="next goes live today" up onClick={() => { setModule("kanban"); setView("calendar"); }} />
        <Kpi lbl="Weekly reach" val="372K" dl="+8.4% vs last week" up onClick={() => setModule("analytics")} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.35fr 1fr" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-h"><Wand2 size={15} color="#FF6F91" /><h3>AI recommendations</h3><span className="badge more" style={{ background: "#FFF0EA", color: "#FF6F91" }}>4 new</span></div>
            <div style={{ paddingBottom: 6 }}>
              <div className="airec"><div className="ico"><Sparkles size={14} /></div><p><b>Q3 Thought Leadership</b> is trailing its lead target. Publish the <b>recycled zippers</b> post Thursday 9:00 — your LinkedIn audience peaks then.</p></div>
              <div className="airec"><div className="ico"><Sparkles size={14} /></div><p>Three drafts drift from brand voice ("we guarantee…"). <b>Rewrite for tone</b> before approval.</p></div>
              <div className="airec"><div className="ico"><Sparkles size={14} /></div><p><b>"How to layer for −10°C"</b> is your top performer. Repurpose it as a TikTok short to extend reach ~18%.</p></div>
            </div>
          </div>

          <div className="card">
            <div className="card-h"><ShieldCheck size={15} color="var(--warn)" /><h3>Approval queue</h3>
              <button className="chipbtn more" onClick={() => setModule("approvals")}>Open center</button></div>
            {approvals.slice(0, 5).map((it) => (
              <div className="rowitem" key={it.id} onClick={() => open(it)} style={{ cursor: "pointer" }}>
                <StageDot k={it.stage} />
                <span className="tt">{it.title}</span>
                <ChannelBadge ch={it.channel} />
                <Avatar id={it.assignee} size={22} />
                <span className="meta">{fmtDay(new Date(it.due))}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-h"><BarChart3 size={15} color="var(--accent)" /><h3>Performance snapshot</h3><span className="meta more">last 11 weeks · engagements</span></div>
            <div style={{ padding: "6px 10px 12px", height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E63F6" stopOpacity={0.28} /><stop offset="100%" stopColor="#2E63F6" stopOpacity={0} />
                  </linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
                  <XAxis dataKey="i" hide /><YAxis tick={{ fontSize: 10, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E7EAF0", boxShadow: "var(--sh-2)" }} />
                  <Area type="monotone" dataKey="v" stroke="#2E63F6" strokeWidth={2.4} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-h"><Megaphone size={15} color="var(--accent)" /><h3>Campaign health</h3></div>
            <div style={{ padding: "4px 16px 14px", display: "flex", flexDirection: "column", gap: 13 }}>
              {CAMPAIGNS.map((c) => (
                <div key={c.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span className="sdot" style={{ background: c.c }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.n}</span>
                    <span className="meta" style={{ marginLeft: "auto" }}>{c.health}</span>
                  </div>
                  <div className="meter"><i style={{ width: c.health + "%", opacity: c.health < 70 ? 0.65 : 1 }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><Clock size={15} color="var(--warn)" /><h3>Upcoming deadlines</h3></div>
            {deadlines.map((it) => (
              <div className="rowitem" key={it.id} onClick={() => open(it)} style={{ cursor: "pointer" }}>
                <div style={{ textAlign: "center", width: 34 }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{new Date(it.due).getDate()}</div>
                  <div className="meta" style={{ fontSize: 9.5 }}>{new Date(it.due).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</div>
                </div>
                <span className="tt">{it.title}</span>
                <span className="badge" style={{ background: stage(it.stage).c + "16", color: stage(it.stage).c }}>{stage(it.stage).n}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-h"><Users size={15} color="var(--accent)" /><h3>Team activity</h3></div>
            <div style={{ padding: "8px 0 12px" }}>
              {activity.map((a, i) => (
                <div className="actline" key={i}>
                  <div className="dotcol"><Avatar id={a.who} size={26} />{i < activity.length - 1 && <div className="ln" />}</div>
                  <div>
                    <p style={{ fontSize: 12.5, margin: 0, lineHeight: 1.45 }} dangerouslySetInnerHTML={{ __html: `<b>${person(a.who).n.split(" ")[0]}</b> ${a.txt}` }} />
                    <span className="meta">{a.t} ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== ANALYTICS ============================== */
const reachData = [
  { w: "W1", reach: 288, eng: 21 }, { w: "W2", reach: 312, eng: 24 }, { w: "W3", reach: 301, eng: 22 },
  { w: "W4", reach: 340, eng: 29 }, { w: "W5", reach: 333, eng: 27 }, { w: "W6", reach: 358, eng: 33 },
  { w: "W7", reach: 372, eng: 38 }, { w: "W8", reach: 391, eng: 41 },
];
const channelMix = [
  { name: "Instagram", v: 42, c: "#E1306C" }, { name: "LinkedIn", v: 23, c: "#0A66C2" },
  { name: "Blog", v: 16, c: "#2E63F6" }, { name: "YouTube", v: 11, c: "#FF0000" },
  { name: "X", v: 8, c: "#111111" },
];
function Analytics({ items }) {
  const top = [...items].filter((i) => i.stage === "published" || i.ai > 80).sort((a, b) => b.ai - a.ai).slice(0, 5);
  const Metric = ({ l, v, d, up }) => (
    <div className="card kpi"><div className="lbl">{l}</div><div className="val">{v}</div>
      <div className="dl" style={{ color: up ? "var(--ok)" : "var(--bad)" }}><TrendingUp size={13} style={{ transform: up ? "none" : "scaleY(-1)" }} />{d}</div></div>
  );
  return (
    <div className="pad fadein">
      <div className="grid" style={{ gridTemplateColumns: "repeat(5,1fr)", marginBottom: 16 }}>
        <Metric l="Reach" v="391K" d="+5.1%" up /><Metric l="Engagement" v="41.2K" d="+7.3%" up />
        <Metric l="Eng. rate" v="4.8%" d="+0.4pt" up /><Metric l="CTR" v="2.1%" d="−0.2pt" />
        <Metric l="Followers" v="128.4K" d="+1.9%" up />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", marginBottom: 16 }}>
        <div className="card">
          <div className="card-h"><TrendingUp size={15} color="var(--accent)" /><h3>Reach & engagement</h3><span className="meta more">weekly · thousands</span></div>
          <div style={{ padding: "8px 12px 16px", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reachData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="r1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2E63F6" stopOpacity={0.25} /><stop offset="100%" stopColor="#2E63F6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="r2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FF6F91" stopOpacity={0.22} /><stop offset="100%" stopColor="#FF6F91" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F5" vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#98A2B3" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E7EAF0" }} />
                <Area type="monotone" dataKey="reach" stroke="#2E63F6" strokeWidth={2.4} fill="url(#r1)" />
                <Area type="monotone" dataKey="eng" stroke="#FF6F91" strokeWidth={2.4} fill="url(#r2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><Hash size={15} color="var(--accent)" /><h3>Channel mix</h3></div>
          <div style={{ padding: "6px 12px 12px", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelMix} dataKey="v" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
                  {channelMix.map((c) => <Cell key={c.name} fill={c.c} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E7EAF0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ padding: "0 16px 14px", display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
            {channelMix.map((c) => <span key={c.name} style={{ fontSize: 11.5, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 }}><span className="sdot" style={{ background: c.c }} />{c.name} <b className="mono">{c.v}%</b></span>)}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-h"><Star size={15} color="var(--warn)" /><h3>Top performing content</h3><span className="meta more">by AI performance score</span></div>
        {top.map((it, i) => (
          <div className="rowitem" key={it.id}>
            <span className="mono" style={{ width: 18, color: "var(--ink-3)", fontWeight: 700 }}>{i + 1}</span>
            <span className="tt">{it.title}</span>
            <ChannelBadge ch={it.channel} />
            <span className="pill" style={{ background: camp(it.campaign).c + "16", color: camp(it.campaign).c }}>{camp(it.campaign).n.split(" ")[0]}</span>
            <AiScore v={it.ai} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== CAMPAIGNS ============================== */
function Campaigns({ items }) {
  return (
    <div className="pad fadein">
      <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        {CAMPAIGNS.map((c) => {
          const cItems = items.filter((i) => i.campaign === c.id);
          const pct = Math.round((c.current / c.target) * 100);
          return (
            <div className="card" key={c.id} style={{ overflow: "hidden" }}>
              <div style={{ height: 6, background: `linear-gradient(90deg,${c.c},${c.c}88)` }} />
              <div style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="sdot" style={{ background: c.c, width: 10, height: 10 }} />
                  <div style={{ fontSize: 15.5, fontWeight: 660, letterSpacing: "-.01em" }}>{c.n}</div>
                  <span className="pill" style={{ marginLeft: "auto", background: c.health >= 80 ? "var(--ok-soft)" : c.health >= 65 ? "var(--warn-soft)" : "var(--bad-soft)", color: c.health >= 80 ? "var(--ok)" : c.health >= 65 ? "var(--warn)" : "var(--bad)" }}>{c.status}</span>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "8px 0 14px", lineHeight: 1.45 }}>{c.obj}</p>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 6 }}>
                  <span className="meta">{c.kpi}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{c.current.toLocaleString()} / {c.target.toLocaleString()}</span>
                </div>
                <div className="meter"><i style={{ width: pct + "%" }} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line-2)" }}>
                  <span className="meta" style={{ display: "flex", alignItems: "center", gap: 5 }}><CalIcon size={12} />{c.window}</span>
                  <span className="meta" style={{ display: "flex", alignItems: "center", gap: 5 }}><Layers size={12} />{cItems.length} items</span>
                  <div style={{ marginLeft: "auto", display: "flex" }}>
                    {[...new Set(cItems.map((i) => i.assignee))].slice(0, 4).map((a, k) => (
                      <div key={a} style={{ marginLeft: k ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--surface)" }}><Avatar id={a} size={24} /></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== APPROVALS ============================== */
function Approvals({ items, move, open }) {
  const queue = items.filter((i) => ["review", "legal", "approval"].includes(i.stage));
  return (
    <div className="pad fadein">
      <div className="card">
        <div className="card-h"><ShieldCheck size={16} color="var(--accent)" /><h3>Approval center</h3>
          <span className="badge more" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>{queue.length} awaiting sign-off</span></div>
        {queue.length === 0 && <div className="empty"><div className="ic"><CheckCircle2 size={22} /></div>Queue clear. Nothing needs your sign-off.</div>}
        {queue.map((it) => (
          <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderTop: "1px solid var(--line-2)" }}>
            <div style={{ width: 46, height: 46, borderRadius: 10, background: thumbGrad(it), flex: "none" }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 620, cursor: "pointer" }} onClick={() => open(it)}>{it.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                <span className="badge" style={{ background: stage(it.stage).c + "16", color: stage(it.stage).c }}><StageDot k={it.stage} />{stage(it.stage).n}</span>
                <ChannelBadge ch={it.channel} />
                <span className="meta">owner {person(it.assignee).n.split(" ")[0]} · due {fmtDay(new Date(it.due))}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="meta" style={{ display: "flex", alignItems: "center", gap: 4 }}>Reviewers</span>
              <div style={{ display: "flex" }}>{["lena", "sam"].map((a, k) => <div key={a} style={{ marginLeft: k ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--surface)" }}><Avatar id={a} size={24} /></div>)}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="chipbtn" onClick={() => move(it.id, "writing")}>Request changes</button>
              <button className="primary" onClick={() => move(it.id, it.stage === "approval" ? "scheduled" : "approval")}><Check size={13} />Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== BRAND KIT ============================== */
function BrandKit() {
  const colors = [["Aurora Blue", "#2E63F6"], ["Ridge Ink", "#171A21"], ["Dawn", "#FFB27A"], ["Summit Teal", "#0EA5A4"], ["Alpine Mist", "#F3F5F8"], ["Trail Amber", "#F79009"]];
  const tags = ["#Northbound", "#TrailTested", "#OutInTheOpen", "#LayerUp", "#BuiltForCold", "#EveryTrail"];
  return (
    <div className="pad fadein" style={{ maxWidth: 900 }}>
      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div className="section-h">Colour</div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {colors.map(([n, c]) => (
            <div key={n}><div className="swatch" style={{ background: c }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 12 }}><b style={{ fontWeight: 600 }}>{n}</b><span className="mono" style={{ color: "var(--ink-3)" }}>{c}</span></div></div>
          ))}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-h">Typography</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-.03em" }}>Made for the outdoors</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>Display · SF Pro / Inter · 700</div>
          <div style={{ fontSize: 15, marginTop: 18, lineHeight: 1.5 }}>Body copy stays warm, direct, and plainspoken — like advice from someone who's actually been up the mountain.</div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>Body · 400 · 15/24</div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-h">Voice & tone</div>
          {[["Warm, not corporate", "Talk like a trail buddy, not a brochure."], ["Confident, never boastful", "Show the proof; skip the superlatives."], ["Plain words", "Say “stays dry”, not “moisture-wicking technology”."]].map(([a, b]) => (
            <div key={a} style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: "1px solid var(--line-2)" }}>
              <Check size={16} color="var(--ok)" style={{ marginTop: 2, flex: "none" }} />
              <div><b style={{ fontSize: 13 }}>{a}</b><div style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 2 }}>{b}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-h">Approved hashtags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{tags.map((t) => <span key={t} className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent-ink)", fontSize: 12 }}>{t}</span>)}</div>
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="section-h">Legal disclaimer</div>
          <p style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>Field-test claims must reference the internal test ID. Sustainability claims require the current lifecycle citation. Ambassador posts must include #ad or #gifted.</p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 12.5, color: "#FF6F91", fontWeight: 600 }}>
        <Sparkles size={14} /> Afuera's AI follows this kit automatically when it generates content.
      </div>
    </div>
  );
}

/* ============================== ASSET LIBRARY ============================== */
function AssetLibrary() {
  const assets = [
    ["Sunrise summit — RAW", "Image", "Instagram", "#E1306C", "#FFB27A"], ["Aurora jacket — hero", "Image", "Blog", "#2E63F6", "#8B5CF6"],
    ["Factory tour — B-roll", "Video", "YouTube", "#FF0000", "#171A21"], ["Northbound logo — light", "Logo", "Brand", "#2E63F6", "#0EA5A4"],
    ["Base layer — flat lay", "Image", "Email", "#F79009", "#EC4899"], ["Trail map — winter", "Graphic", "X", "#0EA5A4", "#2E63F6"],
    ["Ambassador Noa — portrait", "Image", "LinkedIn", "#0A66C2", "#8B5CF6"], ["Pack-fit — carousel set", "Image", "Instagram", "#EC4899", "#FFB27A"],
  ];
  return (
    <div className="pad fadein">
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["All", "Images", "Video", "Logos", "Templates", "Fonts"].map((f, i) => (
          <button key={f} className={i === 0 ? "primary" : "chipbtn"}>{f}</button>
        ))}
        <button className="chipbtn" style={{ marginLeft: "auto" }}><Sparkles size={13} color="#FF6F91" />AI auto-tag</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {assets.map(([n, t, ch, a, b]) => (
          <div className="assettile" key={n}>
            <div className="assetimg" style={{ background: `linear-gradient(135deg,${a},${b})` }}>
              <div style={{ position: "absolute", left: 9, top: 9 }}><TypeBadge t={t} /></div>
              {t === "Video" && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff" }}><Play size={24} fill="#fff" /></div>}
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}><ChannelBadge ch={ch} /><span className="meta" style={{ marginLeft: "auto" }}>v2</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== AUTOMATIONS ============================== */
function Automations() {
  const [rules, setRules] = useState([
    { on: true, w: "Card approved", t: "Move to Scheduled", i: CheckCircle2 },
    { on: true, w: "Publish date arrives", t: "Publish to channel", i: Send },
    { on: true, w: "Content published", t: "Create analytics task", i: BarChart3 },
    { on: false, w: "Campaign ends", t: "Archive all content", i: FolderOpen },
    { on: true, w: "Draft misses brand voice", t: "Flag + notify owner in Slack", i: MessageSquare },
  ]);
  return (
    <div className="pad fadein" style={{ maxWidth: 820 }}>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="section-h" style={{ marginBottom: 14 }}>Active workflows</div>
        {rules.map((r, i) => {
          const Ico = r.i;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 4px", borderTop: i ? "1px solid var(--line-2)" : "none" }}>
              <button className={"toggle" + (r.on ? " on" : "")} onClick={() => setRules(rules.map((x, k) => k === i ? { ...x, on: !x.on } : x))}><i /></button>
              <div className="autonode" style={{ borderColor: "var(--accent-soft)" }}><Zap size={13} color="var(--accent)" />When <b style={{ fontWeight: 700 }}>{r.w}</b></div>
              <ArrowRight size={16} color="var(--ink-4)" />
              <div className="autonode"><Ico size={13} color="var(--ink-2)" />{r.t}</div>
              <button className="iconbtn" style={{ marginLeft: "auto" }}><MoreHorizontal size={16} /></button>
            </div>
          );
        })}
      </div>
      <button className="chipbtn"><Plus size={14} />New automation</button>
    </div>
  );
}

/* ============================== TEAM ============================== */
function TeamView({ items }) {
  return (
    <div className="pad fadein">
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {TEAM.map((t) => {
          const load = items.filter((i) => i.assignee === t.id && !["published", "archived"].includes(i.stage)).length;
          return (
            <div className="card" key={t.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative" }}>
                  <Avatar id={t.id} size={44} />
                  <span style={{ position: "absolute", right: -1, bottom: -1, width: 12, height: 12, borderRadius: "50%", background: t.on ? "var(--ok)" : "var(--ink-4)", boxShadow: "0 0 0 2.5px var(--surface)" }} />
                </div>
                <div><div style={{ fontSize: 14, fontWeight: 640 }}>{t.n}</div><div className="meta">{t.role}</div></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, margin: "16px 0 6px" }}>
                <span className="meta">Workload · {load} active</span><span className="mono" style={{ fontWeight: 600, color: t.load > 80 ? "var(--bad)" : "var(--ink-2)" }}>{t.load}%</span>
              </div>
              <div className="meter"><i style={{ width: t.load + "%", background: t.load > 80 ? "var(--bad)" : "linear-gradient(90deg,var(--dawn-a),var(--dawn-b))" }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== CONTENT HUB ============================== */
function ContentHub({ items, open }) {
  const [q, setQ] = useState("");
  const list = items.filter((i) => i.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="pad fadein">
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div className="searchbox" style={{ display: "flex", maxWidth: 360, flex: 1 }}>
          <Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all content, forever…" style={{ border: "none", background: "none", outline: "none", fontSize: 13, flex: 1, fontFamily: "inherit", color: "var(--ink)" }} />
        </div>
        {["Drafts", "Published", "Templates", "AI-generated", "Archived"].map((f) => <button key={f} className="chipbtn">{f}</button>)}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {list.map((it) => (
          <div className="card" key={it.id} style={{ overflow: "hidden", cursor: "pointer" }} onClick={() => open(it)}>
            <div style={{ height: 92, background: thumbGrad(it), position: "relative" }}>
              <div style={{ position: "absolute", left: 10, top: 10 }}><TypeBadge t={it.type} /></div>
              <div style={{ position: "absolute", right: 10, top: 10 }}><AiScore v={it.ai} /></div>
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 620, lineHeight: 1.35, marginBottom: 9 }}>{it.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="badge" style={{ background: stage(it.stage).c + "16", color: stage(it.stage).c }}>{stage(it.stage).n}</span>
                <span className="meta" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>v{Math.max(1, it.comments)} · <Link2 size={11} /></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== ITEM DRAWER ============================== */
function ItemDrawer({ item, close, move }) {
  if (!item) return null;
  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="drawer">
        <div style={{ height: 150, background: thumbGrad(item), position: "relative", flex: "none" }}>
          <button className="iconbtn" style={{ position: "absolute", right: 12, top: 12, background: "rgba(255,255,255,.9)" }} onClick={close}><X size={17} /></button>
          <div style={{ position: "absolute", left: 16, bottom: 14, display: "flex", gap: 8 }}><TypeBadge t={item.type} /><ChannelBadge ch={item.channel} /></div>
        </div>
        <div style={{ padding: 20, overflowY: "auto" }}>
          <div style={{ fontSize: 19, fontWeight: 680, letterSpacing: "-.02em", lineHeight: 1.25 }}>{item.title}</div>
          <div style={{ display: "flex", gap: 8, margin: "12px 0 18px", flexWrap: "wrap" }}>
            <span className="badge" style={{ background: stage(item.stage).c + "16", color: stage(item.stage).c }}><StageDot k={item.stage} />{stage(item.stage).n}</span>
            <span className="pill" style={{ background: camp(item.campaign).c + "16", color: camp(item.campaign).c }}>{camp(item.campaign).n}</span>
            <AiScore v={item.ai} />
          </div>
          {[["Owner", <span style={{ display: "flex", alignItems: "center", gap: 7 }}><Avatar id={item.assignee} size={22} />{person(item.assignee).n}</span>],
            ["Due date", fmtDay(new Date(item.due))],
            ["Priority", item.priority],
            ["Comments", item.comments], ["Attachments", item.attachments]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", padding: "10px 0", borderTop: "1px solid var(--line-2)", fontSize: 13 }}>
                <span style={{ width: 120, color: "var(--ink-3)" }}>{k}</span><span style={{ fontWeight: 550 }}>{v}</span>
              </div>
            ))}
          <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: "linear-gradient(180deg,#FFF7F2,#FFFDFC)", border: "1px solid #FBE2D4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 640, color: "#FF6F91", marginBottom: 6 }}><Wand2 size={14} />AI suggestion</div>
            <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: 0, lineHeight: 1.5 }}>Tighten the hook to the first 7 words and add <b>#TrailTested</b> — matches your brand kit and lifts save-rate on {item.channel}.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button className="chipbtn" style={{ flex: 1, justifyContent: "center" }}>Comment</button>
            <button className="primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => { const idx = STAGES.findIndex((s) => s.k === item.stage); move(item.id, STAGES[Math.min(idx + 1, STAGES.length - 1)].k); close(); }}>Advance stage <ArrowRight size={14} /></button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================== AI DRAWER ============================== */
const PROMPTS = ["Write 3 Instagram captions for the sunrise summit reel", "Generate hashtags for a winter base-layer launch", "Rewrite this to match our brand voice", "Draft a content brief for Q3 thought leadership", "What should we post Thursday?"];
function aiRespond(text) {
  const t = text.toLowerCase();
  if (t.includes("hashtag")) return "Here are on-brand hashtags, ranked by reach potential and checked against your Brand Kit:\n\nCore: #Northbound #TrailTested #BuiltForCold\nReach: #WinterHiking #LayerUp #BaseLayer\nCommunity: #OutInTheOpen #EveryTrail\n\nI kept it to 8 — past that, engagement dips on Instagram for your account.";
  if (t.includes("caption")) return "Three captions in your voice — warm, plainspoken, no jargon:\n\n1. \"5am. −8°C. Worth it.\" Some views you have to earn. ☀️ #TrailTested\n\n2. The trail was quiet. The sunrise wasn't. Tag someone you'd drag up here.\n\n3. First light hits different at altitude. Shot on a summit push in the Aurora shell. #OutInTheOpen\n\nWant me to tune any of these tighter, or draft the first-comment hashtags?";
  if (t.includes("rewrite") || t.includes("voice")) return "Reworked to match your Brand Kit (warm, confident, plain words — no \"guarantee\" claims):\n\nBefore → \"Our advanced moisture-wicking technology guarantees you stay dry.\"\nAfter → \"Built to keep you dry when the climb gets sweaty. Field-tested on real trails.\"\n\nI dropped the absolute claim to stay clear of your legal disclaimer rules.";
  if (t.includes("brief")) return "Content brief — Q3 Thought Leadership\n\nGoal: 600 qualified leads (currently 268 — behind pace)\nAngle: designing gear for genuine cold, from the people who test it\nFormats: 1 long-form LinkedIn post/wk + 1 YouTube explainer/mo\nHook bank: recycled zippers, −10°C layering, factory tour\nCTA: gated \"Cold-Weather Field Guide\" PDF\n\nWant me to generate the first three post drafts?";
  if (t.includes("thursday") || t.includes("post")) return "Thursday's best slot is 9:00 — your LinkedIn audience peaks then. I'd publish \"Why we switched to recycled zippers\" (AI score 91, already in Approval). It carries the Q3 campaign, which is behind on leads. Shall I move it to Scheduled for Thu 9:00?";
  return "On it. I can draft captions, generate hashtags, rewrite to your brand voice, build content briefs, score drafts, or plan your calendar — all inside Afuera, following your Brand Kit. What would help most?";
}
function AIDrawer({ close, seedText }) {
  const [msgs, setMsgs] = useState([{ r: "a", t: "I'm your Afuera assistant. I can see your boards, campaigns, and Brand Kit. Ask me to create, rewrite, or plan — or pick a starter below." }]);
  const [val, setVal] = useState(seedText || "");
  const [typing, setTyping] = useState(false);
  const bodyRef = useRef(null);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs, typing]);

  const send = useCallback((text) => {
    const q = (text ?? val).trim(); if (!q || typing) return;
    setMsgs((m) => [...m, { r: "u", t: q }]); setVal(""); setTyping(true);
    const full = aiRespond(q);
    setTimeout(() => {
      setTyping(false);
      let i = 0; const id = Date.now();
      setMsgs((m) => [...m, { r: "a", t: "", id }]);
      const iv = setInterval(() => {
        i += 3;
        setMsgs((m) => m.map((x) => x.id === id ? { ...x, t: full.slice(0, i) } : x));
        if (i >= full.length) clearInterval(iv);
      }, 14);
    }, 550);
  }, [val, typing]);

  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="drawer">
        <div className="ai-head">
          <div className="ai-orb"><Sparkles size={17} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 660, fontSize: 14 }}>AI Workspace</div><div className="meta">Brand-voice aware · sees your data</div></div>
          <button className="iconbtn" onClick={close}><X size={18} /></button>
        </div>
        <div className="ai-body" ref={bodyRef}>
          {msgs.map((m, i) => (
            <div key={i} className={"ai-msg " + m.r}>
              {m.r === "a" ? <div className="bubble" style={{ whiteSpace: "pre-wrap" }}>{m.t}{m.t === "" ? "" : null}</div> : m.t}
            </div>
          ))}
          {typing && <div className="ai-msg a"><div className="bubble"><span className="cursorblink" /></div></div>}
          {msgs.length <= 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
              {PROMPTS.map((p) => <button key={p} className="promptchip" onClick={() => send(p)}>{p}</button>)}
            </div>
          )}
        </div>
        <div className="ai-foot">
          <div className="ai-input">
            <textarea rows={1} value={val} placeholder="Ask Afuera to create, rewrite, or plan…"
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <button className="ai-send" disabled={!val.trim() || typing} onClick={() => send()}><Send size={15} /></button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================== COMMAND PALETTE ============================== */
function CommandPalette({ close, items, go, askAI }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const nav = [
    { t: "Go to Dashboard", m: "dashboard", ic: LayoutDashboard }, { t: "Open Kanban board", m: "kanban", ic: LayoutGrid },
    { t: "Open Calendar", m: "kanban", v: "calendar", ic: CalIcon }, { t: "View Analytics", m: "analytics", ic: BarChart3 },
    { t: "Approval center", m: "approvals", ic: ShieldCheck }, { t: "Brand kit", m: "brand", ic: Palette },
  ];
  const cItems = items.filter((i) => i.title.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
    .map((i) => ({ t: i.title, kind: "content", item: i, ic: FileText }));
  const cNav = nav.filter((n) => n.t.toLowerCase().includes(q.toLowerCase()));
  const results = q.trim()
    ? [{ t: `Ask AI: "${q}"`, kind: "ai", ic: Sparkles }, ...cNav, ...cItems]
    : nav.map((n) => ({ ...n, kind: "nav" }));
  useEffect(() => setSel(0), [q]);
  const run = (r) => {
    if (r.kind === "ai") askAI(q);
    else if (r.item) { go(r.item.stage === "published" ? "analytics" : "kanban"); }
    else go(r.m, r.v);
    close();
  };
  return (
    <div className="cmdwrap" onClick={close}>
      <div className="cmd" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-in">
          <Command size={18} color="var(--ink-3)" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, jump to a view, or ask AI…"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, results.length - 1));
              if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
              if (e.key === "Enter" && results[sel]) run(results[sel]);
              if (e.key === "Escape") close();
            }} />
          <span className="searchbox" style={{ background: "none", padding: 0 }}><span className="kbd">esc</span></span>
        </div>
        <div className="cmd-list">
          {results.map((r, i) => { const Ic = r.ic; return (
            <div key={i} className={"cmd-i" + (i === sel ? " sel" : "")} onMouseEnter={() => setSel(i)} onClick={() => run(r)}>
              <Ic size={16} color={r.kind === "ai" ? "#FF6F91" : "var(--ink-3)"} /><span>{r.t}</span>
              <span className="kind">{r.kind}</span>
            </div>
          ); })}
          {results.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No matches. Press Enter to ask AI.</div>}
        </div>
      </div>
    </div>
  );
}

/* ============================== APP SHELL ============================== */
const NAV = [
  { g: "Operate", items: [
    { k: "dashboard", n: "Dashboard", ic: LayoutDashboard },
    { k: "kanban", n: "Content board", ic: LayoutGrid, views: true },
    { k: "hub", n: "Content Hub", ic: FolderOpen },
    { k: "campaigns", n: "Campaigns", ic: Megaphone },
    { k: "approvals", n: "Approval Center", ic: ShieldCheck },
  ]},
  { g: "Create", items: [
    { k: "ai", n: "AI Workspace", ic: Sparkles },
    { k: "assets", n: "Asset Library", ic: ImageIcon },
    { k: "brand", n: "Brand Kit", ic: Palette },
  ]},
  { g: "Run", items: [
    { k: "analytics", n: "Analytics", ic: BarChart3 },
    { k: "automations", n: "Automation", ic: Zap },
    { k: "team", n: "Team", ic: Users },
  ]},
];
const VIEWS = [
  { k: "kanban", n: "Kanban", ic: LayoutGrid }, { k: "calendar", n: "Calendar", ic: CalIcon },
  { k: "table", n: "Table", ic: TableIcon },
];
const TITLES = { dashboard: "Dashboard", kanban: "Content board", hub: "Content Hub", campaigns: "Campaigns", approvals: "Approval Center", ai: "AI Workspace", assets: "Asset Library", brand: "Brand Kit", analytics: "Analytics", automations: "Automation", team: "Team" };

export default function Afuera() {
  const [items, setItems] = useState(seed);
  const [module, setModule] = useState("dashboard");
  const [view, setView] = useState("kanban");
  const [drawer, setDrawer] = useState(null);      // item drawer
  const [ai, setAi] = useState(null);              // {seed} or null
  const [cmd, setCmd] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  const move = useCallback((id, stg) => setItems((it) => it.map((x) => x.id === id ? {
    ...x, stage: stg, publishAt: ["scheduled", "published"].includes(stg) ? (x.publishAt || x.due) : (["scheduled", "published"].includes(x.stage) ? x.due : x.publishAt)
  } : x)), []);
  const reschedule = useCallback((id, iso) => setItems((it) => it.map((x) => x.id === id ? { ...x, publishAt: iso, due: iso } : x)), []);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd((c) => !c); }
      if (e.key === "Escape") { setCmd(false); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  const openItem = (it) => setDrawer(it);
  const goto = (m, v) => { setModule(m); if (v) setView(v); if (m === "ai") { setAi({ seed: "" }); } setRailOpen(false); };

  const renderMain = () => {
    switch (module) {
      case "dashboard": return <Dashboard items={items} open={openItem} setModule={setModule} setView={setView} />;
      case "kanban":
        if (view === "calendar") return <CalendarView items={items} reschedule={reschedule} open={openItem} />;
        if (view === "table") return <TableView items={items} open={openItem} />;
        return <Kanban items={items} move={move} open={openItem} />;
      case "hub": return <ContentHub items={items} open={openItem} />;
      case "campaigns": return <Campaigns items={items} />;
      case "approvals": return <Approvals items={items} move={move} open={openItem} />;
      case "assets": return <AssetLibrary />;
      case "brand": return <BrandKit />;
      case "analytics": return <Analytics items={items} />;
      case "automations": return <Automations />;
      case "team": return <TeamView items={items} />;
      case "ai": return <div className="empty" style={{ height: "60%" }}><div className="ic"><Sparkles size={24} color="#FF6F91" /></div><div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>Your AI Workspace is open on the right.</div><div style={{ marginTop: 4 }}>Ask it to create, rewrite, score, or plan.</div></div>;
      default: return null;
    }
  };

  // counts for nav
  const counts = {
    approvals: items.filter((i) => ["review", "legal", "approval"].includes(i.stage)).length,
    kanban: items.filter((i) => !["published", "archived"].includes(i.stage)).length,
  };

  return (
    <div className="afa">
      <style>{CSS}</style>
      <div className="shell">
        {/* SIDEBAR */}
        <aside className={"rail" + (railOpen ? " open" : "")}>
          <div className="brand">
            <div className="mark" />
            <div><h1>Afuera</h1><div className="sub">Content Operations OS</div></div>
          </div>
          <div className="ws">
            <div className="ws-badge" style={{ background: "linear-gradient(135deg,#171A21,#3A4150)" }}>N</div>
            <div style={{ minWidth: 0 }}><div className="n">Northbound</div><div className="r">Outdoor · Marketing</div></div>
            <ChevronDown size={15} color="var(--ink-4)" style={{ marginLeft: "auto" }} />
          </div>
          <nav className="nav">
            {NAV.map((grp) => (
              <div key={grp.g}>
                <div className="nav-h">{grp.g}</div>
                {grp.items.map((n) => {
                  const Ic = n.ic;
                  return (
                    <button key={n.k} className={"nav-i" + (module === n.k ? " on" : "")}
                      onClick={() => n.k === "ai" ? (setAi({ seed: "" })) : goto(n.k)}>
                      <Ic size={16} strokeWidth={module === n.k ? 2.3 : 2} />{n.n}
                      {counts[n.k] != null && <span className="ct">{counts[n.k]}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="rail-foot">
            <Avatar id="sam" size={30} />
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>Sam Okafor</div><div className="meta" style={{ fontSize: 10.5 }}>Content lead</div></div>
            <button className="iconbtn" style={{ marginLeft: "auto", width: 30, height: 30 }}><MoreHorizontal size={16} /></button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          <header className="top">
            <button className="iconbtn menu-btn" onClick={() => setRailOpen((o) => !o)}><Menu size={18} /></button>
            <div className="crumb">{TITLES[module]}{module === "kanban" && <span className="k">{view}</span>}</div>
            <div className="searchbox" onClick={() => setCmd(true)}>
              <Search size={15} /><span>Search or ask AI…</span><span className="kbd">⌘K</span>
            </div>
            <div className="top-r">
              {module === "kanban" && (
                <div className="seg">
                  {VIEWS.map((v) => { const Ic = v.ic; return (
                    <button key={v.k} className={view === v.k ? "on" : ""} onClick={() => setView(v.k)}><Ic size={14} />{v.n}</button>
                  ); })}
                </div>
              )}
              <button className="iconbtn"><Bell size={18} /><span className="dotbadge" /></button>
              <button className="ai-btn" onClick={() => setAi({ seed: "" })}><Sparkles size={15} />Ask AI</button>
              <button className="primary" style={{ height: 34 }}><Plus size={15} />Create</button>
            </div>
          </header>
          <div className="horizon" />

          {/* view header bar for board module */}
          {["kanban"].includes(module) && (
            <div className="viewbar">
              <button className="chipbtn"><Filter size={13} />Filter</button>
              <button className="chipbtn"><Layers size={13} />Group: Stage</button>
              <button className="chipbtn">Saved views <ChevronDown size={13} /></button>
              <div style={{ marginLeft: "auto", display: "flex" }}>
                {TEAM.slice(0, 5).map((t, k) => <div key={t.id} style={{ marginLeft: k ? -8 : 0, borderRadius: "50%", boxShadow: "0 0 0 2px var(--surface)" }}><Avatar id={t.id} size={26} /></div>)}
              </div>
            </div>
          )}

          <main className="body">{renderMain()}</main>
        </div>
      </div>

      {drawer && <ItemDrawer item={drawer} close={() => setDrawer(null)} move={move} />}
      {ai && <AIDrawer close={() => setAi(null)} seedText={ai.seed} />}
      {cmd && <CommandPalette close={() => setCmd(false)} items={items}
        go={(m, v) => goto(m, v)} askAI={(q) => setAi({ seed: q })} />}
    </div>
  );
}

/**
 * P41 新闻助手入口合集
 * Upgraded: removed broken iframe preview, card-based UX with domain favicon,
 * recent history, batch URL copy, quick open all, drag hint
 */
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const categoriesEl = document.getElementById("categories");
const metaEl = document.getElementById("meta");
const configInput = document.getElementById("configInput");
const applyConfigBtn = document.getElementById("applyConfigBtn");
const resetConfigBtn = document.getElementById("resetConfigBtn");
const statusEl = document.getElementById("status");
const copyAllBtn = document.getElementById("copyAllBtn");
const openAllBtn = document.getElementById("openAllBtn");
const recentEl = document.getElementById("recentList");

const STORAGE_AGENTS = "p41_agents_v2";
const STORAGE_RECENT = "p41_recent_v1";

const DEFAULT_AGENTS = [
  { id: "writer-coach", name: "写作陪练", desc: "改写、提纲、润色", url: "https://chat.openai.com/", category: "内容生产", tags: ["写作", "编辑"], note: "需登录 OpenAI 账号" },
  { id: "fact-check", name: "事实核查助手", desc: "核查流程提醒和证据链梳理", url: "https://www.bing.com/search?q=fact+check+workflow", category: "核查验证", tags: ["核查", "流程"] },
  { id: "data-viz", name: "数据可视化助理", desc: "图表方案建议与叙事结构提示", url: "https://echarts.apache.org/examples/", category: "数据分析", tags: ["图表", "可视化"] },
  { id: "interview-helper", name: "采访提问助手", desc: "访谈提纲和追问策略", url: "https://duckduckgo.com/?q=interview+question+framework", category: "内容生产", tags: ["采访", "提纲"] },
  { id: "translation-agent", name: "多语翻译助手", desc: "跨语种快速理解与术语对照", url: "https://translate.google.com/", category: "效率工具", tags: ["翻译", "多语"] },
  { id: "timeline-agent", name: "时间线整理助手", desc: "将事件拆为可核对的时间轴", url: "https://www.wolframalpha.com/", category: "核查验证", tags: ["时间线", "结构化"], note: "部分功能需付费" },
  { id: "perplexity", name: "Perplexity AI", desc: "带来源引用的 AI 搜索引擎", url: "https://www.perplexity.ai/", category: "效率工具", tags: ["搜索", "AI"], note: "需登录获取更多功能" },
  { id: "deepl", name: "DeepL 翻译", desc: "高质量神经网络翻译", url: "https://www.deepl.com/translator", category: "效率工具", tags: ["翻译"] },
  { id: "claude", name: "Claude AI", desc: "Anthropic 的 AI 助手", url: "https://claude.ai/", category: "效率工具", tags: ["AI", "对话"], note: "需登录 Anthropic 账号" },
  { id: "kimi", name: "Kimi 智能助手", desc: "月之暗面 AI 助手，支持长文本", url: "https://kimi.moonshot.cn/", category: "效率工具", tags: ["AI", "长文本"], note: "需登录" }
];

let agents = loadAgents();
let activeCategory = "全部";
let recent = loadRecent();

function setStatus(text) { statusEl.textContent = `状态: ${text}`; }

function escapeHtml(str) {
  return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function normalizeAgent(item) {
  return {
    id: String(item.id || item.name || "").trim(),
    name: String(item.name || "").trim(),
    desc: String(item.desc || "").trim(),
    url: String(item.url || "").trim(),
    category: String(item.category || "未分类").trim(),
    tags: Array.isArray(item.tags) ? item.tags.map(t => String(t).trim()).filter(Boolean) : [],
    note: String(item.note || "").trim()
  };
}

function validateAgents(data) {
  if (!Array.isArray(data)) throw new Error("配置顶层必须是数组");
  const normalized = data.map(normalizeAgent);
  normalized.forEach(item => {
    if (!item.id || !item.name || !item.url) throw new Error("每项至少包含 id / name / url");
    if (!/^https?:\/\//i.test(item.url)) throw new Error(`URL 非法: ${item.name}`);
  });
  return normalized;
}

function loadAgents() {
  try {
    const raw = localStorage.getItem(STORAGE_AGENTS);
    if (!raw) return [...DEFAULT_AGENTS];
    return validateAgents(JSON.parse(raw));
  } catch (_) { return [...DEFAULT_AGENTS]; }
}

function saveAgents() { localStorage.setItem(STORAGE_AGENTS, JSON.stringify(agents)); }

function loadRecent() {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
}

function saveRecent() {
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(recent.slice(0, 8)));
}

function addRecent(agent) {
  recent = recent.filter(r => r.id !== agent.id);
  recent.unshift({ id: agent.id, name: agent.name, time: Date.now() });
  recent = recent.slice(0, 8);
  saveRecent();
  renderRecent();
}

function getDomainInitial(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return host.charAt(0).toUpperCase();
  } catch (_) { return "?"; }
}

function getDomainColor(url) {
  const colors = ["#667eea", "#f5576c", "#4facfe", "#43e97b", "#fa709a", "#a18cd1", "#06b6d4", "#f59e0b"];
  let hash = 0;
  for (const c of url) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffff;
  return colors[hash % colors.length];
}

function getCategories() { return ["全部", ...new Set(agents.map(a => a.category))]; }

function matchesAgent(agent, q) {
  const haystack = [agent.name, agent.desc, agent.category, ...(agent.tags || [])].join(" ").toLowerCase();
  return (!q || haystack.includes(q)) && (activeCategory === "全部" || agent.category === activeCategory);
}

function renderCategories() {
  categoriesEl.innerHTML = "";
  getCategories().forEach(cat => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `chip ${cat === activeCategory ? "active" : ""}`;
    btn.textContent = cat;
    btn.addEventListener("click", () => { activeCategory = cat; renderCategories(); renderGrid(); });
    categoriesEl.appendChild(btn);
  });
}

function renderGrid() {
  const q = search.value.trim().toLowerCase();
  const filtered = agents.filter(a => matchesAgent(a, q));
  grid.innerHTML = "";

  filtered.forEach(agent => {
    const card = document.createElement("article");
    card.className = "tile";
    const initial = getDomainInitial(agent.url);
    const color = getDomainColor(agent.url);

    card.innerHTML = `
      <div class="tile-header">
        <div class="tile-icon" style="background:${color}">${initial}</div>
        <div class="tile-info">
          <h3>${escapeHtml(agent.name)}</h3>
          <p class="desc">${escapeHtml(agent.desc)}</p>
          ${agent.note ? `<p class="tile-note" style="font-size:0.75rem;color:#888;margin-top:4px">⚠️ ${escapeHtml(agent.note)}</p>` : ""}
        </div>
      </div>
      <p class="tile-meta">${escapeHtml(agent.category)} · ${escapeHtml(agent.tags.join(" / ")) || "无标签"}</p>
      <div class="tile-actions">
        <a href="${escapeHtml(agent.url)}" target="_blank" rel="noopener noreferrer" class="open-btn" data-agent-id="${escapeHtml(agent.id)}">打开 →</a>
        <button type="button" class="copy-btn" data-url="${escapeHtml(agent.url)}" title="复制链接">📋</button>
      </div>
    `;
    grid.appendChild(card);
  });

  metaEl.textContent = `共 ${agents.length} 项 | 当前显示 ${filtered.length} 项`;
}

function renderRecent() {
  if (!recentEl) return;
  recentEl.innerHTML = "";
  if (recent.length === 0) {
    recentEl.innerHTML = '<li class="empty-hint">暂无使用记录</li>';
    return;
  }
  recent.forEach(r => {
    const agent = agents.find(a => a.id === r.id);
    if (!agent) return;
    const li = document.createElement("li");
    li.innerHTML = `<a href="${escapeHtml(agent.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(agent.name)}</a>`;
    recentEl.appendChild(li);
  });
}

// === Events ===
search.addEventListener("input", renderGrid);

grid.addEventListener("click", e => {
  const link = e.target.closest("[data-agent-id]");
  if (link) {
    const agent = agents.find(a => a.id === link.dataset.agentId);
    if (agent) addRecent(agent);
  }
  const copyBtn = e.target.closest(".copy-btn");
  if (copyBtn) {
    e.preventDefault();
    navigator.clipboard.writeText(copyBtn.dataset.url).then(
      () => setStatus("已复制链接"),
      () => setStatus("复制失败")
    );
  }
});

if (copyAllBtn) {
  copyAllBtn.addEventListener("click", () => {
    const urls = agents.map(a => a.url).join("\n");
    navigator.clipboard.writeText(urls).then(
      () => setStatus(`已复制 ${agents.length} 个链接`),
      () => setStatus("复制失败")
    );
  });
}

if (openAllBtn) {
  openAllBtn.addEventListener("click", () => {
    if (!confirm(`即将打开 ${agents.length} 个链接，确定？`)) return;
    agents.forEach(a => window.open(a.url, "_blank", "noopener"));
    setStatus(`已打开 ${agents.length} 个链接`);
  });
}

applyConfigBtn.addEventListener("click", () => {
  try {
    agents = validateAgents(JSON.parse(configInput.value));
    saveAgents();
    activeCategory = "全部";
    renderCategories();
    renderGrid();
    setStatus(`配置已应用，共 ${agents.length} 项`);
  } catch (err) {
    setStatus(`配置错误: ${err.message}`);
  }
});

resetConfigBtn.addEventListener("click", () => {
  agents = [...DEFAULT_AGENTS];
  saveAgents();
  configInput.value = JSON.stringify(agents, null, 2);
  activeCategory = "全部";
  renderCategories();
  renderGrid();
  setStatus("已恢复默认入口配置");
});

// === Init ===
configInput.value = JSON.stringify(agents, null, 2);
renderCategories();
renderGrid();
renderRecent();

// === PM Metrics Integration ===
(function () {
  try {
    if (!window.pmMetrics) return;
    let taskStarted = false;
    document.addEventListener("click", function (e) {
      if (taskStarted) return;
      const btn = e.target.closest("button, a");
      if (btn) { taskStarted = true; window.pmMetrics.markTaskStart("portal_nav_task"); }
    }, { once: false });
  } catch (_e) { }
})();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Deployed TodoList on Base Sepolia (chainId 84532).
// https://sepolia.basescan.org/address/0xe89b6312DB066C3E5Ae5B507d94f135Fd2D4259f
const CONTRACT_ADDRESS = "0xe89b6312DB066C3E5Ae5B507d94f135Fd2D4259f";

const ABI = [
  "function addTask(string text) external",
  "function editTask(uint256 index, string text) external",
  "function toggleTask(uint256 index) external",
  "function deleteTask(uint256 index) external",
  "function getMyTasks() view returns (tuple(uint256 id, string text, bool done, uint256 createdAt)[])",
  "function getTasks(address owner) view returns (tuple(uint256 id, string text, bool done, uint256 createdAt)[])",
  "event TaskAdded(address indexed owner, uint256 indexed id, string text)",
  "event TaskToggled(address indexed owner, uint256 indexed id, bool done)",
  "event TaskEdited(address indexed owner, uint256 indexed id, string text)",
  "event TaskDeleted(address indexed owner, uint256 indexed id)",
];

// ---------------------------------------------------------------------------
// State + refs
// ---------------------------------------------------------------------------

let provider, signer, contract, account;

const els = {
  connectBtn: document.getElementById("connectBtn"),
  account: document.getElementById("account"),
  taskInput: document.getElementById("taskInput"),
  addBtn: document.getElementById("addBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  status: document.getElementById("status"),
  list: document.getElementById("list"),
  empty: document.getElementById("empty"),
  counts: document.getElementById("counts"),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStatus(text, kind = "") {
  els.status.textContent = text;
  els.status.className = "status" + (kind ? " " + kind : "");
}

function short(a) {
  return a.slice(0, 6) + "…" + a.slice(-4);
}

function setBusy(busy) {
  els.addBtn.disabled = busy;
  els.taskInput.disabled = busy;
}

// ---------------------------------------------------------------------------
// Wallet
// ---------------------------------------------------------------------------

async function connect() {
  if (!window.ethereum) {
    setStatus("No wallet found. Install MetaMask or Coinbase Wallet.", "error");
    return;
  }
  if (!CONTRACT_ADDRESS) {
    setStatus("Set CONTRACT_ADDRESS in app.js after deploying.", "error");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = (await signer.getAddress()).toLowerCase();

    els.account.textContent = "Connected: " + short(account);
    els.account.classList.remove("hidden");
    els.connectBtn.textContent = "Connected";

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    els.taskInput.disabled = false;
    els.addBtn.disabled = false;
    els.refreshBtn.disabled = false;

    await refresh();

    // Refresh when any of the caller's tasks change.
    const mine = ethers.getAddress(account);
    ["TaskAdded", "TaskToggled", "TaskEdited", "TaskDeleted"].forEach((name) => {
      contract.on(contract.filters[name](mine), () => refresh());
    });
  } catch (err) {
    setStatus(err.shortMessage || err.message || "Failed to connect.", "error");
  }
}

// ---------------------------------------------------------------------------
// Read + render
// ---------------------------------------------------------------------------

async function refresh() {
  if (!contract) return;
  setStatus("Loading…");
  try {
    const tasks = await contract.getMyTasks();
    renderList(tasks);
    setStatus("");
  } catch (err) {
    setStatus(err.shortMessage || err.message || "Failed to load.", "error");
  }
}

function renderList(tasks) {
  els.list.innerHTML = "";
  const done = tasks.filter((t) => t.done).length;
  els.counts.textContent = tasks.length
    ? `(${done}/${tasks.length} done)`
    : "";

  if (tasks.length === 0) {
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");

  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.className = "task" + (task.done ? " done" : "");

    // Checkbox
    const check = document.createElement("button");
    check.className = "check" + (task.done ? " on" : "");
    check.textContent = task.done ? "✓" : "";
    check.title = "Toggle done";
    check.addEventListener("click", () => toggleTask(index));

    // Text
    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    // Edit
    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.textContent = "✏️";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => startEdit(li, index, task.text));

    // Delete
    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn danger";
    delBtn.textContent = "🗑️";
    delBtn.title = "Delete";
    delBtn.addEventListener("click", () => deleteTask(index));

    li.append(check, text, editBtn, delBtn);
    els.list.appendChild(li);
  });
}

function startEdit(li, index, current) {
  li.innerHTML = "";
  const input = document.createElement("input");
  input.className = "task-edit";
  input.value = current;
  input.maxLength = 256;

  const save = document.createElement("button");
  save.className = "icon-btn";
  save.textContent = "💾";
  save.title = "Save";
  save.addEventListener("click", () => editTask(index, input.value.trim()));

  const cancel = document.createElement("button");
  cancel.className = "icon-btn";
  cancel.textContent = "✖️";
  cancel.title = "Cancel";
  cancel.addEventListener("click", refresh);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") editTask(index, input.value.trim());
    if (e.key === "Escape") refresh();
  });

  li.append(input, save, cancel);
  input.focus();
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

async function send(action, label) {
  try {
    setStatus("Confirm in your wallet…");
    const tx = await action();
    setStatus(label + "…");
    await tx.wait();
    setStatus("Done ✅", "ok");
    await refresh();
  } catch (err) {
    setStatus(err.shortMessage || err.message || "Transaction failed.", "error");
  }
}

async function addTask() {
  const text = els.taskInput.value.trim();
  if (!text) {
    setStatus("Type a task first.", "error");
    return;
  }
  setBusy(true);
  await send(() => contract.addTask(text), "Adding");
  els.taskInput.value = "";
  setBusy(false);
}

async function toggleTask(index) {
  await send(() => contract.toggleTask(index), "Updating");
}

async function editTask(index, text) {
  if (!text) {
    setStatus("Text can't be empty.", "error");
    return;
  }
  await send(() => contract.editTask(index, text), "Saving");
}

async function deleteTask(index) {
  await send(() => contract.deleteTask(index), "Deleting");
}

// ---------------------------------------------------------------------------
// UI wiring
// ---------------------------------------------------------------------------

els.connectBtn.addEventListener("click", connect);
els.addBtn.addEventListener("click", addTask);
els.refreshBtn.addEventListener("click", refresh);
els.taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => window.location.reload());
  window.ethereum.on?.("chainChanged", () => window.location.reload());
}

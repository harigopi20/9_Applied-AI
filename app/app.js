const catalogUrl = "../data/store_map.csv";
const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});

const projectForm = document.querySelector("#project-form");
const marketSelect = document.querySelector("#market-select");
const marketNotice = document.querySelector("#market-notice");
const marketAnnouncement = document.querySelector("#market-announcement");
const projectScreen = document.querySelector("#project-screen");
const projectDescription = document.querySelector("#project-description");
const wallTypeGroup = document.querySelector("#wall-type-group");
const wallType = document.querySelector("#wall-type");
const message = document.querySelector("#message");
const results = document.querySelector("#results");
const productList = document.querySelector("#product-list");
const resultsDescription = document.querySelector("#results-description");
const checkedCount = document.querySelector("#checked-count");
const listTotal = document.querySelector("#list-total");
const copyStatus = document.querySelector("#copy-status");

const projectTemplates = {
  paint: {
    products: [
      { id: "P001", quantity: "1 can (10 L)" },
      { id: "P008", quantity: "1 set" },
      { id: "P010", quantity: "1 roll" },
      { id: "P011", quantity: "1 cloth" },
      { id: "P027", quantity: "1 pair" },
      { id: "P028", quantity: "1 pair" },
    ],
  },
  shelf: {
    productsForWall: {
      solid: [
        { id: "P063", quantity: "1 board" },
        { id: "P060", quantity: "1 pair" },
        { id: "P044", quantity: "1 pack (8 mm plugs)" },
      ],
      drywall: [
        { id: "P063", quantity: "1 board" },
        { id: "P060", quantity: "1 pair" },
        { id: "P046", quantity: "1 pack (plasterboard anchors)" },
      ],
    },
  },
};

const hazards = [
  /\b(?:electrical|electric|mains)\s+(?:work|wiring|installation|install|repair|circuit|cable|socket|outlet)\b/i,
  /\b(?:rewire|rewiring|gas line|gas pipe|gas installation)\b/i,
  /\b(?:replace|install|repair|move|add)\s+(?:a\s+)?(?:light switch|wall socket|electrical outlet|power outlet|socket)\b/i,
  /\b(?:load[- ]bearing|bearing wall|structural wall|remove (?:a )?wall|breaker panel|fuse box)\b/i,
];

let catalog = [];
let activeProducts = [];

function updateMarketSelection() {
  const selectedMarket = marketSelect.selectedOptions[0].textContent;
  const detail = `${selectedMarket} selected. All demo markets use the same sample products, prices and store locations.`;
  marketNotice.textContent = detail;
  marketAnnouncement.textContent = detail;
}

marketSelect.addEventListener("change", updateMarketSelection);
updateMarketSelection();

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value !== "")) rows.push(row);
  }

  const [headers, ...records] = rows;
  if (!headers) return [];
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
}

function setMessage(title, body) {
  message.replaceChildren();
  const heading = document.createElement("h2");
  heading.textContent = title;
  const paragraph = document.createElement("p");
  paragraph.textContent = body;
  message.append(heading, paragraph);
  projectScreen.classList.remove("hidden");
  message.classList.remove("hidden");
  results.classList.add("hidden");
}

function clearMessage() {
  message.classList.add("hidden");
  message.replaceChildren();
}

function detectProject(description) {
  if (hazards.some((pattern) => pattern.test(description))) return "hazard";
  if (/\b(?:paint|painting|repaint|wall colour|room colour)\b/i.test(description)) return "paint";
  if (/\b(?:shelf|shelving|bracket|hang .*wall|put up .*wall)\b/i.test(description)) return "shelf";
  return "unsupported";
}

function lookupProduct(id) {
  const product = catalog.find((item) => item.product_nr === id);
  if (!product) {
    throw new Error(`The sample catalogue is missing product ${id}.`);
  }
  return product;
}

function makeProductRow(item) {
  const product = lookupProduct(item.id);
  const row = document.createElement("label");
  row.className = "product-row";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.setAttribute("aria-label", `Mark ${product.product_name} as collected`);
  checkbox.addEventListener("change", () => {
    row.classList.toggle("is-checked", checkbox.checked);
    updateListSummary();
  });

  const description = document.createElement("span");
  const name = document.createElement("span");
  name.className = "product-name";
  name.textContent = product.product_name;
  const meta = document.createElement("span");
  meta.className = "product-meta";
  meta.textContent = `${item.quantity} · ${product.size} · Aisle ${product.aisle_nr}, shelf ${product.shelf_nr}`;
  description.append(name, meta);

  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = currency.format(Number(product.price_eur));
  const category = document.createElement("small");
  category.textContent = product.category;
  price.append(category);

  row.append(checkbox, description, price);
  return row;
}

function updateListSummary() {
  const checkboxes = [...productList.querySelectorAll('input[type="checkbox"]')];
  const checked = checkboxes.filter((checkbox) => checkbox.checked).length;
  const total = activeProducts.reduce((sum, item) => {
    const price = Number(lookupProduct(item.id).price_eur);
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);

  checkedCount.textContent = `${checked} of ${checkboxes.length} items checked`;
  listTotal.textContent = `Sample total ${currency.format(total)}`;
}

function showPlan(products, description) {
  activeProducts = products;
  productList.replaceChildren(...products.map(makeProductRow));
  resultsDescription.textContent = description;
  message.classList.add("hidden");
  projectScreen.classList.add("hidden");
  results.classList.remove("hidden");
  updateListSummary();
}

document.querySelector("#back-to-project").addEventListener("click", () => {
  results.classList.add("hidden");
  projectScreen.classList.remove("hidden");
  projectDescription.focus();
});

function buildPlan() {
  const description = projectDescription.value.trim();
  const project = detectProject(description);

  clearMessage();
  results.classList.add("hidden");

  if (project === "hazard") {
    setMessage(
      "This project needs a qualified professional",
      "Electrical installation, gas work and structural changes can be dangerous. This demo will not generate a shopping list or instructions for that work. Please contact a qualified professional.",
    );
    return;
  }

  if (project === "unsupported") {
    setMessage(
      "We don't have a starter list for that project yet",
      "For this demo, try describing a room-painting project or a shelf you want to hang. No products have been selected.",
    );
    return;
  }

  if (project === "shelf" && !wallType.value) {
    wallTypeGroup.classList.remove("hidden");
    wallType.focus();
    setMessage(
      "One detail before we suggest products",
      "Shelf fixings depend on the wall. Choose a wall type, or select “I'm not sure” to get a safer next step.",
    );
    return;
  }

  if (project === "shelf" && wallType.value === "unknown") {
    setMessage(
      "Check the wall before buying fixings",
      "We haven't selected anchors because the wall type is unknown. Ask a store professional to help identify the wall and choose compatible fixings for your shelf and its load.",
    );
    return;
  }

  const template = projectTemplates[project];
  const products = project === "shelf"
    ? template.productsForWall[wallType.value]
    : template.products;

  if (!products) {
    throw new Error("No product list is configured for this project choice.");
  }

  showPlan(
    products,
    project === "shelf"
      ? `Starter items for a shelf on ${wallType.options[wallType.selectedIndex].text.toLowerCase()}. Confirm the complete fixing system is compatible before purchase.`
      : "Starter items for painting a room. Check the paint quantity against your wall area and the product coverage information.",
  );
}

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    buildPlan();
  } catch (error) {
    setMessage("We couldn't build the list", error.message);
  }
});

projectDescription.addEventListener("input", () => {
  const isShelfProject = detectProject(projectDescription.value) === "shelf";
  wallTypeGroup.classList.toggle("hidden", !isShelfProject);
  if (!isShelfProject) wallType.value = "";
});

document.querySelectorAll("[data-example]").forEach((button) => {
  button.addEventListener("click", () => {
    projectDescription.value = button.dataset.example;
    projectDescription.dispatchEvent(new Event("input"));
    projectDescription.focus();
  });
});

document.querySelector("#copy-list").addEventListener("click", async (event) => {
  const lines = activeProducts.map((item) => {
    const product = lookupProduct(item.id);
    return `- ${product.product_name} (${item.quantity}) — aisle ${product.aisle_nr}, shelf ${product.shelf_nr} — ${currency.format(Number(product.price_eur))}`;
  });
  const text = `Baumarkt-Buddy starter list\n${lines.join("\n")}\n\nSample prices and locations; verify product compatibility.`;

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "List copied to clipboard.";
  } catch {
    copyStatus.textContent = "Clipboard access isn't available here. You can still use the list on screen.";
  }
});

async function loadCatalog() {
  const response = await fetch(catalogUrl);
  if (!response.ok) {
    throw new Error(`Couldn't load the sample catalogue (${response.status}).`);
  }
  catalog = parseCsv(await response.text());
  if (catalog.length === 0) {
    throw new Error("The sample catalogue is empty.");
  }
}

const submitButton = projectForm.querySelector('button[type="submit"]');
loadCatalog()
  .then(() => {
    submitButton.disabled = false;
    submitButton.firstChild.textContent = "Build my starter list ";
  })
  .catch((error) => {
    submitButton.disabled = true;
    setMessage("The planner couldn't start", `${error.message} Open this app through a local web server, such as VS Code Live Server.`);
  });

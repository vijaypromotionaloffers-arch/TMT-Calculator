// State
const state = {
    diameter: 8,
    length: 12,
    price: 0,
    rods: 0, // Central source of truth for quantity
    weight: 0,
    items: []
};

// Bundle Mapping (Dia -> Rods per Bundle)
const BUNDLE_MAP = {
    8: 10,
    10: 7,
    12: 5,
    16: 3,
    20: 2,
    25: 1,
    32: 1
};

// DOM Elements
const els = {
    diaOptions: document.querySelectorAll('input[name="diameter"]'),
    price: document.getElementById('price'),

    // Inputs
    containerQty: document.getElementById('quantity-inputs'),
    containerWeight: document.getElementById('weight-input-container'),
    inputBundles: document.getElementById('input-bundles'),
    inputRods: document.getElementById('input-rods'),
    inputWeight: document.getElementById('input-weight'),

    // Preview
    previewWeight: document.getElementById('preview-weight'),
    previewCost: document.getElementById('preview-cost'),
    addBtn: document.getElementById('add-btn'),

    // List
    clearBtn: document.getElementById('clear-btn'),
    itemsList: document.getElementById('items-list'),
    totalWeight: document.getElementById('total-weight'),
    subtotalCost: document.getElementById('subtotal-cost'),
    gstRow: document.getElementById('gst-row'),
    gstAmount: document.getElementById('gst-amount'),
    totalCost: document.getElementById('total-cost'),

    // GST
    gstToggle: document.getElementById('gst-toggle'),
    gstRate: document.getElementById('gst-rate')
};

// Constants
const DENSITY_DIVISOR = 162; // Standard D^2/162

// Initialization
function init() {
    attachListeners();
    // Initialize with default state
    updateFromRods(0);
    // Initialize GST state from DOM and visibility
    state.gstEnabled = els.gstToggle.checked;
    state.gstRate = parseFloat(els.gstRate.value) || 0;
    updateGSTVisibility();
}

function attachListeners() {
    // Diameter Selection
    els.diaOptions.forEach(opt => {
        opt.addEventListener('change', (e) => {
            state.diameter = parseInt(e.target.value);
            // When diameter changes, reset inputs to 0 as requested
            updateFromRods(0);
        });
    });

    // Inputs
    // Length is fixed at 12m as per requirement
    // els.length.addEventListener('input', (e) => {
    //     state.length = parseFloat(e.target.value) || 0;
    //     updateCalculation();
    // });

    els.price.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value) || 0;
        if (val < 0) { val = 0; e.target.value = 0; }
        state.price = val;
        updateCostOnly();
    });

    // Quantity Side
    els.inputRods.addEventListener('input', (e) => {
        let rods = parseFloat(e.target.value) || 0;
        if (rods < 0) { rods = 0; e.target.value = 0; }
        updateFromRods(rods);
    });

    els.inputBundles.addEventListener('input', (e) => {
        let bundles = parseFloat(e.target.value) || 0;
        if (bundles < 0) { bundles = 0; e.target.value = 0; }
        const rods = bundles * (BUNDLE_MAP[state.diameter] || 1);
        updateFromRods(rods);
    });

    // Weight Side
    els.inputWeight.addEventListener('input', (e) => {
        let weight = parseFloat(e.target.value) || 0;
        if (weight < 0) { weight = 0; e.target.value = 0; }
        updateFromWeight(weight);
    });

    // GST Listeners
    els.gstToggle.addEventListener('change', (e) => {
        state.gstEnabled = e.target.checked;
        renderList();
        updateGSTVisibility();
    });

    els.gstRate.addEventListener('input', (e) => {
        let rate = parseFloat(e.target.value) || 0;
        if (rate < 0) { rate = 0; e.target.value = 0; }
        state.gstRate = rate;
        renderList();
    });

    // Select all on double click for better UX
    const inputs = [els.price, els.inputRods, els.inputBundles, els.inputWeight, els.gstRate];
    inputs.forEach(input => {
        input.addEventListener('dblclick', function () {
            this.select();
        });
    });

    // Buttons
    els.addBtn.addEventListener('click', addItem);
    els.clearBtn.addEventListener('click', clearItems);
}

function updateGSTVisibility() {
    if (state.gstEnabled) {
        els.gstRow.style.opacity = '1';
        els.gstRate.disabled = false;
    } else {
        els.gstRow.style.opacity = '0.3';
        els.gstRate.disabled = true;
    }
}

function calculateOneRodWeight(dia, len) {
    if (dia <= 0 || len <= 0) return 0;
    return ((dia * dia) / DENSITY_DIVISOR) * len;
}

// Logic flow:
// 1. User inputs Rods -> calc Weight, update UI
// 2. User inputs Weight -> calc Rods, update UI
// 3. User inputs Bundles -> calc Rods -> calc Weight, update UI

function updateFromRods(rods) {
    state.rods = rods;

    // Sync Bundles UI
    const perBundle = BUNDLE_MAP[state.diameter] || 1;
    const bundles = rods / perBundle;

    // Check if input needs update (avoid cursor jumping if it's the active element)
    if (document.activeElement !== els.inputRods) {
        els.inputRods.value = toDisplay(rods);
    }
    if (document.activeElement !== els.inputBundles) {
        els.inputBundles.value = toDisplay(bundles);
    }

    // Calc Weight
    const oneRodW = calculateOneRodWeight(state.diameter, state.length);
    const weight = rods * oneRodW;
    state.weight = weight;

    // Sync Weight UI
    if (document.activeElement !== els.inputWeight) {
        els.inputWeight.value = weight > 0 ? weight.toFixed(2) : '';
    }

    updateCostOnly();
}

function updateFromWeight(weight) {
    state.weight = weight;

    // Calc Rods
    const oneRodW = calculateOneRodWeight(state.diameter, state.length);
    let rods = 0;
    if (oneRodW > 0) {
        rods = weight / oneRodW;
    }
    state.rods = rods;

    // Sync Rods/Bundles UI
    const perBundle = BUNDLE_MAP[state.diameter] || 1;
    const bundles = rods / perBundle;

    if (document.activeElement !== els.inputRods) {
        els.inputRods.value = toDisplay(rods);
    }
    if (document.activeElement !== els.inputBundles) {
        els.inputBundles.value = toDisplay(bundles);
    }

    updateCostOnly();
}

function updateCostOnly() {
    const cost = state.weight * state.price;
    els.previewWeight.textContent = formatNum(state.weight) + ' kg';
    els.previewCost.textContent = '₹' + Math.round(cost).toLocaleString('en-IN');

    state.lastCost = cost; // Cache for adding
}

function toDisplay(num) {
    if (num === 0) return ''; // Return empty to show placeholder
    // If integer, return as is.
    if (Number.isInteger(num)) return num;
    return parseFloat(num.toFixed(3)); // 3 decimals for precision during typing
}

function addItem() {
    if (state.weight <= 0) return;

    state.items.push({
        id: Date.now(),
        diameter: state.diameter,
        length: state.length,
        quantity: state.rods,
        weight: state.weight,
        price: state.price,
        cost: state.weight * state.price // Recalc to be sure
    });
    renderList();
    animateAdd();
}


function deleteItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    renderList();
}

function clearItems() {
    state.items = [];
    renderList();
}

function renderList() {
    els.itemsList.innerHTML = '';

    let grandWeight = 0;
    let subtotalCost = 0;

    if (state.items.length === 0) {
        els.itemsList.innerHTML = '<tr class="empty-state"><td colspan="5">No items added yet.</td></tr>';
    } else {
        state.items.forEach(item => {
            // Calculate bundles and rods for display
            const perBundle = BUNDLE_MAP[item.diameter] || 1;
            const bundles = Math.floor(item.quantity / perBundle);
            const remainderRods = item.quantity % perBundle;

            // Format: "2 bdl, 4 rods" or just "5 rods"
            let qtyDisplay = '';
            if (bundles > 0) {
                qtyDisplay += `${bundles} Bdl`;
            }
            if (remainderRods > 0.001) { // Tolerance for float
                if (qtyDisplay) qtyDisplay += ', ';
                qtyDisplay += `${formatNum(remainderRods)} Rods`;
            }
            if (!qtyDisplay) qtyDisplay = '0 Rods';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <b>${item.diameter}mm TMT</b>
                </td>
                <td class="text-right" style="font-size: 0.9em; color: var(--text-muted);">
                    ${qtyDisplay}
                    <div style="font-size: 0.8em; opacity: 0.7;">(${formatNum(item.quantity)} Total)</div>
                </td>
                <td class="text-right">${Math.round(item.weight)}</td>
                <td class="text-right">₹${Math.round(item.cost).toLocaleString('en-IN')}</td>
                <td class="text-right">
                    <button class="action-btn" onclick="deleteItem(${item.id})">&times;</button>
                </td>
            `;
            els.itemsList.appendChild(tr);

            grandWeight += item.weight;
            subtotalCost += item.cost;
        });
    }

    els.totalWeight.textContent = formatNum(grandWeight) + ' kg';
    els.subtotalCost.textContent = '₹' + Math.round(subtotalCost).toLocaleString('en-IN');

    // GST Calculation
    let finalCost = subtotalCost;
    if (state.gstEnabled) {
        const rate = state.gstRate;
        const gstVal = subtotalCost * (rate / 100);
        finalCost = subtotalCost + gstVal;
        els.gstAmount.textContent = '₹' + Math.round(gstVal).toLocaleString('en-IN');
    } else {
        els.gstAmount.textContent = '₹0';
    }

    els.totalCost.textContent = '₹' + formatCost(finalCost);
}

// Helpers
function formatNum(n) {
    return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

function formatCost(n) {
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function animateAdd() {
    const btn = els.addBtn;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="btn-icon">✓</span> Added';
    btn.style.background = '#10b981';

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 1000);
}

// Expose delete function globally for the inline onclick handler
window.deleteItem = deleteItem;

// Start
init();

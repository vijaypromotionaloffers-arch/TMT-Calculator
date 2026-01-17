// State
const state = {
    diameter: 8,
    length: 12,
    price: 0,
    rods: 0,
    weight: 0,
    gstEnabled: false,
    gstRate: 18,
    items: [],
    bbsItems: [],
    bbsDia: 8,
    bbsShape: 'stirrup-rect'
};

const BUNDLE_MAP = { 8: 10, 10: 7, 12: 5, 16: 3, 20: 2, 25: 1, 32: 1 };
const UNIT_WEIGHT_CONST = 162;

function getDiaOptions(selected) {
    return [8, 10, 12, 16, 20, 25, 32].map(d =>
        `<option value="${d}" ${d === selected ? 'selected' : ''}>${d}mm</option>`
    ).join('');
}

// --- Dynamic Row Templates ---
const ROW_TEMPLATES = {
    nosSet: (idx, isRemovable, defDia = 16) => `
        <div class="input-row dynamic-set nos-set" id="nos-set-${idx}">
            <div class="input-group">
                <label>Dia</label>
                <select class="bbs-mem-inp set-dia">${getDiaOptions(defDia)}</select>
            </div>
            <div class="input-group">
                <label>Nos</label>
                <div style="display:flex; align-items:center; gap:5px;">
                    <input type="number" class="bbs-mem-inp set-no" value="2" style="flex:1">
                    ${isRemovable ? `<button class="action-btn text-red" onclick="removeDynamicRow(this)" style="padding:4px 8px;">&times;</button>` : ''}
                </div>
            </div>
        </div>
    `,
    spacingSet: (idx, isRemovable, defDia = 10) => `
        <div class="input-row dynamic-set spacing-set" id="spacing-set-${idx}">
            <div class="input-group">
                <label>Dia</label>
                <select class="bbs-mem-inp set-dia">${getDiaOptions(defDia)}</select>
            </div>
            <div class="input-group">
                <label>Spacing (mm)</label>
                <div style="display:flex; align-items:center; gap:5px;">
                    <input type="number" class="bbs-mem-inp set-space" value="150" style="flex:1">
                    ${isRemovable ? `<button class="action-btn text-red" onclick="removeDynamicRow(this)" style="padding:4px 8px;">&times;</button>` : ''}
                </div>
            </div>
        </div>
    `,
    innerRing: (idx, isRemovable) => `
        <div class="dynamic-set inner-set" style="background: rgba(0,0,0,0.02); padding:8px; border-radius:4px; margin-bottom:8px;">
             <div class="input-row" style="margin-bottom:5px;">
                <div class="input-group">
                    <label>Inner/Link Dia</label>
                    <select class="bbs-mem-inp set-dia">${getDiaOptions(8)}</select>
                </div>
                 <div class="input-group">
                    <label>Spacing</label>
                     <div style="display:flex; align-items:center; gap:5px;">
                        <input type="number" class="bbs-mem-inp set-space" placeholder="e.g. 150" style="flex:1">
                        ${isRemovable ? `<button class="action-btn text-red" onclick="removeDynamicRow(this)" style="padding:4px 8px;">&times;</button>` : ''}
                     </div>
                 </div>
            </div>
            <div class="input-row">
                <div class="input-group"><label>A (Len/Width)</label><input type="number" class="bbs-mem-inp set-a" placeholder="mm"></div>
                <div class="input-group"><label>B (Height)</label><input type="number" class="bbs-mem-inp set-b" placeholder="Optional"></div>
            </div>
        </div>
    `
};

const MEMBER_CONFIG = {
    footing: {
        title: 'Footing (IS 456)',
        onLoad: () => {
            addDynamicRow('spacingSet', 'footing-x-container', false, 12);
            addDynamicRow('spacingSet', 'footing-y-container', false, 12);
        },
        inputs: () => `
            <div class="input-row">
                <div class="input-group"><label>Length (L) mm</label><input type="number" class="bbs-mem-inp" data-key="L" placeholder="e.g. 1500"></div>
                <div class="input-group"><label>Width (B) mm</label><input type="number" class="bbs-mem-inp" data-key="B" placeholder="e.g. 1200"></div>
            </div>
             <div class="input-group"><label>Depth (D) mm</label><input type="number" class="bbs-mem-inp" data-key="D" placeholder="e.g. 450"></div>
            
            <div style="margin-bottom:10px;">
                <label style="font-size:0.9em; font-weight:600; color:#555;">Long Bars (X Dir)</label>
                <div id="footing-x-container"></div>
                <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'footing-x-container', true, 12)">+ Add X Set</button>
            </div>

            <div style="margin-bottom:10px;">
                <label style="font-size:0.9em; font-weight:600; color:#555;">Short Bars (Y Dir)</label>
                <div id="footing-y-container"></div>
                <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'footing-y-container', true, 12)">+ Add Y Set</button>
            </div>

            <div class="input-group"><label>Cover (mm)</label><input type="number" class="bbs-mem-inp" data-key="cover" value="50"></div>
        `
    },
    column: {
        title: 'Column (IS 456)',
        onLoad: () => {
            addDynamicRow('nosSet', 'col-vert-container', false, 16);
        },
        inputs: () => `
             <div class="input-row">
                <div class="input-group"><label>Width (b) mm</label><input type="number" class="bbs-mem-inp" data-key="b" placeholder="e.g. 300"></div>
                <div class="input-group"><label>Depth (D) mm</label><input type="number" class="bbs-mem-inp" data-key="D" placeholder="e.g. 450"></div>
            </div>
            <div class="input-group"><label>Floor Height (mm)</label><input type="number" class="bbs-mem-inp" data-key="H" value="3000"></div>
            
            <div style="margin-bottom:10px;">
                <label style="font-size:0.9em; font-weight:600; color:#555;">Vertical Bars</label>
                <div id="col-vert-container"></div>
                <button class="btn-outline-sm" onclick="addDynamicRow('nosSet', 'col-vert-container', true, 12)">+ Add Vertical Set</button>
            </div>

             <div class="input-row">
                <div class="input-group">
                    <label>Outer Ring Dia</label>
                    <select class="bbs-mem-inp" data-key="ringDia">${getDiaOptions(8)}</select>
                </div>
                <div class="input-group"><label>Spacing</label><input type="number" class="bbs-mem-inp" data-key="ringSpace" value="150"></div>
            </div>
            
            <div style="margin-bottom:10px;">
                 <label style="font-size:0.9em; font-weight:600; color:#555;">Inner Rings / Links</label>
                 <div id="col-inner-container"></div>
                 <button class="btn-outline-sm" onclick="addDynamicRow('innerRing', 'col-inner-container', true)">+ Add Inner Ring/Link</button>
            </div>

            <div class="input-group"><label>Cover (mm)</label><input type="number" class="bbs-mem-inp" data-key="cover" value="40"></div>
        `
    },
    beam: {
        title: 'Beam (IS 456)',
        onLoad: () => {
            addDynamicRow('nosSet', 'beam-top-container', false, 12);
            addDynamicRow('nosSet', 'beam-bot-container', false, 16);
        },
        inputs: () => `
             <div class="input-row">
                <div class="input-group"><label>Width (b) mm</label><input type="number" class="bbs-mem-inp" data-key="b" placeholder="e.g. 230"></div>
                <div class="input-group"><label>Depth (D) mm</label><input type="number" class="bbs-mem-inp" data-key="D" placeholder="e.g. 450"></div>
            </div>
            <div class="input-group"><label>Beam Length (mm)</label><input type="number" class="bbs-mem-inp" data-key="L" placeholder="e.g. 4000"></div>
            
            <div style="margin-bottom:10px;">
                <label style="font-size:0.9em; font-weight:600; color:#555;">Top Bars</label>
                <div id="beam-top-container"></div>
                <button class="btn-outline-sm" onclick="addDynamicRow('nosSet', 'beam-top-container', true, 12)">+ Add Top Set</button>
            </div>

            <div style="margin-bottom:10px;">
                <label style="font-size:0.9em; font-weight:600; color:#555;">Bottom Bars</label>
                <div id="beam-bot-container"></div>
                <button class="btn-outline-sm" onclick="addDynamicRow('nosSet', 'beam-bot-container', true, 16)">+ Add Bot Set</button>
            </div>

             <div class="input-row">
                <div class="input-group"><label>Outer Ring Dia</label><select class="bbs-mem-inp" data-key="ringDia">${getDiaOptions(8)}</select></div>
                <div class="input-group"><label>Spacing</label><input type="number" class="bbs-mem-inp" data-key="ringSpace" value="150"></div>
            </div>
            
             <div style="margin-bottom:10px;">
                 <label style="font-size:0.9em; font-weight:600; color:#555;">Inner Rings</label>
                 <div id="beam-inner-container"></div>
                 <button class="btn-outline-sm" onclick="addDynamicRow('innerRing', 'beam-inner-container', true)">+ Add Inner Ring</button>
            </div>

            <div class="input-group"><label>Cover (mm)</label><input type="number" class="bbs-mem-inp" data-key="cover" value="25"></div>
        `
    },
    slab: {
        title: 'Slab (IS 456)',
        onLoad: () => {
            addDynamicRow('spacingSet', 'slab-main-bot-container', false, 10);
            addDynamicRow('spacingSet', 'slab-dist-bot-container', false, 8);
        },
        inputs: () => `
            <div class="input-row">
                <div class="input-group"><label>Panel Len (Ly)</label><input type="number" class="bbs-mem-inp" data-key="Ly" placeholder="e.g. 4000"></div>
                <div class="input-group"><label>Panel Wid (Lx)</label><input type="number" class="bbs-mem-inp" data-key="Lx" placeholder="e.g. 3000"></div>
            </div>
             <div class="input-group"><label>Slab Thick (mm)</label><input type="number" class="bbs-mem-inp" data-key="D" value="125"></div>
            
             <div style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
                <label style="font-size:0.9em; font-weight:700; color:var(--primary-color);">Short Span (Main)</label>
                
                <div style="margin-top:5px;">
                    <label style="font-size:0.85em; font-weight:600; color:#666;">Bottom Bars</label>
                    <div id="slab-main-bot-container"></div>
                    <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'slab-main-bot-container', true, 10)">+ Add Main Bottom</button>
                </div>
                
                 <div style="margin-top:10px;">
                    <label style="font-size:0.85em; font-weight:600; color:#666;">Top Bars</label>
                    <div id="slab-main-top-container"></div>
                    <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'slab-main-top-container', true, 10)">+ Add Main Top</button>
                </div>
            </div>

            <div style="margin-bottom:10px;">
                <label style="font-size:0.9em; font-weight:700; color:var(--primary-color);">Long Span (Dist)</label>
                
                 <div style="margin-top:5px;">
                    <label style="font-size:0.85em; font-weight:600; color:#666;">Bottom Bars</label>
                    <div id="slab-dist-bot-container"></div>
                    <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'slab-dist-bot-container', true, 8)">+ Add Dist Bottom</button>
                </div>

                 <div style="margin-top:10px;">
                    <label style="font-size:0.85em; font-weight:600; color:#666;">Top Bars</label>
                    <div id="slab-dist-top-container"></div>
                    <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'slab-dist-top-container', true, 8)">+ Add Dist Top</button>
                </div>
            </div>

             <div class="input-group"><label>Cover (mm)</label><input type="number" class="bbs-mem-inp" data-key="cover" value="20"></div>
        `
    },
    shape: {
        title: 'Custom Shape',
        inputs: () => `
             <div class="input-group full-width">
                <label>Select Shape</label>
                <select id="bbs-shape-custom" class="shape-select pl-2 bbs-mem-inp" data-key="customShape">
                    <option value="stirrup-rect">Rectangular Stirrup</option>
                    <option value="stirrup-circ">Circular Stirrup</option>
                    <option value="l-bar">L-Bar</option>
                    <option value="straight">Straight Bar</option>
                </select>
            </div>
            <div class="input-group full-width">
                 <label>Diameter</label>
                 <select class="bbs-mem-inp" data-key="customDia">${getDiaOptions(8)}</select>
            </div>
            <div id="bbs-custom-inputs"></div>
        `
    }
};

const BBS_SHAPE_CONFIG = {
    'stirrup-rect': { name: 'Rect Stirrup' },
    'stirrup-circ': { name: 'Circ Stirrup' },
    'l-bar': { name: 'L-Bar' },
    'straight': { name: 'Straight' }
};

// DOM Elements & Init
const els = {
    diaOptions: document.querySelectorAll('input[name="diameter"]'),
    price: document.getElementById('price'),
    containerQty: document.getElementById('quantity-inputs'),
    containerWeight: document.getElementById('weight-input-container'),
    inputBundles: document.getElementById('input-bundles'),
    inputRods: document.getElementById('input-rods'),
    inputWeight: document.getElementById('input-weight'),
    previewWeight: document.getElementById('preview-weight'),
    previewCost: document.getElementById('preview-cost'),
    addBtn: document.getElementById('add-btn'),
    clearBtn: document.getElementById('clear-btn'),
    itemsList: document.getElementById('items-list'),
    totalWeight: document.getElementById('total-weight'),
    subtotalCost: document.getElementById('subtotal-cost'),
    gstRow: document.getElementById('gst-row'),
    gstAmount: document.getElementById('gst-amount'),
    totalCost: document.getElementById('total-cost'),
    gstToggle: document.getElementById('gst-toggle'),
    gstRate: document.getElementById('gst-rate')
};

function init() {
    attachListeners();
    updateFromRods(0);
    state.gstEnabled = els.gstToggle.checked;
    state.gstRate = parseFloat(els.gstRate.value) || 0;
    updateGSTVisibility();
}

function attachListeners() {
    els.diaOptions.forEach(opt => {
        opt.addEventListener('change', (e) => {
            state.diameter = parseInt(e.target.value);
            updateFromRods(0);
        });
    });
    els.price.addEventListener('input', (e) => {
        let val = parseFloat(e.target.value) || 0;
        if (val < 0) { val = 0; e.target.value = 0; }
        state.price = val;
        updateCostOnly();
    });
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
    els.inputWeight.addEventListener('input', (e) => {
        let weight = parseFloat(e.target.value) || 0;
        if (weight < 0) { weight = 0; e.target.value = 0; }
        updateFromWeight(weight);
    });
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
    const infoBtn = document.getElementById('info-btn');
    if (infoBtn) {
        infoBtn.onclick = () => document.getElementById('info-modal').classList.add('active');
        document.getElementById('close-modal').onclick = () => document.getElementById('info-modal').classList.remove('active');
    }
    const inputs = [els.price, els.inputRods, els.inputBundles, els.inputWeight, els.gstRate];
    inputs.forEach(input => {
        input.addEventListener('dblclick', function () {
            this.select();
        });
    });
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
    return ((dia * dia) / 162) * len;
}

function updateFromRods(rods) {
    state.rods = rods;
    const perBundle = BUNDLE_MAP[state.diameter] || 1;
    const bundles = rods / perBundle;
    if (document.activeElement !== els.inputRods) els.inputRods.value = toDisplay(rods);
    if (document.activeElement !== els.inputBundles) els.inputBundles.value = toDisplay(bundles);
    const weight = rods * calculateOneRodWeight(state.diameter, state.length);
    state.weight = weight;
    if (document.activeElement !== els.inputWeight) els.inputWeight.value = weight > 0 ? weight.toFixed(2) : '';
    updateCostOnly();
}

function updateFromWeight(weight) {
    state.weight = weight;
    const oneRodW = calculateOneRodWeight(state.diameter, state.length);
    let rods = 0;
    if (oneRodW > 0) rods = weight / oneRodW;
    state.rods = rods;
    const perBundle = BUNDLE_MAP[state.diameter] || 1;
    const bundles = rods / perBundle;
    if (document.activeElement !== els.inputRods) els.inputRods.value = toDisplay(rods);
    if (document.activeElement !== els.inputBundles) els.inputBundles.value = toDisplay(bundles);
    updateCostOnly();
}

function updateCostOnly() {
    const cost = state.weight * state.price;
    els.previewWeight.textContent = formatNum(state.weight) + ' kg';
    els.previewCost.textContent = '₹' + Math.round(cost).toLocaleString('en-IN');
}

function toDisplay(num) {
    if (num === 0) return '';
    if (Number.isInteger(num)) return num;
    return parseFloat(num.toFixed(3));
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
        cost: state.weight * state.price
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
            const perBundle = BUNDLE_MAP[item.diameter] || 1;
            const bundles = Math.floor(item.quantity / perBundle);
            const rem = item.quantity % perBundle;
            const qtyDisplay = (bundles > 0 ? `${bundles} Bdl` : '') + (rem > 0.001 ? (bundles ? ', ' : '') + `${formatNum(rem)} Rods` : '') || '0 Rods';

            const tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${item.diameter}mm TMT</b></td><td class="text-right" style="font-size:0.9em;color:var(--text-muted);">${qtyDisplay}<div style="font-size:0.8em;opacity:0.7;">(${formatNum(item.quantity)})</div></td><td class="text-right">${Math.round(item.weight)}</td><td class="text-right">₹${Math.round(item.cost).toLocaleString('en-IN')}</td><td class="text-right"><button class="action-btn" onclick="deleteItem(${item.id})">&times;</button></td>`;
            els.itemsList.appendChild(tr);
            grandWeight += item.weight;
            subtotalCost += item.cost;
        });
    }
    els.totalWeight.textContent = formatNum(grandWeight) + ' kg';
    els.subtotalCost.textContent = '₹' + Math.round(subtotalCost).toLocaleString('en-IN');
    const gstVal = state.gstEnabled ? subtotalCost * (state.gstRate / 100) : 0;
    els.gstAmount.textContent = '₹' + Math.round(gstVal).toLocaleString('en-IN');
    els.totalCost.textContent = '₹' + formatCost(subtotalCost + gstVal);
}

function formatNum(n) { return n.toLocaleString('en-IN', { maximumFractionDigits: 2 }); }
function formatCost(n) { return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function animateAdd() {
    const btn = els.addBtn;
    const old = btn.innerHTML;
    btn.innerHTML = '<span class="btn-icon">✓</span> Added';
    btn.style.background = '#10b981';
    setTimeout(() => { btn.innerHTML = old; btn.style.background = ''; }, 1000);
}
window.deleteItem = deleteItem;

// --- BBS Logic ---

function setupBBSListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            const tab = document.getElementById(e.target.getAttribute('data-tab'));
            if (tab) { tab.style.display = 'block'; tab.classList.add('active'); }
        });
    });
    const typeSelect = document.getElementById('bbs-type');
    if (typeSelect) typeSelect.addEventListener('change', () => renderBBSInputs());
    const addBBSBtn = document.getElementById('bbs-add-btn');
    if (addBBSBtn) addBBSBtn.addEventListener('click', addBBSItem);
    const clearBBSBtn = document.getElementById('bbs-clear-btn');
    if (clearBBSBtn) clearBBSBtn.addEventListener('click', () => { state.bbsItems = []; renderBBSList(); });
    const memCount = document.getElementById('member-count');
    if (memCount) memCount.addEventListener('input', calculateBBSPreview);
    renderBBSInputs();
}

window.addDynamicRow = function (type, containerId, isRemovable, defDia) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const idx = container.children.length;
    const html = ROW_TEMPLATES[type](idx, isRemovable, defDia);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const node = temp.firstElementChild;
    container.appendChild(node);
    node.querySelectorAll('input, select').forEach(i => i.addEventListener('input', calculateBBSPreview));
    calculateBBSPreview();
};

window.removeDynamicRow = function (btn) {
    btn.closest('.dynamic-set').remove();
    calculateBBSPreview();
};

function renderBBSInputs() {
    const container = document.getElementById('bbs-dynamic-inputs');
    const type = document.getElementById('bbs-type').value;
    const config = MEMBER_CONFIG[type];
    if (!container || !config) return;

    container.innerHTML = config.inputs();
    if (config.onLoad) config.onLoad();

    if (type === 'shape') {
        const shapeSel = document.getElementById('bbs-shape-custom');
        shapeSel.addEventListener('change', renderCustomShapeInputs);
        renderCustomShapeInputs();
    }
    container.querySelectorAll('.bbs-mem-inp').forEach(inp => {
        inp.addEventListener('input', calculateBBSPreview);
        inp.addEventListener('dblclick', function () { this.select(); });
    });
    calculateBBSPreview();
}

function renderCustomShapeInputs() {
    const container = document.getElementById('bbs-custom-inputs');
    const shape = document.getElementById('bbs-shape-custom').value;
    let html = '';
    if (shape === 'stirrup-rect') html = `<div class="input-row"><div class="input-group"><label>A (mm)</label><input type="number" class="bbs-mem-inp custom-dim" data-key="a" placeholder="300"></div><div class="input-group"><label>B (mm)</label><input type="number" class="bbs-mem-inp custom-dim" data-key="b" placeholder="450"></div></div><div class="input-group"><label>Cover</label><input type="number" class="bbs-mem-inp custom-dim" data-key="cover" value="25"></div>`;
    else if (shape === 'stirrup-circ') html = `<div class="input-group"><label>Col Dia</label><input type="number" class="bbs-mem-inp custom-dim" data-key="d_member"></div><div class="input-group"><label>Cover</label><input type="number" class="bbs-mem-inp custom-dim" data-key="cover" value="40"></div>`;
    else if (shape === 'l-bar') html = `<div class="input-row"><div class="input-group"><label>A (mm)</label><input type="number" class="bbs-mem-inp custom-dim" data-key="a"></div><div class="input-group"><label>B (mm)</label><input type="number" class="bbs-mem-inp custom-dim" data-key="b"></div></div>`;
    else if (shape === 'straight') html = `<div class="input-group"><label>Length</label><input type="number" class="bbs-mem-inp custom-dim" data-key="len"></div>`;
    html += `<div class="input-group"><label>No. of Bars</label><input type="number" class="bbs-mem-inp custom-dim" data-key="qty" value="1"></div>`;
    container.innerHTML = html;
    container.querySelectorAll('input').forEach(i => {
        i.addEventListener('input', calculateBBSPreview);
        i.addEventListener('dblclick', function () { this.select() });
    });
}

function collectSets(selector) {
    const sets = [];
    document.querySelectorAll(selector).forEach(row => {
        const dia = parseFloat(row.querySelector('.set-dia')?.value) || 0;
        const spaceInp = row.querySelector('.set-space');
        const noInp = row.querySelector('.set-no');
        const aInp = row.querySelector('.set-a');
        const bInp = row.querySelector('.set-b');

        const item = { dia };
        if (spaceInp) item.space = parseFloat(spaceInp.value) || 0;
        if (noInp) item.no = parseFloat(noInp.value) || 0;
        if (aInp) item.a = parseFloat(aInp.value) || 0;
        if (bInp) item.b = parseFloat(bInp.value) || 0;

        if (dia > 0) {
            if (item.no > 0 || item.space > 0) sets.push(item);
        }
    });
    return sets;
}

function calculateBBSPreview() {
    const type = document.getElementById('bbs-type').value;
    const inputs = {};

    document.querySelectorAll('#bbs-dynamic-inputs .bbs-mem-inp:not(.set-dia):not(.set-no):not(.set-space):not(.set-a):not(.set-b)').forEach(i => {
        if (i.dataset.key) inputs[i.dataset.key] = parseFloat(i.value) || 0;
    });
    const memCount = parseFloat(document.getElementById('member-count').value) || 1;

    if (type === 'footing') {
        inputs.xSets = collectSets('#footing-x-container .dynamic-set');
        inputs.ySets = collectSets('#footing-y-container .dynamic-set');
    } else if (type === 'column') {
        inputs.vertSets = collectSets('#col-vert-container .dynamic-set');
        inputs.innerSets = collectSets('#col-inner-container .dynamic-set');
    } else if (type === 'beam') {
        inputs.topSets = collectSets('#beam-top-container .dynamic-set');
        inputs.botSets = collectSets('#beam-bot-container .dynamic-set');
        inputs.innerSets = collectSets('#beam-inner-container .dynamic-set');
    } else if (type === 'slab') {
        inputs.mainBotSets = collectSets('#slab-main-bot-container .dynamic-set');
        inputs.mainTopSets = collectSets('#slab-main-top-container .dynamic-set');
        inputs.distBotSets = collectSets('#slab-dist-bot-container .dynamic-set');
        inputs.distTopSets = collectSets('#slab-dist-top-container .dynamic-set');
    }
    if (type === 'shape') {
        document.querySelectorAll('.custom-dim').forEach(i => inputs[i.dataset.key] = parseFloat(i.value) || 0);
    }

    const items = generateMemberItems(type, inputs, memCount);
    let totalWt = 0;
    items.forEach(i => totalWt += i.weight);

    const wtEl = document.getElementById('bbs-total-weight');
    const countEl = document.getElementById('bbs-item-count');
    if (wtEl) wtEl.textContent = formatNum(totalWt) + ' kg';
    if (countEl) countEl.textContent = items.length + ' Item(s)';
    return items;
}

function generateMemberItems(type, inp, count) {
    const items = [];
    const pushItem = (name, shape, dia, cutLen, no) => {
        const wt = (dia * dia / 162) * (cutLen / 1000) * no * count;
        if (wt > 0) items.push({ name, shape, dia, cutLen: cutLen / 1000, qty: no * count, weight: wt });
    };

    if (type === 'footing') {
        const bob = Math.max(0, inp.D - 2 * inp.cover);
        if (inp.xSets) {
            inp.xSets.forEach((set, idx) => {
                const lenX = (inp.L - 2 * inp.cover) + 2 * bob;
                const noX = Math.floor((inp.B - 2 * inp.cover) / set.space) + 1;
                pushItem(`Footing X Set ${idx + 1}`, 'U-Bar', set.dia, lenX, noX);
            });
        }
        if (inp.ySets) {
            inp.ySets.forEach((set, idx) => {
                const lenY = (inp.B - 2 * inp.cover) + 2 * bob;
                const noY = Math.floor((inp.L - 2 * inp.cover) / set.space) + 1;
                pushItem(`Footing Y Set ${idx + 1}`, 'U-Bar', set.dia, lenY, noY);
            });
        }

    } else if (type === 'column') {
        if (inp.vertSets) {
            inp.vertSets.forEach((set, idx) => {
                const lap = 50 * set.dia;
                pushItem(`Vert Set ${idx + 1}`, 'Straight', set.dia, inp.H + lap, set.no);
            });
        }

        const a = Math.max(0, inp.b - 2 * inp.cover);
        const b = Math.max(0, inp.D - 2 * inp.cover);
        const ringLen = 2 * (a + b) + 24 * inp.ringDia;
        const ringNo = Math.floor(inp.H / inp.ringSpace) + 1;
        pushItem('Rings (Outer)', 'Rect Ring', inp.ringDia, ringLen, ringNo);

        if (inp.innerSets) {
            inp.innerSets.forEach((set, idx) => {
                let innerLen = 0;
                let typeStr = 'Link/Tie';
                if (set.b > 0) {
                    innerLen = 2 * (set.a + set.b) + 24 * set.dia;
                    typeStr = 'Inner Ring';
                } else {
                    innerLen = set.a + 20 * set.dia;
                }
                const innerNo = Math.floor(inp.H / set.space) + 1;
                pushItem(`${typeStr} ${idx + 1}`, 'Custom', set.dia, innerLen, innerNo);
            });
        }

    } else if (type === 'beam') {
        const effLen = inp.L - 2 * inp.cover;
        if (inp.topSets) {
            inp.topSets.forEach((set, idx) => {
                const hook = 2 * 10 * set.dia;
                pushItem(`Top Set ${idx + 1}`, 'Str+Hook', set.dia, effLen + hook, set.no);
            });
        }
        if (inp.botSets) {
            inp.botSets.forEach((set, idx) => {
                const hook = 2 * 10 * set.dia;
                pushItem(`Bot Set ${idx + 1}`, 'Str+Hook', set.dia, effLen + hook, set.no);
            });
        }

        const a = Math.max(0, inp.b - 2 * inp.cover);
        const b = Math.max(0, inp.D - 2 * inp.cover);
        const ringLen = 2 * (a + b) + 24 * inp.ringDia;
        const ringNo = Math.floor(inp.L / inp.ringSpace) + 1;
        pushItem('Stirrups', 'Rect Ring', inp.ringDia, ringLen, ringNo);

        if (inp.innerSets) {
            inp.innerSets.forEach((set, idx) => {
                const innerLen = 2 * (set.a + (set.b || 0)) + 24 * set.dia;
                const innerNo = Math.floor(inp.L / set.space) + 1;
                pushItem(`Inner Ring ${idx + 1}`, 'Rect Ring', set.dia, innerLen, innerNo);
            });
        }

    } else if (type === 'slab') {
        // Main Bars (Short Span)
        const crankAddRatio = 0.42;

        // Bottom
        if (inp.mainBotSets) {
            inp.mainBotSets.forEach((set, idx) => {
                const d_crank = Math.max(0, inp.D - 2 * inp.cover - set.dia);
                const crankAdd = crankAddRatio * d_crank;
                const cutMain = inp.Lx - 2 * inp.cover + (2 * 10 * set.dia) + crankAdd;
                const noMain = Math.floor(inp.Ly / set.space) + 1;
                pushItem(`Main Bot (Short) Set ${idx + 1}`, 'Cranked', set.dia, cutMain, noMain);
            });
        }

        // Top
        if (inp.mainTopSets) {
            inp.mainTopSets.forEach((set, idx) => {
                const cutMain = inp.Lx - 2 * inp.cover + (2 * 10 * set.dia); // Usually straight
                const noMain = Math.floor(inp.Ly / set.space) + 1;
                pushItem(`Main Top (Short) Set ${idx + 1}`, 'Straight', set.dia, cutMain, noMain);
            });
        }

        // Distribution Bars (Long Span)
        // Bottom
        if (inp.distBotSets) {
            inp.distBotSets.forEach((set, idx) => {
                const cutDist = inp.Ly - 2 * inp.cover + (2 * 10 * set.dia);
                const noDist = Math.floor(inp.Lx / set.space) + 1;
                pushItem(`Dist Bot (Long) Set ${idx + 1}`, 'Straight', set.dia, cutDist, noDist);
            });
        }

        // Top
        if (inp.distTopSets) {
            inp.distTopSets.forEach((set, idx) => {
                const cutDist = inp.Ly - 2 * inp.cover + (2 * 10 * set.dia);
                const noDist = Math.floor(inp.Lx / set.space) + 1;
                pushItem(`Dist Top (Long) Set ${idx + 1}`, 'Straight', set.dia, cutDist, noDist);
            });
        }

    } else if (type === 'shape') {
        const shape = inp.customShape;
        const d = inp.customDia;
        const q = inp.qty || 1;
        let cut = 0;
        if (shape === 'stirrup-rect') cut = 2 * (Math.max(0, inp.a - 2 * inp.cover) + Math.max(0, inp.b - 2 * inp.cover)) + (24 * d);
        else if (shape === 'stirrup-circ') cut = Math.PI * Math.max(0, inp.d_member - 2 * inp.cover - d) + (24 * d);
        else if (shape === 'l-bar') cut = inp.a + inp.b - 2 * d;
        else if (shape === 'straight') cut = inp.len;
        pushItem('Custom', BBS_SHAPE_CONFIG[shape].name, d, cut, q);
    }

    return items;
}

function addBBSItem() {
    const items = calculateBBSPreview();
    if (!items || items.length === 0) return;
    const memName = document.getElementById('bbs-name').value || 'MEM';
    const type = document.getElementById('bbs-type').value;
    items.forEach(i => { i.memberName = memName.toUpperCase(); i.memberType = type; state.bbsItems.push(i); });
    renderBBSList();
    const btn = document.getElementById('bbs-add-btn'); const old = btn.innerHTML; btn.innerHTML = 'Added! ✓'; btn.style.background = '#10b981'; setTimeout(() => { btn.innerHTML = old; btn.style.background = ''; }, 1000);
}

function renderBBSList() {
    const list = document.getElementById('bbs-list');
    const grandTotalEl = document.getElementById('bbs-grand-total');
    if (!list || !grandTotalEl) return;
    list.innerHTML = ''; let grandTotal = 0;
    if (state.bbsItems.length === 0) {
        list.innerHTML = '<tr class="empty-state"><td colspan="7">No items added yet.</td></tr>';
        grandTotalEl.textContent = '0 kg'; return;
    }
    const groups = {};
    state.bbsItems.forEach((item, index) => {
        if (!groups[item.memberName]) groups[item.memberName] = { name: item.memberName, type: item.memberType, items: [], weight: 0 };
        groups[item.memberName].items.push({ ...item, originalIndex: index });
        groups[item.memberName].weight += item.weight;
        grandTotal += item.weight;
    });
    Object.values(groups).forEach(group => {
        const headerRow = document.createElement('tr');
        headerRow.className = 'group-header'; headerRow.style.background = 'rgba(0,0,0,0.03)';
        headerRow.innerHTML = `<td colspan="5" style="column-span:all;font-weight:700;color:var(--primary-color);">${group.name} <span style="font-size:0.8em;color:#666;font-weight:400;">(${MEMBER_CONFIG[group.type]?.title || group.type})</span></td><td style="font-weight:700;">${formatNum(group.weight)}</td><td><button class="action-btn text-red" onclick="removeBBSGroup('${group.name}')" title="Delete Member">&times;</button></td>`;
        list.appendChild(headerRow);
        group.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td style="padding-left:20px;color:#555;">${item.name}</td><td>${item.shape}</td><td>${item.dia}</td><td>${item.cutLen.toFixed(3)}</td><td>${item.qty}</td><td style="color:#666;">${formatNum(item.weight)}</td><td><button class="action-btn" style="opacity:0.3" onclick="removeBBSItem(${item.originalIndex})">&times;</button></td>`;
            list.appendChild(row);
        });
    });
    grandTotalEl.textContent = formatNum(grandTotal) + ' kg';
}
function removeBBSItem(index) { state.bbsItems.splice(index, 1); renderBBSList(); }
function removeBBSGroup(memName) { if (!confirm(`Delete all for "${memName}"?`)) return; state.bbsItems = state.bbsItems.filter(i => i.memberName !== memName); renderBBSList(); }
window.removeBBSItem = removeBBSItem; window.removeBBSGroup = removeBBSGroup;
setupBBSListeners(); init();

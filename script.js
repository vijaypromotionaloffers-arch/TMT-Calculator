// State
const state = {
    diameter: 8,
    length: 12,
    price: 0,
    rods: 0,
    weight: 0,
    gstEnabled: false,
    gstRate: 18,
    bindingWireRate: 10,
    laborRate: 0,
    items: [],
    bbsItems: [],
    steelItems: [],
    bbsDia: 8,
    bbsShape: 'stirrup-rect'
};

const BUNDLE_MAP = { 8: 10, 10: 7, 12: 5, 16: 3, 20: 2, 25: 1, 32: 1 };
const UNIT_WEIGHT_CONST = 162;

// --- Unit Conversion ---
const UNITS = { MM: 'mm', FT: 'ft' };
let appUnit = UNITS.MM; // Default unit

// Converts any length string (mm, ft, in) to Millimeters (integer)
// Converts any length string (mm, ft, in) to Millimeters (integer)
function toMM(valStr, unitContext = appUnit) {
    if (!valStr) return 0;
    valStr = String(valStr).trim();
    if (valStr === '') return 0;

    // Check for "10 5", "10-5", "10.5" (as ft.in) format
    // Allow flexible spacing and separators
    const flexMatch = valStr.match(/^(\d+)[\s\-\.]+(\d+)\s*"?$/);

    if (flexMatch) {
        let ft = parseInt(flexMatch[1]);
        let inc = parseInt(flexMatch[2]);
        return Math.round((ft * 304.8) + (inc * 25.4));
    }

    // Check for Standard Foot/Inch format: 10' 5", 10', 5"
    const ftMatch = valStr.match(/(\d+)\'/);
    const inMatch = valStr.match(/(\d+)\"/);

    if (ftMatch || inMatch) {
        let ft = ftMatch ? parseInt(ftMatch[1]) : 0;
        let inc = inMatch ? parseInt(inMatch[1]) : 0;
        return Math.round((ft * 304.8) + (inc * 25.4));
    }

    // Assume MM if simple number
    return Math.round(parseFloat(valStr) || 0);
}

// Converts Millimeters (integer) to Display String based on Current Unit
function toDisplay(mmVal) {
    if (isNaN(mmVal) || mmVal === 0) return '';
    if (appUnit === UNITS.MM) {
        return String(Math.round(mmVal));
    } else {
        // Convert to ft' in"
        // 1 inch = 25.4 mm
        let totalInches = Math.round(mmVal / 25.4);
        let feet = Math.floor(totalInches / 12);
        let inches = totalInches % 12;
        if (feet > 0 && inches > 0) return `${feet}' ${inches}"`;
        if (feet > 0) return `${feet}'`;
        return `${inches}"`;
    }
}

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
        title: 'Footing',
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
        title: 'Column',
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
        title: 'Beam',
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
        title: 'Slab',
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
            
            <div style="margin-bottom:10px;">
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

                <div style="margin-top:10px;">
                    <label style="font-size:0.85em; font-weight:600; color:#666;">Top Extra (Support)</label>
                    <div id="slab-main-top-extra-container"></div>
                    <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'slab-main-top-extra-container', true, 10)">+ Add Top Extra (0.3L)</button>
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

                <div style="margin-top:10px;">
                    <label style="font-size:0.85em; font-weight:600; color:#666;">Top Extra (Support)</label>
                    <div id="slab-dist-top-extra-container"></div>
                    <button class="btn-outline-sm" onclick="addDynamicRow('spacingSet', 'slab-dist-top-extra-container', true, 8)">+ Add Top Extra (0.3L)</button>
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

const STEEL_CONSTANTS = {
    DENSITY: 7850, // kg/m3
    TYPES: {
        SHS: { label: 'SHS (Square)', inputs: ['Side (mm)', 'Thickness (mm)'] },
        RHS: { label: 'RHS (Rectangular)', inputs: ['Width (mm)', 'Depth (mm)', 'Thickness (mm)'] },
        CHS: { label: 'CHS (Circular)', inputs: ['Outer Dia (mm)', 'Thickness (mm)'] },
        ANGLE: { label: 'Angle (L)', inputs: ['Leg A (mm)', 'Leg B (mm)', 'Thickness (mm)'] },
        BEAM: { label: 'Beam (I/H)', inputs: ['Depth (mm)', 'Flange Width (mm)', 'Web Thk (mm)', 'Flange Thk (mm)'] },
        CHANNEL: { label: 'Channel (C)', inputs: ['Depth (mm)', 'Flange Width (mm)', 'Web Thk (mm)', 'Flange Thk (mm)'] },
        FLAT: { label: 'Flat Bar', inputs: ['Width (mm)', 'Thickness (mm)'] }
    },
    PRESETS: {
        SHS: [
            { label: 'SC1 - 200x200x10', vals: [200, 10] },
            { label: 'SC2 - 400x400x12', vals: [400, 12] },
            { label: '300x300x10', vals: [300, 10] }
        ],
        RHS: [
            { label: 'M1 - 300x150x6', vals: [300, 150, 6] },
            { label: 'M2 - 200x100x4', vals: [200, 100, 4] },
            { label: 'M3 - 300x150x10', vals: [300, 150, 10] },
            { label: 'M4 - 500x200x16', vals: [500, 200, 16] },
            { label: 'M5 - 300x200x12', vals: [300, 200, 12] },
            { label: 'M6 - 200x100x4', vals: [200, 100, 4] },
            { label: 'M7 - 240x120x8', vals: [240, 120, 8] },
            { label: 'M8 - 145x82x4.8', vals: [145, 82, 4.8] },
            { label: 'SC3 - 200x100x8', vals: [200, 100, 8] }
        ],
        CHS: [
            { label: 'M9 - 114.3x4.5', vals: [114.3, 4.5] }
        ]
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
    console.log("Modern Calculator: init() started");
    attachListeners();
    updateFromRods(0);
    state.gstEnabled = els.gstToggle.checked;
    state.gstRate = parseFloat(els.gstRate.value) || 0;
    updateGSTVisibility();
    injectCostSettings();
    injectProjectUI();
    try {
        console.log("Calling initSteelTab()");
        initSteelTab();
        console.log("initSteelTab() success");
    } catch (e) {
        console.error("Error in initSteelTab:", e);
    }
}

// Inject Cost Settings
// ...
function injectCostSettings() {
    // ... (lines 370-388)
    div.innerHTML = `
            <h4 style="font-size:0.9em; margin-bottom:10px; color:#555;">Advanced Costs</h4>
            <div class="input-row">
                <div class="input-group">
                    <label>Labor Rate (₹/ton)</label>
                    <input type="number" id="labor-rate" placeholder="e.g. 5000" class="bbs-mem-inp" value="0">
                </div>
                 <div class="input-group">
                    <label>Binding Wire (kg/ton)</label>
                    <input type="number" id="wire-rate" placeholder="e.g. 10" class="bbs-mem-inp" value="10">
                </div>
                <div class="input-group">
                    <label>Wire Price (₹/kg)</label>
                    <input type="number" id="wire-price" placeholder="e.g. 80" class="bbs-mem-inp" value="0">
                </div>
            </div>
        `;
    // ...
    document.getElementById('wire-price').addEventListener('input', (e) => {
        state.bindingWirePrice = parseFloat(e.target.value) || 0;
        renderList();
    });
}

// Inject styles for print
const style = document.createElement('style');
style.innerHTML = `
        @media print {
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body * { visibility: hidden; }
            #bbs-print-section, #bbs-print-section * { visibility: visible; }
            #bbs-print-section {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                box-shadow: none;
                background: white;
            }
            #bbs-clear-btn, #bbs-export-actions, .action-btn, button { display: none !important; }
            
            table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; font-size: 12px; }
            th { background-color: #f3f4f6 !important; color: #111 !important; font-weight: bold; border: 1px solid #ccc; padding: 8px; }
            td { border: 1px solid #ccc; padding: 6px; }
            .group-header { background-color: #e5e7eb !important; font-weight: bold; }
            .group-header td { background-color: #e5e7eb !important; }
        }
    `;
document.head.appendChild(style);

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

    // Cost Calc
    // Cost Calc
    const weightInTons = grandWeight / 1000;
    const laborCost = weightInTons * (state.laborRate || 0);

    // Binding Wire Calc
    const wireKg = weightInTons * (state.bindingWireRate || 10);
    const wireCost = wireKg * (state.bindingWirePrice || 0);

    // Final Cost
    let finalCost = subtotalCost + laborCost + wireCost;
    const gstVal = state.gstEnabled ? subtotalCost * (state.gstRate / 100) : 0;
    finalCost += gstVal;

    els.gstAmount.textContent = '₹' + Math.round(gstVal).toLocaleString('en-IN');

    let extraText = '';
    if (laborCost > 0) extraText += ` + Labor: ₹${formatNum(laborCost)}`;
    if (wireCost > 0) extraText += ` + Wire: ₹${formatNum(wireCost)} (${formatNum(wireKg)}kg)`;

    els.totalCost.innerHTML = '₹' + formatCost(finalCost) + (extraText ? `<div style="font-size:0.6em; font-weight:400; color:#666;">(Incl. GST${extraText})</div>` : '');
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


    // Opt Listener
    const btnOpt = document.getElementById('btn-generate-plan');
    if (btnOpt) btnOpt.addEventListener('click', generateCutPlan);

    // New Static Actions
    const btnProj = document.getElementById('btn-project');
    const btnExcel = document.getElementById('btn-excel');
    const btnPrint = document.getElementById('btn-print');

    if (btnProj) btnProj.addEventListener('click', openProjectModal);
    if (btnExcel) btnExcel.addEventListener('click', exportCSV);
    if (btnPrint) btnPrint.addEventListener('click', printBBS);

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
    drawShape(shape, {});
}

// --- Visual & Export Logic ---

function drawShape(shape, params) {
    const canvas = document.getElementById('shape-preview');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas for better resolution (optional, but good for text)
    // Only set if not already high-res to avoid loop if we add resize listener later
    // For now, assume fixed 300x150 but let's treat context width relative
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Config
    const colorConc = '#e5e7eb'; // concrete fill
    const colorConcStroke = '#9ca3af'; // concrete outline
    const colorStirrup = '#ef4444'; // red stirrup
    const colorBar = '#3b82f6'; // blue bars
    const colorInner = '#f59e0b'; // orange inner links
    const pad = 25; // Increased padding for labels

    function drawBar(cx, cy, d) {
        ctx.beginPath();
        ctx.fillStyle = colorBar;
        const r = Math.max(2, d / 2 * 0.4); // Scale down visual radius
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fill();
    }

    if (shape === 'footing') {
        const L = params.L || 1500;
        const B = params.B || 1200;
        // Use pad for labels (approx 20px space)
        const ratio = Math.min((w - 2 * pad) / L, (h - 2 * pad) / B);
        const dw = L * ratio;
        const dh = B * ratio;
        const x = (w - dw) / 2;
        const y = (h - dh) / 2;

        ctx.strokeStyle = colorConcStroke;
        ctx.strokeRect(x, y, dw, dh);

        // Draw Grid
        ctx.beginPath();
        ctx.strokeStyle = '#ccc';
        const count = 5;
        for (let i = 1; i < count; i++) { ctx.moveTo(x + (dw * i / count), y); ctx.lineTo(x + (dw * i / count), y + dh); }
        for (let i = 1; i < count; i++) { ctx.moveTo(x, y + (dh * i / count)); ctx.lineTo(x + dw, y + (dh * i / count)); }
        ctx.stroke();

        ctx.fillStyle = '#666';
        ctx.fillText(`L: ${L}`, w / 2, y - 10);
        ctx.fillText(`B: ${B}`, x + dw + 15, h / 2);
    }
    else if (shape === 'column') {
        const B_real = params.b || 300;
        const D_real = params.D || 450;
        const ratio = Math.min((w - 60) / B_real, (h - 60) / D_real); // More space
        const dw = B_real * ratio;
        const dh = D_real * ratio;
        const x = (w - dw) / 2;
        const y = (h - dh) / 2;

        ctx.strokeStyle = colorConcStroke;
        ctx.strokeRect(x, y, dw, dh);

        const cover = (params.cover || 40) * ratio;
        const stirrupW = dw - 2 * cover;
        const stirrupH = dh - 2 * cover;
        const sx = x + cover;
        const sy = y + cover;

        ctx.strokeStyle = colorStirrup;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx, sy, stirrupW, stirrupH);

        const bars = [];
        if (params.vertSets) params.vertSets.forEach(set => {
            for (let i = 0; i < set.no; i++) bars.push(set.dia);
        });
        bars.sort((a, b) => b - a);

        const coords = [
            { x: sx, y: sy },
            { x: sx + stirrupW, y: sy },
            { x: sx + stirrupW, y: sy + stirrupH },
            { x: sx, y: sy + stirrupH }
        ];

        const remnant = bars.length - 4;
        if (remnant > 0) {
            // Distribute logic (simplified)
            const topC = Math.ceil(remnant / 4);
            const rightC = Math.ceil((remnant - topC) / 3);
            const botC = Math.ceil((remnant - topC - rightC) / 2);
            const leftC = remnant - topC - rightC - botC;
            const fillLine = (x1, y1, x2, y2, c) => {
                for (let k = 1; k <= c; k++) {
                    coords.push({ x: x1 + (x2 - x1) * (k / (c + 1)), y: y1 + (y2 - y1) * (k / (c + 1)) });
                }
            };
            fillLine(sx, sy, sx + stirrupW, sy, topC);
            fillLine(sx + stirrupW, sy, sx + stirrupW, sy + stirrupH, rightC);
            fillLine(sx + stirrupW, sy + stirrupH, sx, sy + stirrupH, botC);
            fillLine(sx, sy + stirrupH, sx, sy, leftC);
        }

        bars.forEach((dia, i) => { if (i < coords.length) drawBar(coords[i].x, coords[i].y, dia); });

        // Inner sets
        if (params.innerSets) {
            ctx.strokeStyle = colorInner;
            ctx.lineWidth = 1;
            params.innerSets.forEach(set => {
                if (set.a && set.b) {
                    const iw = set.a * ratio;
                    const ih = set.b * ratio;
                    ctx.strokeRect((w - iw) / 2, (h - ih) / 2, iw, ih);
                } else if (set.a) {
                    const len = set.a * ratio;
                    ctx.beginPath(); ctx.moveTo(w / 2, h / 2 - len / 2); ctx.lineTo(w / 2, h / 2 + len / 2); ctx.stroke();
                }
            });
        }

        ctx.fillStyle = '#666'; ctx.fillText(`${B_real}x${D_real}`, w / 2, h - 10);
    }
    else if (shape === 'beam') {
        const B_real = params.b || 300;
        const D_real = params.D || 450;
        const ratio = Math.min((w - 60) / B_real, (h - 60) / D_real);
        const dw = B_real * ratio;
        const dh = D_real * ratio;
        const x = (w - dw) / 2;
        const y = (h - dh) / 2;

        ctx.strokeStyle = colorConcStroke;
        ctx.strokeRect(x, y, dw, dh);

        const cover = (params.cover || 25) * ratio;
        const sx = x + cover;
        const sy = y + cover;
        const sw = dw - 2 * cover;
        const sh = dh - 2 * cover;

        ctx.strokeStyle = colorStirrup;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx, sy, sw, sh);

        const layerGap = 25 * ratio;
        if (params.topSets) params.topSets.forEach((set, idx) => {
            const layerY = sy + (idx * layerGap);
            const count = set.no;
            if (count > 0) {
                if (count === 1) drawBar(sx + sw / 2, layerY, set.dia);
                else for (let i = 0; i < count; i++) drawBar(sx + (sw * i / (count - 1)), layerY, set.dia);
            }
        });
        if (params.botSets) params.botSets.forEach((set, idx) => {
            const layerY = (sy + sh) - (idx * layerGap);
            const count = set.no;
            if (count > 0) {
                if (count === 1) drawBar(sx + sw / 2, layerY, set.dia);
                else for (let i = 0; i < count; i++) drawBar(sx + (sw * i / (count - 1)), layerY, set.dia);
            }
        });
        if (params.innerSets) {
            ctx.strokeStyle = colorInner; ctx.lineWidth = 1;
            params.innerSets.forEach(set => {
                if (set.a && set.b) {
                    const iw = set.a * ratio; const ih = (set.b || 0) * ratio;
                    ctx.strokeRect((w - iw) / 2, (h - ih) / 2, iw, ih);
                }
            });
        }
        ctx.fillStyle = '#666'; ctx.fillText(`${B_real}x${D_real}`, w / 2, h - 10);
    }
    else if (shape === 'slab') {
        const Lx = params.Lx || 3000;
        const Ly = params.Ly || 4000;
        const ratio = Math.min((w - 60) / Lx, (h - 60) / Ly);
        const dw = Lx * ratio;
        const dh = Ly * ratio;
        const x = (w - dw) / 2;
        const y = (h - dh) / 2;

        ctx.strokeRect(x, y, dw, dh);
        ctx.beginPath(); ctx.strokeStyle = '#ddd';
        ctx.moveTo(x, y); ctx.lineTo(x + dw, y + dh);
        ctx.moveTo(x + dw, y); ctx.lineTo(x, y + dh);
        ctx.stroke();

        ctx.fillStyle = '#666';
        ctx.fillText(`Lx: ${Lx}`, w / 2, y - 10);
        ctx.fillText(`Ly: ${Ly}`, x + dw + 20, h / 2);
    }
    else if (shape === 'stirrup-rect') {
        const rw = w - 2 * pad;
        const rh = h - 2 * pad;
        ctx.strokeStyle = colorBar;
        ctx.strokeRect(pad, pad, rw, rh);
        // Hook
        ctx.beginPath();
        ctx.moveTo(pad + rw / 2, pad); ctx.lineTo(pad + rw / 2 + 10, pad + 15);
        ctx.moveTo(pad + rw / 2, pad); ctx.lineTo(pad + rw / 2 - 10, pad + 15);
        ctx.stroke();

        ctx.fillStyle = '#666';
        ctx.fillText(`A: ${params.a || 'A'}`, w / 2, h - 10);
        ctx.fillText(`B: ${params.b || 'B'}`, 10, h / 2); // Left side
    }
    else if (shape === 'stirrup-circ') {
        ctx.beginPath();
        ctx.strokeStyle = colorBar;
        const r = (Math.min(w, h) / 2) - pad;
        ctx.arc(w / 2, h / 2, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#666';
        ctx.fillText(`D: ${params.d_member || 'D'}`, w / 2, h - 10);
    }
    else if (shape === 'l-bar') {
        ctx.beginPath();
        ctx.strokeStyle = colorBar;
        // Schematic L shape
        const lx = pad + 20; const ly = pad;
        const lb = w - pad; const lh = h - pad;
        ctx.moveTo(lx, ly); ctx.lineTo(lx, lh); ctx.lineTo(lb, lh);
        ctx.stroke();
        ctx.fillStyle = '#666';
        ctx.fillText(`A: ${params.a || 'A'}`, lx - 10, h / 2);
        ctx.fillText(`B: ${params.b || 'B'}`, w / 2 + 10, h - 10);
    }
    else if (shape === 'straight') {
        ctx.beginPath();
        ctx.strokeStyle = colorBar;
        ctx.moveTo(pad, h / 2); ctx.lineTo(w - pad, h / 2);
        ctx.stroke();
        ctx.fillStyle = '#666';
        ctx.fillText(`L: ${params.len || 'Len'}`, w / 2, h / 2 - 15);
    }
}

function printBBS() {
    window.print();
}

function exportCSV() {
    if (state.bbsItems.length === 0) { alert('No data to export'); return; }
    // BOM for UTF-8 + sep=, for Excel to auto-detect columns
    let csv = '\uFEFFsep=,\nMember,Type,Shape,Dia (mm),Cut Len (m),Qty,Weight (kg)\n';

    // Sort items by Group to match display
    const groups = {};
    state.bbsItems.forEach((item) => {
        const key = `${item.memberName}-${item.memberType}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });

    Object.keys(groups).forEach(grpKey => {
        groups[grpKey].forEach(item => {
            // Quote strings to handle commas in names if any
            csv += `"${item.memberName}","${item.memberType}","${item.shape}",${item.dia},${item.cutLen.toFixed(3)},${item.qty},${item.weight.toFixed(2)}\n`;
        });
    });

    // Add Summary
    const totalWt = state.bbsItems.reduce((acc, i) => acc + i.weight, 0);
    const wireKg = (totalWt / 1000) * state.bindingWireRate;
    csv += `\n,,,,,TOTAL STEEL,${totalWt.toFixed(2)}\n`;
    csv += `\n,,,,,BINDING WIRE,${wireKg.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bbs_schedule_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// --- Project Management ---
const PROJECT_STORAGE_KEY = 'bbs_projects';

function getProjects() {
    return JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY) || '{}');
}

function saveProject() {
    const name = document.getElementById('project-name-inp').value.trim();
    if (!name) { alert('Please enter a project name'); return; }
    const projects = getProjects();
    if (projects[name] && !confirm(`Overwrite existing project "${name}"?`)) return;

    projects[name] = {
        date: Date.now(),
        items: state.bbsItems
    };
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
    renderProjectList();
    alert('Project saved successfully!');
}

function loadProject(name, append = false) {
    if (!append && state.bbsItems.length > 0 && !confirm('Replace current list? Cancel to stop.')) return;

    const projects = getProjects();
    if (projects[name]) {
        if (append) {
            state.bbsItems = [...state.bbsItems, ...(projects[name].items || [])];
        } else {
            state.bbsItems = projects[name].items || [];
            // Pre-fill name for re-saving
            const nameInp = document.getElementById('project-name-inp');
            if (nameInp) nameInp.value = name;
        }
        renderBBSList();
        document.getElementById('project-modal').classList.remove('active');
    }
}

function deleteProject(name) {
    if (!confirm(`Delete project "${name}" forever?`)) return;
    const projects = getProjects();
    delete projects[name];
    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
    renderProjectList();
}

function renderProjectList() {
    const list = document.getElementById('saved-projects-list');
    if (!list) return;
    const projects = getProjects();
    const names = Object.keys(projects).sort();

    if (names.length === 0) {
        list.innerHTML = '<div style="color:#888; text-align:center; padding:10px;">No saved projects</div>';
        return;
    }

    list.innerHTML = names.map(name => {
        const safeName = name.replace(/'/g, "\\'");
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #eee;">
            <span style="font-weight:600; font-size:0.95em; color:#333;">${name}</span>
            <div style="display:flex; gap:5px;">
                <button class="action-btn" onclick="printProject('${safeName}')" title="Print Project" style="color:#4b5563;">🖨️</button>
                <button class="action-btn" onclick="exportProjectExcel('${safeName}')" title="Export Excel" style="color:#059669;">📊</button>
                <button class="action-btn" onclick="exportProjectJSON('${safeName}')" title="Backup JSON" style="color:#6366f1;">⬇️</button>
                <button class="btn-outline-sm" onclick="loadProject('${safeName}', false)" title="Replace Current List">Load</button>
                <button class="btn-outline-sm" onclick="loadProject('${safeName}', true)" title="Add to Current List">+ Add</button>
                <button class="action-btn text-red" onclick="deleteProject('${safeName}')" style="margin-left:5px;">&times;</button>
            </div>
        </div>
    `;
    }).join('');
}

function exportProjectJSON(name) {
    const projects = getProjects();
    if (!projects[name]) return;
    const data = JSON.stringify(projects[name], null, 2);
    const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Sanitize filename: replace non-alphanumeric chars with underscore
    const safeFilename = name.replace(/[^a-z0-9]/gi, '_');
    a.download = `${safeFilename}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importProjectJSON(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.items || !Array.isArray(data.items)) { throw new Error('Invalid project structure'); }

            // Default name from filename
            let name = file.name.replace('.json', '').replace('_backup', '');
            name = prompt('Enter name for imported project:', name);
            if (!name) return;

            const projects = getProjects();
            if (projects[name] && !confirm(`Overwrite existing project "${name}"?`)) return;

            projects[name] = data;
            localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
            renderProjectList();
            alert('Project imported successfully!');
        } catch (err) {
            alert('Error importing file: ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = ''; // Reset
}

function openProjectModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.add('active');
    renderProjectList();
}

function injectProjectUI() {
    // Inject Modal
    if (!document.getElementById('project-modal')) {
        const modal = document.createElement('div');
        modal.id = 'project-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content glass-panel" style="max-width: 500px; width:90%;">
                <button onclick="document.getElementById('project-modal').classList.remove('active')" class="close-btn">&times;</button>
                <h3 style="margin-bottom:15px;">Project Management</h3>
                
                <div style="background:#f9fafb; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #eee;">
                    <label style="font-weight:600; display:block; margin-bottom:8px; color:#4b5563;">Save Current Project</label>
                    <div style="display:flex; gap:10px;">
                        <input type="text" id="project-name-inp" class="bbs-mem-inp" placeholder="Project Name" style="flex:1;">
                        <button class="primary-btn" style="padding:0 20px;" onclick="saveProject()">Save</button>
                    </div>
                </div>
                
                <label style="font-weight:600; display:block; margin-bottom:10px; color:#4b5563;">Saved Projects</label>
                <div id="saved-projects-list" style="max-height:300px; overflow-y:auto; border:1px solid #eee; border-radius:4px; background:white;"></div>

                <div style="margin-top:20px; border-top:1px solid #eee; padding-top:15px; text-align:center;">
                    <input type="file" id="import-file" style="display:none" accept=".json" onchange="importProjectJSON(this)">
                    <button class="btn-outline-sm" style="width:100%; border-style:dashed; color:#666;" onclick="document.getElementById('import-file').click()">
                        📥 Import Project Backup (.json)
                    </button>
                    <p style="font-size:0.8em; color:#999; margin-top:5px;">Transfer projects between export/import via JSON</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}
window.saveProject = saveProject; window.loadProject = loadProject; window.deleteProject = deleteProject;
window.exportProjectJSON = exportProjectJSON; window.importProjectJSON = importProjectJSON;

function collectSets(selector) {
    // Implementation same as before
    const sets = [];
    document.querySelectorAll(selector).forEach(row => {
        const dia = parseFloat(row.querySelector('.set-dia')?.value) || 0;
        const spaceInp = row.querySelector('.set-space');
        const noInp = row.querySelector('.set-no');
        const aInp = row.querySelector('.set-a');
        const bInp = row.querySelector('.set-b');
        const item = { dia };
        if (spaceInp) item.space = toMM(spaceInp.value);
        if (noInp) item.no = parseFloat(noInp.value) || 0;
        if (aInp) item.a = toMM(aInp.value);
        if (bInp) item.b = toMM(bInp.value);
        if (dia > 0) { if (item.no > 0 || item.space > 0) sets.push(item); }
    });
    return sets;
}

function calculateBBSPreview() {
    const type = document.getElementById('bbs-type').value;
    const inputs = {};

    document.querySelectorAll('#bbs-dynamic-inputs .bbs-mem-inp:not(.set-dia):not(.set-no):not(.set-space):not(.set-a):not(.set-b)').forEach(i => {
        if (i.dataset.key) inputs[i.dataset.key] = toMM(i.value);
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
        inputs.mainTopExtraSets = collectSets('#slab-main-top-extra-container .dynamic-set');
        inputs.distBotSets = collectSets('#slab-dist-bot-container .dynamic-set');
        inputs.distTopSets = collectSets('#slab-dist-top-container .dynamic-set');
        inputs.distTopExtraSets = collectSets('#slab-dist-top-extra-container .dynamic-set');
    }
    if (type === 'shape') {
        document.querySelectorAll('.custom-dim').forEach(i => inputs[i.dataset.key] = parseFloat(i.value) || 0);
        drawShape(document.getElementById('bbs-shape-custom').value, inputs);
    }

    const items = generateMemberItems(type, inputs, memCount);
    let totalWt = 0;
    items.forEach(i => totalWt += i.weight);

    const wtEl = document.getElementById('bbs-total-weight');
    const countEl = document.getElementById('bbs-item-count');
    if (wtEl) wtEl.textContent = formatNum(totalWt) + ' kg';
    if (countEl) countEl.textContent = items.length + ' Item(s)';

    // Trigger Draw
    if (type !== 'shape') { // Custom shape draws itself inside renderCustomShapeInputs or manually
        drawShape(type, inputs);
    }

    return items;
}

function generateMemberItems(type, inp, count) {
    const items = [];
    const pushItem = (name, shape, dia, cutLen, no) => {
        const wt = (dia * dia / 162) * (cutLen / 1000) * no * count;
        if (wt > 0) items.push({ name, shape, dia, cutLen: cutLen / 1000, qty: no * count, weight: wt });
    };
    const MEMBER_CONFIG = {
        footing: {
            inputs: [
                { id: 'l', label: 'Length (L)', type: 'number', placeholder: 'e.g. 1500' },
                { id: 'b', label: 'Breadth (B)', type: 'number', placeholder: 'e.g. 1200' },
                { id: 'spacing', label: 'Spacing', type: 'number', placeholder: 'e.g. 150' }
            ]
        },
        column: {
            inputs: [
                { id: 'h', label: 'Height', type: 'number', placeholder: 'e.g. 3000' },
                { id: 'l', label: 'Length', type: 'number', placeholder: 'e.g. 450' },
                { id: 'b', label: 'Breadth', type: 'number', placeholder: 'e.g. 230' },
                { id: 'bars', label: 'No. of Bars', type: 'number', placeholder: 'e.g. 4' } // Main bars count
            ]
        },
        beam: {
            inputs: [
                { id: 'l', label: 'Clear Span', type: 'number', placeholder: 'e.g. 4000' },
                { id: 'bw', label: 'Beam Width', type: 'number', placeholder: 'e.g. 230' },
                { id: 'd', label: 'Beam Depth', type: 'number', placeholder: 'e.g. 450' },
                { id: 'top-bars', label: 'Top Bars', type: 'number', placeholder: 'e.g. 2' },
                { id: 'bot-bars', label: 'Bottom Bars', type: 'number', placeholder: 'e.g. 3' }
            ]
        },
        slab: {
            inputs: [
                { id: 'lx', label: 'Short Span (Lx)', type: 'number', placeholder: 'e.g. 3000' },
                { id: 'ly', label: 'Long Span (Ly)', type: 'number', placeholder: 'e.g. 4000' },
                { id: 'spacing', label: 'Spacing', type: 'number', placeholder: 'e.g. 150' },
                { id: 'main-top-extra', label: 'Top Extra (Support) - Short', type: 'number', placeholder: 'e.g. 0 (Sets)' },
                { id: 'dist-top-extra', label: 'Top Extra (Support) - Long', type: 'number', placeholder: 'e.g. 0 (Sets)' }
            ]
        },
        stirrups: {
            inputs: [
                { id: 'a', label: 'Side A', type: 'number', placeholder: 'e.g. 230' },
                { id: 'b', label: 'Side B', type: 'number', placeholder: 'e.g. 450' },
                { id: 'spacing', label: 'Spacing', type: 'number', placeholder: 'e.g. 150' }, // For qty calc
                { id: 'len-span', label: 'Span Length', type: 'number', placeholder: 'e.g. 4000' } // For qty calc
            ]
        },
        shape: {
            inputs: [
                { id: 'a', label: 'A (mm)', type: 'number', placeholder: '0' },
                { id: 'b', label: 'B (mm)', type: 'number', placeholder: '0' },
                { id: 'c', label: 'C (mm)', type: 'number', placeholder: '0' },
                { id: 'd', label: 'D (mm)', type: 'number', placeholder: '0' },
                { id: 'e', label: 'E (mm)', type: 'number', placeholder: '0' },
                { id: 'r', label: 'Bend Ded. (d)', type: 'number', placeholder: 'e.g. 2 (for 90°)' } // in diameters
            ]
        }
    };

    const STEEL_CONSTANTS = {
        DENSITY: 7850, // kg/m3
        TYPES: {
            SHS: { label: 'SHS (Square)', inputs: ['Side (mm)', 'Thickness (mm)'] },
            RHS: { label: 'RHS (Rectangular)', inputs: ['Width (mm)', 'Depth (mm)', 'Thickness (mm)'] },
            CHS: { label: 'CHS (Circular)', inputs: ['Outer Dia (mm)', 'Thickness (mm)'] },
            ANGLE: { label: 'Angle (L)', inputs: ['Leg A (mm)', 'Leg B (mm)', 'Thickness (mm)'] },
            BEAM: { label: 'Beam (I/H)', inputs: ['Depth (mm)', 'Flange Width (mm)', 'Web Thk (mm)', 'Flange Thk (mm)'] },
            CHANNEL: { label: 'Channel (C)', inputs: ['Depth (mm)', 'Flange Width (mm)', 'Web Thk (mm)', 'Flange Thk (mm)'] },
            FLAT: { label: 'Flat Bar', inputs: ['Width (mm)', 'Thickness (mm)'] }
        },
        PRESETS: {
            SHS: [
                { label: 'SC1 - 200x200x10', vals: [200, 10] },
                { label: 'SC2 - 400x400x12', vals: [400, 12] },
                { label: '300x300x10', vals: [300, 10] }
            ],
            RHS: [
                { label: 'M1 - 300x150x6', vals: [300, 150, 6] },
                { label: 'M2 - 200x100x4', vals: [200, 100, 4] },
                { label: 'M3 - 300x150x10', vals: [300, 150, 10] },
                { label: 'M4 - 500x200x16', vals: [500, 200, 16] },
                { label: 'M5 - 300x200x12', vals: [300, 200, 12] },
                { label: 'M6 - 200x100x4', vals: [200, 100, 4] },
                { label: 'M7 - 240x120x8', vals: [240, 120, 8] },
                { label: 'M8 - 145x82x4.8', vals: [145, 82, 4.8] },
                { label: 'SC3 - 200x100x8', vals: [200, 100, 8] }
            ],
            CHS: [
                { label: 'M9 - 114.3x4.5', vals: [114.3, 4.5] }
            ]
        }
    };

    const BBS_SHAPE_CONFIG = {
        // Custom shape names
        'L': 'L-Shape',
        'C': 'C-Shape',
        'U': 'U-Shape',
        'BOX': 'Rect. Stirrup'
    };

    let state = {
        diameter: 8,
        length: 12,
        rods: 0,
        weight: 0,
        price: 0,
        items: [], // Cost Estimator items
        bbsItems: [], // BBS Items
        steelItems: [], // Structural Steel Items
        laborRate: 0,
        bindingWireRate: 10,
        bindingWirePrice: 0,
        gstEnabled: false,
        gstRate: 18
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
        const crankAddRatio = 0.42;
        if (inp.mainBotSets) {
            inp.mainBotSets.forEach((set, idx) => {
                const d_crank = Math.max(0, inp.D - 2 * inp.cover - set.dia);
                const crankAdd = crankAddRatio * d_crank;
                const cutMain = inp.Lx - 2 * inp.cover + (2 * 10 * set.dia) + crankAdd;
                const noMain = Math.floor(inp.Ly / set.space) + 1;
                pushItem(`Main Bot (Short) Set ${idx + 1}`, 'Cranked', set.dia, cutMain, noMain);
            });
        }
        if (inp.mainTopSets) {
            inp.mainTopSets.forEach((set, idx) => {
                const cutMain = inp.Lx - 2 * inp.cover + (2 * 10 * set.dia);
                const noMain = Math.floor(inp.Ly / set.space) + 1;
                pushItem(`Main Top (Short) Set ${idx + 1}`, 'Straight', set.dia, cutMain, noMain);
            });
        }
        if (inp.distBotSets) {
            inp.distBotSets.forEach((set, idx) => {
                const cutDist = inp.Ly - 2 * inp.cover + (2 * 10 * set.dia);
                const noDist = Math.floor(inp.Lx / set.space) + 1;
                pushItem(`Dist Bot (Long) Set ${idx + 1}`, 'Straight', set.dia, cutDist, noDist);
            });
        }
        if (inp.distTopSets) {
            inp.distTopSets.forEach((set, idx) => {
                const cutDist = inp.Ly - 2 * inp.cover + (2 * 10 * set.dia);
                const noDist = Math.floor(inp.Lx / set.space) + 1;
                pushItem(`Dist Top (Long) Set ${idx + 1}`, 'Straight', set.dia, cutDist, noDist);
            });
        }
        // Top Extras (0.3L)
        if (inp.mainTopExtraSets) {
            inp.mainTopExtraSets.forEach((set, idx) => {
                // Length is 0.3 * Lx (Span) each side? Usually it's over support.
                // Assuming it's a single bar of length 0.3Lx placed over support? 
                // Or total length? 
                // Standard: 0.3L from support face. If continuous, 0.3L each side.
                // Let's assume conservatively 0.3L + anchorage?
                // Simplest interpretation: It's a straight bar of length 0.3 * Span
                const cutExtra = 0.3 * inp.Lx;
                // No is based on opposite span
                const noExtra = Math.floor(inp.Ly / set.space) + 1;
                pushItem(`Main Top Extra (0.3L) Set ${idx + 1}`, 'Straight', set.dia, cutExtra, noExtra);
            });
        }
        if (inp.distTopExtraSets) {
            inp.distTopExtraSets.forEach((set, idx) => {
                const cutExtra = 0.3 * inp.Ly;
                const noExtra = Math.floor(inp.Lx / set.space) + 1;
                pushItem(`Dist Top Extra (0.3L) Set ${idx + 1}`, 'Straight', set.dia, cutExtra, noExtra);
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
    const memCount = parseFloat(document.getElementById('member-count').value) || 1;

    items.forEach(i => {
        i.memberName = memName.toUpperCase();
        i.memberType = type;
        i.memberCount = memCount; // Store count
        state.bbsItems.push(i);
    });
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
        grandTotalEl.textContent = '0 kg';
        return;
    }

    const groups = {};
    state.bbsItems.forEach((item, index) => {
        const key = `${item.memberName}-${item.memberType}`;
        if (!groups[key]) groups[key] = { name: item.memberName, type: item.memberType, count: item.memberCount, items: [], weight: 0 };
        groups[key].items.push({ ...item, originalIndex: index });
        groups[key].weight += item.weight;
        grandTotal += item.weight;
    });

    Object.values(groups).forEach(group => {
        const headerRow = document.createElement('tr');
        headerRow.className = 'group-header'; headerRow.style.background = 'rgba(0,0,0,0.03)';

        let displayTitle = '';
        const typeTitle = MEMBER_CONFIG[group.type]?.title || group.type;
        const countBadge = group.count > 1 ? `<span style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-size:0.8em; margin-left:8px;">x${group.count} Nos</span>` : '';

        if (group.name === 'MEM') {
            displayTitle = `${typeTitle} ${countBadge}`;
        } else {
            displayTitle = `${group.name} <span style="font-size:0.8em;color:#666;font-weight:400;">(${typeTitle})</span> ${countBadge}`;
        }

        headerRow.innerHTML = `<td colspan="5" style="column-span:all;font-weight:700;color:var(--primary-color);">${displayTitle}</td><td style="font-weight:700;">${formatNum(group.weight)}</td><td><button class="action-btn text-red" onclick="removeBBSGroup('${group.name}', '${group.type}')" title="Delete Member">&times;</button></td>`;
        list.appendChild(headerRow);
        group.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td style="padding-left:20px;color:#555;">${item.name}</td><td>${item.shape}</td><td>${item.dia}</td><td>${item.cutLen.toFixed(3)}</td><td>${item.qty}</td><td style="color:#666;">${formatNum(item.weight)}</td><td><button class="action-btn" style="opacity:0.3" onclick="removeBBSItem(${item.originalIndex})">&times;</button></td>`;
            list.appendChild(row);
        });
    });

    grandTotalEl.textContent = formatNum(grandTotal) + ' kg';

    // Wire
    let footer = document.getElementById('bbs-footer-extras');
    if (!footer) {
        footer = document.createElement('div');
        footer.id = 'bbs-footer-extras';
        footer.style.padding = '10px 0';
        footer.style.fontSize = '0.9em';
        footer.style.color = '#555';
        footer.style.textAlign = 'right';
        list.parentElement.after(footer);
    }
    const wireKg = (grandTotal / 1000) * state.bindingWireRate;
    footer.innerHTML = `Binding Wire Required (~${state.bindingWireRate}kg/T): <b>${formatNum(wireKg)} kg</b>`;

    function removeBBSItem(index) { state.bbsItems.splice(index, 1); renderBBSList(); }
    function removeBBSGroup(memName, memType) {
        if (!confirm(`Delete all for "${memName === 'MEM' ? (MEMBER_CONFIG[memType]?.title || memType) : memName}"?`)) return;
        state.bbsItems = state.bbsItems.filter(i => !(i.memberName === memName && i.memberType === memType));
        renderBBSList();
    }
    window.removeBBSItem = removeBBSItem; window.removeBBSGroup = removeBBSGroup;
}

function generateCSV(items) {
    let csv = '\uFEFFsep=,\nMember,Type,Shape,Dia (mm),Cut Len (m),Qty,Weight (kg)\n';
    const groups = {};
    items.forEach(item => {
        const key = `${item.memberName}-${item.memberType}`;
        if (!groups[key]) groups[key] = { name: item.memberName, type: item.memberType, count: item.memberCount || 1, items: [], weight: 0 };
        groups[key].items.push(item);
        groups[key].weight += item.weight;
    });

    Object.values(groups).forEach(group => {
        const typeTitle = MEMBER_CONFIG[group.type]?.title || group.type;
        const countStr = group.count > 1 ? ` (x${group.count})` : '';
        csv += `"${group.name} - ${typeTitle}${countStr}",,,,,,"${formatNum(group.weight)}"\n`;
        group.items.forEach(item => {
            csv += ` , , ${item.shape}, ${item.dia}, ${item.cutLen.toFixed(3)}, ${item.qty}, ${formatNum(item.weight)}\n`;
        });
    });
    return csv;
}

function exportCSV() {
    if (state.bbsItems.length === 0) { alert('No data to export'); return; }
    const csv = generateCSV(state.bbsItems);
    downloadCSV(csv, 'bbs_export.csv');
}

function exportProjectExcel(name) {
    const projects = getProjects();
    if (!projects[name]) return;
    const csv = generateCSV(projects[name].items);
    downloadCSV(csv, `${name}_export.csv`);
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printProject(name) {
    if (!confirm(`This will load project "${name}" to the screen to print it. Continue?`)) return;
    loadProject(name, false);
    document.getElementById('project-modal').classList.remove('active');
    setTimeout(() => window.print(), 500);
}

window.printBBS = printBBS;
window.exportCSV = exportCSV;
window.openProjectModal = openProjectModal;
window.exportProjectExcel = exportProjectExcel;
window.printProject = printProject;


document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Starting App...");

    // Safety check for critical functions
    if (typeof setupBBSListeners !== 'function') console.error("setupBBSListeners is missing!");
    if (typeof init !== 'function') console.error("init is missing!");

    try {
        setupBBSListeners();
        console.log("setupBBSListeners done");
    } catch (e) {
        console.error("Critical Error in setupBBSListeners:", e);
    }

    try {
        init();
        console.log("init done");
    } catch (e) {
        console.error("Critical Error in init:", e);
    }

    // Force Steel Tab Init again just in case init() failed halfway
    try {
        if (typeof initSteelTab === 'function') {
            initSteelTab();
        } else {
            console.error("initSteelTab function missing!");
        }
    } catch (e) {
        console.error("Manual initSteelTab call failed:", e);
    }
});

// --- Optimization Logic ---

function generateCutPlan() {
    const container = document.getElementById('optimization-results');
    if (state.bbsItems.length === 0) {
        container.innerHTML = '<div class="empty-state">No items in BBS to optimize.</div>';
        return;
    }

    // 1. Group by Diameter
    const stockLen = 12; // meters
    const diaGroups = {};
    state.bbsItems.forEach(item => {
        if (!diaGroups[item.dia]) diaGroups[item.dia] = [];
        // Flatten qty: if qty is 4, add 4 separate items of cutLen
        for (let i = 0; i < item.qty; i++) {
            // Push object with metadata
            diaGroups[item.dia].push({
                len: item.cutLen,
                label: `${item.memberName} (${item.shape})`
            });
        }
    });

    // 2. Process Each Diameter
    let html = '';
    const sortedDias = Object.keys(diaGroups).sort((a, b) => b - a);

    sortedDias.forEach(dia => {
        const pieces = diaGroups[dia].sort((a, b) => b.len - a.len); // Descending length
        const bars = optimizeStock(stockLen, pieces);

        const totalStock = bars.length * stockLen;
        const usedLen = pieces.reduce((a, b) => a + b.len, 0);
        const waste = totalStock - usedLen;
        const wastePct = (waste / totalStock) * 100;

        html += `
            <div style="background:white; border:1px solid #e5e7eb; border-radius:8px; padding:15px; margin-bottom:20px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3 style="margin:0; font-size:1.1em; color:#1f2937;">${dia}mm Diameter</h3>
                    <div style="text-align:right; font-size:0.9em; line-height:1.4;">
                        <div><b>${bars.length}</b> bars (12m) required</div>
                        <div style="color:${wastePct < 5 ? '#059669' : '#d97706'}">Waste: ${waste.toFixed(2)}m (${wastePct.toFixed(1)}%)</div>
                    </div>
                </div>
                
                <div style="display:flex; flex-direction:column; gap:8px;">
                    ${bars.map((bar, idx) => {
            return `
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="font-size:0.85em; color:#666; width:60px;">Bar ${idx + 1}</div>
                                <div style="flex:1; height:32px; background:#f3f4f6; border-radius:4px; overflow:hidden; display:flex;">
                                    ${bar.cuts.map(c => `
                                        <div style="width:${(c.len / 12) * 100}%; background:#3b82f6; border-right:1px solid rgba(255,255,255,0.3); color:white; font-size:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; white-space:nowrap; position:relative;" title="${c.len.toFixed(2)}m - ${c.label}">
                                            <span style="font-weight:bold;">${c.len.toFixed(2)}</span>
                                            <span style="font-size:8px; opacity:0.8;">${c.label.split(' ')[0]}</span>
                                        </div>
                                    `).join('')}
                                    <div style="flex:1; background:#fee2e2; display:flex; align-items:center; justify-content:center; color:#991b1b; font-size:10px;" title="Waste">
                                        waste
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function optimizeStock(stockLen, pieces) {
    // First Fit Decreasing Algorithm
    // bars = [ { remaining: 12, cuts: [] } ]
    const bars = [];

    pieces.forEach(p => {
        // Try to fit in existing bar
        const bestBar = bars.find(b => b.remaining >= p.len);
        if (bestBar) {
            bestBar.remaining -= p.len;
            bestBar.cuts.push(p);
        } else {
            // New Bar
            bars.push({ remaining: stockLen - p.len, cuts: [p] });
        }
    });
    return bars;
}


// Expose functions to window
window.saveProject = saveProject;
window.loadProject = loadProject;
window.deleteProject = deleteProject;
window.exportProjectJSON = exportProjectJSON;
window.printProject = printProject;
window.exportProjectExcel = exportProjectExcel;
window.importProjectJSON = importProjectJSON;
window.addDynamicRow = addDynamicRow;
window.renderCustomShapeInputs = renderCustomShapeInputs;
window.calculateBBSPreview = calculateBBSPreview;

// --- Dual Unit Toggle ---
function toggleUnit(toggle) {
    const oldUnit = appUnit;
    appUnit = toggle.checked ? UNITS.FT : UNITS.MM;

    // Valid keys for length fields (exclude diameter, nos, price, weight)
    const lengthKeys = ['L', 'B', 'D', 'H', 'Lx', 'Ly', 'cover', 'spacing', 'ringSpace'];

    // Update all inputs
    document.querySelectorAll('.bbs-mem-inp').forEach(inp => {
        const key = inp.getAttribute('data-key');

        // Update Label Text (e.g., "Length (L) mm" -> "Length (L) ft")
        // Check previous sibling first (standard), then closest input-group label (nested)
        let label = inp.previousElementSibling;
        if (!label || label.tagName !== 'LABEL') {
            const group = inp.closest('.input-group');
            if (group) label = group.querySelector('label');
        }

        if (label && label.tagName === 'LABEL') {
            if (appUnit === UNITS.FT) {
                label.innerText = label.innerText.replace('(mm)', '(ft)').replace(' mm', ' ft').replace('MM', 'FT');
            } else {
                label.innerText = label.innerText.replace('(ft)', '(mm)').replace(' ft', ' mm').replace('FT', 'MM');
            }
        }

        // Ensure input type allows text for ft/in
        if (lengthKeys.includes(key) || inp.classList.contains('set-space') || inp.classList.contains('custom-dim')) {
            inp.type = 'text'; // Allow strings

            // Convert current value using OLD unit context
            let currentMM = toMM(inp.value, oldUnit);
            if (currentMM > 0) {
                inp.value = toDisplay(currentMM);
            }

            // Update placeholder using OLD unit context
            if (inp.placeholder && (inp.placeholder.includes('e.g.') || !isNaN(parseInt(inp.placeholder)))) {
                let phText = inp.placeholder.replace('e.g. ', '');
                let phMM = toMM(phText, oldUnit);
                if (phMM > 0) inp.placeholder = 'e.g. ' + toDisplay(phMM);
            }
        }
    });

    // Re-render calculations or preview if needed
    calculateBBSPreview();
}
window.toggleUnit = toggleUnit;




/* =========================================
   STRUCTURAL STEEL LOGIC (REBUILT)
   ========================================= */

// Explicitly attach to window to avoid scope issues
window.STEEL_CONSTANTS = {
    DENSITY: 7850, // kg/m3
    TYPES: {
        SHS: { label: 'SHS (Square)', inputs: ['Side (mm)', 'Thickness (mm)'] },
        RHS: { label: 'RHS (Rectangular)', inputs: ['Width (mm)', 'Depth (mm)', 'Thickness (mm)'] },
        CHS: { label: 'CHS (Circular)', inputs: ['Outer Dia (mm)', 'Thickness (mm)'] },
        ANGLE: { label: 'Angle (L)', inputs: ['Leg A (mm)', 'Leg B (mm)', 'Thickness (mm)'] },
        BEAM: { label: 'Beam (I/H)', inputs: ['Depth (mm)', 'Flange Width (mm)', 'Web Thk (mm)', 'Flange Thk (mm)'] },
        CHANNEL: { label: 'Channel (C)', inputs: ['Depth (mm)', 'Flange Width (mm)', 'Web Thk (mm)', 'Flange Thk (mm)'] },
        FLAT: { label: 'Flat Bar', inputs: ['Width (mm)', 'Thickness (mm)'] }
    },
    PRESETS: {
        SHS: [
            { label: 'SC1 - 200x200x10', vals: [200, 10] },
            { label: 'SC2 - 400x400x12', vals: [400, 12] },
            { label: '300x300x10', vals: [300, 10] }
        ],
        RHS: [
            { label: 'M1 - 300x150x6', vals: [300, 150, 6] },
            { label: 'M2 - 200x100x4', vals: [200, 100, 4] },
            { label: 'M3 - 300x150x10', vals: [300, 150, 10] },
            { label: 'M4 - 500x200x16', vals: [500, 200, 16] },
            { label: 'M5 - 300x200x12', vals: [300, 200, 12] },
            { label: 'M6 - 200x100x4', vals: [200, 100, 4] },
            { label: 'M7 - 240x120x8', vals: [240, 120, 8] },
            { label: 'M8 - 145x82x4.8', vals: [145, 82, 4.8] },
            { label: 'SC3 - 200x100x8', vals: [200, 100, 8] }
        ],
        CHS: [
            { label: 'M9 - 114.3x4.5', vals: [114.3, 4.5] }
        ]
    }
};

function initSteelTab() {
    console.log("initSteelTab: Starting initialization...");
    const typeSelect = document.getElementById('steel-type');
    const presetSelect = document.getElementById('steel-preset');
    const addBtn = document.getElementById('btn-add-steel');
    const clearBtn = document.getElementById('btn-clear-steel');
    const container = document.getElementById('steel-dims-container');

    if (!typeSelect || !presetSelect || !addBtn || !clearBtn || !container) {
        console.error("initSteelTab: CRITICAL - Missing DOM elements", {
            typeSelect, presetSelect, addBtn, clearBtn, container
        });
        return;
    }

    // Remove existing listeners to prevent duplicates
    const cloneType = typeSelect.cloneNode(true);
    typeSelect.parentNode.replaceChild(cloneType, typeSelect);
    const newTypeSelect = document.getElementById('steel-type');

    newTypeSelect.addEventListener('change', () => {
        console.log("Steel Type Changed:", newTypeSelect.value);
        renderSteelInputs();
        updateSteelPresets();
    });

    const clonePreset = presetSelect.cloneNode(true);
    presetSelect.parentNode.replaceChild(clonePreset, presetSelect);
    const newPresetSelect = document.getElementById('steel-preset');

    newPresetSelect.addEventListener('change', () => {
        applySteelPreset();
    });

    // Re-attach button listeners
    addBtn.replaceWith(addBtn.cloneNode(true));
    document.getElementById('btn-add-steel').addEventListener('click', addSteelItem);

    clearBtn.replaceWith(clearBtn.cloneNode(true));
    document.getElementById('btn-clear-steel').addEventListener('click', clearSteelItems);

    console.log("initSteelTab: Listeners attached. Rendering initial inputs...");
    renderSteelInputs();
    updateSteelPresets();
    console.log("initSteelTab: Initialization complete.");
}

function renderSteelInputs() {
    const typeEl = document.getElementById('steel-type');
    if (!typeEl) return;
    const type = typeEl.value;
    const container = document.getElementById('steel-dims-container');

    // Explicit check for constants
    const CONSTANTS = window.STEEL_CONSTANTS || STEEL_CONSTANTS;
    if (!CONSTANTS) {
        console.error("STEEL_CONSTANTS not found!");
        return;
    }

    const config = CONSTANTS.TYPES[type];

    container.innerHTML = '';

    if (!config) {
        console.error("Config not found for type:", type);
        return;
    }

    const row = document.createElement('div');
    row.className = 'input-row';

    config.inputs.forEach((label, index) => {
        const group = document.createElement('div');
        group.className = 'input-group';
        group.innerHTML = `
            <label>${label}</label>
            <input type="number" class="steel-dim-inp" data-index="${index}" placeholder="0" step="any">
        `;
        row.appendChild(group);
    });

    container.appendChild(row);
    console.log("renderSteelInputs: Rendered inputs for", type);
}

function updateSteelPresets() {
    const type = document.getElementById('steel-type').value;
    const presetSelect = document.getElementById('steel-preset');
    const CONSTANTS = window.STEEL_CONSTANTS || STEEL_CONSTANTS;

    if (!CONSTANTS) return;
    const presets = CONSTANTS.PRESETS[type] || [];

    presetSelect.innerHTML = '<option value="">-- Custom Size --</option>';

    presets.forEach((p, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = p.label;
        presetSelect.appendChild(opt);
    });
}

function applySteelPreset() {
    const type = document.getElementById('steel-type').value;
    const idx = document.getElementById('steel-preset').value;
    const CONSTANTS = window.STEEL_CONSTANTS || STEEL_CONSTANTS;

    if (idx === '') return;

    const preset = CONSTANTS.PRESETS[type][idx];
    const inputs = document.querySelectorAll('.steel-dim-inp');

    if (preset && inputs) {
        preset.vals.forEach((val, i) => {
            if (inputs[i]) inputs[i].value = val;
        });
    }
}

function calculateSteelProperties(type, dims, length) {
    let area = 0; // Cross-sectional area in mm2
    let surfaceParams = 0; // Perimeter for surface area in mm
    const CONSTANTS = window.STEEL_CONSTANTS || STEEL_CONSTANTS;

    // Dims map based on type inputs order
    const d1 = parseFloat(dims[0]) || 0;
    const d2 = parseFloat(dims[1]) || 0;
    const d3 = parseFloat(dims[2]) || 0;
    const d4 = parseFloat(dims[3]) || 0;

    if (type === 'SHS') {
        const side = d1;
        const thk = d2;
        const outer = side * side;
        const inner = (side - 2 * thk) * (side - 2 * thk);
        area = outer - inner;
        surfaceParams = 4 * side;
    } else if (type === 'RHS') {
        const w = d1;
        const d = d2;
        const thk = d3;
        const outer = w * d;
        const inner = (w - 2 * thk) * (d - 2 * thk);
        area = outer - inner;
        surfaceParams = 2 * (w + d);
    } else if (type === 'CHS') {
        const od = d1;
        const thk = d2;
        const id = od - 2 * thk;
        area = (Math.PI / 4) * (od * od - id * id);
        surfaceParams = Math.PI * od;
    } else if (type === 'ANGLE') {
        const a = d1;
        const b = d2;
        const thk = d3;
        area = (a * thk) + ((b - thk) * thk);
        surfaceParams = 2 * (a + b);
    } else if (type === 'FLAT') {
        const w = d1;
        const t = d2;
        area = w * t;
        surfaceParams = 2 * (w + t);
    } else if (type === 'BEAM' || type === 'CHANNEL') {
        const depth = d1;
        const width = d2;
        const webThk = d3;
        const flgThk = d4;

        if (type === 'BEAM') {
            area = (2 * width * flgThk) + ((depth - 2 * flgThk) * webThk);
            surfaceParams = (2 * width) + (2 * depth) + (2 * (width - webThk));
        } else {
            area = (2 * width * flgThk) + ((depth - 2 * flgThk) * webThk);
            surfaceParams = (2 * depth) + (4 * width) - (2 * webThk);
        }
    }

    const weight = (area > 0 ? (area / 1000000) * length * CONSTANTS.DENSITY : 0);
    const surfArea = (surfaceParams > 0 ? (surfaceParams / 1000) * length : 0);

    return { weight, surfArea };
}


function addSteelItem() {
    const type = document.getElementById('steel-type').value;
    const nameInput = document.getElementById('steel-name');
    const len = parseFloat(document.getElementById('steel-len').value) || 0;
    const qty = parseFloat(document.getElementById('steel-qty').value) || 0;
    const price = parseFloat(document.getElementById('steel-price').value) || 0;
    const CONSTANTS = window.STEEL_CONSTANTS || STEEL_CONSTANTS;

    // Get dimensions
    const inputs = document.querySelectorAll('.steel-dim-inp');
    const dims = Array.from(inputs).map(i => parseFloat(i.value) || 0);

    if (len <= 0 || qty <= 0) {
        alert("Please enter valid length and quantity.");
        return;
    }

    const props = calculateSteelProperties(type, dims, len);
    const totalWeight = props.weight * qty;
    const totalArea = props.surfArea * qty;
    const totalCost = totalWeight * price;

    // Generate Description
    let desc = '';
    const customName = nameInput ? nameInput.value.trim() : '';

    if (customName) {
        desc = `<b>${customName}</b> (${type} ${dims.join('x')})`;
    } else {
        const presetSelect = document.getElementById('steel-preset');
        const presetIdx = presetSelect ? presetSelect.value : '';

        if (presetIdx !== '' && CONSTANTS.PRESETS[type] && CONSTANTS.PRESETS[type][presetIdx]) {
            desc = CONSTANTS.PRESETS[type][presetIdx].label;
        } else {
            desc = `${type} ${dims.join('x')}`;
        }
    }

    state.steelItems.push({
        id: Date.now(),
        type,
        desc,
        dims,
        len,
        qty,
        unitWt: props.weight,
        totalWt: totalWeight,
        totalArea,
        cost: totalCost
    });

    renderSteelList();
}


function clearSteelItems() {
    state.steelItems = [];
    const nameInput = document.getElementById('steel-name');
    if (nameInput) nameInput.value = '';
    renderSteelList();
}

function removeSteelItem(id) {
    state.steelItems = state.steelItems.filter(i => i.id !== id);
    renderSteelList();
}

function renderSteelList() {
    const list = document.getElementById('steel-list');
    if (!list) return;
    list.innerHTML = '';

    let grandWt = 0;
    let grandArea = 0;
    let grandCost = 0;

    if (state.steelItems.length === 0) {
        list.innerHTML = '<tr class="empty-state"><td colspan="6">No steel items added.</td></tr>';
    } else {
        state.steelItems.forEach(item => {
            grandWt += item.totalWt;
            grandArea += item.totalArea;
            grandCost += item.cost;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${item.desc}</b></td>
                <td>${item.dims.join('x')}</td>
                <td>${item.qty} &times; ${item.len}m</td>
                <td class="text-right">${formatNum(item.totalWt)} kg</td>
                <td class="text-right">${formatNum(item.totalArea)} m²</td>
                <td class="text-right"><button class="action-btn" onclick="removeSteelItem(${item.id})">&times;</button></td>
            `;
            list.appendChild(tr);
        });
    }

    const elTotalWt = document.getElementById('steel-total-weight');
    const elTotalArea = document.getElementById('steel-total-area');
    const elTotalCost = document.getElementById('steel-total-cost');

    if (elTotalWt) elTotalWt.textContent = formatNum(grandWt) + ' kg';
    if (elTotalArea) elTotalArea.textContent = formatNum(grandArea) + ' m²';
    if (elTotalCost) elTotalCost.innerHTML = '₹' + formatCost(grandCost);
}



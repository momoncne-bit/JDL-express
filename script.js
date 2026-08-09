let currentCalculatedPrice = 0;
let currentError = null;
let finalMessageString = "";

// 當網頁載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
    renderDynamicOptions(); // 首次渲染選項
    setupEventListeners();
    updateAllPrices();      // 初始化價格
});

// 監聽所有輸入與按鈕變化
function setupEventListeners() {
    document.querySelectorAll('input[name="customerType"]').forEach(r => {
        r.addEventListener('change', () => {
            renderDynamicOptions();
            updateAllPrices();
        });
    });
    document.getElementById('weightInput').addEventListener('input', updateAllPrices);
}

// 根據 住戶/商戶 動態生成服務類別 (改為同行 compact-row 佈局)
function renderDynamicOptions() {
    const customerTypeRadio = document.querySelector('input[name="customerType"]:checked');
    const customerType = customerTypeRadio ? customerTypeRadio.value : 'residential';
    const container = document.getElementById('dynamicServiceOptions');
    
    let serviceHtml = '';
    
    if (customerType === 'residential') {
        serviceHtml = `
            <div class="compact-row">
                <span class="compact-label">服務類別：</span>
                <div class="compact-control">
                    <div class="segmented-grid" style="grid-template-columns: repeat(2, 1fr);">
                        <label class="segmented-btn"><input type="radio" name="serviceType" value="standard" checked><span>標快 (T+1)</span></label>
                        <label class="segmented-btn"><input type="radio" name="serviceType" value="express"><span>特快 (4小時)</span></label>
                    </div>
                </div>
            </div>
            <div class="compact-row" id="deliveryGroup"></div>
        `;
    } else {
        serviceHtml = `
            <div class="compact-row">
                <span class="compact-label">服務類別：</span>
                <div class="compact-control">
                    <div class="segmented-grid" style="grid-template-columns: repeat(3, 1fr);">
                        <label class="segmented-btn"><input type="radio" name="serviceType" value="standard" checked><span>標快 (T+1)</span></label>
                        <label class="segmented-btn"><input type="radio" name="serviceType" value="express"><span>特快 (4小時)</span></label>
                        <label class="segmented-btn"><input type="radio" name="serviceType" value="heavy"><span>重貨 (T+1)</span></label>
                    </div>
                </div>
            </div>
            <div class="compact-row" id="deliveryGroup"></div>
        `;
    }

    container.innerHTML = serviceHtml;

    document.querySelectorAll('input[name="serviceType"]').forEach(r => {
        r.addEventListener('change', () => {
            renderDeliveryOptions();
            updateAllPrices();
        });
    });

    renderDeliveryOptions();
}

// 根據服務類別動態渲染「派送模式」(改為同行 compact-row 佈局)
function renderDeliveryOptions() {
    const customerTypeRadio = document.querySelector('input[name="customerType"]:checked');
    const customerType = customerTypeRadio ? customerTypeRadio.value : 'residential';
    const serviceTypeRadio = document.querySelector('input[name="serviceType"]:checked');
    const serviceType = serviceTypeRadio ? serviceTypeRadio.value : 'standard';
    const deliveryGroup = document.getElementById('deliveryGroup');

    if (!deliveryGroup) return;

    let html = '<span class="compact-label">派送模式：</span><div class="compact-control">';

    if (serviceType === 'heavy') {
        html += `
            <div style="padding: 0.6rem 0.6rem; background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
                <span>門到門</span>
                <span style="font-size: 0.7rem; color: var(--accent-green); background: #ecfdf5; padding: 1px 5px; border-radius: 4px; font-weight: 700;">自動標註</span>
                <input type="radio" name="deliveryMethod" value="d2d" checked style="display:none;">
            </div>
        `;
    } else if (serviceType === 'express') {
        html += `
            <div style="padding: 0.6rem 0.6rem; background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
                <span>門到門（特快專屬）</span>
                <input type="radio" name="deliveryMethod" value="d2d" checked style="display:none;">
            </div>
        `;
    } else if (customerType === 'residential') {
        html += `
            <div class="segmented-grid" style="grid-template-columns: repeat(2, 1fr);">
                <label class="segmented-btn"><input type="radio" name="deliveryMethod" value="d2d" checked><span>門到門</span></label>
                <label class="segmented-btn"><input type="radio" name="deliveryMethod" value="d2s"><span>門到店/店到門</span></label>
            </div>
        `;
    } else {
        html += `
            <div class="segmented-grid" style="grid-template-columns: repeat(2, 1fr);">
                <label class="segmented-btn"><input type="radio" name="deliveryMethod" value="d2s" checked><span>門到店/店到門</span></label>
                <label class="segmented-btn"><input type="radio" name="deliveryMethod" value="s2s"><span>店到店</span></label>
            </div>
        `;
    }

    html += '</div>';
    deliveryGroup.innerHTML = html;

    document.querySelectorAll('input[name="deliveryMethod"]').forEach(r => {
        r.addEventListener('change', updateAllPrices);
    });
}

// 增減重量
function changeWeight(delta) {
    const input = document.getElementById('weightInput');
    let val = parseFloat(input.value) || 0;
    val = Math.max(0.1, parseFloat((val + delta).toFixed(1)));
    input.value = val;
    updateAllPrices();
}

// 價格計算矩陣
function calculatePrice(weight, serviceType, deliveryMethod) {
    if (weight <= 0) return { finalPrice: null, error: '請輸入有效重量' };

    if (serviceType === 'express') {
        deliveryMethod = 'd2d';
    }

    if (weight <= 0.5) {
        if (serviceType === 'heavy') return { finalPrice: null, error: '京快重貨不設 0.5kg 項目' };
        if (serviceType === 'express') return { finalPrice: 33 };
        if (serviceType === 'standard') {
            if (deliveryMethod === 's2s') return { finalPrice: 14 };
            return { finalPrice: 17 };
        }
    }

    if (weight > 20) {
        if (serviceType === 'express') return { finalPrice: null, error: '京東特快上限為 20kg' };
        if (serviceType === 'standard') {
            const extraKg = Math.ceil(weight - 20);
            let basePrice = 258;
            if (deliveryMethod === 'd2s') basePrice = 253;
            if (deliveryMethod === 's2s') basePrice = 248;
            return { finalPrice: basePrice + (extraKg * 13) };
        }
        if (serviceType === 'heavy') {
            if (weight <= 39) return { finalPrice: 155 };
            if (weight <= 59) return { finalPrice: 184 };
            if (weight <= 79) return { finalPrice: 230 };
            if (weight <= 300) return { finalPrice: 276 };
            const extraKg = Math.ceil(weight - 300);
            return { finalPrice: 276 + (extraKg * 0.7) };
        }
    }

    const tier = (Math.ceil(weight * 2) / 2).toFixed(1);
    const priceTable = {
        "1.0": { express: 33, heavy: 27, standard: { d2d: 27, d2s: 22, s2s: 14 } },
        "1.5": { express: 41, heavy: 34, standard: { d2d: 34, d2s: 29, s2s: 14 } },
        "2.0": { express: 48, heavy: 40, standard: { d2d: 40, d2s: 35, s2s: 14 } },
        "2.5": { express: 56, heavy: 47, standard: { d2d: 47, d2s: 42, s2s: 24 } },
        "3.0": { express: 63, heavy: 53, standard: { d2d: 53, d2s: 48, s2s: 24 } },
        "3.5": { express: 71, heavy: 60, standard: { d2d: 53, d2s: 48, s2s: 24 } },
        "4.0": { express: 78, heavy: 66, standard: { d2d: 53, d2s: 48, s2s: 24 } },
        "4.5": { express: 86, heavy: 73, standard: { d2d: 53, d2s: 48, s2s: 24 } },
        "5.0": { express: 95, heavy: 78, standard: { d2d: 53, d2s: 48, s2s: 34 } },
        "5.5": { express: 95, heavy: 78, standard: { d2d: 53, d2s: 48, s2s: 34 } },
        "6.0": { express: 109, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "6.5": { express: 109, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "7.0": { express: 123, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "7.5": { express: 123, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "8.0": { express: 138, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "8.5": { express: 138, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "9.0": { express: 152, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "9.5": { express: 152, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 34 } },
        "10.0": { express: 166, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 61 } },
        "10.5": { express: 166, heavy: 81, standard: { d2d: 62, d2s: 57, s2s: 61 } },
        "11.0": { express: 180, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "11.5": { express: 180, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "12.0": { express: 195, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "12.5": { express: 195, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "13.0": { express: 209, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "13.5": { express: 209, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "14.0": { express: 223, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "14.5": { express: 223, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "15.0": { express: 238, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "15.5": { express: 238, heavy: 118, standard: { d2d: 71, d2s: 66, s2s: 61 } },
        "16.0": { express: 252, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "16.5": { express: 252, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "17.0": { express: 266, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "17.5": { express: 266, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "18.0": { express: 281, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "18.5": { express: 281, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "19.0": { express: 295, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "19.5": { express: 295, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } },
        "20.0": { express: 309, heavy: 127, standard: { d2d: 80, d2s: 75, s2s: 70 } }
    };

    const data = priceTable[tier];
    if (!data) return { finalPrice: null, error: '無此重量級距' };

    if (serviceType === 'express') return { finalPrice: data.express };
    if (serviceType === 'heavy') return { finalPrice: data.heavy };
    return { finalPrice: data.standard[deliveryMethod] || data.standard['d2s'] };
}

function updateAllPrices() {
    const deliveryRadio = document.querySelector('input[name="deliveryMethod"]:checked');
    const deliveryMethod = deliveryRadio ? deliveryRadio.value : 'd2d';
    const serviceTypeRadio = document.querySelector('input[name="serviceType"]:checked');
    const serviceType = serviceTypeRadio ? serviceTypeRadio.value : 'standard';
    const weight = parseFloat(document.getElementById('weightInput').value) || 0.1;

    const res = calculatePrice(weight, serviceType, deliveryMethod);
    const badge = document.getElementById('pricingTypeBadge');
    const priceDisplay = document.getElementById('itemPriceDisplay');

    if (weight <= 0.5) {
        badge.textContent = '📄 文件特惠價';
        badge.style.background = '#fee2e2'; badge.style.color = 'var(--accent-red)';
    } else if (weight > 20) {
        badge.textContent = '🏋️ 特快重貨價';
        badge.style.background = '#fef3c7'; badge.style.color = '#b45309';
    } else {
        badge.textContent = '📦 包裹標準計價';
        badge.style.background = '#e0f2fe'; badge.style.color = '#0369a1';
    }

    if (res.finalPrice === null) {
        currentCalculatedPrice = 0;
        currentError = res.error;
        priceDisplay.innerHTML = `<span style="color:#ef4444; font-size:0.95rem;">⚠️ ${res.error}</span>`;
    } else {
        currentCalculatedPrice = res.finalPrice;
        currentError = null;
        priceDisplay.textContent = `港幣 $${res.finalPrice.toFixed(2)}`;
    }

    updateOrderSummary(weight, serviceType, deliveryMethod);
}

function updateOrderSummary(weight, serviceType, deliveryMethod) {
    const summaryContainer = document.getElementById('orderSummary');
    const deliveryRadio = document.querySelector('input[name="deliveryMethod"]:checked');
    const globalMethodStr = deliveryRadio ? deliveryRadio.parentNode.textContent.trim() : '門到門';

    let serviceLabel = '標快 (T+1)';
    if (serviceType === 'express') serviceLabel = '特快 (4小時)';
    if (serviceType === 'heavy') serviceLabel = '重貨 (T+1)';

    let methodStr = globalMethodStr;
    if (serviceType === 'express' || serviceType === 'heavy') methodStr = '門到門';

    if (currentError) {
        summaryContainer.innerHTML = `<div class="summary-row"><span style="color:#ef4444; font-weight:bold;">${currentError}</span></div>`;
    } else {
        summaryContainer.innerHTML = `
            <div class="summary-row">
                <span style="flex:1;">
                    <strong>文件 / 包裹</strong><br>
                    <small style="color:var(--text-secondary);">${serviceLabel} | ${methodStr} | ${weight}kg</small>
                </span>
                <span style="font-family:monospace; font-size: 1.1rem; color: var(--accent-green); font-weight: bold;">
                    港幣 $${currentCalculatedPrice.toFixed(2)}
                </span>
            </div>
        `;
    }
}

/* ================= 頁面切換與發送邏輯 ================= */

function nextPage(pageNumber) {
    if (currentError) {
        alert('重量或選項設定有誤，請先修正。');
        return;
    }
    showPage(pageNumber);
}

function prevPage(pageNumber) {
    showPage(pageNumber);
}

// 切換分頁顯示邏輯
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none'; 
    });

    const activePage = document.getElementById(`page${page}`);
    if (activePage) {
        activePage.classList.add('active');
        activePage.style.display = 'block';
    }

    for (let i = 1; i <= 3; i++) {
        const stepEle = document.getElementById(`step${i}`);
        if (stepEle) {
            if (i <= page) stepEle.classList.add('active');
            else stepEle.classList.remove('active');
        }
    }

    const floatingEle = document.getElementById('floatingSummary');
    if (floatingEle) {
        if (page === 1) {
            floatingEle.style.display = 'block';
        } else {
            floatingEle.style.display = 'none';
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 確認資料並切換至第 3 頁
function goToPage3() {
    const senderName = document.getElementById('senderName').value.trim();
    const senderPhone = document.getElementById('senderPhone').value.trim();
    const senderAddress = document.getElementById('senderAddress').value.trim();

    const recipientName = document.getElementById('recipientName').value.trim();
    const recipientPhone = document.getElementById('recipientPhone').value.trim();
    const recipientAddress = document.getElementById('recipientAddress').value.trim();

    if (!senderName) { alert('請輸入「寄件人名稱」'); document.getElementById('senderName').focus(); return; }
    if (!senderPhone) { alert('請輸入「寄件人聯絡電話」'); document.getElementById('senderPhone').focus(); return; }
    if (!senderAddress) { alert('請輸入「寄件地址」'); document.getElementById('senderAddress').focus(); return; }

    if (!recipientName) { alert('請輸入「收件人名稱」'); document.getElementById('recipientName').focus(); return; }
    if (!recipientPhone) { alert('請輸入「收件人聯絡電話」'); document.getElementById('recipientPhone').focus(); return; }
    if (!recipientAddress) { alert('請輸入「到貨地址」'); document.getElementById('recipientAddress').focus(); return; }

    const customerTypeRadio = document.querySelector('input[name="customerType"]:checked');
    const customerTypeVal = customerTypeRadio ? customerTypeRadio.value : 'residential';
    const customerTypeStr = customerTypeVal === 'residential' ? '住戶服務' : '商戶服務';

    const serviceTypeRadio = document.querySelector('input[name="serviceType"]:checked');
    const serviceType = serviceTypeRadio ? serviceTypeRadio.value : 'standard';

    const deliveryRadio = document.querySelector('input[name="deliveryMethod"]:checked');
    const globalMethodStr = deliveryRadio ? deliveryRadio.parentNode.textContent.trim() : '門到門';
    const weight = document.getElementById('weightInput').value || '0.5';

    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const payment = paymentRadio ? paymentRadio.value : '寄件人支付 (寄付)';

    let serviceLabel = '京東標快 (T+1)';
    if (serviceType === 'express') serviceLabel = '京東特快 (4小時)';
    if (serviceType === 'heavy') serviceLabel = '京快重貨 (T+1)';

    let methodStr = globalMethodStr;
    if (serviceType === 'express' || serviceType === 'heavy') methodStr = '門到門';

    finalMessageString = `📦 【京東快遞 - 新運單申請】\n\n`;
    finalMessageString += `====== 寄件項目 ======\n`;
    finalMessageString += `• 客戶: ${customerTypeStr}\n`;
    finalMessageString += `• 服務: ${serviceLabel}\n`;
    finalMessageString += `• 方式: ${methodStr}\n`;
    finalMessageString += `• 重量: ${weight}kg\n`;
    finalMessageString += `*預估標準總金額: 港幣 $${currentCalculatedPrice.toFixed(2)}*\n\n`;
    
    finalMessageString += `====== 寄件人 (Sender) ======\n`;
    finalMessageString += `• 名稱: ${senderName}\n`;
    finalMessageString += `• 電話: ${senderPhone}\n`;
    finalMessageString += `• 地址: ${senderAddress}\n\n`;

    finalMessageString += `====== 收件人 (Recipient) ======\n`;
    finalMessageString += `• 名稱: ${recipientName}\n`;
    finalMessageString += `• 電話: ${recipientPhone}\n`;
    finalMessageString += `• 地址: ${recipientAddress}\n\n`;
    
    finalMessageString += `====== 繳款方法 ======\n`;
    finalMessageString += `• ${payment}`;

    window.finalMessageString = finalMessageString;

    const finalSummaryContainer = document.getElementById('finalSummary');
    if (finalSummaryContainer) {
        finalSummaryContainer.textContent = finalMessageString;
    }
    
    showPage(3);
}
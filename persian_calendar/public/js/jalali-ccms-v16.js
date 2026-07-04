/* ==============================================================================
   🚀 FRAPPE 16 JALALI CORE (ZERO-INTERFERENCE ARCHITECTURE)
   ============================================================================== */
(function () {
    "use strict";

    const isRTL =
        document.documentElement.lang === "fa" ||
        document.body.getAttribute("dir") === "rtl" ||
        (window.frappe && frappe.boot?.user?.language === "fa");

    if (!isRTL) return;

    console.log("%c ⚡ FRAPPE 16 JALALI CORE (ZERO-INTERFERENCE) ", "background: #111827; color: #10b981; font-weight: bold;");

    let pickerEl = null;
    let activeInput = null;
    let activeControl = null;
    let targetYear = 1405;
    let targetMonth = 1;

    const monthNames = [
        "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
    ];

    // ---------- موتور ریاضی مستقل جهت جلوگیری از کرش Gantt و Moment ----------
    const JalaliCal = {
        g2j(gy, gm, gd) {
            let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            let jy = (gy <= 1600) ? 0 : 979; gy -= (gy <= 1600) ? 621 : 1600;
            let gy2 = (gm > 2) ? (gy + 1) : gy;
            let days = (365 * gy) + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100) + parseInt((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
            jy += 33 * parseInt(days / 12053); days %= 12053;
            jy += 4 * parseInt(days / 1461); days %= 1461;
            jy += parseInt((days - 1) / 365); if (days > 365) days = (days - 1) % 365;
            let jm = (days < 186) ? (1 + parseInt(days / 31)) : (7 + parseInt((days - 186) / 30));
            let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
            return [jy, jm, jd];
        },
        j2g(jy, jm, jd) {
            let gy = (jy <= 979) ? 0 : 1600; jy -= (jy <= 979) ? 621 : 979;
            let days = (365 * jy) + (parseInt(jy / 33) * 8) + parseInt(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? ((jm - 1) * 31) : (((jm - 7) * 30) + 186));
            gy += 400 * parseInt(days / 146097); days %= 146097;
            gy += 100 * parseInt(days / 36524); days %= 36524; if (days >= 36524) days++;
            gy += 4 * parseInt(days / 1461); days %= 1461;
            gy += parseInt((days - 1) / 365); if (days > 365) days = (days - 1) % 365;
            let gd = days + 1;
            let sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let gm; for (gm = 1; gm < 13; gm++) { let v = sal_a[gm]; if (gd <= v) break; gd -= v; }
            return [gy, gm, gd];
        },
        getDaysInMonth(jy, jm) {
            if (jm <= 6) return 31; if (jm <= 11) return 30;
            let a = jy - 979; let b = (parseInt(a / 33) * 8) + parseInt(((a % 33) + 3) / 4);
            let c = (parseInt((jy + 1 - 979) / 33) * 8) + parseInt((((jy + 1 - 979) % 33) + 3) / 4);
            return (c - b === 1) ? 30 : 29;
        }
    };

    function gToJ(gStr) {
        if (!gStr) return "";
        let datePart = gStr.split(" ")[0];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return gStr; // Only convert Valid YYYY-MM-DD
        const parts = datePart.split("-");
        const [jy, jm, jd] = JalaliCal.g2j(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
        let res = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
        console.log(`[Jalali Engine] gToJ: ${gStr} -> ${res}`);
        return res;
    }

    function jToG(jStr) {
        if (!jStr) return "";
        let datePart = jStr.split(" ")[0].replace(/[jJ]/g, "");
        if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(datePart)) return jStr; // Only convert Valid YYYY/MM/DD
        const parts = datePart.split("/");
        const [gy, gm, gd] = JalaliCal.j2g(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
        let res = `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
        console.log(`[Jalali Engine] jToG: ${jStr} -> ${res}`);
        return res;
    }

    let currentView = "days"; // 'days', 'months', 'years'
    let currentDecade = Math.floor(targetYear / 10) * 10;
    let selectedDayCache = null;


    let updatePosition = function() {
        if (!pickerEl || pickerEl.style.display === 'none' || !activeInput) return;
        if (!activeInput.isConnected || activeInput.offsetWidth === 0) {
            pickerEl.style.setProperty('display', 'none', 'important');
            activeInput = null;
            return;
        }
        const rect = activeInput.getBoundingClientRect();
        const inputHeight = rect.height;
        const windowHeight = window.innerHeight;
        const pickerHeight = 270; // approximate
        
        let top = rect.bottom + 4;
        let left = rect.left;
        
        const spaceBelow = windowHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        if (spaceBelow < pickerHeight && spaceAbove > pickerHeight) {
            top = rect.top - pickerHeight - 4;
        }
        
        if (left + 270 > window.innerWidth) left = window.innerWidth - 270;
        
        pickerEl.style.setProperty('top', top + "px", 'important');
        pickerEl.style.setProperty('left', left + "px", 'important');
    };

    function ensurePicker() {
        if (pickerEl) return;
        pickerEl = document.createElement("div");
        pickerEl.id = "custom-jalali-global-picker";
        pickerEl.className = "datepicker active datepicker-jalali"; 
        pickerEl.style.position = "fixed";
        pickerEl.style.setProperty('display', 'none', 'important');
        pickerEl.style.zIndex = "2147483647";
        pickerEl.setAttribute("dir", "rtl");
        document.body.appendChild(pickerEl);
        
        console.log("Jalali Engine: Picker element created in DOM.");

        // No preventDefault on mousedown to allow clicks to register naturally on all devices
        
        pickerEl.addEventListener("click", function (e) {
            e.stopPropagation(); 
            const actionEl = e.target.closest("[data-action]");
            if (actionEl) {
                const action = actionEl.dataset.action;
                if (action === "prev-month") { 
                    if (currentView === "days") {
                        targetMonth--; if(targetMonth<1){targetMonth=12;targetYear--;} 
                    } else if (currentView === "months") {
                        targetYear--;
                    } else if (currentView === "years") {
                        currentDecade -= 10;
                    }
                    renderGrid(); 
                }
                else if (action === "next-month") { 
                    if (currentView === "days") {
                        targetMonth++; if(targetMonth>12){targetMonth=1;targetYear++;} 
                    } else if (currentView === "months") {
                        targetYear++;
                    } else if (currentView === "years") {
                        currentDecade += 10;
                    }
                    renderGrid(); 
                }
                else if (action === "zoom-out") {
                    if (currentView === "days") { currentView = "months"; renderGrid(); }
                    else if (currentView === "months") { currentView = "years"; currentDecade = Math.floor(targetYear / 10) * 10; renderGrid(); }
                }
                else if (action === "today") selectToday();
                return;
            }

            const cell = e.target.closest(".datepicker--cell");
            if (cell && !cell.classList.contains("-other-month-")) {
                if (cell.classList.contains("-day-")) {
                    selectDate(cell.dataset.day);
                } else if (cell.classList.contains("-month-")) {
                    targetMonth = parseInt(cell.dataset.month, 10);
                    currentView = "days";
                    renderGrid();
                } else if (cell.classList.contains("-year-")) {
                    targetYear = parseInt(cell.dataset.year, 10);
                    currentView = "months";
                    renderGrid();
                }
            }
        });

        pickerEl.addEventListener("input", function(e) {
            if (e.target.classList.contains("custom-bridge-hour") || e.target.classList.contains("custom-bridge-min")) {
                if (selectedDayCache) {
                    updateInputAndOptionallyClose(selectedDayCache, false, true);
                } else if (activeInput && activeInput.value && activeInput.value.includes("/")) {
                    let d = parseInt(activeInput.value.split(" ")[0].split("/")[2], 10);
                    updateInputAndOptionallyClose(d, false, true);
                } else {
                    const now = new Date(); 
                    const [jy, jm, jd] = JalaliCal.g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    updateInputAndOptionallyClose(jd, false, true);
                }
            }
        });

        const closePickerHandler = function (e) {
            if (activeInput && !pickerEl.contains(e.target) && e.target !== activeInput) {
                pickerEl.style.setProperty('display', 'none', 'important'); 
                activeInput = null;
                currentView = "days";
            }
        };
        document.addEventListener("mousedown", closePickerHandler, true);
        document.addEventListener("touchstart", closePickerHandler, {passive: true, capture: true});
        document.addEventListener("pointerdown", closePickerHandler, true);
        
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && activeInput) {
                pickerEl.style.setProperty('display', 'none', 'important'); 
                activeInput = null;
                currentView = "days";
            }
        }, true);
        
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition, true);
    }

    function showPicker(input, control) {
        if (input._jalali_ignore_focus) return;
        if (pickerEl && pickerEl.style.display !== 'none' && activeInput === input) return;
        activeInput = input; activeControl = control;
        currentView = "days";
        ensurePicker();
        
        let currentVal = input.value;
        if (currentVal && /^\d{4}\/\d{2}\/\d{2}/.test(currentVal)) {
            const parts = currentVal.split(" ")[0].split("/");
            targetYear = parseInt(parts[0], 10); targetMonth = parseInt(parts[1], 10);
        } else {
            const now = new Date(); const [jy, jm] = JalaliCal.g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
            targetYear = jy; targetMonth = jm;
        }
        
        renderGrid();
        pickerEl.style.setProperty('display', 'block', 'important');
        updatePosition();
        setTimeout(updatePosition, 10);
    }

    function renderGrid() {
        if (!pickerEl || !activeInput) return;
        const fieldType = activeInput.dataset.fieldtype || (activeControl && activeControl.df.fieldtype);
        
        const now = new Date(); const [gy, gm, gd] = JalaliCal.g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
        const todayStr = `${gy}/${String(gm).padStart(2, '0')}/${String(gd).padStart(2, '0')}`;
        let selectedStr = activeInput.value ? activeInput.value.split(" ")[0] : "";
        let navTitle = "";
        let bodyHtml = "";

        const svgPrev = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
        const svgNext = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;

        if (currentView === "days") {
            navTitle = `${monthNames[targetMonth - 1]} ${targetYear}`;
            
            const totalDays = JalaliCal.getDaysInMonth(targetYear, targetMonth);
            const [gYear, gMonth, gDay] = JalaliCal.j2g(targetYear, targetMonth, 1);
            const startWeekday = new Date(gYear, gMonth - 1, gDay).getDay();
            const startOffset = (startWeekday + 1) % 7; 
            
            let cellsHtml = "";
            for (let i = 0; i < startOffset; i++) { cellsHtml += `<div class="datepicker--cell -day- -other-month-"></div>`; }
            for (let d = 1; d <= totalDays; d++) {
                const currentLoopStr = `${targetYear}/${String(targetMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}`;
                const isToday = currentLoopStr === todayStr; 
                const isSelected = currentLoopStr === selectedStr;
                cellsHtml += `<div class="datepicker--cell -day- ${isToday ? '-current-' : ''} ${isSelected ? '-selected-' : ''}" data-day="${d}">${d}</div>`;
            }
            bodyHtml = `
                <div class="datepicker--days datepicker--body active">
                    <div class="datepicker--day-names">
                        <div class="datepicker--day-name">ش</div><div class="datepicker--day-name">ی</div>
                        <div class="datepicker--day-name">د</div><div class="datepicker--day-name">س</div>
                        <div class="datepicker--day-name">چ</div><div class="datepicker--day-name">پ</div>
                        <div class="datepicker--day-name">ج</div>
                    </div>
                    <div class="datepicker--cells datepicker--cells-days">${cellsHtml}</div>
                </div>`;
        } else if (currentView === "months") {
            navTitle = `${targetYear}`;
            let cellsHtml = "";
            for (let m = 1; m <= 12; m++) {
                const isSelected = selectedStr && parseInt(selectedStr.split('/')[0]) === targetYear && parseInt(selectedStr.split('/')[1]) === m;
                cellsHtml += `<div class="datepicker--cell -month- ${isSelected ? '-selected-' : ''}" data-month="${m}" style="height:40px !important; margin:0; padding:0; display:flex; align-items:center; justify-content:center; border-radius: 4px;">${monthNames[m - 1]}</div>`;
            }
            bodyHtml = `
                <div class="datepicker--months datepicker--body active" style="padding: 4px;">
                    <div class="datepicker--cells datepicker--cells-months" style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">${cellsHtml}</div>
                </div>`;
        } else if (currentView === "years") {
            navTitle = `${currentDecade} - ${currentDecade + 9}`;
            let cellsHtml = "";
            for (let y = currentDecade - 1; y <= currentDecade + 10; y++) {
                const isSelected = selectedStr && parseInt(selectedStr.split('/')[0]) === y;
                const isOtherDecade = y < currentDecade || y > currentDecade + 9;
                cellsHtml += `<div class="datepicker--cell -year- ${isOtherDecade ? '-other-month-' : ''} ${isSelected ? '-selected-' : ''}" data-year="${y}" style="height:40px !important; margin:0; padding:0; display:flex; align-items:center; justify-content:center; border-radius: 4px;">${y}</div>`;
            }
            bodyHtml = `
                <div class="datepicker--years datepicker--body active" style="padding: 4px;">
                    <div class="datepicker--cells datepicker--cells-years" style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">${cellsHtml}</div>
                </div>`;
        }

        let timeHtml = "";
        if (fieldType === "Datetime") {
            const tempNow = new Date();
            let currentHour = String(tempNow.getHours()).padStart(2, '0');
            let currentMin = String(tempNow.getMinutes()).padStart(2, '0');
            if (activeInput.value && activeInput.value.includes(" ")) {
                const timePart = activeInput.value.split(" ")[1];
                if (timePart.includes(":")) [currentHour, currentMin] = timePart.split(":");
            }
            timeHtml = `
                <div class="datepicker--time">
                    <div class="datepicker--time-current" style="display: flex; justify-content: center; align-items: center; margin-bottom: 10px; font-weight: bold; font-size: 14px;">
                        <span class="datepicker--time-current-hours" style="padding: 2px 6px; border-radius: 4px;">${currentHour}</span>
                        <span class="datepicker--time-current-colon" style="margin: 0 2px;">:</span>
                        <span class="datepicker--time-current-minutes" style="padding: 2px 6px; border-radius: 4px;">${currentMin}</span>
                    </div>
                    <div class="datepicker--time-sliders" style="padding: 0 10px;">
                        <div class="datepicker--time-row" data-time="hours" style="margin-bottom: 8px;">
                            <input type="range" class="custom-bridge-hour" name="hours" value="${parseInt(currentHour, 10)}" min="0" max="23" step="1" style="width: 100%; cursor: pointer;">
                        </div>
                        <div class="datepicker--time-row" data-time="minutes">
                            <input type="range" class="custom-bridge-min" name="minutes" value="${parseInt(currentMin, 10)}" min="0" max="59" step="1" style="width: 100%; cursor: pointer;">
                        </div>
                    </div>
                </div>`;
        }

        pickerEl.innerHTML = `
            <i class="datepicker--pointer"></i>
            <nav class="datepicker--nav">
                <div class="datepicker--nav-action" data-action="prev-month">${svgNext}</div>
                <div class="datepicker--nav-title" data-action="zoom-out"><b>${navTitle}</b></div>
                <div class="datepicker--nav-action" data-action="next-month">${svgPrev}</div>
            </nav>
            <div class="datepicker--content">
                ${bodyHtml}
            </div>
            ${timeHtml}
            <div class="datepicker--buttons" style="display:flex; border-top:1px solid #efefef;">
                <span class="datepicker--button" data-action="today" style="flex:1; text-align:center; padding:8px; cursor:pointer;">امروز</span>
            </div>
        `;
    }

    function updateInputAndOptionallyClose(d, closePicker, skipRender = false) {
        let timePart = "";
        const fieldType = activeInput && activeInput.dataset.fieldtype ? activeInput.dataset.fieldtype : (activeControl && activeControl.df ? activeControl.df.fieldtype : null);
        const isDatetime = (fieldType === "Datetime");
        
        if (isDatetime) {
            let hEl = pickerEl.querySelector(".custom-bridge-hour");
            let mEl = pickerEl.querySelector(".custom-bridge-min");
            let h = hEl ? hEl.value : "00";
            let m = mEl ? mEl.value : "00";
            timePart = ` ${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
            
            let hSpan = pickerEl.querySelector(".datepicker--time-current-hours");
            let mSpan = pickerEl.querySelector(".datepicker--time-current-minutes");
            if (hSpan) hSpan.textContent = String(h).padStart(2, '0');
            if (mSpan) mSpan.textContent = String(m).padStart(2, '0');
        }

        let selectedStr = `${targetYear}/${String(targetMonth).padStart(2, '0')}/${String(d).padStart(2, '0')}${timePart}`;
        
        let targetInput = activeInput;
        if (targetInput) {
            targetInput._jalali_ignore_focus = true;
            setTimeout(() => { targetInput._jalali_ignore_focus = false; }, 200);
        }

        try {
            if (activeControl) {
                activeControl.set_value(jToG(selectedStr.split(" ")[0]) + (isDatetime ? ` ${selectedStr.split(" ")[1]}` : ""));
            } else if (activeInput) {
                activeInput.value = selectedStr;
                activeInput.dispatchEvent(new Event("change", { bubbles: true }));
                activeInput.dispatchEvent(new Event("input", { bubbles: true }));
            }
        } catch (err) {
            console.error("Jalali Engine: Error setting value", err);
        }

        if (closePicker) {
            pickerEl.style.setProperty('display', 'none', 'important');
            activeInput = null;
        } else {
            selectedDayCache = d;
            if (!skipRender) {
                renderGrid();
            } else {
                // Just update the selected class in the grid without destroying HTML
                let cells = pickerEl.querySelectorAll('.datepicker--cell.-day-');
                cells.forEach(c => {
                    if (parseInt(c.dataset.day, 10) === parseInt(d, 10)) {
                        c.classList.add('-selected-');
                    } else {
                        c.classList.remove('-selected-');
                    }
                });
            }
        }
    }

    function selectDate(day) {
        if (!activeInput) return;
        const fieldType = activeInput && activeInput.dataset.fieldtype ? activeInput.dataset.fieldtype : (activeControl && activeControl.df ? activeControl.df.fieldtype : null);
        const isDatetime = (fieldType === "Datetime");
        updateInputAndOptionallyClose(day, !isDatetime);
    }

    function selectToday() {
        const now = new Date(); const [jy, jm, jd] = JalaliCal.g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
        targetYear = jy; targetMonth = jm; selectDate(jd);
    }

    // ---------- پچ‌های کاملاً ایزوله برای فرم‌ها (بدون تخریب Gantt یا Formatters) ----------
    function applyFrameworkOverrides() {
        if (!window.frappe) return;

        // 1. پچ ایمن ControlDate
        if (frappe.ui?.form?.ControlDate) {
            console.log("[Jalali Engine] Patching ControlDate");
            frappe.ui.form.ControlDate.prototype.parse = function (value) { return jToG(value); };
            frappe.ui.form.ControlDate.prototype.format_for_input = function (value) { return gToJ(value); };
            frappe.ui.form.ControlDate.prototype.set_formatted_input = function (value) { 
                if (value === "Today") { const now = new Date(); value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
                if (value) this.$input?.val(gToJ(value) || value); 
            };

            frappe.ui.form.ControlDate.prototype.set_datepicker = function () {
                const me = this; this.$input.attr("autocomplete", "off");
                this.$input.off("focus click").on("focus click", function (e) { e.stopPropagation(); showPicker(this, me); });
                
                // شبیه‌ساز ایمن برای جلوگیری از کرش روتین‌های داخلی فرپه
                this.datepicker = {
                    clear: function () { me.$input.val(""); },
                    selectDate: function (d) { 
                        if (d instanceof Date) {
                            let dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                            me.$input.val(gToJ(dStr)); 
                        }
                    },
                    hide: function () { if(pickerEl) pickerEl.style.setProperty('display', 'none', 'important'); },
                    update: function () {},
                    selectedDates: []
                };
            };
        }

        // 2. پچ ایمن ControlDatetime
        if (frappe.ui?.form?.ControlDatetime) {
            console.log("[Jalali Engine] Patching ControlDatetime");
            frappe.ui.form.ControlDatetime.prototype.parse = function (value) { 
                if(!value) return "";
                let parts = value.split(" ");
                return jToG(parts[0]) + (parts[1] ? " " + parts[1] : "");
            };
            frappe.ui.form.ControlDatetime.prototype.format_for_input = function (value) { 
                if(!value) return "";
                let parts = value.split(" ");
                return gToJ(parts[0]) + (parts[1] ? " " + parts[1] : "");
            };
            frappe.ui.form.ControlDatetime.prototype.set_formatted_input = function (value) { 
                if (value) this.$input?.val(this.format_for_input(value) || value); 
            };
            frappe.ui.form.ControlDatetime.prototype.set_datepicker = function () {
                const me = this; this.$input.attr("autocomplete", "off");
                this.$input.off("focus click").on("focus click", function (e) { e.stopPropagation(); showPicker(this, me); });
                this.datepicker = { 
                    clear: function () { me.$input.val(""); }, 
                    selectDate: function (d) { 
                        if (d instanceof Date) {
                            let dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                            me.$input.val(gToJ(dStr)); 
                        }
                    }, 
                    hide: function () { if(pickerEl) pickerEl.style.setProperty('display', 'none', 'important'); }, 
                    update: function () {}, 
                    selectedDates: [] 
                };
            };
        }

        // 3. تنظیم شروع هفته (برای اصلاح گرید تقویم اصلی و گانت)
        frappe.datetime.get_first_day_of_the_week_index = function() { return 6; };

        // 4. پچ تقویم بزرگ (Lazy Load + Original Method Call برای حل مشکل viewType)
        frappe.provide("frappe.views");
        function patchCalendarConfig(CalendarClass) {
            if (!CalendarClass || !CalendarClass.prototype || !CalendarClass.prototype.setup_options) return;
            if (CalendarClass.prototype._jalali_patched) return;
            
            const originalSetupOptions = CalendarClass.prototype.setup_options;
            CalendarClass.prototype.setup_options = function(defaults) {
                if (originalSetupOptions) {
                    originalSetupOptions.call(this, defaults);
                }
                if (this.cal_options) { 
                    this.cal_options.locale = 'fa'; 
                    this.cal_options.firstDay = 6; // شروع از روز شنبه
                    this.cal_options.buttonText = {
                        today: 'امروز',
                        month: 'ماه',
                        week: 'هفته',
                        day: 'روز',
                        list: 'لیست'
                    };
                }
            };
            
            const originalMake = CalendarClass.prototype.make;
            CalendarClass.prototype.make = function() {
                if (this.cal_options && this.cal_options.weekends === 'false') {
                    this.cal_options.weekends = false; // Fix Frappe string boolean bug
                }
                
                // We do not mutate this.cal_options.weekends so Frappe's state remains correct.
                let isWeekendsHidden = (this.cal_options && this.cal_options.weekends === false);
                if (isWeekendsHidden) {
                    this.cal_options.hiddenDays = [4, 5];
                }

                let origFC = frappe.FullCalendar;
                frappe.FullCalendar = function(el, options) {
                    let newOptions = Object.assign({}, options);
                    newOptions.direction = 'rtl';
                    newOptions.firstDay = 6;
                    if (newOptions.buttonIcons) {
                        newOptions.buttonIcons.prev = 'right';
                        newOptions.buttonIcons.next = 'left';
                    }
                    newOptions.buttonHints = {
                        prev: 'قبلی',
                        next: 'بعدی',
                        today: 'امروز',
                        month: 'ماه',
                        week: 'هفته',
                        day: 'روز'
                    };
                    newOptions.weekends = true; // Force weekends for FC so Sat/Sun aren't hidden
                    return new origFC(el, newOptions);
                };
                frappe.FullCalendar.Plugins = origFC.Plugins;

                this.cal_options.dayHeaderContent = function(arg) {
                    let date = arg.date;
                    let [jy, jm, jd] = JalaliCal.g2j(date.getFullYear(), date.getMonth() + 1, date.getDate());
                    let monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
                    let weekMap = {"Sun": "یکشنبه", "Mon": "دوشنبه", "Tue": "سه‌شنبه", "Wed": "چهارشنبه", "Thu": "پنجشنبه", "Fri": "جمعه", "Sat": "شنبه"};
                    let enDay = date.toLocaleDateString('en-US', {weekday: 'short'});
                    let dayName = weekMap[enDay] || enDay;
                    
                    if (arg.view.type === 'dayGridMonth') {
                        return dayName;
                    } else {
                        return dayName + ' ' + jd + ' ' + monthNames[jm - 1];
                    }
                };

                let origDatesSet = this.cal_options.datesSet;
                this.cal_options.datesSet = function(arg) {
                    if (origDatesSet) origDatesSet.call(this, arg);
                };

                if (originalMake) {
                    originalMake.call(this);
                }

                // Fix Calendar Title Jumping (Sync MutationObserver)
                if (this.fullCalendar && this.fullCalendar.el) {
                    const updateTitle = () => {
                        let titleEl = this.fullCalendar.el.querySelector('.fc-toolbar-title');
                        if (titleEl) {
                            let textNode = null;
                            let text = "";
                            titleEl.childNodes.forEach(n => {
                                if (n.nodeType === 3) { textNode = n; text += n.nodeValue; }
                            });
                            if (!textNode) return;
                            
                            if (text.includes(' - ') && !text.includes(' – ')) return; // Already patched
                            
                            let parts = text.split(/\s*[-–]\s*/);
                            let newTitle = text;
                            if (parts.length === 2) {
                                let p1 = parts[0].trim().split(/\s+/);
                                let p2 = parts[1].trim().split(/\s+/);
                                if (p1.length === 2 && p2.length === 2) {
                                    if (p1[0] === p2[0]) { 
                                        newTitle = p1[1] + ' - ' + p2[1] + ' ' + p1[0];
                                    } else if (p1[1] === p2[1]) {
                                        newTitle = p1[0] + ' - ' + p2[0] + ' ' + p1[1];
                                    } else {
                                        newTitle = p1[1] + ' ' + p1[0] + ' - ' + p2[1] + ' ' + p2[0];
                                    }
                                }
                            } else if (parts.length === 1) {
                                let p = parts[0].trim().split(/\s+/);
                                if (p.length === 2 && p[0].match(/^[0-9۰-۹]+$/)) { 
                                    newTitle = p[1] + ' ' + p[0];
                                } else if (p.length === 2 && p[1].match(/^[0-9۰-۹]+$/)) {
                                    newTitle = p[0] + ' ' + p[1];
                                }
                            }
                            if (newTitle !== text) {
                                textNode.nodeValue = newTitle;
                            }
                        }
                    };

                    const observer = new MutationObserver(() => {
                        updateTitle();
                    });
                    const toolbar = this.fullCalendar.el.querySelector('.fc-header-toolbar');
                    if (toolbar) {
                        observer.observe(toolbar, { childList: true, subtree: true, characterData: true });
                    }
                    updateTitle();
                }

                // Restore frappe.FullCalendar to prevent infinite proxy wrapping
                frappe.FullCalendar = origFC;

                if (this.fullCalendar && !this.fullCalendar._jalali_setOption_patched) {
                    const origSetOption = this.fullCalendar.setOption;
                    if (origSetOption) {
                        this.fullCalendar.setOption = function(name, value) {
                            if (name === 'weekends') {
                                // FullCalendar default weekends are Sat/Sun. 
                                // To hide Thu/Fri in Jalali:
                                if (value === false || value === 'false') {
                                    origSetOption.call(this, 'hiddenDays', [4, 5]);
                                } else {
                                    origSetOption.call(this, 'hiddenDays', []);
                                }
                                setTimeout(() => {
                                    origSetOption.call(this, 'weekends', true);
                                }, 1);
                                return;
                            }
                            return origSetOption.call(this, name, value);
                        };
                        this.fullCalendar._jalali_setOption_patched = true;
                    }
                    
                    // We don't need to manually setOption('weekends', false) here because we modified cal_options
                    // But we MUST restore this.cal_options.weekends so Frappe's toggle button works properly
                    if (this._jalali_initial_weekends_state !== undefined) {
                        this.cal_options.weekends = this._jalali_initial_weekends_state;
                    }
                }
            };
            
            CalendarClass.prototype._jalali_patched = true;
        }

        if (frappe.views.Calendar) {
            patchCalendarConfig(frappe.views.Calendar);
        } else {
            let _Calendar = frappe.views.Calendar;
            Object.defineProperty(frappe.views, 'Calendar', {
                get: function() { return _Calendar; },
                set: function(val) {
                    _Calendar = val;
                    if (_Calendar) patchCalendarConfig(_Calendar);
                }
            });
        }

        // 5. فرمت‌کننده‌های ایمن برای List Views بدون کرش در Gantt (کنترل Null)
        if (frappe.form && frappe.form.formatters) {
            const origDate = frappe.form.formatters.Date;
            frappe.form.formatters.Date = function(value, doc, field) {
                if (!value) return "";
                if (window.cur_list && window.cur_list.view_name === "Gantt") return origDate ? origDate(value, doc, field) : value; // Bypass Gantt to prevent crashes
                if (typeof value === "string") {
                    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return gToJ(value);
                    if (value.includes("/")) return value; // Already converted
                }
                return origDate ? origDate(value, doc, field) : value;
            };

            const origDatetime = frappe.form.formatters.Datetime;
            frappe.form.formatters.Datetime = function(value, doc, field) {
                if (!value) return "";
                if (window.cur_list && window.cur_list.view_name === "Gantt") return origDatetime ? origDatetime(value, doc, field) : value; // Bypass Gantt to prevent crashes
                if (typeof value === "string") {
                    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
                        let parts = value.split(" ");
                        return gToJ(parts[0]) + (parts[1] ? " " + parts[1] : "");
                    }
                    if (value.includes("/")) return value; // Already converted
                }
                return origDatetime ? origDatetime(value, doc, field) : value;
            };
        }
        
        // 6. پچ ایمنی Gantt View (تضمین پاس دادن تاریخ میلادی به frappe-gantt)
        if (frappe.views && frappe.views.GanttView) {
            const origPrepare = frappe.views.GanttView.prototype.prepare_tasks;
            const origRender = frappe.views.GanttView.prototype.render_gantt;
            if (origPrepare && !frappe.views.GanttView.prototype._jalali_patched) {
                frappe.views.GanttView.prototype.prepare_tasks = function() {
                    console.log("Jalali Engine: Securing Gantt chart data...");
                    origPrepare.apply(this, arguments);
                    if (this.tasks && Array.isArray(this.tasks)) {
                        this.tasks.forEach(t => {
                            if (t.start && typeof t.start === "string") {
                                if (t.start.includes('/')) t.start = jToG(t.start) || t.start;
                                else if (/^1[34]\d{2}-\d{2}-\d{2}/.test(t.start)) t.start = jToG(t.start.replace(/-/g, '/')) || t.start;
                            }
                            if (t.end && typeof t.end === "string") {
                                if (t.end.includes('/')) t.end = jToG(t.end) || t.end;
                                else if (/^1[34]\d{2}-\d{2}-\d{2}/.test(t.end)) t.end = jToG(t.end.replace(/-/g, '/')) || t.end;
                            }
                        });
                    }
                };
                frappe.views.GanttView.prototype._jalali_patched = true;
            }
            if (origRender && !frappe.views.GanttView.prototype._jalali_gantt_render_patched) {
                frappe.views.GanttView.prototype.render_gantt = function() {
                    origRender.apply(this, arguments);
                    if (this.gantt) {
                        const me = this;
                        // Patch Popup HTML for Jalali
                        this.gantt.options.custom_popup_html = function(task) {
                            var item = me.get_item(task.id);
                            let startJ = gToJ(moment(task._start).format("YYYY-MM-DD"));
                            let endJ = gToJ(moment(task._end).format("YYYY-MM-DD"));
                            var html = `<div class="title">${task.name}</div><div class="subtitle" style="direction: rtl;">${startJ} - ${endJ}</div>`;
                            if (me.settings && $.isFunction(me.settings.gantt_custom_popup_html)) {
                                html = me.settings.gantt_custom_popup_html(task, item);
                            }
                            return '<div class="details-container">' + html + "</div>";
                        };
                        
                        // Patch on_date_change to save Jalali
                        this.gantt.options.on_date_change = (task, start, end) => {
                            if (!me.can_write) return;
                            let field_map = me.calendar_settings.field_map;
                            let startG = moment(start).format("YYYY-MM-DD");
                            let endG = moment(end).format("YYYY-MM-DD");
                            frappe.db.set_value(task.doctype, task.id, {
                                [field_map.start]: startG,
                                [field_map.end]: endG
                            });
                        };

                        // Jalali Grid Renderer for frappe-gantt
                        const translateDOM = () => {
                            if (!me.$result || !me.gantt || !me.gantt.dates) return;
                            const svg = me.$result[0].querySelector('svg');
                            if (!svg) return;
                            
                            // RTL Flip for Gantt
                            if (!svg.dataset.jalaliRtl) {
                                svg.style.transform = 'scaleX(-1)';
                                svg.dataset.jalaliRtl = 'true';
                            }

                            // Explicitly apply text transform for browsers that might fail with CSS
                            let allTexts = svg.querySelectorAll('text, .bar-label');
                            allTexts.forEach(t => {
                                t.style.transform = 'scaleX(-1)';
                                t.style.transformOrigin = 'center';
                                t.style.transformBox = 'fill-box';
                            });
                            
                            const dates = me.gantt.dates;
                            const viewMode = me.gantt.options.view_mode;
                            const monthNames = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
                            
                            let upperTexts = svg.querySelectorAll('.upper-text');
                            let lowerTexts = svg.querySelectorAll('.lower-text');
                            
                            let colWidth = me.gantt.options.column_width;
                            if (lowerTexts.length >= 2) {
                                colWidth = parseFloat(lowerTexts[1].getAttribute('x')) - parseFloat(lowerTexts[0].getAttribute('x'));
                            }

                            if (viewMode === 'Day' || viewMode === 'Half Day' || viewMode === 'Quarter Day' || viewMode === 'Week') {
                                // Fix Lower Texts (Days)
                                lowerTexts.forEach((t, i) => {
                                    if (dates[i]) {
                                        let [jy, jm, jd] = JalaliCal.g2j(dates[i].getFullYear(), dates[i].getMonth() + 1, dates[i].getDate());
                                        if (viewMode === 'Day') t.innerHTML = jd; 
                                        else if (viewMode === 'Week') t.innerHTML = jd + ' ' + monthNames[jm - 1];
                                    }
                                });
                                
                                // Rebuild Upper Texts (Months)
                                let upperY = upperTexts.length > 0 ? upperTexts[0].getAttribute('y') : 15;
                                let gHeader = upperTexts.length > 0 ? upperTexts[0].parentNode : svg.querySelector('g.grid-header');
                                upperTexts.forEach(t => t.remove()); // Remove original Gregorian month boundaries
                                
                                let currentJMonth = -1;
                                let currentJYear = -1;
                                let startX = 0;
                                let count = 0;
                                
                                const appendUpperText = (jYear, jMonth, xStart, countSpan) => {
                                    if (!gHeader) return;
                                    let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                                    text.setAttribute('class', 'upper-text');
                                    text.setAttribute('y', upperY);
                                    let center = xStart + (countSpan * colWidth) / 2;
                                    text.setAttribute('x', center);
                                    text.innerHTML = monthNames[jMonth - 1] + ' ' + jYear;
                                    text.setAttribute('style', 'text-anchor: middle;');
                                    gHeader.appendChild(text);
                                };
                                
                                dates.forEach((d, i) => {
                                    let [jy, jm, jd] = JalaliCal.g2j(d.getFullYear(), d.getMonth() + 1, d.getDate());
                                    if (jm !== currentJMonth || jy !== currentJYear) {
                                        if (currentJMonth !== -1) {
                                            appendUpperText(currentJYear, currentJMonth, startX, count);
                                        }
                                        currentJMonth = jm;
                                        currentJYear = jy;
                                        startX = i * colWidth;
                                        count = 1;
                                    } else {
                                        count++;
                                    }
                                });
                                if (currentJMonth !== -1) {
                                    appendUpperText(currentJYear, currentJMonth, startX, count);
                                }
                            } else if (viewMode === 'Month') {
                                lowerTexts.forEach((t, i) => {
                                    if (dates[i]) {
                                        let [jy, jm, jd] = JalaliCal.g2j(dates[i].getFullYear(), dates[i].getMonth() + 1, 15);
                                        t.innerHTML = monthNames[jm - 1];
                                    }
                                });
                                upperTexts.forEach((t, i) => {
                                    let match = t.innerHTML.match(/\d{4}/);
                                    if (match) {
                                        let gYear = parseInt(match[0]);
                                        t.innerHTML = gYear - 621;
                                    }
                                });
                            } else if (viewMode === 'Year') {
                                lowerTexts.forEach((t, i) => {
                                    if (dates[i]) {
                                        t.innerHTML = dates[i].getFullYear() - 621;
                                    }
                                });
                            }
                        };
                        
                        if (!this.gantt._jalali_render_patched) {
                            const origGanttRender = this.gantt.render;
                            if (origGanttRender) {
                                this.gantt.render = function() {
                                    origGanttRender.apply(this, arguments);
                                    translateDOM(); // Synchronous execution to prevent jump
                                };
                            }
                            this.gantt._jalali_render_patched = true;
                        }
                        translateDOM();
                    }
                };
                frappe.views.GanttView.prototype._jalali_gantt_render_patched = true;
            }
        }
    }

    function bootstrap() {
        if (window.frappe && window.frappe.ui && window.frappe.ui.form) { 
            if (!document.getElementById('jalali-global-fixes')) {
                let style = document.createElement('style');
                style.id = 'jalali-global-fixes';
                style.textContent = `
                    /* Fix Gantt RTL Text Mirroring */
                    .gantt-container svg text, 
                    .gantt-container svg .bar-label {
                        transform: scaleX(-1) !important;
                        transform-origin: center !important;
                        transform-box: fill-box !important;
                    }
                    /* Calendar Toolbar Buttons RTL Fix */
                    [dir="rtl"] .fc-toolbar-chunk .btn-group {
                        display: flex !important;
                        flex-direction: row !important;
                    }
                    [dir="rtl"] .fc-toolbar-chunk .btn-group > .btn {
                        display: inline-flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        height: 28px !important;
                        padding: 0 10px !important;
                        line-height: normal !important;
                        vertical-align: middle !important;
                    }
                    
                    /* Separate Today button and round all its corners */
                    [dir="rtl"] .fc-toolbar-chunk .btn-group > .fc-today-button {
                        border-radius: var(--border-radius, 4px) !important;
                        margin-left: 8px !important;
                    }
                    
                    /* Month button becomes the right-most of the connected group */
                    [dir="rtl"] .fc-toolbar-chunk .btn-group > .fc-dayGridMonth-button {
                        border-top-right-radius: var(--border-radius, 4px) !important;
                        border-bottom-right-radius: var(--border-radius, 4px) !important;
                        border-top-left-radius: 0 !important;
                        border-bottom-left-radius: 0 !important;
                    }
                    
                    /* Week button is in the middle, flat on both sides */
                    [dir="rtl"] .fc-toolbar-chunk .btn-group > .fc-timeGridWeek-button {
                        border-radius: 0 !important;
                    }
                    
                    /* Day button is the left-most, rounded on the left */
                    [dir="rtl"] .fc-toolbar-chunk .btn-group > .fc-timeGridDay-button {
                        border-top-left-radius: var(--border-radius, 4px) !important;
                        border-bottom-left-radius: var(--border-radius, 4px) !important;
                        border-top-right-radius: 0 !important;
                        border-bottom-right-radius: 0 !important;
                    }
                    
                    /* Prev/Next buttons */
                    [dir="rtl"] .fc-toolbar-chunk .btn-group > .fc-prev-button {
                        border-top-right-radius: var(--border-radius, 4px) !important;
                        border-bottom-right-radius: var(--border-radius, 4px) !important;
                        border-top-left-radius: 0 !important;
                        border-bottom-left-radius: 0 !important;
                    }
                    [dir="rtl"] .fc-toolbar-chunk .btn-group > .fc-next-button {
                        border-top-left-radius: var(--border-radius, 4px) !important;
                        border-bottom-left-radius: var(--border-radius, 4px) !important;
                        border-top-right-radius: 0 !important;
                        border-bottom-right-radius: 0 !important;
                    }

                    /* Fix Onboarding Widget Overlapping Sidebar in RTL */
                    [dir="rtl"] .user-onboarding,
                    [dir="rtl"] .onb-panel {
                        left: 20px !important;
                        right: auto !important;
                        position: fixed !important;
                        bottom: 20px !important;
                        z-index: 9999 !important;
                    }
                    /* Fix Gantt Chart SVG Mirroring (Prevents Jumping) */
                    [dir="rtl"] .gantt-container svg {
                        transform: scaleX(-1) !important;
                    }
                `;
                document.head.appendChild(style);
            }
            applyFrameworkOverrides(); 
            console.log("%c 🎉 JALALI CORE READY (ZERO-INTERFERENCE) ", "background: #000; color: #00ff00; font-weight: bold;");
        } else { 
            setTimeout(bootstrap, 50); 
        }
    }
    bootstrap();
})();

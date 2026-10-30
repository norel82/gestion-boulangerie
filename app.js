(function () {
    'use strict';

    const STORAGE_KEY = 'boulangerie_hours';
    const DEFAULT_RATE = 0;
    const SUNDAY_BONUS = 0.2;
    const MONTH_NAMES = [
        'janvier',
        'février',
        'mars',
        'avril',
        'mai',
        'juin',
        'juillet',
        'août',
        'septembre',
        'octobre',
        'novembre',
        'décembre'
    ];

    let currentMonth = startOfMonth(new Date());

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }
        return 'day-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function isValidDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
        }
        const parts = value.split('-').map(Number);
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        return (
            date.getFullYear() === parts[0] &&
            date.getMonth() === parts[1] - 1 &&
            date.getDate() === parts[2]
        );
    }

    function isValidTime(value) {
        return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    }

    function normalizeDay(raw) {
        if (!raw || typeof raw !== 'object') {
            return null;
        }
        const date = typeof raw.date === 'string' ? raw.date : '';
        const start = typeof raw.start === 'string' ? raw.start : '';
        const end = typeof raw.end === 'string' ? raw.end : '';
        if (!isValidDate(date) || !isValidTime(start) || !isValidTime(end)) {
            return null;
        }
        const id =
            typeof raw.id === 'string' && raw.id.trim() !== ''
                ? raw.id.trim()
                : createId();
        return { id: id, date: date, start: start, end: end };
    }

    function normalizeData(raw) {
        const data = { rate: DEFAULT_RATE, days: [] };
        if (!raw || typeof raw !== 'object') {
            return data;
        }

        const rate = Number(raw.rate);
        if (Number.isFinite(rate) && rate >= 0) {
            data.rate = rate;
        }

        const sourceDays = Array.isArray(raw.days) ? raw.days : [];
        const seenIds = new Set();
        sourceDays.forEach(function (item) {
            const day = normalizeDay(item);
            if (!day || seenIds.has(day.id)) {
                return;
            }
            seenIds.add(day.id);
            data.days.push(day);
        });

        data.days.sort(function (a, b) {
            if (a.date !== b.date) {
                return a.date < b.date ? -1 : 1;
            }
            return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
        });

        return data;
    }

    function load() {
        let raw = null;
        try {
            raw = window.localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return normalizeData(null);
        }
        if (!raw) {
            return normalizeData(null);
        }
        try {
            return normalizeData(JSON.parse(raw));
        } catch (error) {
            return normalizeData(null);
        }
    }

    function save(data) {
        const clean = normalizeData(data);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
            return true;
        } catch (error) {
            return false;
        }
    }

    function startOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function addMonths(date, delta) {
        return new Date(date.getFullYear(), date.getMonth() + delta, 1);
    }

    function formatMonthLabel(date) {
        const name = MONTH_NAMES[date.getMonth()];
        return name.charAt(0).toUpperCase() + name.slice(1) + ' ' + date.getFullYear();
    }

    function renderMonthNav() {
        const label = document.getElementById('month-label');
        if (label) {
            label.textContent = formatMonthLabel(currentMonth);
        }
    }

    function setMonth(delta) {
        currentMonth = addMonths(currentMonth, delta);
        renderMonthNav();
        renderAll();
    }

    function initMonthNav() {
        const prevButton = document.getElementById('btn-prev-month');
        const nextButton = document.getElementById('btn-next-month');
        if (prevButton) {
            prevButton.addEventListener('click', function () {
                setMonth(-1);
            });
        }
        if (nextButton) {
            nextButton.addEventListener('click', function () {
                setMonth(1);
            });
        }
        renderMonthNav();
    }

    function pad2(value) {
        return String(value).padStart(2, '0');
    }

    function dateKey(date) {
        return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
    }

    function parseDateKey(value) {
        const parts = value.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function startOfWeek(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
    }

    function timeToMinutes(value) {
        const parts = value.split(':').map(Number);
        return parts[0] * 60 + parts[1];
    }

    function dayDurationMinutes(day) {
        const start = timeToMinutes(day.start);
        const end = timeToMinutes(day.end);
        const diff = end - start;
        return diff < 0 ? diff + 24 * 60 : diff;
    }

    function formatDuration(minutes) {
        const safe = Math.max(0, Math.round(minutes));
        return Math.floor(safe / 60) + 'h ' + pad2(safe % 60);
    }

    function isSunday(dateStr) {
        return parseDateKey(dateStr).getDay() === 0;
    }

    function dayPay(day, rate) {
        const hours = dayDurationMinutes(day) / 60;
        const multiplier = isSunday(day.date) ? 1 + SUNDAY_BONUS : 1;
        return hours * rate * multiplier;
    }

    function sumDays(days, rate) {
        return days.reduce(
            function (acc, day) {
                acc.minutes += dayDurationMinutes(day);
                acc.pay += dayPay(day, rate);
                acc.count += 1;
                return acc;
            },
            { minutes: 0, pay: 0, count: 0 }
        );
    }

    function monthDays(days, monthDate) {
        const prefix = monthDate.getFullYear() + '-' + pad2(monthDate.getMonth() + 1);
        return days.filter(function (day) {
            return day.date.slice(0, 7) === prefix;
        });
    }

    function computeMonthTotals(days, rate, monthDate) {
        return sumDays(monthDays(days, monthDate), rate);
    }

    function computeCurrentWeekTotals(days, rate) {
        const start = startOfWeek(new Date());
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
        return sumDays(
            days.filter(function (day) {
                const date = parseDateKey(day.date);
                return date >= start && date < end;
            }),
            rate
        );
    }

    function groupDaysByWeek(days) {
        const groups = new Map();
        days.forEach(function (day) {
            const start = dateKey(startOfWeek(parseDateKey(day.date)));
            if (!groups.has(start)) {
                groups.set(start, []);
            }
            groups.get(start).push(day);
        });
        return Array.from(groups, function (entry) {
            return { start: entry[0], days: entry[1] };
        });
    }

    function formatDateFr(dateStr) {
        const date = parseDateKey(dateStr);
        return pad2(date.getDate()) + '/' + pad2(date.getMonth() + 1) + '/' + date.getFullYear();
    }

    function formatMoney(value) {
        return Number(value).toFixed(2).replace('.', ',') + ' €';
    }

    function setText(id, text) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    }

    function createCell(text) {
        const cell = document.createElement('td');
        cell.textContent = text;
        return cell;
    }

    function renderContract(data) {
        const input = document.getElementById('contract-rate');
        if (input) {
            input.value = String(data.rate);
        }
    }

    function initContract() {
        const input = document.getElementById('contract-rate');
        if (!input) {
            return;
        }
        input.addEventListener('change', function () {
            const rate = Number(input.value);
            if (!Number.isFinite(rate) || rate < 0) {
                renderContract(load());
                return;
            }
            const data = load();
            data.rate = rate;
            save(data);
            renderAll();
        });
    }

    function renderCards(data) {
        const monthTotals = computeMonthTotals(data.days, data.rate, currentMonth);
        const weekTotals = computeCurrentWeekTotals(data.days, data.rate);
        setText('card-this-week', formatDuration(weekTotals.minutes));
        setText('card-this-month', formatDuration(monthTotals.minutes));
        setText('card-days', String(monthTotals.count));
        setText('card-salary', formatMoney(monthTotals.pay));
    }

    function createActionButton(label, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn';
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    function renderDays(data) {
        const tbody = document.getElementById('days-tbody');
        if (!tbody) {
            return;
        }
        const days = monthDays(data.days, currentMonth);
        tbody.textContent = '';
        days.forEach(function (day) {
            const row = document.createElement('tr');
            row.appendChild(createCell(formatDateFr(day.date)));
            row.appendChild(createCell(day.start + ' – ' + day.end));
            row.appendChild(createCell(formatDuration(dayDurationMinutes(day))));

            const actions = document.createElement('td');
            actions.className = 'actions-cell';
            actions.appendChild(
                createActionButton('Modifier', function () {
                    openDayModal('edit', day);
                })
            );
            actions.appendChild(
                createActionButton('Copier', function () {
                    openDayModal('copy', day);
                })
            );
            row.appendChild(actions);
            tbody.appendChild(row);
        });

        const empty = document.getElementById('empty-list');
        if (empty) {
            empty.style.display = days.length === 0 ? 'block' : 'none';
        }
    }

    function renderWeeks(data) {
        const container = document.getElementById('weeks-list');
        if (!container) {
            return;
        }
        const days = monthDays(data.days, currentMonth);
        container.textContent = '';

        if (days.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'Aucune journée pour ce mois.';
            message.style.color = 'var(--muted)';
            message.style.margin = '0';
            container.appendChild(message);
            return;
        }

        groupDaysByWeek(days).forEach(function (group) {
            const totals = sumDays(group.days, data.rate);
            const card = document.createElement('article');
            card.className = 'week-card';

            const header = document.createElement('div');
            header.className = 'week-header';
            const title = document.createElement('strong');
            title.textContent = 'Semaine du ' + formatDateFr(group.start);
            const summary = document.createElement('span');
            summary.textContent = formatDuration(totals.minutes) + ' · ' + formatMoney(totals.pay);
            header.appendChild(title);
            header.appendChild(summary);

            const body = document.createElement('div');
            body.className = 'week-body';
            group.days.forEach(function (day) {
                const line = document.createElement('div');
                line.textContent =
                    formatDateFr(day.date) +
                    ' · ' +
                    day.start +
                    ' – ' +
                    day.end +
                    ' · ' +
                    formatDuration(dayDurationMinutes(day));
                body.appendChild(line);
            });

            const totalsLine = document.createElement('div');
            totalsLine.className = 'week-totals';
            totalsLine.textContent =
                'Total : ' +
                formatDuration(totals.minutes) +
                ' · ' +
                totals.count +
                ' jour(s) · ' +
                formatMoney(totals.pay);
            body.appendChild(totalsLine);

            card.appendChild(header);
            card.appendChild(body);
            container.appendChild(card);
        });
    }

    function defaultDayDate() {
        const now = new Date();
        if (now.getFullYear() === currentMonth.getFullYear() && now.getMonth() === currentMonth.getMonth()) {
            return dateKey(now);
        }
        return dateKey(currentMonth);
    }

    function openModal(element) {
        if (element) {
            element.classList.add('active');
        }
    }

    function closeModal(element) {
        if (element) {
            element.classList.remove('active');
        }
    }

    function openDayModal(mode, day) {
        const title = document.getElementById('modal-day-title');
        const dateInput = document.getElementById('day-date');
        const startInput = document.getElementById('day-start');
        const endInput = document.getElementById('day-end');
        const idInput = document.getElementById('day-id');
        const modeInput = document.getElementById('day-mode');
        if (!dateInput || !startInput || !endInput || !idInput || !modeInput) {
            return;
        }

        if (mode === 'edit' && day) {
            dateInput.value = day.date;
            startInput.value = day.start;
            endInput.value = day.end;
            idInput.value = day.id;
            modeInput.value = 'edit';
            if (title) {
                title.textContent = 'Modifier une journée';
            }
        } else if (mode === 'copy' && day) {
            dateInput.value = day.date;
            startInput.value = day.start;
            endInput.value = day.end;
            idInput.value = '';
            modeInput.value = 'add';
            if (title) {
                title.textContent = 'Copier une journée';
            }
        } else {
            dateInput.value = defaultDayDate();
            startInput.value = '';
            endInput.value = '';
            idInput.value = '';
            modeInput.value = 'add';
            if (title) {
                title.textContent = 'Ajouter une journée';
            }
        }

        openModal(document.getElementById('modal-day'));
        if (typeof dateInput.focus === 'function') {
            dateInput.focus();
        }
    }

    function saveDayFromModal() {
        const dateInput = document.getElementById('day-date');
        const startInput = document.getElementById('day-start');
        const endInput = document.getElementById('day-end');
        const idInput = document.getElementById('day-id');
        const modeInput = document.getElementById('day-mode');
        if (!dateInput || !startInput || !endInput || !idInput || !modeInput) {
            return;
        }

        const date = dateInput.value;
        const start = startInput.value;
        const end = endInput.value;
        const id = idInput.value;
        const mode = modeInput.value;

        if (!isValidDate(date) || !isValidTime(start) || !isValidTime(end)) {
            if (typeof window.alert === 'function') {
                window.alert('Veuillez renseigner une date et des horaires valides.');
            }
            return;
        }

        const data = load();
        const day = {
            id: mode === 'edit' && id !== '' ? id : createId(),
            date: date,
            start: start,
            end: end
        };

        let replaced = false;
        if (mode === 'edit' && id !== '') {
            data.days = data.days.map(function (item) {
                if (item.id === id) {
                    replaced = true;
                    return day;
                }
                return item;
            });
        }
        if (!replaced) {
            data.days.push(day);
        }

        save(data);
        closeModal(document.getElementById('modal-day'));
        renderAll();
    }

    function initDayModal() {
        const addButton = document.getElementById('btn-add');
        const saveButton = document.getElementById('modal-day-save');
        const closeButton = document.getElementById('modal-day-close');
        const cancelButton = document.getElementById('modal-day-cancel');
        const modal = document.getElementById('modal-day');

        if (addButton) {
            addButton.addEventListener('click', function () {
                openDayModal('add');
            });
        }
        if (saveButton) {
            saveButton.addEventListener('click', saveDayFromModal);
        }
        if (closeButton) {
            closeButton.addEventListener('click', function () {
                closeModal(modal);
            });
        }
        if (cancelButton) {
            cancelButton.addEventListener('click', function () {
                closeModal(modal);
            });
        }
        if (modal) {
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
        }
    }

    function renderAll() {
        const data = load();
        renderContract(data);
        renderCards(data);
        renderDays(data);
        renderWeeks(data);
    }

    window.BoulangerieStore = {
        STORAGE_KEY: STORAGE_KEY,
        DEFAULT_RATE: DEFAULT_RATE,
        SUNDAY_BONUS: SUNDAY_BONUS,
        createId: createId,
        isValidDate: isValidDate,
        isValidTime: isValidTime,
        normalizeDay: normalizeDay,
        normalizeData: normalizeData,
        load: load,
        save: save
    };

    window.BoulangerieCalc = {
        dateKey: dateKey,
        parseDateKey: parseDateKey,
        startOfWeek: startOfWeek,
        timeToMinutes: timeToMinutes,
        dayDurationMinutes: dayDurationMinutes,
        formatDuration: formatDuration,
        isSunday: isSunday,
        dayPay: dayPay,
        sumDays: sumDays,
        monthDays: monthDays,
        computeMonthTotals: computeMonthTotals,
        computeCurrentWeekTotals: computeCurrentWeekTotals,
        groupDaysByWeek: groupDaysByWeek
    };

    initMonthNav();
    initContract();
    initDayModal();
    renderAll();
})();

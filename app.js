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
})();

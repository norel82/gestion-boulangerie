(function () {
    'use strict';

    const STORAGE_KEY = 'boulangerie_hours';
    const DEFAULT_RATE = 0;
    const SUNDAY_BONUS = 0.2;

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
})();

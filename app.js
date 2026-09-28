document.addEventListener('DOMContentLoaded', () => {
    let events = [
        { id: 101, title: 'Local Authors Meet & Greet', author: 'James Beaufort', category: 'Author Signing', status: 'Upcoming', date: 'Sun, Sep 27, 07:00 PM', seatsTaken: 12, seatsTotal: 40, description: 'Join us for an evening with three local authors discussing contemporary fiction.' },
        { id: 102, title: 'Classic Fiction Discussion Club', author: 'Prof. Atlas Myo', category: 'Book Club', status: 'Sold Out', date: 'Mon, Sep 28, 06:30 PM', seatsTaken: 20, seatsTotal: 20, description: 'In-depth discussion of 20th-century American classics. Tea provided.' }
    ];

    let filterTimeout = null, lastActiveElement = null;

    const searchInput = document.getElementById('search-input'), categorySelect = document.getElementById('category-select'), statusSelect = document.getElementById('status-select');
    const eventsGrid = document.getElementById('events-grid'), emptyNotice = document.getElementById('empty-notice'), loadingBar = document.getElementById('loading-bar'), terminal = document.getElementById('telemetry-terminal');
    const metricTotal = document.getElementById('metric-total'), metricUpcoming = document.getElementById('metric-upcoming'), metricOngoing = document.getElementById('metric-ongoing'), metricRsvps = document.getElementById('metric-rsvps');
    const btnGrid = document.getElementById('btn-grid'), btnList = document.getElementById('btn-list'), btnOpenModal = document.getElementById('btn-open-modal'), btnCloseModal = document.getElementById('btn-close-modal'), btnCancelModal = document.getElementById('btn-cancel-modal'), btnClearConsole = document.getElementById('btn-clear-console');
    const modalOverlay = document.getElementById('modal-overlay'), eventForm = document.getElementById('event-form');

    function sanitize(str) {
        if (typeof str !== 'string') return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function formatDate(isoStr) {
        if (!isoStr) return '';
        const dateObj = new Date(isoStr);
        if (isNaN(dateObj.getTime())) return isoStr;
        return dateObj.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function logTelemetry(message) {
        const timestamp = new Date().toLocaleTimeString();
        const formatted = `[Telemetry] ${message}`;
        console.log(formatted);

        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = `[${timestamp}] ${formatted}`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    function updateMetrics() {
        const total = events.length;
        const upcoming = events.filter(e => e.status === 'Upcoming').length;
        const ongoing = events.filter(e => e.status === 'Ongoing').length;
        const totalRsvps = events.reduce((sum, item) => sum + item.seatsTaken, 0);

        metricTotal.textContent = total;
        metricUpcoming.textContent = upcoming;
        metricOngoing.textContent = ongoing;
        metricRsvps.textContent = totalRsvps;
    }

    function renderEvents() {
        const query = searchInput.value.toLowerCase().trim();
        const selectedCategory = categorySelect.value;
        const selectedStatus = statusSelect.value;

        const filtered = events.filter(item => {
            const matchQuery = item.title.toLowerCase().includes(query) || item.author.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
            const matchCategory = !selectedCategory || item.category === selectedCategory;
            const matchStatus = !selectedStatus || item.status === selectedStatus;
            return matchQuery && matchCategory && matchStatus;
        });

        updateMetrics();
        eventsGrid.innerHTML = '';

        if (filtered.length === 0) {
            emptyNotice.classList.remove('hidden');
            return;
        }

        emptyNotice.classList.add('hidden');

        filtered.forEach(item => {
            const card = document.createElement('article');
            card.className = 'event-card';

            const isSoldOut = item.seatsTaken >= item.seatsTotal || item.status === 'Sold Out';
            const statusBadgeClass = isSoldOut ? 'bg-muted' : 'bg-dark';
            const statusLabel = isSoldOut ? 'SOLD OUT' : item.status.toUpperCase();

            card.innerHTML = `
                <div class="tags-row">
                    <span class="tag-badge ${statusBadgeClass}">${statusLabel}</span>
                    <span class="tag-badge">${item.category}</span>
                </div>
                <h3 class="card-title">${item.title}</h3>
                <p class="card-host">Host: ${item.author}</p>
                <div class="card-details">
                    <p><strong>Date:</strong> ${item.date}</p>
                    <p><strong>Seats:</strong> ${item.seatsTaken} / ${item.seatsTotal}</p>
                </div>
                <p class="card-desc">${item.description}</p>
                <button type="button" class="btn-action ${isSoldOut ? 'disabled-rsvp' : 'active-rsvp'}" data-id="${item.id}" ${isSoldOut ? 'disabled aria-disabled="true"' : ''}>
                    ${isSoldOut ? 'FULLY BOOKED' : 'RSVP SEAT'}
                </button>
            `;

            eventsGrid.appendChild(card);
        });

        eventsGrid.querySelectorAll('.active-rsvp').forEach(btn => {
            btn.addEventListener('click', e => handleRSVP(Number(e.currentTarget.getAttribute('data-id'))));
        });
    }

    function triggerAsyncFilter(actionName) {
        if (filterTimeout) clearTimeout(filterTimeout);

        loadingBar.classList.remove('hidden');
        eventsGrid.classList.add('hidden');
        emptyNotice.classList.add('hidden');

        filterTimeout = setTimeout(() => {
            loadingBar.classList.add('hidden');
            eventsGrid.classList.remove('hidden');
            renderEvents();
            logTelemetry(actionName);
        }, 400);
    }

    function handleRSVP(eventId) {
        loadingBar.classList.remove('hidden');
        eventsGrid.classList.add('hidden');

        setTimeout(() => {
            const target = events.find(e => e.id === eventId);

            if (target && target.seatsTaken < target.seatsTotal) {
                target.seatsTaken += 1;
                if (target.seatsTaken >= target.seatsTotal) target.status = 'Sold Out';
                logTelemetry(`RSVP seat reserved for "${target.title}"`);
            }

            loadingBar.classList.add('hidden');
            eventsGrid.classList.remove('hidden');
            renderEvents();
        }, 300);
    }

    function setFieldError(inputEl, errorEl, hasError) {
        if (hasError) {
            inputEl.classList.add('has-error');
            inputEl.setAttribute('aria-invalid', 'true');
            errorEl.classList.add('active');
        } else {
            inputEl.classList.remove('has-error');
            inputEl.setAttribute('aria-invalid', 'false');
            errorEl.classList.remove('active');
        }
    }

    function resetValidation() {
        const fields = [
            { input: 'form-title', error: 'error-title' },
            { input: 'form-author', error: 'error-author' },
            { input: 'form-category', error: 'error-category' },
            { input: 'form-date', error: 'error-date' },
            { input: 'form-total-seats', error: 'error-seats' },
            { input: 'form-desc', error: 'error-desc' }
        ];

        fields.forEach(f => setFieldError(document.getElementById(f.input), document.getElementById(f.error), false));
    }

    function openModal() {
        lastActiveElement = document.activeElement;
        modalOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        document.getElementById('form-title').focus();
        logTelemetry('Opened Host Event dialog modal');
    }

    function closeModal() {
        modalOverlay.classList.add('hidden');
        document.body.style.overflow = '';
        eventForm.reset();
        resetValidation();

        if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
            lastActiveElement.focus();
        }
    }

    eventForm.addEventListener('submit', e => {
        e.preventDefault();
        resetValidation();

        const titleEl = document.getElementById('form-title');
        const authorEl = document.getElementById('form-author');
        const categoryEl = document.getElementById('form-category');
        const dateEl = document.getElementById('form-date');
        const seatsEl = document.getElementById('form-total-seats');
        const descEl = document.getElementById('form-desc');

        let valid = true;

        if (!titleEl.value.trim()) {
            setFieldError(titleEl, document.getElementById('error-title'), true);
            valid = false;
        }

        if (!authorEl.value.trim()) {
            setFieldError(authorEl, document.getElementById('error-author'), true);
            valid = false;
        }

        if (!categoryEl.value) {
            setFieldError(categoryEl, document.getElementById('error-category'), true);
            valid = false;
        }

        const selectedDate = new Date(dateEl.value);

        if (!dateEl.value || isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
            setFieldError(dateEl, document.getElementById('error-date'), true);
            valid = false;
        }

        const rawSeats = seatsEl.value.trim();
        const seatsNum = Number(rawSeats);
        const isIntegerString = /^[1-9]\d*$/.test(rawSeats);

        if (!rawSeats || !isIntegerString || seatsNum <= 0 || !Number.isInteger(seatsNum)) {
            setFieldError(seatsEl, document.getElementById('error-seats'), true);
            valid = false;
        }

        if (!descEl.value.trim()) {
            setFieldError(descEl, document.getElementById('error-desc'), true);
            valid = false;
        }

        if (!valid) return;

        const newEvent = {
            id: Date.now(),
            title: sanitize(titleEl.value.trim()),
            author: sanitize(authorEl.value.trim()),
            category: sanitize(categoryEl.value),
            status: sanitize(document.getElementById('form-status').value),
            date: formatDate(dateEl.value),
            seatsTaken: 0,
            seatsTotal: parseInt(seatsEl.value, 10),
            description: sanitize(descEl.value.trim())
        };

        events.unshift(newEvent);
        closeModal();
        triggerAsyncFilter(`Created event "${newEvent.title}"`);
    });

    searchInput.addEventListener('input', () => triggerAsyncFilter('Search filter modified'));
    categorySelect.addEventListener('change', () => triggerAsyncFilter('Category filter changed'));
    statusSelect.addEventListener('change', () => triggerAsyncFilter('Status filter changed'));

    btnGrid.addEventListener('click', () => {
        eventsGrid.classList.remove('list-view');
        btnGrid.classList.add('active');
        btnGrid.setAttribute('aria-pressed', 'true');
        btnList.classList.remove('active');
        btnList.setAttribute('aria-pressed', 'false');
        logTelemetry('Switched to Grid view');
    });

    btnList.addEventListener('click', () => {
        eventsGrid.classList.add('list-view');
        btnList.classList.add('active');
        btnList.setAttribute('aria-pressed', 'true');
        btnGrid.classList.remove('active');
        btnGrid.setAttribute('aria-pressed', 'false');
        logTelemetry('Switched to List view');
    });

    btnOpenModal.addEventListener('click', openModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    btnClearConsole.addEventListener('click', () => {
        terminal.innerHTML = '';
    });

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) closeModal();
    });

    modalOverlay.addEventListener('keydown', e => {
        if (e.key !== 'Tab' || modalOverlay.classList.contains('hidden')) return;

        const focusableElements = modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    });

    renderEvents();
    logTelemetry('System initialized');
});

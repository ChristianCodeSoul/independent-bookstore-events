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

    function formatDate(value) {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        return date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function logTelemetry(message) {
        const time = new Date().toLocaleTimeString();
        const text = `[Telemetry] ${message}`;
        console.log(text);

        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = `[${time}] ${text}`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
    }

    function updateMetrics() {
        metricTotal.textContent = events.length;
        metricUpcoming.textContent = events.filter(e => e.status === 'Upcoming').length;
        metricOngoing.textContent = events.filter(e => e.status === 'Ongoing').length;
        metricRsvps.textContent = events.reduce((total, event) => total + event.seatsTaken, 0);
    }

    function renderEvents() {
        const query = searchInput.value.toLowerCase().trim(), category = categorySelect.value, status = statusSelect.value;

        const filtered = events.filter(event => {
            const matchesSearch = event.title.toLowerCase().includes(query) || event.author.toLowerCase().includes(query) || event.description.toLowerCase().includes(query);
            return matchesSearch && (!category || event.category === category) && (!status || event.status === status);
        });

        updateMetrics();
        eventsGrid.innerHTML = '';

        if (!filtered.length) {
            emptyNotice.classList.remove('hidden');
            return;
        }

        emptyNotice.classList.add('hidden');

        filtered.forEach(event => {
            const card = document.createElement('article');
            card.className = 'event-card';

            const soldOut = event.seatsTaken >= event.seatsTotal || event.status === 'Sold Out';
            const badgeClass = soldOut ? 'bg-muted' : 'bg-dark';
            const badgeText = soldOut ? 'SOLD OUT' : event.status.toUpperCase();

            card.innerHTML = `
                <div class="tags-row">
                    <span class="tag-badge ${badgeClass}">${event.category}</span>
                    <span class="tag-badge ${badgeClass}">${badgeText}</span>
                </div>
                <h3 class="card-title">${event.title}</h3>
                <p class="card-host">Host: ${event.author}</p>
                <div class="card-details">
                    <p><strong>Date:</strong> ${event.date}</p>
                    <p><strong>Seats:</strong> ${event.seatsTaken} / ${event.seatsTotal}</p>
                </div>
                <p class="card-desc">${event.description}</p>
                <button type="button" class="btn-action ${soldOut ? 'disabled-rsvp' : 'active-rsvp'}" data-id="${event.id}" ${soldOut ? 'disabled aria-disabled="true"' : ''}>${soldOut ? 'FULLY BOOKED' : 'RSVP SEAT'}</button>
            `;

            eventsGrid.appendChild(card);
        });

        eventsGrid.querySelectorAll('.active-rsvp').forEach(button => {
            button.addEventListener('click', e => handleRSVP(Number(e.currentTarget.dataset.id)));
        });
    }

    function triggerAsyncFilter(message) {
        if (filterTimeout) clearTimeout(filterTimeout);

        loadingBar.classList.remove('hidden');
        eventsGrid.classList.add('hidden');
        emptyNotice.classList.add('hidden');

        filterTimeout = setTimeout(() => {
            loadingBar.classList.add('hidden');
            eventsGrid.classList.remove('hidden');
            renderEvents();
            logTelemetry(message);
        }, 400);
    }

    function handleRSVP(eventId) {
        loadingBar.classList.remove('hidden');
        eventsGrid.classList.add('hidden');

        setTimeout(() => {
            const event = events.find(item => item.id === eventId);

            if (event && event.seatsTaken < event.seatsTotal) {
                event.seatsTaken++;
                if (event.seatsTaken >= event.seatsTotal) event.status = 'Sold Out';
                logTelemetry(`RSVP seat reserved for "${event.title}"`);
            }

            loadingBar.classList.add('hidden');
            eventsGrid.classList.remove('hidden');
            renderEvents();
        }, 300);
    }

    function setFieldError(input, error, hasError) {
        input.classList.toggle('has-error', hasError);
        error.classList.toggle('active', hasError);
        input.setAttribute('aria-invalid', String(hasError));
    }

    function resetValidation() {
        const fields = [
            ['form-title', 'error-title'],
            ['form-author', 'error-author'],
            ['form-category', 'error-category'],
            ['form-date', 'error-date'],
            ['form-total-seats', 'error-seats'],
            ['form-desc', 'error-desc']
        ];

        fields.forEach(([inputId, errorId]) => setFieldError(document.getElementById(inputId), document.getElementById(errorId), false));
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

        if (lastActiveElement && typeof lastActiveElement.focus === 'function') lastActiveElement.focus();
    }

    eventForm.addEventListener('submit', e => {
        e.preventDefault();
        resetValidation();

        const title = document.getElementById('form-title'), author = document.getElementById('form-author'), category = document.getElementById('form-category');
        const date = document.getElementById('form-date'), seats = document.getElementById('form-total-seats'), description = document.getElementById('form-desc');
        const status = document.getElementById('form-status');
        let valid = true;

        if (!title.value.trim()) {
            setFieldError(title, document.getElementById('error-title'), true);
            valid = false;
        }

        if (!author.value.trim()) {
            setFieldError(author, document.getElementById('error-author'), true);
            valid = false;
        }

        if (!category.value) {
            setFieldError(category, document.getElementById('error-category'), true);
            valid = false;
        }

        const selectedDate = new Date(date.value);

        if (!date.value || isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
            setFieldError(date, document.getElementById('error-date'), true);
            valid = false;
        }

        const seatValue = seats.value.trim(), seatNumber = Number(seatValue);

        if (!/^[1-9]\d*$/.test(seatValue) || !Number.isInteger(seatNumber)) {
            setFieldError(seats, document.getElementById('error-seats'), true);
            valid = false;
        }

        if (!description.value.trim()) {
            setFieldError(description, document.getElementById('error-desc'), true);
            valid = false;
        }

        if (!valid) return;

        const newEvent = {
            id: Date.now(),
            title: sanitize(title.value.trim()),
            author: sanitize(author.value.trim()),
            category: sanitize(category.value),
            status: sanitize(status.value),
            date: formatDate(date.value),
            seatsTaken: 0,
            seatsTotal: seatNumber,
            description: sanitize(description.value.trim())
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

        const focusable = modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0], last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            last.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
        }
    });

    renderEvents();
    logTelemetry('System initialized');
});

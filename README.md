
# Independent Bookstore Events Portal

A zero dependency event management interface for bookstore floor staff. Replaces paper logs and spreadsheets with a single-page app to track readings, book clubs, workshops, and RSVPs.

## Overview

This repository addresses Ticket `ENG-18072`. It provides a responsive, accessible dashboard where staff can log new events, track capacity, filter listings, and handle patron seat reservations in real time.

## Key Features

- **Event Catalog**: Grid and list layout options displaying real-time event status, capacity, and seat counts.
- **Search & Filters**: Instant text search across titles and authors, paired with category and status dropdowns.
- **Publishing & RSVPs**: Modal workflows for hosting new events and reserving patron seats with remaining-seat validation.
- **Validation & Security**: Client-side field checks with explicit error states, plus HTML sanitization to block XSS injection.
- **Offline / Low-Bandwidth Handling**: Built-in loading states and simulated latency for unstable 3G connections.
- **Telemetry Console**: Logs user actions to an on-page console and browser console for analytics tracking.
- **Accessibility (a11y)**: Built with semantic HTML5, skip navigation, keyboard focus management, ARIA labels, and 44px minimum touch targets.
- **Monochromatic UI**: Pure CSS implementation using a strict black-and-white theme across desktop, tablet, and mobile views.

## Tech Stack

- **HTML5**: Semantic tags, forms, and ARIA landmark roles.
- **CSS3**: Modern vanilla CSS using variables, Flexbox, Grid, and media query breakpoints.
- **JavaScript (ES6+)**: Vanilla DOM management, in-memory state, event handling, and input sanitization.

## Project Structure

```text
independent Bookstore Events/
  ─ index.html
  ─ styles.css
  ─ app.js
  ─ README.md
```

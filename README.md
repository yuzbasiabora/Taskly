# Taskly

## Description

Taskly is a browser-based task management web application built using HTML, CSS, and JavaScript.
It lets users create, organize, prioritize, and track their daily tasks entirely in the browser — no server, no backend, and no account needed.
I built it to apply what I learned in Web Application Development in a real, useful project that combines DOM manipulation, dynamic UI rendering, and local data persistence.

## Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla, no frameworks)

## Features

- Add tasks with a custom title (up to 120 characters)
- Set task priority: Low, Medium, or High
- Assign a category: Work, Personal, School, Health, or Other
- Assign due dates to tasks
- Add optional notes to any task
- Mark tasks as complete (with confetti animation)
- Delete individual tasks
- Edit any task via a modal popup (text, priority, category, due date, notes)
- Filter tasks: All, Active, Done, High Priority, Overdue, Today
- Live search — filter tasks by keyword as you type
- Sort tasks: Default, Priority, Due Date, A-Z, Newest First
- Drag-and-drop to reorder tasks
- Task statistics bar: Total, Active, Done, Overdue counts
- Completion progress bar showing percentage of tasks done
- Overdue and "Today" visual warnings on due dates
- Toast notifications for add, edit, delete, complete actions
- Clear All button with confirmation dialog
- Dark mode toggle (persisted across sessions)
- Fully responsive layout for desktop and mobile
- All data persisted in localStorage — tasks survive page refresh

## How to Run

- Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
- No server setup required
- No dependencies to install
- All data is saved automatically in your browser via localStorage

## Project Structure

```
taskly/
├── index.html    # App structure, layout, and modal markup
├── style.css     # All styling, dark mode, animations, responsive design
└── script.js     # Task logic, rendering, filters, sorting, search, drag-drop, localStorage
```

## Team Members

- Bora Yuzbasi — Full project: HTML structure, CSS design, JavaScript functionality

## Challenges & Learning

- Getting drag-and-drop to work smoothly with dynamic elements required careful event handling across dragstart, dragover, and drop events on dynamically rendered DOM nodes
- Managing localStorage correctly so the app state always matches what is rendered took careful iteration
- Building dark mode using CSS custom properties made switching themes as simple as toggling one class on the body
- The confetti animation using a canvas element was built from scratch using requestAnimationFrame
- Implementing live search alongside filter and sort required carefully composing all three in one getFiltered function

## Future Improvements

- Add user authentication so each user has their own private task list stored on a server
- Replace localStorage with a cloud database (e.g. Firebase or MongoDB) for cross-device sync
- Add collaborative shared lists where multiple users can assign tasks to each other
- Implement push notifications or email reminders for upcoming due dates
- Build an analytics dashboard showing productivity trends over time
- Convert to a Progressive Web App (PWA) for offline mobile support

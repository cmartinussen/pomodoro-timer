# Pomodoro Timer

A Japanese-inspired Pomodoro countdown clock built with HTML, CSS, and JavaScript.

## Features

- 25-minute work sessions
- 5-minute short breaks after each work session
- 15-minute long breaks after every 4 work sessions
- Automatic switching between work and break sessions
- Start, pause, and reset functionality
- Dark mode toggle
- Browser notifications when sessions end
- Japanese-inspired design with clean aesthetics
- Event logging for session tracking

## Development Setup

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pomodoro-timer.git
   cd pomodoro-timer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

1. Start a local development server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to `http://localhost:8080`

### Testing

Run the test suite:
```bash
npm test
```

The tests verify core functionality including timer logic, session switching, and UI updates.

## Deployment

This project is configured for automatic deployment to GitHub Pages:

1. Push your code to the `main` branch
2. GitHub Actions will automatically run tests and deploy to GitHub Pages
3. Your site will be available at `https://yourusername.github.io/pomodoro-timer/`

## Usage

1. Open the app in your web browser
2. Click "Start" to begin the timer
3. Click "Pause" to pause the timer
4. Click "Reset" to reset to a new work session
5. Click the moon/sun icon to toggle dark mode
6. The timer will automatically switch between work and break sessions
7. After 4 completed work sessions, you'll get a long break

## Session Flow

- **Work Session**: 25 minutes of focused work
- **Short Break**: 5 minutes after each work session
- **Long Break**: 15 minutes after every 4 work sessions

The app displays the current session and what's coming next to make the flow intuitive.

## Browser Notifications

The app will request permission to show notifications when sessions end. If denied, it will fall back to browser alerts.

## Dark Mode

Toggle between light and dark modes using the button in the top-right corner. Your preference is saved locally.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
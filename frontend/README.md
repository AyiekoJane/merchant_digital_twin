# Merchant Digital Twin Simulation Platform - Frontend

A clean, architecture-aligned control interface for the Merchant Digital Twin simulation system.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3001`

## Prerequisites

- Node.js 16+ and npm
- Backend services running on `http://localhost:3000`

## Application Structure

### Pages

1. **Dashboard** - Real-time insights & scenario comparison
2. **Simulation Console** - Core simulation control interface
3. **Live Insights** - Real-time monitoring & agent status
4. **Scenario Testing** - Virtual flow experimentation
5. **Settings** - Configuration & defaults

### Workflow

```
1. Upload CSV data (Simulation Console)
2. Configure simulation parameters
3. Select channel (Web/USSD/App)
4. Run simulation
5. Monitor live insights
6. Analyze results (Dashboard)
7. Compare scenarios
8. Test alternative flows (Scenario Testing)
```

## Features

✅ CSV upload for merchant data
✅ Channel selection (Web, USSD, App)
✅ Real-time simulation monitoring
✅ Live agent status tracking
✅ Scenario comparison
✅ Virtual flow experimentation
✅ Performance analytics
✅ Network & literacy breakdowns

## API Integration

The frontend connects to the backend middleware at `http://localhost:3000`:

- `POST /merchants/upload` - Upload CSV data
- `POST /simulate/channel` - Start simulation
- `GET /insights/summary` - Fetch metrics
- `GET /insights/compare` - Compare scenarios
- `GET /channels` - Get available channels

## Component Architecture

```
/src
├── App.js                    # Main application
├── components/
│   ├── Dashboard.js          # Insights & comparison
│   ├── SimulationConsole.js  # Control interface
│   ├── LiveInsights.js       # Real-time monitoring
│   ├── ScenarioTesting.js    # Virtual testing
│   ├── Settings.js           # Configuration
│   ├── simulation/           # Simulation components
│   │   ├── CSVUploader.js
│   │   ├── ChannelSelector.js
│   │   ├── UrlInput.js
│   │   ├── SimulationControls.js
│   │   └── RunSimulationButton.js
│   └── insights/             # Insights components
│       ├── MetricsPanel.js
│       ├── LiveLogs.js
│       └── AgentStatusGrid.js
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Configuration

Default settings can be modified in the Settings page:

- Backend API URL (default: `http://localhost:3000`)
- Default merchant count (default: 5)
- Default simulation speed (default: normal)

## Troubleshooting

### Backend Connection Failed

Ensure backend services are running:
```bash
cd backend
npm start
```

### CSV Upload Failed

- Check file format (must be .csv)
- Ensure backend is running
- Check browser console for errors

### No Simulation Data

- Upload merchant CSV first
- Run a simulation from Simulation Console
- Wait for agents to complete execution

## Documentation

- `ARCHITECTURE.md` - Complete architecture documentation
- `MIGRATION_SUMMARY.md` - Restructuring details
- Component JSDoc comments

## Support

For issues or questions, check:
1. Backend service logs
2. Browser console errors
3. Network tab in DevTools
4. API endpoint responses

## License

Proprietary - Merchant Digital Twin Simulation Platform

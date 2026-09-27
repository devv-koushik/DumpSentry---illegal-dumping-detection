# DumpSentry — AI-Powered Illegal Dumping Detection Platform

A production-quality **frontend-only** React application for an AI/drone-based
illegal dumping detection and monitoring platform. Upload drone imagery, view
mock AI detection results, monitor incidents on a map, and track the
authority-notification workflow — all backed by realistic mock data so the
UI is fully functional before any real backend, AI model, or drone exists.

> **This is a frontend prototype.** There is no real backend, no database, no
> live AI model, and no real email/drone integration. Every data-fetching
> function in `src/services/` simulates network latency and returns
> realistic mock data, structured so a real API can be swapped in later
> without touching any component.

## Terminology note

The UI never claims an image alone proves illegal dumping. Detections are
labelled **"Suspected Illegal Dumping"**, **"Requires Verification"**, or
**"Pending Review"**, and every incident requires a human "Verify Detection"
step before it's treated as confirmed.

---

## Features

- **Landing page** — Hero, Problem, How It Works, AI Detection Preview,
  Authority Routing, Statistics, CTA, and Footer sections.
- **Dashboard Overview** — stat cards, detection trend chart, waste-category
  chart, detection map, recent detections, and recent alerts.
- **Detections** — filterable/searchable grid or table view of all
  detections (status, context, waste type, free-text search).
- **Detection Details** — original + AI-annotated image, classification,
  GPS coordinates, timestamp, responsible authority, and actions (Verify
  Detection, Send Alert, Mark Resolved).
- **Upload & Analyze** — drag-and-drop upload with a simulated multi-stage
  AI pipeline (Uploading → Analyzing → Detecting Waste → Classifying
  Context → Assigning Authority → Complete).
- **Map** — full-page Leaflet/OpenStreetMap view with status-colored
  markers, popups, status filters, and location search.
- **Alerts** — authority notification table with mock "Send Alert" action,
  plus the context → authority reference cards.
- **Analytics** — detection trend, waste categories, incident status,
  context distribution, and authority alert summary (Recharts).
- **Settings** — Profile, Notifications, Authority Configuration, AI
  Configuration, and System Preferences (mock only).
- Responsive throughout: collapsible sidebar on tablet, hamburger menu on
  mobile, full-width dashboard on desktop.
- Subtle Framer Motion animations on page/card entrances.

## Tech stack

| Purpose        | Library                          |
|-----------------|-----------------------------------|
| Build tool      | Vite                              |
| UI framework    | React 19                          |
| Routing         | react-router-dom                  |
| Styling         | Tailwind CSS                      |
| Animation       | Framer Motion                     |
| Icons           | lucide-react                      |
| Charts          | Recharts                          |
| Map             | Leaflet + react-leaflet (OpenStreetMap tiles) |

## Project structure

```
src/
  components/      Reusable UI: Navbar, Sidebar, StatCard, DetectionCard,
                    DetectionTable, DetectionStatus, ConfidenceBadge,
                    AlertTable, MapView, UploadZone, AIAnalysisProgress,
                    AuthorityBadge, PageHeader, EmptyState, LoadingSpinner,
                    LandingNav
  layouts/
    DashboardLayout.jsx   Sidebar + top nav shell for all /dashboard/* routes
  pages/
    Landing.jsx, Dashboard.jsx, Detections.jsx, DetectionDetails.jsx,
    UploadAnalyze.jsx, MapPage.jsx, Alerts.jsx, Analytics.jsx, Settings.jsx
  services/
    mockAI.js          analyzeImage(image, onProgress) — simulated CV pipeline
    mockAlerts.js       fetchAlerts(), sendAlert(detectionId)
    mockDetections.js   fetchDetections(filters), fetchDetectionById(id),
                        updateDetectionStatus(id, status),
                        updateAlertStatus(id, alertStatus)
  data/
    detections.js       18 mock detection records + chart datasets
    authorities.js      context → authority/email mapping
  App.jsx               Route definitions
  main.jsx               React entry point
  index.css               Tailwind directives + shared utility classes
```

## Installation

Requires Node.js 18+.

```bash
npm install
```

## How to run

```bash
npm start
```

(`npm start` and `npm run dev` are equivalent — both launch the Vite dev
server, printed at `http://localhost:5173` by default.)

Build for production:

```bash
npm run build
npm run preview   # serve the production build locally
```

## How to add the drone video

The current landing hero uses a CSS/SVG "patrol map" illustration instead of
a stock video, so no video asset is required to run the project. To use a
real drone clip instead:

1. Place your file at `src/assets/drone-dumping.mp4`.
2. In `src/pages/Landing.jsx`, replace the `motion.div` hero-media block
   with a `<video autoPlay muted loop playsInline>` element that imports and
   points to that asset, e.g.:

   ```jsx
   import droneVideo from "../assets/drone-dumping.mp4";
   // ...
   <video autoPlay muted loop playsInline className="h-full w-full object-cover">
     <source src={droneVideo} type="video/mp4" />
   </video>
   ```

## How to replace mock AI with a real API

All AI logic is isolated in `src/services/mockAI.js`. Replace the body of
`analyzeImage(image, onProgress)` with a real call to your inference
endpoint, keeping the same return shape:

```js
export async function analyzeImage(image, onProgress) {
  const formData = new FormData();
  formData.append("image", image);

  onProgress(0, "Uploading");
  const res = await fetch("https://your-api.example.com/v1/analyze", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  // Map your API's response into the shape components expect:
  return {
    wasteDetected: data.wasteDetected,
    wasteType: data.wasteType,
    context: data.context,
    confidence: data.confidence,
    status: data.status,
    boundingBoxes: data.boundingBoxes,
    authority: data.authority,
    authorityEmail: data.authorityEmail,
    analyzedAt: new Date().toISOString(),
  };
}
```

No component needs to change — `UploadAnalyze.jsx` only calls this function.

## How to replace mock alerts with a real email service

`src/services/mockAlerts.js` exports `fetchAlerts()` and
`sendAlert(detectionId)`. Point `sendAlert` at your real notification
endpoint (e.g. an internal API that wraps SendGrid/SES, or a webhook):

```js
export async function sendAlert(detectionId) {
  const res = await fetch(`/api/alerts/${detectionId}/send`, { method: "POST" });
  if (!res.ok) throw new Error("Alert dispatch failed");
  return res.json();
}
```

`fetchAlerts()` should similarly call your real alerts endpoint instead of
reading from the in-memory mock log.

## How to connect the frontend to a real backend

1. Add an environment variable for your API base URL, e.g. in `.env`:
   ```
   VITE_API_BASE_URL=https://api.dumpsentry.example.com
   ```
2. In each `src/services/*.js` file, replace the mock `delay()` +
   in-memory-array logic with `fetch(`${import.meta.env.VITE_API_BASE_URL}/...`)`
   calls, keeping each function's return shape identical to what it returns
   today — every component only depends on that shape, not on how the data
   is fetched.
3. For live drone telemetry / GPS, feed real coordinates into the same
   `latitude`/`longitude`/`location` fields already used throughout
   `MapView.jsx` and the detection detail pages.
4. Swap `src/data/authorities.js` for a real authority-directory API call
   if authority contacts should be centrally managed rather than
   hardcoded/configured in Settings.

No routing, layout, or component code needs to change for any of the above —
the mock service layer was written specifically to be a drop-in replacement
boundary.

## Notes

- All drone imagery in this demo is placeholder photography (Picsum), not
  real dumping-site photos.
- Locations are realistic Kolkata-area place names used for demonstration
  only — they do not represent real reported incidents.
- Map tiles are served from the public OpenStreetMap tile server, which is
  fine for development but should be replaced with a properly licensed tile
  provider for production traffic.

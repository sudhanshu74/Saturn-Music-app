# Saturn Music 🪐

A production-grade, full-stack music streaming platform engineered for performance, security, and a seamless cross-device user experience. 

Saturn Music features a Spotify-inspired responsive UI, global state audio management, and an advanced enterprise-grade authentication pipeline.

## 🚀 Key Features

* **Enterprise-Grade Security:** Implements a stateless dual-token JWT architecture (short-lived access, httpOnly secure refresh). Includes a custom Axios/Fetch interceptor for silent background token rotation without disrupting the user experience.
* **Proactive Anomaly Alerts:** Integrated with the Brevo API to handle secure OTP password resets and asynchronous background tracking to alert users of unrecognized logins via email.
* **High-Speed Caching:** Utilizes Redis to cache external iTunes API search queries and mathematically generated personalized "Daily Mixes," significantly reducing server latency and rate-limiting bottlenecks.
* **Global Audio State:** Built a custom audio player utilizing the React Context API. Users can navigate pages, search for tracks, and curate playlists without interrupting background audio playback.
* **Flawless Mobile Web Experience:** Engineered a responsive layout using Tailwind CSS with specific fixes for iOS Safari dynamic viewport (`100vh`) shifts, delivering a stable, native-app feel on mobile browsers.

## 🛠️ Tech Stack

**Frontend:**
* React.js
* Tailwind CSS
* Context API (State Management)

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose
* Redis (Caching Layer)
* JWT (Authentication)
* bcryptjs (Password Hashing)

**External APIs & Services:**
* iTunes Search API
* Brevo API (Transactional Emails)


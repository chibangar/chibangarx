import ReactDOM from "react-dom/client"
import App from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import { HashRouter } from "react-router-dom"
import { PostHogProvider } from "posthog-js/react"
import "./i18n/i18n"
import { AmbientMusicProvider } from "./components/AmbientMusicProvider"

const rootElement = document.getElementById("root")
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // <React.StrictMode>
    <PostHogProvider
      apiKey="phc_4vF2nxwQK17nl5wIQ4sT8UJae8iHZmsjGkPxgyQJhZo"
      options={{
        api_host: "https://us.i.posthog.com",
        capture_exceptions: true,
        debug: import.meta.env.MODE === "development",
      }}
    >
      <HashRouter>
        <ErrorBoundary>
          <AmbientMusicProvider>
            <App />
          </AmbientMusicProvider>
        </ErrorBoundary>
      </HashRouter>
    </PostHogProvider>,
    // </React.StrictMode>
  )
}

import React, { Component, type ReactNode } from "react"
import log from "electron-log/renderer"
import { invoke } from "../lib/electron"
import Button from "./ui/button"
import TitleBar from "./titlebar"

const GITHUB_ISSUES = "https://github.com/chibangar/chibangarx/issues"
const DISCORD_INVITE = "https://discord.gg/4hbRUfXxR"

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error("React Error Boundary caught an error:", error, errorInfo)
  }

  handleOpenLogFolder = async () => {
    await invoke({ channel: "open-log-folder" })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const errorMessage =
        this.state.error instanceof Error ? this.state.error.message : String(this.state.error)
      const errorStack = this.state.error instanceof Error ? this.state.error.stack : undefined

      return (
        <div className="flex flex-col h-screen bg-chibangarx-bg text-chibangarx-text items-center justify-center p-8">
          {/* @ts-expect-error */}
          <TitleBar />
          <div className="max-w-xl w-full rounded-2xl border border-chibangarx-border bg-chibangarx-card p-8">
            <h1 className="text-2xl font-semibold text-red-500 mb-2">Ocorreu um erro</h1>
            <p className="text-chibangarx-text-secondary mb-4">
              O ChibangaRx encontrou um erro inesperado. Ajude-nos a corrigi-lo ao reportar este
              problema.
            </p>
            <pre className="mb-6 p-4 rounded-lg bg-chibangarx-accent text-xs text-chibangarx-text overflow-x-auto overflow-y-auto max-h-40 border border-chibangarx-border select-all">
              {errorMessage}
              {errorStack && `\n\n${errorStack}`}
            </pre>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="primary" onClick={this.handleOpenLogFolder} size="md">
                Abrir pasta de registos
              </Button>
              <Button variant="secondary" onClick={this.handleRetry} size="md">
                Tentar novamente
              </Button>
            </div>
            <p className="text-sm text-chibangarx-text-muted">
                Crie um{" "}
              <a
                href={GITHUB_ISSUES}
                target="_blank"
                rel="noopener noreferrer"
                className="text-chibangarx-primary hover:underline"
              >
                problema no GitHub
              </a>{" "}
                ou partilhe o erro e o ficheiro de registo no nosso{" "}
              <a
                href={DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-chibangarx-primary hover:underline"
              >
                Discord
              </a>{" "}
                para podermos corrigi-lo.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

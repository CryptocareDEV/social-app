import React from "react"

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error("React crash caught by ErrorBoundary:", error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "#f8fafc",
            color: "#111827",
            padding: 40,
            textAlign: "center",
          }}
        >
          <h2>Something went wrong.</h2>
          <p style={{ marginTop: 12, opacity: 0.7 }}>
            The app encountered an unexpected error.
          </p>

          <button
            onClick={this.handleReload}
            style={{
              marginTop: 20,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#111827",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

import React from 'react'

class ErrorBoundary extends React.Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false }
  }

  // eslint-disable-next-line handle-callback-err
  componentDidCatch (error, info) {
    // Display fallback UI
    this.setState({ hasError: true })
    // You can also log the error to an error reporting service
    console.error(error, info)
  }

  render () {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }
}

export default ErrorBoundary
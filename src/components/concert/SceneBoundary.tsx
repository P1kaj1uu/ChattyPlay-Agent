import { Component, type ReactNode } from 'react'

export default class SceneBoundary extends Component<
  {
    children: ReactNode
    onMap: () => void
  },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed)
      return (
        <div className="stadium-fallback" role="alert">
          <strong>3D 组件暂时未能加载</strong>
          <p>你可以继续使用座位图选择位置。</p>
          <button className="primary-button" onClick={this.props.onMap}>
            使用 2D 座位图
          </button>
        </div>
      )
    return this.props.children
  }
}

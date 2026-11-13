import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface State {
  error: Error | null
}

/** Bắt lỗi hiển thị để trang không bị trắng; cho phép xóa bản lưu cũ và tải lại. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error', error, info.componentStack)
  }

  private reset = () => {
    try {
      localStorage.removeItem('market-snapshot-v1')
      localStorage.removeItem('market-snapshot-v2')
    } catch {
      // bỏ qua
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0a0f1f] p-6">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="font-display text-xl font-semibold text-white">Trang gặp lỗi hiển thị</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">Dữ liệu đã lưu có thể không còn khớp phiên bản mới. Bấm nút bên dưới để xóa bản lưu và tải lại.</p>
          <p className="mt-3 break-words rounded-xl bg-black/30 p-3 text-left font-mono text-xs text-rose-300">{this.state.error.message}</p>
          <button type="button" onClick={this.reset} className="mt-5 min-h-[44px] rounded-xl bg-sky-200 px-6 text-sm font-semibold text-slate-900 hover:bg-sky-100">
            Tải lại dữ liệu
          </button>
        </div>
      </div>
    )
  }
}

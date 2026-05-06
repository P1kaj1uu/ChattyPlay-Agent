/**
 * LaTeX 编译 API 服务
 * 通过本地代理调用第三方在线 API 编译 LaTeX 代码，返回 PDF Blob
 */

export interface CompileOptions {
  code: string
  compiler?: 'xelatex' | 'pdflatex' | 'lualatex'
  timeout?: number
  files?: Array<{
    name: string
    content: string  // base64 编码的文件内容
  }>
}

export interface CompileResult {
  success: boolean
  pdfBlob?: Blob
  error?: string
}

/**
 * 编译 LaTeX 代码
 * @param options.code - LaTeX 源代码
 * @param options.compiler - LaTeX 编译器 (xelatex, pdflatex, lualatex)，默认 xelatex（推荐用于中文）
 * @param options.timeout - 超时时间（毫秒），默认 60000
 * @param options.files - 附加文件（如图片），格式为 [{ name: 'image.png', content: 'base64...' }]
 */
export async function compileLatex({ code, compiler = 'xelatex', timeout = 60000, files = [] }: CompileOptions): Promise<CompileResult> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // 使用本地代理 API
    const response = await fetch('/api/latex/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, compiler, files }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const contentType = response.headers.get('content-type') || ''

    // PDF 响应
    if (contentType.includes('application/pdf')) {
      const pdfBlob = await response.blob()
      return {
        success: true,
        pdfBlob,
      }
    }

    // 非 PDF 响应，解析错误信息
    if (!response.ok) {
      let errorMsg = `编译失败: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.error) errorMsg = errorData.error
        if (errorData.message) errorMsg = errorData.message
      } catch { /* ignore parse error */ }
      return {
        success: false,
        error: errorMsg,
      }
    }

    // 未知响应类型
    return {
      success: false,
      error: '编译失败，服务器返回了非 PDF 内容',
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: '编译超时，请稍后重试',
        }
      }
      return {
        success: false,
        error: `编译请求失败: ${err.message}`,
      }
    }
    return {
      success: false,
      error: '编译请求失败，未知错误',
    }
  }
}

/**
 * 检查 LaTeX API 是否可用（通过本地代理）
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch('/api/latex/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

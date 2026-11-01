import { ReactNode, useEffect, useId, useRef } from 'react'
import { FiX } from 'react-icons/fi'

let scrollLocks = 0
let previousOverflow = ''
export function lockConcertScroll() {
  if (!scrollLocks++) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  return () => {
    if (--scrollLocks === 0) document.body.style.overflow = previousOverflow
  }
}

export default function Dialog({
  title,
  children,
  onClose,
  wide = false,
  settings = false
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
  settings?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  const startedOutside = useRef(false)
  const titleId = useId()
  close.current = onClose
  useEffect(() => {
    const dialog = ref.current!,
      previous = document.activeElement as HTMLElement | null
    const media = window.matchMedia('(max-width: 760px)')
    let unlock: (() => void) | undefined
    const open = () => {
      if (dialog.open) dialog.close()
      unlock?.()
      unlock = undefined
      if (!settings || media.matches) {
        unlock = lockConcertScroll()
        dialog.showModal()
      } else dialog.show()
    }
    const cancel = (event: Event) => {
      event.preventDefault()
      close.current()
    }
    const escape = (event: KeyboardEvent) => {
      if (
        settings &&
        !media.matches &&
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !document.querySelector('.concert-dialog:not(.concert-panel)[open]')
      ) {
        event.preventDefault()
        close.current()
      }
    }
    open()
    dialog.addEventListener('cancel', cancel)
    window.addEventListener('keydown', escape)
    if (settings) media.addEventListener('change', open)
    return () => {
      dialog.removeEventListener('cancel', cancel)
      window.removeEventListener('keydown', escape)
      media.removeEventListener('change', open)
      dialog.close()
      unlock?.()
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [settings])
  const outside = (x: number, y: number) => {
    const rect = ref.current!.getBoundingClientRect()
    return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`concert-dialog ${wide ? 'wide' : ''} ${settings ? 'concert-panel' : ''}`}
      onPointerDown={(event) => {
        startedOutside.current =
          event.target === event.currentTarget &&
          outside(event.clientX, event.clientY)
      }}
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          startedOutside.current &&
          outside(event.clientX, event.clientY)
        )
          onClose()
      }}
    >
      <header>
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label={settings ? '关闭设置面板' : '关闭弹窗'}
          onClick={onClose}
        >
          <FiX aria-hidden="true" />
        </button>
      </header>
      {children}
    </dialog>
  )
}

// The next timer starts only after the prior task settles. No hidden-tab backlog.
export function startVisiblePolling({ run, visible, schedule, cancel, delay }: {
  run: () => Promise<void>
  visible: () => boolean
  schedule: (task: () => void, delay: number) => ReturnType<typeof setTimeout>
  cancel: (id: ReturnType<typeof setTimeout>) => void
  delay: number
}) {
  let stopped = false
  let inFlight = false
  let timer: ReturnType<typeof setTimeout> | undefined
  function plan() {
    if (!stopped) timer = schedule(() => { timer = undefined; void tick() }, delay)
  }
  async function tick() {
    if (stopped || inFlight) return
    if (timer !== undefined) { cancel(timer); timer = undefined }
    inFlight = true
    try { if (visible()) await run() } catch { /* task owns its error presentation */ }
    finally { inFlight = false; plan() }
  }
  plan()
  return { refresh: tick, stop() { stopped = true; if (timer !== undefined) cancel(timer) } }
}

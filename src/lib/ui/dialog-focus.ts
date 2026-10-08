/** Keep keyboard traversal inside a modal, including the browser chrome boundary. */
export function trapDialogFocus(event: {
  currentTarget: HTMLDialogElement;
  key: string;
  shiftKey: boolean;
  preventDefault: () => void;
}): void {
  if (event.key !== "Tab") return;
  const dialog = event.currentTarget;
  const controls = [...dialog.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter(element => element.getClientRects().length > 0 && !element.closest('[inert], [hidden]'));
  const first = controls[0], last = controls.at(-1);
  if (!first || !last) { event.preventDefault(); dialog.focus(); return; }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault(); first.focus();
  }
}

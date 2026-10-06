// Releasing a drag-text-selection dispatches a click at the common ancestor of
// the mousedown and mouseup targets, so any row/card onClick fires when the
// user merely copies text — and a navigating or modal-opening handler then
// destroys the selection they were making. Wrap such container handlers: the
// click is ignored while a non-empty selection exists. Buttons with short
// labels don't need this; rows, cards and cells with copyable data do.
export function ignoreTextSelection<E>(handler: (e: E) => void): (e: E) => void {
  return (e: E) => {
    if (typeof window !== "undefined" && window.getSelection()?.toString()) return;
    handler(e);
  };
}

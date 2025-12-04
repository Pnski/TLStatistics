import * as htl from "npm:htl";

export function sparkbar(max) {
  return (x) => htl.html`<div style="
    background: var(--theme-foreground-fainter);
    width: ${100 * x / max}%;
    float: right;
    padding-right: 3px;
    box-sizing: border-box;
    overflow: visible;
    display: flex;
    justify-content: end;">${x.toLocaleString("en-US")}`
}
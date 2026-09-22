/**
 * The desktop nav item: ink-2 text with a gold underline that draws in from
 * the left on hover, on the current page (`aria-current="page"`), on an open
 * menu (`aria-expanded`) and on the menu of the current section
 * (`data-current`).
 */
export const NAV_ITEM = [
  "relative inline-flex items-center gap-1 px-3 py-2 text-[15px] font-medium text-ink-2 transition-colors duration-(--dur-1) hover:text-ink",
  "after:absolute after:bottom-[3px] after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-(--dur-2) after:ease-out after:content-['']",
  "hover:after:scale-x-100 aria-[current=page]:text-ink aria-[current=page]:after:scale-x-100 aria-expanded:text-ink aria-expanded:after:scale-x-100 data-current:text-ink data-current:after:scale-x-100",
].join(" ");

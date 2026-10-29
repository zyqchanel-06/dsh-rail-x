/**
 * dsh-rail-x — browser half.
 *
 * The composer's draft-attachment rail ships its per-item remove button at
 * opacity:0 until hover (CSS-module class `*_remove`). Touch/accidental-paste
 * users never find it, so stray images can only be sent. This plugin pins the
 * control visible and adds a hover pop so it is obviously clickable.
 */
window.__ModuleLoader__.load({
	id: "dsh-rail-x",
	factory: () => {
		const STYLE_ID = "dsh-rail-x-style";
		const CSS = [
			'[class$="_remove"]{opacity:.92 !important;pointer-events:auto !important;cursor:pointer !important;transition:transform .12s ease !important}',
			'[class$="_remove"]:hover{opacity:1 !important;transform:scale(1.25)}',
		].join("\n");
		const boot = () => {
			if (document.getElementById(STYLE_ID) !== null) return;
			const el = document.createElement("style");
			el.id = STYLE_ID;
			el.textContent = CSS;
			document.head.appendChild(el);
		};
		boot();
		new MutationObserver(() => {
			if (document.getElementById(STYLE_ID) === null) boot();
		}).observe(document.head, { childList: true });
	},
});

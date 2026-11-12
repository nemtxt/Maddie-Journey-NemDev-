/* Maddie Journey · consistent inline outline icons.
 * Self-hosted source: no emoji font, icon CDN, image sprite or external fetch.
 * Icon markup is decorative; every actionable control keeps visible text or aria-label.
 */
(function(root){
  'use strict';
  const shapes=Object.freeze({
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>',
    moon:'<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>',
    panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
    users:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 6a3 3 0 1 1 0 6M22 20v-2a6 6 0 0 0-4-5.66"/>',
    people:'<circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 12a4 4 0 0 0 0-8M21 21v-2a5 5 0 0 0-3-4.6"/>',
    list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke-width="3"/>',
    chart:'<path d="M4 20v-6M10 20V9M16 20V4M22 20v-10"/>',
    database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    hierarchy:'<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-5h14v5"/>',
    crown:'<path d="M2 8 7 12 12 3 17 12 22 8 20 20H4L2 8Z"/><path d="M4 16h16"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file:'<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M13 2v7h7M8 14h8M8 18h8"/>',
    'file-check':'<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M13 2v7h7m-11 8 2 2 4-4"/>',
    folder:'<path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    clipboard:'<rect x="5" y="5" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M9 13h6M9 17h4"/>',
    checklist:'<path d="M9 6h12M9 12h12M9 18h12M3 6l1.4 1.4L7 4M3 12l1.4 1.4L7 10M3 18l1.4 1.4L7 16"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
    'id-card':'<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M4.5 16c.8-2 6.2-2 7 0M14 10h5M14 14h5"/>',
    award:'<circle cx="12" cy="8" r="5"/><path d="m9 12-2 9 5-3 5 3-2-9"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    activity:'<path d="M2 12h4l3-8 5 16 4-8h4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    'alert-circle':'<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>',
    'arrow-right':'<path d="M4 12h16m-7-7 7 7-7 7"/>',
    'arrow-left':'<path d="M20 12H4m7-7-7 7 7 7"/>',
    'arrow-up-right':'<path d="M5 19 19 5M8 5h11v11"/>',
    'chevron-right':'<path d="m9 18 6-6-6-6"/>',
    'chevron-left':'<path d="m15 18-6-6 6-6"/>',
    'chevron-down':'<path d="m6 9 6 6 6-6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    minus:'<path d="M5 12h14"/>',
    'circle-help':'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-.8.6-1.5 1.1-1.5 2.5M12 17h.01"/>'
  });
  function svg(name){
    // Closed vocabulary: external data never becomes SVG markup or attributes.
    const key=Object.prototype.hasOwnProperty.call(shapes,name)?name:'circle-help';
    return '<svg class="ui-icon ui-icon-'+key+'" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+shapes[key]+'</svg>';
  }
  root.MJ_ICONS=Object.freeze({svg:svg,names:Object.freeze(Object.keys(shapes))});
})(window);

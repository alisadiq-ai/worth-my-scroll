export const POST_SELECTOR='[role="listitem"][componentkey^="update-card"], .feed-shared-update-v2[data-urn], [data-id^="urn:li:activity:"]';
const TEXT_SELECTOR='[data-testid="expandable-text-box"], .feed-shared-update-v2__description, .update-components-text, .feed-shared-text';
export function extractPost(el:Element):string|null {
 if([...el.querySelectorAll('p,span')].some(e=>!e.closest(TEXT_SELECTOR)&&/^(Promoted|Sponsored|Anzeige|Gesponsert)$/i.test(e.textContent?.trim()||'')))return null;
 const ad=el.querySelector('[data-ad-id], [data-sponsored], .feed-shared-actor__sub-description');
 if(el.hasAttribute('data-ad-id')||el.getAttribute('data-sponsored')==='true'||/\b(Promoted|Sponsored|Anzeige|Gesponsert)\b/i.test(ad?.textContent||''))return null;
 const labels=el.querySelectorAll('.update-components-actor__sub-description, [data-testid="feed-actor-sub-description"]');
 if([...labels].some(x=>/\b(Promoted|Sponsored|Anzeige|Gesponsert)\b/i.test(x.textContent||'')))return null;
 const text=el.querySelector(TEXT_SELECTOR)?.textContent?.replace(/\s*(…|\.\.\.)?\s*see more\s*$/i,'').trim();
 return text&&text.length>=20&&text.length<=12000?text:null;
}

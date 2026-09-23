export function feedStatus(state:any,now=Date.now()){
 if(!state.hasKey)return {label:'Connect Jev to score',detail:'Add your key below to start.',tone:'idle',retry:false};
 if(!state.settings.enabled||!state.settings.consent)return {label:'Scoring is paused',detail:'Resume when you are ready to scroll.',tone:'idle',retry:false};
 const h=state.feedHealth;
 if(!h||now-h.at>20000)return {label:'Waiting for LinkedIn',detail:'Open or refresh your LinkedIn feed. After an extension update, reload the extension first.',tone:'idle',retry:false};
 if(h.pending)return {label:'Scoring posts…',detail:`Scoring ${h.pending} post${h.pending===1?'':'s'} · ${h.scored} annotated`,tone:'active',retry:false};
 if(h.retrying)return {label:'Waiting to retry',detail:'Temporary connection issue. One automatic retry in about a minute.',tone:'waiting',retry:false};
 if(h.errors)return {label:'Scoring needs attention',detail:state.feedError?.message||'Some posts could not be scored. Retry after resolving the issue.',tone:'error',retry:true};
 return {label:h.scored?'Feed is up to date':'Ready for posts',detail:h.scored?`LinkedIn connected · ${h.scored} annotated post${h.scored===1?'':'s'}`:'Scroll to bring a post into view.',tone:'active',retry:false};
}

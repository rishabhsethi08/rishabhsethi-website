/* A compact, inspectable view of the engine. No production integrations are implied. */
(() => {
  const nodes = [
    {id:'event', name:'Incoming event', label:['Incoming','event'], x:200,y:58,r:34,fill:'#d8e8f4',stroke:'#86a7bf',category:'Trigger',description:'A flight update, local disruption, location change, provider response, or timed event starts a fresh assessment.',note:'The same event can have different consequences for different travellers.',links:['ai','context']},
    {id:'context',name:'Traveller context',label:['Traveller','context'],x:66,y:198,r:40,fill:'#ddd0ff',stroke:'#b09ad2',category:'What the system knows',description:'The current itinerary, bookings, commitments, location, personal context, and previous interactions give the event meaning.',note:'Keep source, timestamp, confidence, conflicts, and missing information with the data. A home-geofence exit is a signal; it does not establish intent.',links:['ai','dag']},
    {id:'ai',name:'AI assessment',label:['AI','assessment'],x:200,y:211,r:49,fill:'#c4a8ff',stroke:'#8b5cf6',category:'Reasoning',description:'For each event, assess what changed, who it affects, and whether the current journey still works.',note:'Decide whether to call tools, recalculate the plan, or act on the information already available. Reassess when new results return.',links:['tools','simulation','recovery']},
    {id:'tools',name:'Tools & APIs',label:['Tools','& APIs'],x:334,y:198,r:40,fill:'#c8e8f0',stroke:'#81adbb',category:'Get and exchange information',description:'Send relevant inputs to services and retrieve the information needed for the assessment.',note:'FlightStats, Google Maps, weather, SITATA, calendar, email, Blinctrip data, and ground partners such as Savaari. These sources have different levels of access and certainty.',links:['ai','simulation']},
    {id:'dag',name:'Journey dependencies',label:['Journey','dependencies'],x:66,y:353,r:43,fill:'#ffe8c0',stroke:'#c59c62',category:'The DAG',description:'Link journey steps to the steps they depend on. Attach travel times, booking deadlines, provider policies, and fixed commitments.',note:'The graph carries the dependencies. The AI decides when to reassess; simulation calculates the consequences.',links:['simulation','context']},
    {id:'simulation',name:'Simulate & compare',label:['Simulate','& compare'],x:334,y:353,r:43,fill:'#d8e8f4',stroke:'#86a7bf',category:'Recalculation',description:'Use current API results and journey constraints to create one or more candidate itineraries. Compare arrival times, cost, missed activities, and unresolved tasks.',note:'Return the candidates to the AI for assessment. A new flight may also change the airport, ground route, and time to leave home.',links:['dag','ai','recovery']},
    {id:'recovery',name:'Notification & recovery',label:['Notification','& recovery'],x:200,y:466,r:45,fill:'#c0ecd8',stroke:'#7cb398',category:'The traveller’s next step',description:'Decide whether to notify now, later, or stay quiet. Explain the consequences and help the traveller compare possible responses.',note:'The traveller reviews a plan before confirming. Record the choice, keep unresolved tasks visible, and reassess when new information arrives.',links:['context','ai']}
  ];
  const edges = [
    ['event','ai','M200 93 V160'], ['context','ai','M107 201 L149 206'],
    ['ai','tools','M250 207 L292 202'], ['dag','ai','M96 321 L164 249'],
    ['tools','simulation','M334 240 V308'], ['dag','simulation','M110 353 H289'],
    ['simulation','ai','M307 319 L236 249'], ['ai','recovery','M200 262 V418'],
    ['recovery','context','M160 448 C-7 450 -5 267 46 237']
  ];
  document.querySelectorAll('[data-engine-map]').forEach((host, index) => {
    const uid = 'engine-' + index;
    let selected = null;
    let revised = false;
    host.innerHTML = `<div class="engine-canvas">
      <svg class="engine-drawing" viewBox="0 0 400 530" role="group" aria-label="Blinctrip engine architecture. Select a circle to explore.">
      <defs><marker id="${uid}-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8" fill="#9da3ad"/></marker></defs>
      ${edges.map(([a,b,path])=>`<path class="engine-edge" data-from="${a}" data-to="${b}" d="${path}" marker-end="url(#${uid}-arrow)"${a==='ai'&&b==='tools'?' marker-start="url(#'+uid+'-arrow)"':''}${a==='recovery'?' stroke-dasharray="4 4"':''}/>`).join('')}
      ${nodes.map(n=>`<g class="engine-node" data-node="${n.id}" transform="translate(${n.x},${n.y})" role="button" tabindex="0" aria-label="Explore ${n.name}" aria-controls="${uid}-panel" aria-expanded="false" aria-pressed="false"><circle r="${n.r}" fill="${n.fill}" stroke="${n.stroke}"/><text y="-3">${n.label.map((line,i)=>`<tspan x="0" dy="${i?16:0}">${line}</tspan>`).join('')}</text></g>`).join('')}
      </svg>
      <aside class="engine-panel" id="${uid}-panel" aria-label="Selected component" hidden><button class="engine-close" type="button" aria-label="Close component details">×</button><div data-panel-content></div></aside>
      <p class="engine-hint">Select a circle to explore</p>
    </div>`;
    const canvas = host.querySelector('.engine-canvas');
    const panel = host.querySelector('.engine-panel');
    const content = host.querySelector('[data-panel-content]');
    const dagContent = () => `<div class="dag-switch" role="group" aria-label="Journey scenario"><button type="button" data-scenario="delay" aria-pressed="${!revised}">With delay</button><button type="button" data-scenario="revised" aria-pressed="${revised}">Skip two stops</button></div>
      <ol class="dag-chain">
      <li><strong>Flight arrives</strong><span>10:45 · one hour late</span></li>
      <li><strong>Car pickup</strong><span>12:55 · provider confirmation needed</span></li>
      <li><strong>${revised?'Drive direct to the trail':'Two sightseeing stops'}</strong><span>${revised?'Remove the stops from the route':'Their time affects later arrivals'}</span></li>
      <li><strong>Trail · ${revised?'16:15':'16:45'}</strong><span>${revised?'On time':'30 minutes after the start'}</span></li>
      <li><strong>Hostel · ${revised?'22:15':'22:45'}</strong><span>Reception closes at 23:00</span></li>
      </ol><p class="dag-result" role="status">${revised?'The revised route restores the trail start and adds a buffer at the hostel. The rental hold still needs confirmation.':'The delay propagates through the route: the trail start is missed, and the hostel has little time to spare.'}</p>`;
    function renderPanel() {
      const n = nodes.find(n=>n.id===selected);
      content.innerHTML = `<p class="small-label">${n.category}</p><h3>${n.name}</h3><p>${n.description}</p>${n.id==='dag'?dagContent():''}<p>${n.note}</p><p class="small-label" style="margin-top:16px">Connected to</p><div class="engine-links">${n.links.map(id=>`<button type="button" data-select="${id}">${nodes.find(n=>n.id===id).name} →</button>`).join('')}</div>`;
    }
    function select(id) {
      selected = id;
      const neighbors = new Set(edges.filter(e=>e[0]===id||e[1]===id).flatMap(e=>e.slice(0,2)));
      host.querySelectorAll('.engine-node').forEach(node=>{
        const active = node.dataset.node===id;
        node.setAttribute('aria-pressed',String(active));
        node.setAttribute('aria-expanded',String(active));
        node.classList.toggle('is-muted',!neighbors.has(node.dataset.node));
      });
      host.querySelectorAll('.engine-edge').forEach(edge=>{
        const active = edge.dataset.from===id||edge.dataset.to===id;
        edge.classList.toggle('is-connected',active);edge.classList.toggle('is-muted',!active);
      });
      renderPanel();panel.hidden=false;panel.scrollTop=0;canvas.classList.add('has-selection');
      host.querySelector('.engine-close').focus({preventScroll:true});
    }
    function close() {
      panel.hidden=true;canvas.classList.remove('has-selection');
      host.querySelectorAll('.is-muted,.is-connected').forEach(el=>el.classList.remove('is-muted','is-connected'));
      host.querySelectorAll('.engine-node').forEach(el=>{el.setAttribute('aria-pressed','false');el.setAttribute('aria-expanded','false')});
      if(selected)host.querySelector(`[data-node="${selected}"]`).focus({preventScroll:true});selected=null;
    }
    host.addEventListener('click', e=>{
      const node=e.target.closest('[data-node],[data-select]');
      if(node){select(node.dataset.node||node.dataset.select);return}
      if(e.target.closest('.engine-close')){close();return}
      const choice=e.target.closest('[data-scenario]');
      if(choice){revised=choice.dataset.scenario==='revised';renderPanel();content.querySelector(`[data-scenario="${choice.dataset.scenario}"]`).focus({preventScroll:true})}
    });
    host.addEventListener('keydown', e=>{
      if(e.key==='Escape'&&selected){close();return}
      if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-node]')){e.preventDefault();select(e.target.dataset.node)}
    });
  });
})();

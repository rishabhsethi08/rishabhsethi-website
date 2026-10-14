const scriptBase = new URL('./recovery-prototype/', import.meta.url);
const host = document.querySelector('[data-recovery-prototype]');
if (host) {
  let mount;
  let unmount;
  let ready = false;
  let loading;
  let root;
  const notice = document.querySelector('[data-prototype-notice]');
  const restart = document.querySelector('[data-prototype-restart]');
  const load = () => loading ||= (async () => {
    try {
      // Shadow DOM keeps the original product styles out of the portfolio page.
      const shadow = host.shadowRoot || host.attachShadow({mode:'open'});
      shadow.innerHTML = '<p style="padding:32px;color:#6a6a6a;font:13px Inter,sans-serif">Loading the interactive prototype…</p>';
      const style = document.createElement('link');
      style.rel = 'stylesheet'; style.href = new URL('app.css?v=blinctrip-icon',scriptBase).href;
      const styled = new Promise((resolve,reject)=>{style.onload=resolve;style.onerror=reject});
      shadow.append(style);
      if (!document.querySelector('[data-prototype-font]')) {
        const font=document.createElement('link');font.rel='stylesheet';font.dataset.prototypeFont='';
        font.href='https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,300,400,500&display=swap';document.head.append(font);
      }
      const module = await import(new URL('app.js?v=blinctrip-icon',scriptBase).href);
      await styled;
      shadow.querySelector('p').remove();
      root = document.createElement('div');root.id='root';shadow.append(root);
      mount=module.mountPrototype;unmount=mount(root);ready=true;
    } catch (error) {
      loading=null;
      const target=host.shadowRoot||host;
      target.innerHTML='<p style="padding:32px;font:13px Inter,sans-serif">The prototype could not load. <a href="https://disruption-management-prototype.vercel.app/" target="_blank" rel="noopener">Open in new tab ↗</a></p>';
      console.error('Prototype load failed',error);
    }
  })();
  const observer = new IntersectionObserver(entries=>{
    if(entries.some(e=>e.isIntersecting)){load();observer.disconnect()}
  },{rootMargin:'400px'});
  observer.observe(host);
  restart?.addEventListener('click',async()=>{
    if(!ready){await load();return}
    unmount();unmount=mount(root);if(notice)notice.hidden=true;
  });
  window.addEventListener('blinctrip-demo-call',()=>{
    if(notice){notice.textContent='This is a support-call preview. No call has been placed.';notice.hidden=false;}
  });
}

const noop = () => {};

class FakeNode {
  constructor(tag){
    this.tag = tag;
    this.children = [];
    this.attrs = {};
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this._class = "";
    this._html = "";
    this._text = "";
    this.value = "";
    this.hidden = false;
    this.scrollTop = 0;
  }
  get className(){ return this._class; }
  set className(v){ this._class = String(v); }
  get classList(){
    const node = this;
    return {
      add: (...names) => { node._class = [...new Set(node._class.split(" ").filter(Boolean).concat(names))].join(" "); },
      remove: (...names) => { node._class = node._class.split(" ").filter(c => c && !names.includes(c)).join(" "); },
      toggle: (name, on) => { on ? node.classList.add(name) : node.classList.remove(name); },
      contains: name => node._class.split(" ").includes(name)
    };
  }
  get innerHTML(){ return this._html + this.children.map(c => c.outerHTML).join(""); }
  set innerHTML(v){ this._html = String(v); this.children = []; }
  get textContent(){ return this._text || this._html.replace(/<[^>]*>/g, ""); }
  set textContent(v){ this._text = String(v); }
  get outerHTML(){
    return `<${this.tag} class="${this._class}">${this.innerHTML}${this._text}</${this.tag}>`;
  }
  appendChild(child){ this.children.push(child); return child; }
  append(...nodes){ nodes.forEach(n => this.children.push(n)); }
  remove(){}
  setAttribute(name, value){ this.attrs[name] = String(value); if(name === "id") this.id = String(value); }
  getAttribute(name){ return this.attrs[name]; }
  addEventListener(type, fn){ (this.listeners[type] = this.listeners[type] || []).push(fn); }
  fire(type, event){ (this.listeners[type] || []).forEach(fn => fn(event || {stopPropagation: noop})); }
  querySelector(sel){
    if(sel.startsWith("#")) return this.descendants().find(n => n.attrs.id === sel.slice(1) || n.id === sel.slice(1)) || null;
    return this.find(sel)[0] || new FakeNode("div");
  }
  querySelectorAll(sel){ return this.find(sel); }
  find(sel){
    const want = sel.replace(/^\./, "");
    const hits = [];
    const walk = node => node.children.forEach(child => {
      if(child._class.split(" ").includes(want)) hits.push(child);
      walk(child);
    });
    walk(this);
    return hits;
  }
  descendants(){
    const all = [];
    const walk = node => node.children.forEach(c => { all.push(c); walk(c); });
    walk(this);
    return all;
  }
}

export function installDom(){
  const byId = {};
  const ids = ["main", "tabs", "volume", "volnote", "status", "timer", "clock",
               "sheet", "sheetback", "sheetclose", "sheettitle", "sheetbody", "notes",
               "ring", "ringfill", "ringtext"];
  ids.forEach(id => { byId[id] = new FakeNode("div"); });

  const doc = {
    getElementById: id => byId[id] || (byId[id] = new FakeNode("div")),
    createElement: tag => new FakeNode(tag),
    createElementNS: (ns, tag) => new FakeNode(tag),
    createTextNode: text => Object.assign(new FakeNode("#text"), {_text: String(text)}),
    querySelectorAll: () => [],
    addEventListener: noop,
    body: new FakeNode("body"),
    activeElement: null,
    visibilityState: "visible"
  };

  globalThis.document = doc;
  globalThis.window = {addEventListener: noop, scrollTo: noop};
  if(!globalThis.navigator)
    Object.defineProperty(globalThis, "navigator", {value: {}, configurable: true});
  globalThis.Blob = function(){};
  globalThis.FileReader = function(){};
  globalThis.prompt = () => null;

  return byId;
}

export {FakeNode};

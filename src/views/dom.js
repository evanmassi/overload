const HTML_ESCAPES = {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"};

export const byId = id => document.getElementById(id);

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => HTML_ESCAPES[char]);

export function el(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text !== undefined) node.textContent = text;
  return node;
}

import htm from "htm";

export const createRef = <T>(val: T = null) => ({ current: val });

const isRef = (o: unknown): o is { current: unknown } =>
  typeof o === "object" && "current" in o;

function h(type: keyof HTMLElementTagNameMap, props, ...children) {
  this[0] = 3;

  const el = document.createElement(type);

  Object.entries(props || {}).forEach(([key, value]) => {
    if (key === "ref") {
      if (!isRef(value)) throw new Error("invalid ref");
      value.current = el;
    } else if (key.startsWith("data-")) {
      el.dataset[key.substring(5)] = JSON.stringify(value);
    } else if (key.startsWith("on")) {
      el[key] = value;
    } else {
      el.setAttribute(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
    }
  });

  el.append(...children);

  return el;
}

const _html = htm.bind(h);

export const html = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const result = _html(strings, ...values);
  if (Array.isArray(result)) throw new Error("single parent only!");
  return result;
};

export const render = (component, root) => {
  root.replaceChildren(component.render());
};

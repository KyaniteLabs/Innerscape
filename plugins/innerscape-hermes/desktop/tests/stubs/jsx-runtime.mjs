/* jsx returns a plain tree the harness can inspect. */
export const jsx = (type, props) => ({ type, props: props || {} })
export const jsxs = jsx
export const Fragment = 'Fragment'

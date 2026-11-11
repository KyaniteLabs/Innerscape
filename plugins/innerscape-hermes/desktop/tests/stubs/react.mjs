/* Hooks are never called: the harness checks registration and pure helpers, not renders. */
const unused = () => { throw new Error('hook called outside a render') }
export const useEffect = unused
export const useRef = unused
export const useState = unused
export default { useEffect, useRef, useState }

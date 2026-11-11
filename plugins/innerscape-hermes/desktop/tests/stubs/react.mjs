/* Minimal hooks let the harness call selected components against real plugin code. */
export const useEffect = () => {}
export const useRef = (current) => ({ current })
export const useState = (value) => [value, () => {}]
export default { useEffect, useRef, useState }

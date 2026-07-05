import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

/** Counts up from 0 to `value` whenever value changes. Purely cosmetic. */
export default function AnimatedCounter({ value, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(0, value, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate(v) {
        node.textContent = Math.round(v);
      }
    });
    return () => controls.stop();
  }, [value]);

  return <span ref={ref} className={className}>0</span>;
}

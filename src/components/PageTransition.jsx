import { motion } from 'framer-motion';

/**
 * Wraps page content in a gentle fade/rise so every route feels like it's
 * being pulled into view rather than snapping in. Kept subtle (8px, 0.3s)
 * so it reads as polish, not a slideshow.
 */
export default function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

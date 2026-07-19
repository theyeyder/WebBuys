import { motion } from 'framer-motion';

export default function SpatialCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={`spatial-card ${className}`}
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      whileHover={{ y: -8, rotateX: 4, rotateY: -4, scale: 1.015 }}
    >
      {children}
    </motion.div>
  );
}

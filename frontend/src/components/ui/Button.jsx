export default function Button({ children, className = '', ...props }) {
  return <button className={`wb-btn ${className}`} {...props}>{children}</button>;
}

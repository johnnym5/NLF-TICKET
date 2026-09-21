import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal Component
 * Renders a slow-moving, graceful fade-in animation as the element scrolls into view.
 * Supports independent staggered delays for grouped cards and text elements.
 */
export default function ScrollReveal({ 
  children, 
  delay = 0, 
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  className = '',
  threshold = 0.1,
  duration = 950 // ms (slow, stately movement)
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) {
              observer.unobserve(domRef.current);
            }
          }
        });
      },
      { 
        threshold, 
        rootMargin: '0px 0px -40px 0px' 
      }
    );

    const current = domRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold]);

  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return 'translate3d(0, 24px, 0)';
      case 'down': return 'translate3d(0, -24px, 0)';
      case 'left': return 'translate3d(24px, 0, 0)';
      case 'right': return 'translate3d(-24px, 0, 0)';
      default: return 'translate3d(0, 0, 0)';
    }
  };

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate3d(0, 0, 0)' : getInitialTransform(),
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform'
      }}
      className={className}
    >
      {children}
    </div>
  );
}

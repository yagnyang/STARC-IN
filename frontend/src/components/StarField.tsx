import React from 'react';

const StarField: React.FC = () => {
  const stars = Array.from({ length: 20 }).map((_, i) => {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = Math.random() * 2 + 1;
    const duration = Math.random() * 3 + 3;
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.5 + 0.3;

    return (
      <div
        key={i}
        className="star"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          '--duration': `${duration}s`,
          '--delay': `${delay}s`,
          '--opacity': opacity,
        } as React.CSSProperties}
      />
    );
  });

  return <div className="star-field">{stars}</div>;
};

export default StarField;

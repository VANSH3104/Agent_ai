import React from 'react';

export const ConnectionLines = ({ connections }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
    {connections.map((conn) => (
      <line
        key={conn.id}
        x1={conn.fromX}
        y1={conn.fromY}
        x2={conn.toX}
        y2={conn.toY}
        stroke="#6366f1"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
    ))}
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
      </marker>
    </defs>
  </svg>
);

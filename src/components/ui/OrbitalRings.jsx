import React from 'react';
import { motion, useTransform } from 'framer-motion';

export default function OrbitalRings({ isHovered, scrollProgress }) {
  // Transform scroll progress to opacity (fade in as it comes into view)
  const opacity = useTransform(scrollProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  
  // Transform scroll to rotation speed multiplier
  const scrollSpeed = useTransform(scrollProgress, [0, 0.5, 1], [0.5, 1, 1.5]);

  const rings = [
    {
      size: 380,
      duration: 25,
      reverse: false,
      gradient: 'radial-gradient(circle at 50% 0%, rgba(123,59,255,0.5) 0%, transparent 8%)',
      border: 'border-[#7B3BFF]/40',
      scaleRange: [1, 1.05, 1],
      rotateX: [0, 5, 0],
      hueRotate: [0, 30, 0]
    },
    {
      size: 440,
      duration: 18,
      reverse: true,
      gradient: 'radial-gradient(circle at 80% 20%, rgba(168,85,247,0.4) 0%, transparent 6%)',
      border: 'border-[#A855F7]/30',
      scaleRange: [1, 1.08, 1],
      rotateX: [0, -8, 0],
      hueRotate: [0, -20, 0]
    },
    {
      size: 340,
      duration: 30,
      reverse: false,
      gradient: 'radial-gradient(circle at 30% 70%, rgba(192,132,252,0.45) 0%, transparent 7%)',
      border: 'border-[#C084FC]/35',
      scaleRange: [1, 1.06, 1],
      rotateX: [0, 10, 0],
      hueRotate: [0, 15, 0]
    },
    {
      size: 500,
      duration: 35,
      reverse: true,
      gradient: 'radial-gradient(circle at 10% 50%, rgba(139,75,255,0.3) 0%, transparent 5%)',
      border: 'border-[#8B4BFF]/25',
      scaleRange: [1, 1.04, 1],
      rotateX: [0, -6, 0],
      hueRotate: [0, 25, 0]
    }
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {rings.map((ring, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full border ${ring.border}`}
          style={{
            width: ring.size,
            height: ring.size,
            backgroundImage: ring.gradient,
            opacity
          }}
          animate={{
            rotate: ring.reverse ? -360 : 360,
            scale: ring.scaleRange,
            rotateX: ring.rotateX,
            filter: ring.hueRotate.map(h => `hue-rotate(${h}deg) saturate(${isHovered ? 1.3 : 1})`)
          }}
          transition={{
            rotate: {
              duration: isHovered ? ring.duration * 0.4 : ring.duration,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: ring.duration * 0.6,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotateX: {
              duration: ring.duration * 0.8,
              repeat: Infinity,
              ease: "easeInOut"
            },
            filter: {
              duration: ring.duration * 0.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />
      ))}
      
      {/* Shimmer particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full bg-[#C084FC]"
          style={{
            opacity
          }}
          animate={{
            x: [0, Math.cos(i * 45 * Math.PI / 180) * 200, 0],
            y: [0, Math.sin(i * 45 * Math.PI / 180) * 200, 0],
            scale: [0, 1, 0],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 4 + i * 0.3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
        />
      ))}
    </div>
  );
}
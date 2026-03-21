const fs = require('fs');
const code = `import { motion } from 'framer-motion';
import leftPawImg from '../../assets/images/leftpaw.png';
import rightPawImg from '../../assets/images/rightpaw.png';

const FINGER_COLORS = {
  'pinky-l': 'rgba(239, 68, 68, 0.8)',
  'ring-l': 'rgba(249, 115, 22, 0.8)',
  'middle-l': 'rgba(234, 179, 8, 0.8)',
  'index-l': 'rgba(34, 197, 94, 0.8)',
  'index-r': 'rgba(6, 182, 212, 0.8)',
  'middle-r': 'rgba(59, 130, 246, 0.8)',
  'ring-r': 'rgba(168, 85, 247, 0.8)',
  'pinky-r': 'rgba(236, 72, 153, 0.8)',
  'thumb': 'rgba(255, 255, 255, 0.8)',
};

const BEAN_POSITIONS = {
  left: {
    pinky: { x: 26, y: 38, size: 12 },
    ring: { x: 42, y: 22, size: 14 },
    middle: { x: 62, y: 22, size: 14 },
    index: { x: 78, y: 38, size: 12 },
    thumb: { x: 86, y: 65, size: 10 },
  },
  right: {
    pinky: { x: 74, y: 38, size: 12 },
    ring: { x: 58, y: 22, size: 14 },
    middle: { x: 38, y: 22, size: 14 },
    index: { x: 22, y: 38, size: 12 },
    thumb: { x: 14, y: 65, size: 10 },
  }
};

function GlowingBean({ pos, isActive, color }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: \`\${pos.x}%\`,
        top: \`\${pos.y}%\`,
        width: \`\${pos.size}%\`,
        height: \`\${pos.size}%\`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: isActive ? color : 'transparent',
        boxShadow: isActive ? \`0 0 15px \${color}, 0 0 5px \${color} inset\` : 'none',
        pointerEvents: 'none',
        zIndex: 10
      }}
      animate={{
          scale: isActive ? 1.4 : 1,
          opacity: isActive ? 1 : 0
      }}
      transition={{ duration: 0.15 }}
    />
  );
}

function Paw({ side, activeFingerId }) {
  const isThumb = activeFingerId === 'thumb';
  const imgSrc = side === 'l' ? leftPawImg : rightPawImg;
  const s = side === 'l' ? 'l' : 'r';
  const positions = side === 'l' ? BEAN_POSITIONS.left : BEAN_POSITIONS.right;
  const getColor = (id) => activeFingerId === id ? (FINGER_COLORS[id] || 'var(--color-primary)') : null;
  
  return (
    <div className="relative" style={{ width: '130px' }}>
      <img src={imgSrc} alt={\`Cat Paw \${side}\`} className="w-full h-auto drop-shadow-md pointer-events-none opacity-90" />
      
      <GlowingBean pos={positions.pinky} isActive={activeFingerId === \`pinky-\${s}\`} color={getColor(\`pinky-\${s}\`)} />
      <GlowingBean pos={positions.ring} isActive={activeFingerId === \`ring-\${s}\`} color={getColor(\`ring-\${s}\`)} />
      <GlowingBean pos={positions.middle} isActive={activeFingerId === \`middle-\${s}\`} color={getColor(\`middle-\${s}\`)} />
      <GlowingBean pos={positions.index} isActive={activeFingerId === \`index-\${s}\`} color={getColor(\`index-\${s}\`)} />
      <GlowingBean pos={positions.thumb} isActive={isThumb} color={getColor('thumb')} />
    </div>
  );
}

export default function CatPaws({ activeFingerId }) {
  return (
    <div className="flex justify-center items-center gap-8 w-full max-w-sm mx-auto mt-4 px-4 opacity-100">
      <Paw side="l" activeFingerId={activeFingerId} />
      <Paw side="r" activeFingerId={activeFingerId} />
    </div>
  );
}`;
fs.writeFileSync('src/components/typing/CatPaws.jsx', code);
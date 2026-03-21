import { motion } from 'framer-motion';
import leftPawImg from '../../assets/images/leftpaw.png';
import rightPawImg from '../../assets/images/rightpaw.png';

import lThumbImg from '../../assets/images/l_thumb.png';
import lPinkyImg from '../../assets/images/l_pinky.png';
import lRingImg from '../../assets/images/l_ring.png';
import lMiddleImg from '../../assets/images/l_middle.png';
import lIndexImg from '../../assets/images/l_index.png';

import rThumbImg from '../../assets/images/r_thumb.png';
import rPinkyImg from '../../assets/images/r_pinky.png';
import rRingImg from '../../assets/images/r_ring.png';
import rMiddleImg from '../../assets/images/r_middle.png';
import rIndexImg from '../../assets/images/r_index.png';

const FINGER_COLORS = {
  'pinky-l': 'rgba(239, 68, 68, 1)',
  'ring-l': 'rgba(249, 115, 22, 1)',
  'middle-l': 'rgba(234, 179, 8, 1)',
  'index-l': 'rgba(34, 197, 94, 1)',
  'index-r': 'rgba(6, 182, 212, 1)',
  'middle-r': 'rgba(59, 130, 246, 1)',
  'ring-r': 'rgba(168, 85, 247, 1)',
  'pinky-r': 'rgba(236, 72, 153, 1)',
  'thumb': 'rgba(255, 255, 255, 1)',
};

const BEAN_IMAGES = {
  left: {
    pinky: lPinkyImg,
    ring: lRingImg,
    middle: lMiddleImg,
    index: lIndexImg,
    thumb: lThumbImg,
  },
  right: {
    pinky: rPinkyImg,
    ring: rRingImg,
    middle: rMiddleImg,
    index: rIndexImg,
    thumb: rThumbImg,
  }
};

function GlowingOverlay({ imgSrc, isActive, color }) {
  return (
    <motion.img
      src={imgSrc}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
      style={{
        filter: isActive ? `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color}) drop-shadow(0 0 10px ${color}) brightness(1.7) contrast(1.1)` : 'none'
      }}
      animate={{
          opacity: isActive ? 1 : 0
      }}
      transition={{ duration: 0.1 }}
    />
  );
}

function Paw({ side, activeFingerId }) {
  const isThumb = activeFingerId === 'thumb';
  const imgSrc = side === 'l' ? leftPawImg : rightPawImg;
  const s = side === 'l' ? 'l' : 'r';
  const images = side === 'l' ? BEAN_IMAGES.left : BEAN_IMAGES.right;
  const getColor = (id) => activeFingerId === id ? (FINGER_COLORS[id] || 'var(--color-primary)') : null;
  
  return (
    <div className="relative" style={{ width: '130px' }}>
      <img src={imgSrc} alt={`Cat Paw ${side}`} className="w-full h-auto drop-shadow-md pointer-events-none opacity-90" />
      
      <GlowingOverlay imgSrc={images.pinky} isActive={activeFingerId === `pinky-${s}`} color={getColor(`pinky-${s}`)} />
      <GlowingOverlay imgSrc={images.ring} isActive={activeFingerId === `ring-${s}`} color={getColor(`ring-${s}`)} />
      <GlowingOverlay imgSrc={images.middle} isActive={activeFingerId === `middle-${s}`} color={getColor(`middle-${s}`)} />
      <GlowingOverlay imgSrc={images.index} isActive={activeFingerId === `index-${s}`} color={getColor(`index-${s}`)} />
      <GlowingOverlay imgSrc={images.thumb} isActive={isThumb} color={getColor('thumb')} />
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
}

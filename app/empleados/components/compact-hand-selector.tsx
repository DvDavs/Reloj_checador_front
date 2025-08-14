'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CompactHandSelectorProps {
  registeredFingerIndices: number[];
  onFingerClick?: (fingerIndex: number) => void;
  showDeleteMode?: boolean;
}

const fingerIndexToName: { [key: number]: string } = {
  1: 'Pulgar Derecho',
  2: 'Índice Derecho',
  3: 'Medio Derecho',
  4: 'Anular Derecho',
  5: 'Meñique Derecho',
  6: 'Pulgar Izquierdo',
  7: 'Índice Izquierdo',
  8: 'Medio Izquierdo',
  9: 'Anular Izquierdo',
  10: 'Meñique Izquierdo',
};

export const CompactHandSelector = ({
  registeredFingerIndices,
  onFingerClick,
  showDeleteMode = false,
}: CompactHandSelectorProps) => {
  const rightHandFingerRegions = [
    { id: 1, x: 14, y: 86, width: 17, height: 17 },
    { id: 2, x: 41, y: 32, width: 15, height: 56 },
    { id: 3, x: 62, y: 20, width: 13, height: 65 },
    { id: 4, x: 82, y: 31, width: 14, height: 55 },
    { id: 5, x: 102, y: 49, width: 12, height: 45 },
  ];

  const leftHandFingerRegions = [
    { id: 6, x: 120, y: 85, width: 17, height: 15 },
    { id: 7, x: 93, y: 32, width: 14, height: 56 },
    { id: 8, x: 74, y: 20, width: 13, height: 65 },
    { id: 9, x: 53, y: 31, width: 15, height: 55 },
    { id: 10, x: 35, y: 50, width: 13, height: 45 },
  ];

  const getFingerStatus = (index: number): 'registered' | 'available' => {
    return registeredFingerIndices.includes(index) ? 'registered' : 'available';
  };

  const handleFingerClick = (fingerIndex: number) => {
    if (onFingerClick) {
      onFingerClick(fingerIndex);
    }
  };

  const Finger = ({
    finger,
    isRegistered,
  }: {
    finger: {
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
    };
    isRegistered: boolean;
  }) => {
    const fingerName = fingerIndexToName[finger.id] || `Dedo ${finger.id}`;

    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              key={finger.id}
              onClick={() => handleFingerClick(finger.id)}
              className='absolute flex items-center justify-center rounded-sm cursor-pointer'
              style={{
                left: finger.x,
                top: finger.y,
                width: finger.width,
                height: finger.height,
              }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{
                backgroundColor: isRegistered
                  ? 'hsl(142 76% 36%)'
                  : 'hsl(var(--muted-foreground) / 0.3)',
                opacity: 1,
                scale: 1,
              }}
              whileHover={{
                scale: 1.2,
                transition: { duration: 0.2 },
              }}
            >
              {isRegistered && showDeleteMode ? (
                <X className='h-4 w-4 text-white' />
              ) : (
                <span
                  className={`font-medium text-xs ${
                    isRegistered ? 'text-white' : 'text-muted-foreground'
                  }`}
                ></span>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent className='bg-popover text-popover-foreground border-border'>
            <p>{fingerName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className='flex flex-col items-center justify-center w-full'>
      <div className='flex flex-col md:flex-row justify-center items-center gap-4 w-full mx-auto'>
        <div className='text-center'>
          <div className='relative w-[150px] h-[180px]'>
            <svg
              width='150'
              height='180'
              viewBox='0 0 150 180'
              className='absolute top-0 left-0'
            >
              <path
                d='M 80,19.5 L 79.5,20 L 78,20 L 77.5,20.5 L 77,20.5 L 76,21.5 L 75.5,21.5 L 75,22 L 75,22.5 L 74,23.5 L 74,24 L 73.5,24.5 L 73.5,86.5 L 73,87 L 73,89 L 72.5,89.5 L 72.5,90 L 71,91.5 L 69.5,90 L 69.5,89 L 69,88.5 L 69,86.5 L 68.5,86 L 68.5,35.5 L 68,35 L 68,34.5 L 66,32.5 L 65.5,32.5 L 65,32 L 64,32 L 63.5,31.5 L 58,31.5 L 57.5,32 L 57,32 L 56.5,32.5 L 56,32.5 L 53.5,35 L 53.5,36 L 53,36.5 L 53,93 L 52.5,93.5 L 52.5,95 L 51,96.5 L 50,96.5 L 49,95.5 L 49,94 L 48.5,93.5 L 48.5,54.5 L 48,54 L 48,53 L 47.5,52.5 L 47.5,52 L 45.5,50 L 45,50 L 44.5,49.5 L 44,49.5 L 43.5,49 L 40.5,49 L 40,49.5 L 39,49.5 L 38.5,50 L 38,50 L 36.5,51.5 L 36.5,52 L 36,52.5 L 36,53 L 35.5,53.5 L 35.5,55.5 L 35,56 L 35,115.5 L 35.5,116 L 35.5,121.5 L 36,122 L 36,125 L 36.5,125.5 L 36.5,128 L 37,128.5 L 37,130 L 37.5,130.5 L 37.5,132 L 38,132.5 L 38,134 L 38.5,134.5 L 38.5,135.5 L 39,136 L 39,136.5 L 39.5,137 L 39.5,137.5 L 40,138 L 40,139 L 40.5,139.5 L 40.5,140 L 41,140.5 L 41,141 L 41.5,141.5 L 41.5,142.5 L 42,143 L 42,143.5 L 42.5,144 L 42.5,144.5 L 43,145 L 43,146 L 43.5,146.5 L 43.5,147 L 44,147.5 L 44,148.5 L 44.5,149 L 44.5,149.5 L 45,150 L 45,151 L 45.5,151.5 L 45.5,153 L 46,153.5 L 46,155.5 L 46.5,156 L 46.5,178.5 L 47,179 L 47,179.5 L 47.5,180 L 99.5,180 L 100.5,179 L 100.5,160 L 101,159.5 L 101,157.5 L 101.5,157 L 101.5,155.5 L 102,155 L 102,154 L 102.5,153.5 L 102.5,152.5 L 103,152 L 103,151 L 103.5,150.5 L 103.5,150 L 104,149.5 L 104,149 L 104.5,148.5 L 104.5,147.5 L 105,147 L 105,146.5 L 105.5,146 L 105.5,145.5 L 106.5,144.5 L 106.5,144 L 107,143.5 L 107,143 L 107.5,142.5 L 107.5,142 L 109,140.5 L 109,140 L 111,138 L 111,137.5 L 113.5,135 L 113.5,134.5 L 116.5,131.5 L 116.5,131 L 118,129.5 L 118,129 L 119.5,127.5 L 119.5,127 L 120,126.5 L 120,126 L 121,125 L 121,124.5 L 121.5,124 L 121.5,123.5 L 122.5,122.5 L 122.5,122 L 123,121.5 L 123,121 L 123.5,120.5 L 123.5,120 L 124,119.5 L 124,119 L 124.5,118.5 L 124.5,118 L 125,117.5 L 125,117 L 125.5,116.5 L 125.5,116 L 126,115.5 L 126,115 L 126.5,114.5 L 126.5,114 L 127,113.5 L 127,113 L 127.5,112.5 L 127.5,112 L 128,111.5 L 128,111 L 128.5,110.5 L 128.5,110 L 129,109.5 L 129,109 L 129.5,108.5 L 129.5,108 L 130,107.5 L 130,107 L 130.5,106.5 L 130.5,106 L 131,105.5 L 131,105 L 131.5,104.5 L 131.5,104 L 132,103.5 L 132,103 L 132.5,102.5 L 132.5,102 L 133,101.5 L 133,101 L 133.5,100.5 L 133.5,100 L 134,99.5 L 134,99 L 134.5,98.5 L 134.5,98 L 135,97.5 L 135,97 L 135.5,96.5 L 135.5,96 L 136,95.5 L 136,95 L 136.5,94.5 L 136.5,93 L 137,92.5 L 137,91 L 137.5,90.5 L 137.5,87 L 138,86.5 L 138,85.5 L 136.5,84 L 136.5,84 L 136,84 L 135,83 L 134,83 L 133.5,82.5 L 130.5,82.5 L 130,83 L 128.5,83 L 128,83.5 L 127.5,83.5 L 127,84 L 126.5,84 L 125,85.5 L 124.5,85.5 L 120.5,89.5 L 120.5,90 L 119,91.5 L 119,92 L 118,93 L 118,93.5 L 117.5,94 L 117.5,94.5 L 116.5,95.5 L 116.5,96 L 116,96.5 L 116,97 L 115.5,97.5 L 115.5,98 L 115,98.5 L 115,99 L 114,100 L 114,100.5 L 113.5,101 L 113.5,101.5 L 113,102 L 113,102.5 L 112.5,103 L 112.5,103.5 L 112,104 L 112,104.5 L 111.5,105 L 111.5,105.5 L 111,106 L 111,106.5 L 110.5,107 L 110.5,107.5 L 109.5,108.5 L 109.5,104.5 L 108.5,103.5 L 108.5,37.5 L 109,37 L 109,36 L 108.5,35.5 L 108.5,35 L 106.5,33 L 106,33 L 105,32.5 L 104,32.5 L 103.5,32 L 98.5,32 L 98,32.5 L 97,32.5 L 96.5,33 L 96,33 L 94,35 L 94,35.5 L 93.5,36 L 93.5,86.5 L 93,87 L 93,89.5 L 92.5,90 L 92.5,90.5 L 91.5,91.5 L 90.5,91.5 L 89.5,90.5 L 89.5,90 L 89,89.5 L 89,89 L 88.5,88.5 L 88.5,86.5 L 88,86 L 88,24.5 L 87.5,24 L 87.5,23.5 L 87,23 L 87,22.5 L 85.5,21 L 85,21 L 84.5,20.5 L 84,20.5 L 83.5,20 L 82,20 L 81.5,19.5 Z'
                fill='hsl(var(--muted))'
                stroke='hsl(var(--border))'
                strokeWidth='0.75'
              />
              <text
                x='75'
                y='175'
                textAnchor='middle'
                fill='hsl(var(--muted-foreground))'
                fontSize='10'
              >
                Izquierda
              </text>
            </svg>

            {leftHandFingerRegions.map((finger) => (
              <Finger
                key={finger.id}
                finger={finger}
                isRegistered={getFingerStatus(finger.id) === 'registered'}
              />
            ))}
          </div>
        </div>

        <div className='text-center'>
          <div className='relative w-[150px] h-[180px]'>
            <svg
              width='150'
              height='180'
              viewBox='0 0 150 180'
              className='absolute top-0 left-0'
            >
              <path
                d='M 80,19.5 L 79.5,20 L 78,20 L 77.5,20.5 L 77,20.5 L 76,21.5 L 75.5,21.5 L 75,22 L 75,22.5 L 74,23.5 L 74,24 L 73.5,24.5 L 73.5,86.5 L 73,87 L 73,89 L 72.5,89.5 L 72.5,90 L 71,91.5 L 69.5,90 L 69.5,89 L 69,88.5 L 69,86.5 L 68.5,86 L 68.5,35.5 L 68,35 L 68,34.5 L 66,32.5 L 65.5,32.5 L 65,32 L 64,32 L 63.5,31.5 L 58,31.5 L 57.5,32 L 57,32 L 56.5,32.5 L 56,32.5 L 53.5,35 L 53.5,36 L 53,36.5 L 53,93 L 52.5,93.5 L 52.5,95 L 51,96.5 L 50,96.5 L 49,95.5 L 49,94 L 48.5,93.5 L 48.5,54.5 L 48,54 L 48,53 L 47.5,52.5 L 47.5,52 L 45.5,50 L 45,50 L 44.5,49.5 L 44,49.5 L 43.5,49 L 40.5,49 L 40,49.5 L 39,49.5 L 38.5,50 L 38,50 L 36.5,51.5 L 36.5,52 L 36,52.5 L 36,53 L 35.5,53.5 L 35.5,55.5 L 35,56 L 35,115.5 L 35.5,116 L 35.5,121.5 L 36,122 L 36,125 L 36.5,125.5 L 36.5,128 L 37,128.5 L 37,130 L 37.5,130.5 L 37.5,132 L 38,132.5 L 38,134 L 38.5,134.5 L 38.5,135.5 L 39,136 L 39,136.5 L 39.5,137 L 39.5,137.5 L 40,138 L 40,139 L 40.5,139.5 L 40.5,140 L 41,140.5 L 41,141 L 41.5,141.5 L 41.5,142.5 L 42,143 L 42,143.5 L 42.5,144 L 42.5,144.5 L 43,145 L 43,146 L 43.5,146.5 L 43.5,147 L 44,147.5 L 44,148.5 L 44.5,149 L 44.5,149.5 L 45,150 L 45,151 L 45.5,151.5 L 45.5,153 L 46,153.5 L 46,155.5 L 46.5,156 L 46.5,178.5 L 47,179 L 47,179.5 L 47.5,180 L 99.5,180 L 100.5,179 L 100.5,160 L 101,159.5 L 101,157.5 L 101.5,157 L 101.5,155.5 L 102,155 L 102,154 L 102.5,153.5 L 102.5,152.5 L 103,152 L 103,151 L 103.5,150.5 L 103.5,150 L 104,149.5 L 104,149 L 104.5,148.5 L 104.5,147.5 L 105,147 L 105,146.5 L 105.5,146 L 105.5,145.5 L 106.5,144.5 L 106.5,144 L 107,143.5 L 107,143 L 107.5,142.5 L 107.5,142 L 109,140.5 L 109,140 L 111,138 L 111,137.5 L 113.5,135 L 113.5,134.5 L 116.5,131.5 L 116.5,131 L 118,129.5 L 118,129 L 119.5,127.5 L 119.5,127 L 120,126.5 L 120,126 L 121,125 L 121,124.5 L 121.5,124 L 121.5,123.5 L 122.5,122.5 L 122.5,122 L 123,121.5 L 123,121 L 123.5,120.5 L 123.5,120 L 124,119.5 L 124,119 L 124.5,118.5 L 124.5,118 L 125,117.5 L 125,117 L 125.5,116.5 L 125.5,116 L 126,115.5 L 126,115 L 126.5,114.5 L 126.5,114 L 127,113.5 L 127,113 L 127.5,112.5 L 127.5,112 L 128,111.5 L 128,111 L 128.5,110.5 L 128.5,110 L 129,109.5 L 129,109 L 129.5,108.5 L 129.5,108 L 130,107.5 L 130,107 L 130.5,106.5 L 130.5,106 L 131,105.5 L 131,105 L 131.5,104.5 L 131.5,104 L 132,103.5 L 132,103 L 132.5,102.5 L 132.5,102 L 133,101.5 L 133,101 L 133.5,100.5 L 133.5,100 L 134,99.5 L 134,99 L 134.5,98.5 L 134.5,98 L 135,97.5 L 135,97 L 135.5,96.5 L 135.5,96 L 136,95.5 L 136,95 L 136.5,94.5 L 136.5,93 L 137,92.5 L 137,91 L 137.5,90.5 L 137.5,87 L 138,86.5 L 138,85.5 L 136.5,84 L 136.5,84 L 136,84 L 135,83 L 134,83 L 133.5,82.5 L 130.5,82.5 L 130,83 L 128.5,83 L 128,83.5 L 127.5,83.5 L 127,84 L 126.5,84 L 125,85.5 L 124.5,85.5 L 120.5,89.5 L 120.5,90 L 119,91.5 L 119,92 L 118,93 L 118,93.5 L 117.5,94 L 117.5,94.5 L 116.5,95.5 L 116.5,96 L 116,96.5 L 116,97 L 115.5,97.5 L 115.5,98 L 115,98.5 L 115,99 L 114,100 L 114,100.5 L 113.5,101 L 113.5,101.5 L 113,102 L 113,102.5 L 112.5,103 L 112.5,103.5 L 112,104 L 112,104.5 L 111.5,105 L 111.5,105.5 L 111,106 L 111,106.5 L 110.5,107 L 110.5,107.5 L 109.5,108.5 L 109.5,104.5 L 108.5,103.5 L 108.5,37.5 L 109,37 L 109,36 L 108.5,35.5 L 108.5,35 L 106.5,33 L 106,33 L 105,32.5 L 104,32.5 L 103.5,32 L 98.5,32 L 98,32.5 L 97,32.5 L 96.5,33 L 96,33 L 94,35 L 94,35.5 L 93.5,36 L 93.5,86.5 L 93,87 L 93,89.5 L 92.5,90 L 92.5,90.5 L 91.5,91.5 L 90.5,91.5 L 89.5,90.5 L 89.5,90 L 89,89.5 L 89,89 L 88.5,88.5 L 88.5,86.5 L 88,86 L 88,24.5 L 87.5,24 L 87.5,23.5 L 87,23 L 87,22.5 L 85.5,21 L 85,21 L 84.5,20.5 L 84,20.5 L 83.5,20 L 82,20 L 81.5,19.5 Z'
                fill='hsl(var(--muted))'
                stroke='hsl(var(--border))'
                strokeWidth='0.75'
                transform='scale(-1, 1) translate(-150, 0)'
              />
              <text
                x='75'
                y='175'
                textAnchor='middle'
                fill='hsl(var(--muted-foreground))'
                fontSize='10'
              >
                Derecha
              </text>
            </svg>

            {rightHandFingerRegions.map((finger) => (
              <Finger
                key={finger.id}
                finger={finger}
                isRegistered={getFingerStatus(finger.id) === 'registered'}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

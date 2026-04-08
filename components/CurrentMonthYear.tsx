'use client';

import { useEffect, useState } from 'react';

export function CurrentMonthYear() {
  const [monthYear, setMonthYear] = useState('');

  useEffect(() => {
    setMonthYear(
      new Intl.DateTimeFormat('es-MX', {
        month: 'long',
        year: 'numeric',
      }).format(new Date())
    );
  }, []);

  return (
    <p className='text-sm font-medium tracking-wide text-[#8ab4c2]'>
      {monthYear}
    </p>
  );
}


import { useState, useEffect } from 'react';

const useCurrentTime = (formatOptions?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    // second: '2-digit', // Optionally include seconds
  };
  const options = { ...defaultOptions, ...formatOptions };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => {
      clearInterval(timerId); // Cleanup interval on component unmount
    };
  }, []);

  return currentTime.toLocaleString(undefined, options);
};

export default useCurrentTime;
    
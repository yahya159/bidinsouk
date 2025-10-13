'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  endsAt: string;
  timezone: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function Countdown({ endsAt, timezone }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const endTime = new Date(endsAt).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  const formatEndDate = () => {
    const date = new Date(endsAt);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (timeLeft.isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <Clock className="w-4 h-4" />
          <span className="font-semibold">Enchères terminées</span>
        </div>
        <p className="text-sm text-red-600">
          Cette enchère s'est terminée le {formatEndDate()}
        </p>
      </div>
    );
  }

  const timeString = `Il reste ${timeLeft.days} jours ${timeLeft.hours} heures ${timeLeft.minutes} minutes ${timeLeft.seconds} secondes`;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-amber-700 mb-3">
        <Clock className="w-4 h-4" />
        <span className="font-semibold">Temps restant</span>
      </div>
      
      {/* Countdown Display */}
      <div 
        className="grid grid-cols-4 gap-2 mb-3"
        role="timer"
        aria-live="polite"
        aria-label={timeString}
      >
        <div className="text-center">
          <div className="bg-white rounded-lg p-2 border border-amber-200">
            <div className="text-lg font-bold text-amber-700">{timeLeft.days}</div>
            <div className="text-xs text-amber-600">Jours</div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-white rounded-lg p-2 border border-amber-200">
            <div className="text-lg font-bold text-amber-700">{timeLeft.hours}</div>
            <div className="text-xs text-amber-600">Heures</div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-white rounded-lg p-2 border border-amber-200">
            <div className="text-lg font-bold text-amber-700">{timeLeft.minutes}</div>
            <div className="text-xs text-amber-600">Min</div>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-white rounded-lg p-2 border border-amber-200">
            <div className="text-lg font-bold text-amber-700">{timeLeft.seconds}</div>
            <div className="text-xs text-amber-600">Sec</div>
          </div>
        </div>
      </div>

      {/* End Date Info */}
      <div className="text-xs text-amber-600 space-y-1">
        <p>Se termine le: {formatEndDate()}</p>
        <p>Fuseau horaire: {timezone}</p>
      </div>
    </div>
  );
}
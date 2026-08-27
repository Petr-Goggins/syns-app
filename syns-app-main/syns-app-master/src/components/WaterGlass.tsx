import React from 'react';
import './WaterGlass.css';

interface WaterGlassProps {
  currentAmount: number; // мл выпито
  goalAmount?: number; // норма (по умолчанию 2000 мл)
  onClick?: () => void;
}

const WaterGlass: React.FC<WaterGlassProps> = ({ 
  currentAmount, 
  goalAmount = 2000,
  onClick 
}) => {
  const percentage = Math.min((currentAmount / goalAmount) * 100, 100);
  
  return (
    <div className="water-glass-container" onClick={onClick}>
      <div className="water-glass">
        {/* Основной стакан */}
        <svg viewBox="0 0 100 150" className="glass-svg">
          {/* Фон стакана (пустой) */}
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
          </defs>
          
          {/* Контур стакана */}
          <path
            d="M 20 10 L 25 130 Q 25 145 50 145 Q 75 145 75 130 L 80 10 Q 80 5 50 5 Q 20 5 20 10"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />
          
          {/* Вода внутри стакана */}
          <clipPath id="glassClip">
            <path d="M 22 12 L 26 128 Q 26 142 50 142 Q 74 142 74 128 L 78 12 Q 78 7 50 7 Q 22 7 22 12" />
          </clipPath>
          
          {/* Уровень воды с анимацией */}
          <rect
            x="15"
            y={145 - (percentage / 100) * 130}
            width="70"
            height={(percentage / 100) * 130}
            fill="url(#waterGradient)"
            clipPath="url(#glassClip)"
            className="water-fill"
          />
          
          {/* Волна на поверхности воды */}
          {percentage > 0 && (
            <ellipse
              cx="50"
              cy={145 - (percentage / 100) * 130}
              rx="35"
              ry="4"
              fill="rgba(96, 165, 250, 0.5)"
              className="water-wave"
            />
          )}
          
          {/* Блик на стакане */}
          <path
            d="M 30 20 L 32 100"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Процент заполнения */}
        <div className="water-percentage">
          {Math.round(percentage)}%
        </div>
      </div>
      
      {/* Подпись */}
      <div className="water-label">
        Выпито {currentAmount} мл из {goalAmount} мл
      </div>
    </div>
  );
};

export default WaterGlass;

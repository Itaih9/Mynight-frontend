import React from 'react';

interface SplitTextProps {
  text: string;
}

export const SplitText: React.FC<SplitTextProps> = ({ text }) => {
  return (
    <>
      {text.split(/(\s+)/).map((part, index) => {
        if (part.trim() === '') {
          return <span key={index} className="whitespace-pre">{part}</span>;
        }
        return (
          <span key={index} className="word inline-block">
            {part.split('').map((char, charIndex) => (
              <span key={charIndex} className="char inline-block">
                {char}
              </span>
            ))}
          </span>
        );
      })}
    </>
  );
};

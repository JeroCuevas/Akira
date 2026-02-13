interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: string;
}

export function Card({ children, className = '', header }: CardProps) {
  return (
    <div className={`border-2 border-black shadow-brutal bg-white ${className}`}>
      {header && (
        <div className="bg-brutal-yellow border-b-2 border-black px-4 py-2 font-bold font-brutal">
          {header}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

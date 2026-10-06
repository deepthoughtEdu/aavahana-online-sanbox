export const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="absolute inset-0 flex items-center justify-center">
    {children}
  </div>
);
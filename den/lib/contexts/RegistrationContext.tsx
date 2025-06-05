import React, { createContext, useContext, useState } from "react";

type RegistrationData = {
  email: string;
  password: string;
  full_name: string;
  birthday: string; // use ISO string (YYYY-MM-DD)
};

type RegistrationContextType = {
  data: Partial<RegistrationData>;
  setField: <K extends keyof RegistrationData>(field: K, value: RegistrationData[K]) => void;
  reset: () => void;
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Partial<RegistrationData>>({});

  const setField = (field: keyof RegistrationData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => setData({});

  return (
    <RegistrationContext.Provider value={{ data, setField, reset }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error("useRegistration must be used within a RegistrationProvider");
  return context;
};

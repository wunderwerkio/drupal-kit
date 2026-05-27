export type Log = {
  debug: (message: string, additionalInfo?: object) => void;
  info: (message: string, additionalInfo?: object) => void;
  warn: (message: string, additionalInfo?: object) => void;
  error: (message: string, additionalInfo?: object) => void;

  [key: string]: (message: string, additionalInfo?: object) => void;
};

export type Log = {
  debug: (message: string, additionalInfo?: object) => any;
  info: (message: string, additionalInfo?: object) => any;
  warn: (message: string, additionalInfo?: object) => any;
  error: (message: string, additionalInfo?: object) => any;
  [key: string]: any;
};

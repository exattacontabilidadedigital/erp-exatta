// Utilitário para logs de desenvolvimento
export const devLog = (message: string, data?: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context}]` : '[DEV]';
    
    console.log(`${prefix} ${timestamp}: ${message}`);
    
    if (data !== undefined) {
      console.log('Data:', data);
    }
  }
};

export const devError = (message: string, error?: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context} ERROR]` : '[DEV ERROR]';
    
    console.error(`${prefix} ${timestamp}: ${message}`);
    
    if (error !== undefined) {
      console.error('Error:', error);
    }
  }
};

export const devWarn = (message: string, data?: any, context?: string) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const prefix = context ? `[${context} WARN]` : '[DEV WARN]';
    
    console.warn(`${prefix} ${timestamp}: ${message}`);
    
    if (data !== undefined) {
      console.warn('Data:', data);
    }
  }
};

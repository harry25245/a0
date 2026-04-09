export const saveMemory = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`alpha_${key}`, JSON.stringify(value));
  }
};

export const getMemory = (key: string) => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(`alpha_${key}`);
    return data ? JSON.parse(data) : null;
  }
  return null;
};

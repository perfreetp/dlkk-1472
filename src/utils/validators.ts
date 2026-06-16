export function validateCreditCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  const regex = /^[0-9A-HJ-NPQRTUWXY]{18}$/;
  if (!regex.test(code)) {
    return false;
  }
  return true;
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  const regex = /^1[3-9]\d{9}$/;
  return regex.test(phone);
}

export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

export function formatError(errors: any): string {
  if (!errors) {
    return '';
  }
  if (typeof errors === 'string') {
    return errors;
  }
  if (errors.message) {
    return errors.message;
  }
  if (Array.isArray(errors)) {
    return errors.map((e) => formatError(e)).filter(Boolean).join('；');
  }
  if (typeof errors === 'object') {
    const messages: string[] = [];
    for (const key of Object.keys(errors)) {
      const msg = formatError(errors[key]);
      if (msg) {
        messages.push(msg);
      }
    }
    return messages.join('；');
  }
  return String(errors);
}

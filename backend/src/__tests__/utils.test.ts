import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from '../utils/brazilian';
import { 
  validateInternationalDocument, 
  detectCountryFromPhone, 
  formatInternationalPhone 
} from '../utils/international-validators';

describe('Brazilian Utilities Tests', () => {
  describe('CPF Validation', () => {
    test('should validate correct CPF', () => {
      const validCPFs = [
        '11144477735',
        '111.444.777-35',
        '000.000.001-91'
      ];

      validCPFs.forEach(cpf => {
        expect(validateCPF(cpf)).toBe(true);
      });
    });

    test('should reject invalid CPF', () => {
      const invalidCPFs = [
        '11111111111',
        '123.456.789-00',
        '000.000.000-00',
        '123456789',
        'abc.def.ghi-jk'
      ];

      invalidCPFs.forEach(cpf => {
        expect(validateCPF(cpf)).toBe(false);
      });
    });
  });

  describe('CNPJ Validation', () => {
    test('should validate correct CNPJ', () => {
      const validCNPJs = [
        '11444777000161',
        '11.444.777/0001-61'
      ];

      validCNPJs.forEach(cnpj => {
        expect(validateCNPJ(cnpj)).toBe(true);
      });
    });

    test('should reject invalid CNPJ', () => {
      const invalidCNPJs = [
        '11111111111111',
        '11.111.111/1111-11',
        '12345678000100',
        '123456789012'
      ];

      invalidCNPJs.forEach(cnpj => {
        expect(validateCNPJ(cnpj)).toBe(false);
      });
    });
  });

  describe('Brazilian Document Formatting', () => {
    test('should format CPF correctly', () => {
      expect(formatCPF('11144477735')).toBe('111.444.777-35');
      expect(formatCPF('111.444.777-35')).toBe('111.444.777-35');
    });

    test('should format CNPJ correctly', () => {
      expect(formatCNPJ('11444777000161')).toBe('11.444.777/0001-61');
      expect(formatCNPJ('11.444.777/0001-61')).toBe('11.444.777/0001-61');
    });
  });
});

describe('International Utilities Tests', () => {
  describe('International Document Validation', () => {
    test('should validate passport numbers', () => {
      const passports = [
        { type: 'passport', number: 'A1234567', country: 'US' },
        { type: 'passport', number: 'AB123456', country: 'GB' },
        { type: 'passport', number: 'E12345678', country: 'CN' }
      ];

      passports.forEach(doc => {
        expect(validateInternationalDocument(doc.type, doc.number, doc.country)).toBe(true);
      });
    });

    test('should validate ID card numbers', () => {
      const idCards = [
        { type: 'id_card', number: '123456789', country: 'US' },
        { type: 'id_card', number: 'AB123456C', country: 'GB' }
      ];

      idCards.forEach(doc => {
        expect(validateInternationalDocument(doc.type, doc.number, doc.country)).toBe(true);
      });
    });
  });

  describe('Country Detection from Phone', () => {
    test('should detect country from phone number', () => {
      const phoneTests = [
        { phone: '+55 11 99999-9999', expected: 'BR' },
        { phone: '+86 138 0013 8000', expected: 'CN' },
        { phone: '+1 555 123 4567', expected: 'US' },
        { phone: '+44 20 7946 0958', expected: 'GB' },
        { phone: '+49 30 12345678', expected: 'DE' }
      ];

      phoneTests.forEach(test => {
        expect(detectCountryFromPhone(test.phone)).toBe(test.expected);
      });
    });

    test('should return null for invalid phone numbers', () => {
      const invalidPhones = [
        '123456789',
        'abc-def-ghij',
        '+999 123 456 789'
      ];

      invalidPhones.forEach(phone => {
        expect(detectCountryFromPhone(phone)).toBeNull();
      });
    });
  });

  describe('International Phone Formatting', () => {
    test('should format international phone numbers', () => {
      const phoneFormats = [
        { input: '5511999999999', country: 'BR', expected: '+55 11 99999-9999' },
        { input: '8613800138000', country: 'CN', expected: '+86 138 0013 8000' },
        { input: '15551234567', country: 'US', expected: '+1 555 123 4567' }
      ];

      phoneFormats.forEach(test => {
        expect(formatInternationalPhone(test.input, test.country)).toBe(test.expected);
      });
    });
  });
});

describe('Error Handling Tests', () => {
  test('should handle empty inputs gracefully', () => {
    expect(validateCPF('')).toBe(false);
    expect(validateCNPJ('')).toBe(false);
    expect(detectCountryFromPhone('')).toBeNull();
  });

  test('should handle null inputs gracefully', () => {
    expect(validateCPF(null as any)).toBe(false);
    expect(validateCNPJ(null as any)).toBe(false);
    expect(detectCountryFromPhone(null as any)).toBeNull();
  });

  test('should handle undefined inputs gracefully', () => {
    expect(validateCPF(undefined as any)).toBe(false);
    expect(validateCNPJ(undefined as any)).toBe(false);
    expect(detectCountryFromPhone(undefined as any)).toBeNull();
  });
});
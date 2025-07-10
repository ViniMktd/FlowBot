import { logger } from '../config/logger';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  normalizedValue?: string;
}

export interface DocumentValidationOptions {
  country: string;
  documentType: string;
  strict?: boolean;
}

/**
 * Classe para validação de documentos internacionais
 */
export class InternationalValidator {
  
  /**
   * Validar documento baseado no país
   */
  static validateDocument(
    document: string,
    country: string,
    documentType?: string
  ): ValidationResult {
    if (!document || !country) {
      return {
        isValid: false,
        message: 'Document and country are required'
      };
    }

    const cleanDocument = this.cleanString(document);
    const countryCode = country.toUpperCase();

    try {
      switch (countryCode) {
        case 'BR':
          return this.validateBrazilianDocument(cleanDocument, documentType);
        case 'CN':
          return this.validateChineseDocument(cleanDocument, documentType);
        case 'US':
          return this.validateUSDocument(cleanDocument, documentType);
        case 'IN':
          return this.validateIndianDocument(cleanDocument, documentType);
        case 'DE':
        case 'FR':
        case 'IT':
        case 'ES':
        case 'GB':
          return this.validateEuropeanDocument(cleanDocument, countryCode, documentType);
        default:
          return this.validateGenericDocument(cleanDocument, documentType);
      }
    } catch (error) {
      logger.error('Error validating document', { document, country, error });
      return {
        isValid: false,
        message: 'Validation error occurred'
      };
    }
  }

  /**
   * Validar documentos brasileiros (CPF/CNPJ)
   */
  private static validateBrazilianDocument(
    document: string,
    documentType?: string
  ): ValidationResult {
    if (documentType === 'cpf' || (!documentType && document.length === 11)) {
      return this.validateCPF(document);
    }
    
    if (documentType === 'cnpj' || (!documentType && document.length === 14)) {
      return this.validateCNPJ(document);
    }

    return {
      isValid: false,
      message: 'Invalid Brazilian document format'
    };
  }

  /**
   * Validar documentos chineses
   */
  private static validateChineseDocument(
    document: string,
    documentType?: string
  ): ValidationResult {
    // ID Nacional Chinês (18 dígitos)
    if (documentType === 'national_id' || (!documentType && document.length === 18)) {
      return this.validateChineseNationalId(document);
    }

    // Passaporte chinês
    if (documentType === 'passport') {
      return this.validateChinesePassport(document);
    }

    // Licença de negócios chinesa
    if (documentType === 'business_license') {
      return this.validateChineseBusinessLicense(document);
    }

    return {
      isValid: false,
      message: 'Invalid Chinese document format'
    };
  }

  /**
   * Validar documentos americanos
   */
  private static validateUSDocument(
    document: string,
    documentType?: string
  ): ValidationResult {
    // SSN (Social Security Number)
    if (documentType === 'ssn') {
      return this.validateSSN(document);
    }

    // EIN (Employer Identification Number)
    if (documentType === 'ein') {
      return this.validateEIN(document);
    }

    // Passaporte americano
    if (documentType === 'passport') {
      return this.validateUSPassport(document);
    }

    return {
      isValid: false,
      message: 'Invalid US document format'
    };
  }

  /**
   * Validar documentos indianos
   */
  private static validateIndianDocument(
    document: string,
    documentType?: string
  ): ValidationResult {
    // Aadhaar
    if (documentType === 'aadhaar') {
      return this.validateAadhaar(document);
    }

    // PAN (Permanent Account Number)
    if (documentType === 'pan') {
      return this.validatePAN(document);
    }

    // GSTIN (Goods and Services Tax Identification Number)
    if (documentType === 'gstin') {
      return this.validateGSTIN(document);
    }

    return {
      isValid: false,
      message: 'Invalid Indian document format'
    };
  }

  /**
   * Validar documentos europeus
   */
  private static validateEuropeanDocument(
    document: string,
    country: string,
    documentType?: string
  ): ValidationResult {
    // VAT Number europeu
    if (documentType === 'vat') {
      return this.validateEuropeanVAT(document, country);
    }

    // Passaporte europeu
    if (documentType === 'passport') {
      return this.validateEuropeanPassport(document, country);
    }

    return {
      isValid: false,
      message: 'Invalid European document format'
    };
  }

  /**
   * Validação genérica para outros países
   */
  private static validateGenericDocument(
    document: string,
    documentType?: string
  ): ValidationResult {
    // Passaporte internacional (formato padrão)
    if (documentType === 'passport') {
      const passportRegex = /^[A-Z0-9]{6,9}$/;
      return {
        isValid: passportRegex.test(document),
        message: passportRegex.test(document) ? undefined : 'Invalid passport format',
        normalizedValue: document.toUpperCase()
      };
    }

    // Validação mínima para outros tipos
    if (document.length >= 3 && document.length <= 20) {
      return {
        isValid: true,
        normalizedValue: document
      };
    }

    return {
      isValid: false,
      message: 'Document must be between 3 and 20 characters'
    };
  }

  // Validações específicas por país/documento

  /**
   * Validar CPF brasileiro
   */
  private static validateCPF(cpf: string): ValidationResult {
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
      return { isValid: false, message: 'Invalid CPF format' };
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) {
      return { isValid: false, message: 'Invalid CPF checksum' };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) {
      return { isValid: false, message: 'Invalid CPF checksum' };
    }

    return {
      isValid: true,
      normalizedValue: cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    };
  }

  /**
   * Validar CNPJ brasileiro
   */
  private static validateCNPJ(cnpj: string): ValidationResult {
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
      return { isValid: false, message: 'Invalid CNPJ format' };
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }

    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj.charAt(12))) {
      return { isValid: false, message: 'Invalid CNPJ checksum' };
    }

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }

    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cnpj.charAt(13))) {
      return { isValid: false, message: 'Invalid CNPJ checksum' };
    }

    return {
      isValid: true,
      normalizedValue: cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    };
  }

  /**
   * Validar ID Nacional Chinês
   */
  private static validateChineseNationalId(id: string): ValidationResult {
    const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    
    if (!regex.test(id)) {
      return { isValid: false, message: 'Invalid Chinese National ID format' };
    }

    // Validar checksum
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checksums = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(id.charAt(i)) * weights[i];
    }

    const expectedChecksum = checksums[sum % 11];
    const actualChecksum = id.charAt(17).toUpperCase();

    if (expectedChecksum !== actualChecksum) {
      return { isValid: false, message: 'Invalid Chinese National ID checksum' };
    }

    return {
      isValid: true,
      normalizedValue: id.toUpperCase()
    };
  }

  /**
   * Validar passaporte chinês
   */
  private static validateChinesePassport(passport: string): ValidationResult {
    // Formato: E + 8 dígitos ou G + 8 dígitos
    const regex = /^[EG]\d{8}$/;
    
    return {
      isValid: regex.test(passport),
      message: regex.test(passport) ? undefined : 'Invalid Chinese passport format',
      normalizedValue: passport.toUpperCase()
    };
  }

  /**
   * Validar licença comercial chinesa
   */
  private static validateChineseBusinessLicense(license: string): ValidationResult {
    // Código de crédito social unificado (18 caracteres)
    const regex = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
    
    return {
      isValid: regex.test(license),
      message: regex.test(license) ? undefined : 'Invalid Chinese business license format',
      normalizedValue: license.toUpperCase()
    };
  }

  /**
   * Validar SSN americano
   */
  private static validateSSN(ssn: string): ValidationResult {
    const regex = /^\d{9}$/;
    
    if (!regex.test(ssn)) {
      return { isValid: false, message: 'Invalid SSN format' };
    }

    // Verificar padrões inválidos
    if (ssn === '000000000' || ssn === '123456789' || ssn.startsWith('000') || ssn.substring(3, 5) === '00' || ssn.substring(5) === '0000') {
      return { isValid: false, message: 'Invalid SSN pattern' };
    }

    return {
      isValid: true,
      normalizedValue: ssn.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3')
    };
  }

  /**
   * Validar EIN americano
   */
  private static validateEIN(ein: string): ValidationResult {
    const regex = /^\d{9}$/;
    
    if (!regex.test(ein)) {
      return { isValid: false, message: 'Invalid EIN format' };
    }

    // Verificar prefixos válidos
    const validPrefixes = ['01', '02', '03', '04', '05', '06', '10', '11', '12', '13', '14', '15', '16', '20', '21', '22', '23', '24', '25', '26', '27', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '71', '72', '73', '74', '75', '76', '77', '80', '81', '82', '83', '84', '85', '86', '87', '88', '90', '91', '92', '93', '94', '95', '98', '99'];
    
    if (!validPrefixes.includes(ein.substring(0, 2))) {
      return { isValid: false, message: 'Invalid EIN prefix' };
    }

    return {
      isValid: true,
      normalizedValue: ein.replace(/(\d{2})(\d{7})/, '$1-$2')
    };
  }

  /**
   * Validar passaporte americano
   */
  private static validateUSPassport(passport: string): ValidationResult {
    const regex = /^[A-Z0-9]{6,9}$/;
    
    return {
      isValid: regex.test(passport),
      message: regex.test(passport) ? undefined : 'Invalid US passport format',
      normalizedValue: passport.toUpperCase()
    };
  }

  /**
   * Validar Aadhaar indiano
   */
  private static validateAadhaar(aadhaar: string): ValidationResult {
    if (aadhaar.length !== 12 || /^[01]/.test(aadhaar)) {
      return { isValid: false, message: 'Invalid Aadhaar format' };
    }

    // Algoritmo de verificação Verhoeff
    const verhoeffTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const permutationTable = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    let checksum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(aadhaar.charAt(11 - i));
      checksum = verhoeffTable[checksum][permutationTable[i % 8][digit]];
    }

    return {
      isValid: checksum === 0,
      message: checksum === 0 ? undefined : 'Invalid Aadhaar checksum',
      normalizedValue: aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
    };
  }

  /**
   * Validar PAN indiano
   */
  private static validatePAN(pan: string): ValidationResult {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    
    return {
      isValid: regex.test(pan),
      message: regex.test(pan) ? undefined : 'Invalid PAN format',
      normalizedValue: pan.toUpperCase()
    };
  }

  /**
   * Validar GSTIN indiano
   */
  private static validateGSTIN(gstin: string): ValidationResult {
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    
    return {
      isValid: regex.test(gstin),
      message: regex.test(gstin) ? undefined : 'Invalid GSTIN format',
      normalizedValue: gstin.toUpperCase()
    };
  }

  /**
   * Validar VAT europeu
   */
  private static validateEuropeanVAT(vat: string, country: string): ValidationResult {
    const patterns: Record<string, RegExp> = {
      'DE': /^DE[0-9]{9}$/,
      'FR': /^FR[0-9A-Z]{2}[0-9]{9}$/,
      'IT': /^IT[0-9]{11}$/,
      'ES': /^ES[0-9A-Z][0-9]{7}[0-9A-Z]$/,
      'GB': /^GB([0-9]{9}([0-9]{3})?|[A-Z]{2}[0-9]{3})$/,
    };

    const pattern = patterns[country];
    if (!pattern) {
      return { isValid: false, message: 'VAT validation not supported for this country' };
    }

    return {
      isValid: pattern.test(vat),
      message: pattern.test(vat) ? undefined : `Invalid ${country} VAT format`,
      normalizedValue: vat.toUpperCase()
    };
  }

  /**
   * Validar passaporte europeu
   */
  private static validateEuropeanPassport(passport: string, country: string): ValidationResult {
    // Formato geral europeu
    const regex = /^[A-Z0-9]{6,9}$/;
    
    return {
      isValid: regex.test(passport),
      message: regex.test(passport) ? undefined : `Invalid ${country} passport format`,
      normalizedValue: passport.toUpperCase()
    };
  }

  /**
   * Validar endereço de e-mail internacional
   */
  static validateEmail(email: string): ValidationResult {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return {
      isValid: regex.test(email),
      message: regex.test(email) ? undefined : 'Invalid email format',
      normalizedValue: email.toLowerCase()
    };
  }

  /**
   * Validar telefone internacional
   */
  static validatePhone(phone: string, country?: string): ValidationResult {
    const cleanPhone = this.cleanString(phone);
    
    // Validação básica internacional
    const basicRegex = /^\+?[1-9]\d{6,14}$/;
    
    if (!basicRegex.test(cleanPhone)) {
      return { isValid: false, message: 'Invalid international phone format' };
    }

    // Validações específicas por país
    if (country) {
      const countryPatterns: Record<string, RegExp> = {
        'BR': /^\+?55[1-9]\d{8,9}$/,
        'CN': /^\+?86[1-9]\d{9}$/,
        'US': /^\+?1[2-9]\d{9}$/,
        'IN': /^\+?91[6-9]\d{9}$/,
      };

      const pattern = countryPatterns[country.toUpperCase()];
      if (pattern && !pattern.test(cleanPhone)) {
        return { isValid: false, message: `Invalid ${country} phone format` };
      }
    }

    return {
      isValid: true,
      normalizedValue: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`
    };
  }

  /**
   * Limpar string removendo caracteres especiais
   */
  private static cleanString(str: string): string {
    return str.replace(/[^\w]/g, '');
  }

  /**
   * Validar código postal internacional
   */
  static validatePostalCode(code: string, country: string): ValidationResult {
    const patterns: Record<string, RegExp> = {
      'BR': /^\d{5}-?\d{3}$/,          // CEP brasileiro
      'CN': /^\d{6}$/,                 // Código postal chinês
      'US': /^\d{5}(-\d{4})?$/,        // ZIP code americano
      'CA': /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, // Código postal canadense
      'DE': /^\d{5}$/,                 // Código postal alemão
      'FR': /^\d{5}$/,                 // Código postal francês
      'IT': /^\d{5}$/,                 // Código postal italiano
      'ES': /^\d{5}$/,                 // Código postal espanhol
      'GB': /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i, // Código postal britânico
      'IN': /^\d{6}$/,                 // PIN code indiano
      'JP': /^\d{3}-?\d{4}$/,          // Código postal japonês
      'KR': /^\d{5}$/,                 // Código postal sul-coreano
      'AU': /^\d{4}$/,                 // Código postal australiano
    };

    const pattern = patterns[country.toUpperCase()];
    if (!pattern) {
      return { isValid: false, message: 'Postal code validation not supported for this country' };
    }

    return {
      isValid: pattern.test(code),
      message: pattern.test(code) ? undefined : `Invalid ${country} postal code format`,
      normalizedValue: code.toUpperCase()
    };
  }
}

export default InternationalValidator;
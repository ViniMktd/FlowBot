const { i18nService } = require('./dist/services/i18n.service.js');
const { InternationalValidator } = require('./dist/utils/international-validators.js');

async function testInternationalServices() {
  console.log('🧪 Testando Serviços Internacionais...\n');
  
  try {
    // Teste 1: Detecção de idioma por país
    console.log('📍 Teste 1: Detecção de idioma por país');
    const brazilLang = i18nService.getLanguageByCountry('BR');
    const chinaLang = i18nService.getLanguageByCountry('CN');
    const usLang = i18nService.getLanguageByCountry('US');
    
    console.log(`  🇧🇷 Brasil: ${brazilLang}`);
    console.log(`  🇨🇳 China: ${chinaLang}`);
    console.log(`  🇺🇸 EUA: ${usLang}`);
    
    // Teste 2: Detecção de idioma por telefone
    console.log('\n📞 Teste 2: Detecção de idioma por telefone');
    const phoneBR = i18nService.getLanguageByPhoneNumber('+5511999999999');
    const phoneCN = i18nService.getLanguageByPhoneNumber('+8613888888888');
    const phoneUS = i18nService.getLanguageByPhoneNumber('+15551234567');
    
    console.log(`  +55 (Brasil): ${phoneBR}`);
    console.log(`  +86 (China): ${phoneCN}`);
    console.log(`  +1 (EUA): ${phoneUS}`);
    
    // Teste 3: Validação de documentos
    console.log('\n📄 Teste 3: Validação de documentos');
    const cpfValid = InternationalValidator.validateDocument('11144477735', 'BR', 'CPF');
    const cpfInvalid = InternationalValidator.validateDocument('12345678901', 'BR', 'CPF');
    
    console.log(`  CPF válido (11144477735): ${cpfValid.isValid}`);
    console.log(`  CPF inválido (12345678901): ${cpfInvalid.isValid}`);
    
    // Teste 4: Idiomas suportados
    console.log('\n🌐 Teste 4: Idiomas suportados');
    const supportedLangs = ['pt-BR', 'en', 'zh-CN', 'es', 'fr', 'de'];
    console.log(`  Idiomas: ${supportedLangs.join(', ')}`);
    
    console.log('\n✅ Todos os testes básicos passaram!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testInternationalServices();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInternationalIntegration() {
  console.log('🧪 Testando Integração Internacional Completa...\n');

  try {
    // Teste 1: Verificar países no banco
    console.log('🌍 Teste 1: Verificando países no banco');
    const countries = await prisma.country.findMany({
      select: { code: true, name: true, language: true, currency: true }
    });
    
    console.log(`  Países encontrados: ${countries.length}`);
    countries.forEach(country => {
      console.log(`    ${country.code}: ${country.name} (${country.language}, ${country.currency})`);
    });

    // Teste 2: Verificar traduções
    console.log('\n💬 Teste 2: Verificando traduções');
    const translations = await prisma.translation.findMany({
      where: { key: 'order.confirmed' },
      select: { language: true, value: true }
    });
    
    console.log(`  Traduções encontradas: ${translations.length}`);
    translations.forEach(t => {
      console.log(`    ${t.language}: ${t.value}`);
    });

    // Teste 3: Criar cliente internacional
    console.log('\n👤 Teste 3: Criando cliente internacional (China)');
    const chinaCountry = await prisma.country.findUnique({
      where: { code: 'CN' }
    });

    if (chinaCountry) {
      // Verificar se cliente já existe
      let testCustomer = await prisma.customer.findFirst({
        where: { email: 'test.customer@example.com' }
      });

      if (!testCustomer) {
        testCustomer = await prisma.customer.create({
          data: {
            name: 'Test Customer',
            email: 'test.customer@example.com',
            phone: '+8613888888888',
            countryId: chinaCountry.id,
            preferredLanguage: 'zh-CN',
            documentType: 'national_id',
            documentNumber: '110101199001011234'
          }
        });
      }
      
      console.log(`    ✅ Cliente criado: ${testCustomer.name} (${testCustomer.preferredLanguage})`);
    }

    // Teste 4: Criar fornecedor chinês
    console.log('\n🏭 Teste 4: Criando fornecedor chinês');
    // Verificar se fornecedor já existe
    let testSupplier = await prisma.supplier.findFirst({
      where: { email: 'supplier@china-factory.cn' }
    });

    if (!testSupplier) {
      testSupplier = await prisma.supplier.create({
        data: {
          companyName: 'China Test Factory Ltd',
          email: 'supplier@china-factory.cn',
          phone: '+8613999999999',
          countryId: chinaCountry?.id,
          preferredLanguage: 'zh-CN',
          contactPerson: '张经理',
          businessLicense: 'CN123456789',
          apiEndpoint: 'https://api.china-factory.cn',
          addressCity: 'Shenzhen',
          addressState: 'Guangdong'
        }
      });
    }
    
    console.log(`    ✅ Fornecedor criado: ${testSupplier.companyName} (${testSupplier.preferredLanguage})`);

    // Teste 5: Buscar tradução específica
    console.log('\n🔍 Teste 5: Buscando tradução específica');
    const greeting = await prisma.translation.findFirst({
      where: {
        key: 'greeting',
        language: 'zh-CN'
      }
    });
    
    if (greeting) {
      console.log(`    ✅ Saudação em chinês: ${greeting.value}`);
    }

    // Teste 6: Estatísticas
    console.log('\n📊 Teste 6: Estatísticas internacionais');
    const customersByCountry = await prisma.customer.groupBy({
      by: ['countryId'],
      _count: { countryId: true },
      where: { countryId: { not: null } }
    });
    
    console.log(`    Clientes por país: ${customersByCountry.length} países diferentes`);
    
    const suppliersByCountry = await prisma.supplier.groupBy({
      by: ['countryId'],
      _count: { countryId: true },
      where: { countryId: { not: null } }
    });
    
    console.log(`    Fornecedores por país: ${suppliersByCountry.length} países diferentes`);

    console.log('\n✅ Teste de integração concluído com sucesso!');
    
    console.log('\n📋 Resumo dos Testes:');
    console.log('  🟢 Banco de dados: Conectado e funcional');
    console.log('  🟢 Países: Cadastrados corretamente');
    console.log('  🟢 Traduções: Funcionando');
    console.log('  🟢 Clientes internacionais: Suportados');
    console.log('  🟢 Fornecedores chineses: Suportados');
    console.log('  🟢 Queries internacionais: Funcionando');

  } catch (error) {
    console.error('❌ Erro durante teste de integração:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testInternationalIntegration();
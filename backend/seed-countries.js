const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCountries() {
  console.log('🌍 Inserindo dados de países...');

  const countries = [
    {
      code: 'BR',
      name: 'Brasil',
      nameEn: 'Brazil',
      nameLocal: 'Brasil',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
      language: 'pt-BR',
      phonePrefix: '+55'
    },
    {
      code: 'CN',
      name: 'China',
      nameEn: 'China',
      nameLocal: '中国',
      timezone: 'Asia/Shanghai',
      currency: 'CNY',
      language: 'zh-CN',
      phonePrefix: '+86'
    },
    {
      code: 'US',
      name: 'Estados Unidos',
      nameEn: 'United States',
      nameLocal: 'United States',
      timezone: 'America/New_York',
      currency: 'USD',
      language: 'en',
      phonePrefix: '+1'
    },
    {
      code: 'GB',
      name: 'Reino Unido',
      nameEn: 'United Kingdom',
      nameLocal: 'United Kingdom',
      timezone: 'Europe/London',
      currency: 'GBP',
      language: 'en',
      phonePrefix: '+44'
    },
    {
      code: 'DE',
      name: 'Alemanha',
      nameEn: 'Germany',
      nameLocal: 'Deutschland',
      timezone: 'Europe/Berlin',
      currency: 'EUR',
      language: 'de',
      phonePrefix: '+49'
    }
  ];

  for (const country of countries) {
    try {
      await prisma.country.upsert({
        where: { code: country.code },
        update: country,
        create: country
      });
      console.log(`  ✅ ${country.nameEn} (${country.code})`);
    } catch (error) {
      console.log(`  ❌ Erro ao inserir ${country.nameEn}: ${error.message}`);
    }
  }
}

async function seedTranslations() {
  console.log('\n💬 Inserindo traduções básicas...');

  const translations = [
    // Confirmações de pedido
    { key: 'order.confirmed', language: 'pt-BR', value: 'Pedido confirmado com sucesso!', context: 'whatsapp' },
    { key: 'order.confirmed', language: 'en', value: 'Order confirmed successfully!', context: 'whatsapp' },
    { key: 'order.confirmed', language: 'zh-CN', value: '订单确认成功！', context: 'whatsapp' },
    
    // Notificações de envio
    { key: 'order.shipped', language: 'pt-BR', value: 'Seu pedido foi enviado!', context: 'whatsapp' },
    { key: 'order.shipped', language: 'en', value: 'Your order has been shipped!', context: 'whatsapp' },
    { key: 'order.shipped', language: 'zh-CN', value: '您的订单已发货！', context: 'whatsapp' },
    
    // Saudações
    { key: 'greeting', language: 'pt-BR', value: 'Olá {{name}}!', context: 'whatsapp' },
    { key: 'greeting', language: 'en', value: 'Hello {{name}}!', context: 'whatsapp' },
    { key: 'greeting', language: 'zh-CN', value: '您好 {{name}}！', context: 'whatsapp' },
    
    // Agradecimentos
    { key: 'thank_you', language: 'pt-BR', value: 'Obrigado pela preferência!', context: 'whatsapp' },
    { key: 'thank_you', language: 'en', value: 'Thank you for your business!', context: 'whatsapp' },
    { key: 'thank_you', language: 'zh-CN', value: '感谢您的惠顾！', context: 'whatsapp' }
  ];

  for (const translation of translations) {
    try {
      await prisma.translation.upsert({
        where: {
          key_language: {
            key: translation.key,
            language: translation.language
          }
        },
        update: {
          value: translation.value,
          context: translation.context
        },
        create: translation
      });
      console.log(`  ✅ ${translation.key} (${translation.language})`);
    } catch (error) {
      console.log(`  ❌ Erro ao inserir tradução ${translation.key}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await seedCountries();
    await seedTranslations();
    console.log('\n🎉 Seeds executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
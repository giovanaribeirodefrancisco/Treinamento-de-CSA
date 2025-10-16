// migration.js - CRIAR NA RAIZ DO PROJETO
// Este arquivo será usado apenas UMA VEZ para migrar os dados

const mongoose = require('mongoose');

// ⚠️ SUBSTITUA pela sua string de conexão real
const MONGODB_URI = 'mongodb://localhost:27017/treinamento-professores';

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

async function migrateUsers() {
    try {
        console.log('🚀 Iniciando migração dos usuários...');

        // Buscar todos os usuários na collection
        const usersCollection = mongoose.connection.db.collection('users');
        const users = await usersCollection.find({}).toArray();

        console.log(`📋 Encontrados ${users.length} usuários para migrar`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (let user of users) {
            console.log(`\n👤 Processando usuário: ${user.username}`);

            // Verificar se já tem a estrutura nova
            if (user.progresso && user.progresso.etapaAtual !== undefined && user.progresso.dicasUsadas !== undefined) {
                console.log(`   ⏭️  Usuário já migrado, pulando...`);
                skippedCount++;
                continue;
            }

            const updateData = {};
            const unsetData = {};

            // Criar estrutura de progresso
            updateData.progresso = {
                etapaAtual: 0,
                dicasUsadas: {}
            };

            // Migrar treinoProgresso para progresso.etapaAtual
            if (user.treinoProgresso !== undefined) {
                updateData.progresso.etapaAtual = user.treinoProgresso;
                unsetData.treinoProgresso = "";
                console.log(`   📊 Migrando treinoProgresso: ${user.treinoProgresso} → progresso.etapaAtual`);
            }

            // Migrar dicasUsadas (array) para progresso.dicasUsadas (objeto)
            if (user.dicasUsadas && Array.isArray(user.dicasUsadas)) {
                const dicasMap = {};
                user.dicasUsadas.forEach((dica, index) => {
                    if (dica !== undefined && dica !== null) {
                        dicasMap[index.toString()] = dica;
                    }
                });
                updateData.progresso.dicasUsadas = dicasMap;
                unsetData.dicasUsadas = "";
                console.log(`   💡 Migrando dicasUsadas: ${JSON.stringify(user.dicasUsadas)} → progresso.dicasUsadas`);
            }

            // Preparar query de update
            const updateQuery = {};
            if (Object.keys(updateData).length > 0) {
                updateQuery.$set = updateData;
            }
            if (Object.keys(unsetData).length > 0) {
                updateQuery.$unset = unsetData;
            }

            // Executar update
            if (Object.keys(updateQuery).length > 0) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    updateQuery
                );

                console.log(`   ✅ Usuário ${user.username} migrado com sucesso!`);
                migratedCount++;
            } else {
                console.log(`   ⏭️  Nenhuma migração necessária para ${user.username}`);
                skippedCount++;
            }
        }

        console.log('\n🎉 Migração concluída!');
        console.log(`📊 Estatísticas:`);
        console.log(`   - Migrados: ${migratedCount}`);
        console.log(`   - Pulados: ${skippedCount}`);
        console.log(`   - Total: ${users.length}`);

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
    }
}

async function verifyMigration() {
    try {
        console.log('\n🔍 Verificando migração...');

        const usersCollection = mongoose.connection.db.collection('users');
        const users = await usersCollection.find({}).toArray();

        let successCount = 0;
        let errorCount = 0;

        for (let user of users) {
            if (user.progresso &&
                user.progresso.etapaAtual !== undefined &&
                user.progresso.dicasUsadas !== undefined) {
                successCount++;
                console.log(`✅ ${user.username}: OK`);
            } else {
                errorCount++;
                console.log(`❌ ${user.username}: ERRO - estrutura incorreta`);
            }
        }

        console.log(`\n📊 Verificação:`);
        console.log(`   - Corretos: ${successCount}`);
        console.log(`   - Com erro: ${errorCount}`);

        if (errorCount === 0) {
            console.log('🎉 Todos os usuários foram migrados corretamente!');
        } else {
            console.log('⚠️  Alguns usuários não foram migrados corretamente.');
        }

    } catch (error) {
        console.error('❌ Erro na verificação:', error);
    }
}

// Função principal
async function main() {
    await connectToDatabase();

    console.log('🔄 Escolha uma opção:');
    console.log('1. Executar migração');
    console.log('2. Apenas verificar estrutura atual');

    // Para este exemplo, vamos executar a migração
    // Você pode comentar/descomentar conforme necessário

    await migrateUsers();
    await verifyMigration();

    // Fechar conexão
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
    console.log('✨ Processo concluído!');
}

// Executar o script
main().catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
});

// INSTRUÇÕES DE USO:
// 1. Salve este arquivo como 'migration.js' na raiz do seu projeto
// 2. Certifique-se de que a MONGODB_URI está correta
// 3. Execute: node migration.js
// 4. Após a migração bem-sucedida, APAGUE este arquivo

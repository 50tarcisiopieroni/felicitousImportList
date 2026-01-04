const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const COLUNAS_ACESSORIA_VIP_CSV = ["convite", "DDI", "telefone", "Grupo do convite", "Observação do convite", "pessoa"];

const INPUT_FILE = 'input/listaAcessoVip.csv';
const OUTPUT_FILE = 'output/listaFelicitous.csv';

class ConviteFelicitous {
    constructor(obj) {
        this.convite = obj['convite'];
        this.quantidade = 1;
        this.pessoas = obj['pessoa'];
        this.email = null;
        this.telefone = obj['telefone'].replace(/\D/g, '');
    }
}

async function main() {
    const convites = [];
    let cnvd_atual = null;
    let countLinha = 1;

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ ERRO: O arquivo '${INPUT_FILE}' não foi encontrado.`);
        console.error('💡 Verifique se a pasta "input" existe e se o arquivo "listaFelicitous.csv" está dentro dela.');
        process.exit(1);
    }

    console.log('📂 Lendo arquivo CSV...')
    fs.createReadStream(INPUT_FILE)
        .pipe(csv({
            headers: COLUNAS_ACESSORIA_VIP_CSV,
            skipLines: 1
        }))
        .on('data', (linha) => {
          console.log(`📝 Processando linha (${countLinha++})`)
            if (linha['convite'] && linha['convite'].trim() !== "") {
                if (cnvd_atual) convites.push(cnvd_atual);
                cnvd_atual = new ConviteFelicitous(linha);
            } else {
                if (cnvd_atual) {
                    cnvd_atual.quantidade += 1;
                    cnvd_atual.pessoas += ";" + linha["pessoa"];
                }
            }
        })
        .on('end', async () => {
            if (cnvd_atual) convites.push(cnvd_atual);
            const csvWriter = createCsvWriter({
              path: 'output/listaFelicitous.csv',
              header: [
                { id: 'convite', title: 'convite' },
                { id: 'quantidade', title: 'quantidade' },
                { id: 'pessoas', title: 'pessoas' },
                { id: 'email', title: 'email' },
                { id: 'telefone', title: 'telefone' }
              ]
            });
            console.log("🏁 Finalizado a leitura do arquivo")

            try {
                console.log('⚙️  Inicializando salvamento da lista convertida')
                await csvWriter.writeRecords(convites);
                console.log('✅ Arquivo processado com sucesso');
                console.log('---------------------------------------------------------------- ')
                console.log(`✉️  ${convites.length} convites gerados`);
                console.log(`👥 ${countLinha} pessoas consideradas`)
                console.log(`📄 Lista convertida salva em: ${OUTPUT_FILE}`);
                console.log('---------------------------------------------------------------- ')
            } catch (error) {
                console.error('❌ Erro ao salvar arquivo:', error);
            }
        });
}

main();
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const COLUNAS_ACESSORIA_VIP_CSV = ["convite", "DDI", "telefone", "Grupo do convite", "Observação do convite", "pessoa"];

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

    fs.createReadStream('input/lista.csv')
        .pipe(csv({
            headers: COLUNAS_ACESSORIA_VIP_CSV,
            skipLines: 1
        }))
        .on('data', (linha) => {
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

            try {
                await csvWriter.writeRecords(convites);
                console.log('Arquivo processado e salvo com sucesso em output/listaFelicitous.csv');
            } catch (error) {
                console.error('Erro ao salvar arquivo:', error);
            }
        });
}

main();
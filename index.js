const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');

// --- CONFIGURAÇÕES ---
const ARQUIVO_CSV = 'output/resultados.csv';
const URL_INICIAL = 'https://www.felicitous.com.br/login';
const URL_CONVIDADOS = 'https://www.felicitous.com.br/dashboard/convidados';
// ---------------------

function lerCSV(caminho) {
    return new Promise((resolve, reject) => {
        const resultados = [];
        fs.createReadStream(caminho)
            .pipe(csv())
            .on('data', (data) => resultados.push(data))
            .on('end', () => resolve(resultados))
            .on('error', (err) => reject(err));
    });
}

(async () => {
    console.log('📂 Lendo arquivo CSV...');

    let listaConvidados = [];
    try {
        listaConvidados = await lerCSV(ARQUIVO_CSV);
        console.log(`✅ ${listaConvidados.length} convidados carregados.`);
    } catch (e) {
        console.error('❌ Erro ao ler CSV. Verifique se o arquivo existe.', e);
        return;
    }

    const browser = await puppeteer.launch({
        headless: false, // false para você ver o navegador
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();

    try {
        console.log('🌍 Acessando página inicial...');
        await page.goto(URL_INICIAL);

        console.log('⚠️  POR FAVOR, FAÇA O LOGIN MANUALMENTE NO NAVEGADOR.');
        console.log('⏳ O robô está esperando você entrar no Dashboard...');

        await page.waitForFunction(() => window.location.href.includes('dashboard'), { timeout: 0 });
        
        console.log('✅ Login detectado! Iniciando automação...');

    } catch (error) {
        console.log('❌ Erro ao tentar o login')    
    }
    
    await page.goto(URL_CONVIDADOS, { waitUntil: 'networkidle0' });
    
    for (let i = 0; i < listaConvidados.length; i++) {
        const convidado = listaConvidados[i];
        console.log(`📝 Processando (${i+1}/${listaConvidados.length}) convite ${convidado.convite} ` 
            + `${convidado.email == "" ? "" : 'Sem email'} ${convidado.telefone == "" ? "" : 'Sem telefone'}`);

        try {

            await page.evaluate((dados) => {
                const inputs = document.getElementsByClassName("form-control");

                if (inputs[0]) { inputs[1].value = dados.convite; inputs[0].dispatchEvent(new Event('input')); }
                if (inputs[1]) { inputs[2].value = dados.quantidade; inputs[1].dispatchEvent(new Event('input')); }
                if (inputs[3]) { inputs[3].value = dados.email; inputs[3].dispatchEvent(new Event('input')); }
                if (inputs[4]) { inputs[4].value = dados.telefone; inputs[4].dispatchEvent(new Event('input')); }
                if (inputs[2]) { inputs[5].value = dados.pessoas.split(';').join('\n'); inputs[2].dispatchEvent(new Event('input')); }

                const btnSalvar = document.getElementsByClassName("btn btn-success")[0];
                if (btnSalvar) btnSalvar.click();

            }, convidado);

            await page.waitForNavigation({ waitUntil: 'networkidle0' });
            await new Promise(r => setTimeout(r, 1000));

        } catch (erro) {
            console.error(`❌ Erro ao cadastrar ${convidado.email}:`, erro);
            break
        }
    }

    console.log('🎉 Finalizado!');
})();
const fs = require('fs');
const yaml = require('js-yaml');

try {
    // Ler o arquivo YAML
    const fileContents = fs.readFileSync('./movies.yml', 'utf8');
    const data = yaml.load(fileContents);
    
    // Converter para JSON
    const jsonData = JSON.stringify(data, null, 2);
    
    // Salvar como JSON
    fs.writeFileSync('./movies.json', jsonData);
    
    console.log('Arquivo movies.json criado com sucesso!');
} catch (e) {
    console.error('Erro ao converter YAML para JSON:', e);
}

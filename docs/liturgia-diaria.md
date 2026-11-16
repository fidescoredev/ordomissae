# Liturgia diária integrada ao ordinário

## Comportamento

Ao abrir a página, a data local do navegador seleciona a celebração. Os próprios completos são inseridos automaticamente no ordinário, nos lugares do Intróito, Coleta, Epístola, Gradual/Aleluia/Tracto e sequência, Evangelho, Ofertório, Secreta, Prefácio, Comunhão e Pós-Comunhão.

A cobertura é de 1/1/2026 a 31/12/2027: 730 datas. Há seletor de dia e de formulário quando a fonte prevê várias Missas. A navegação não consulta um servidor externo. Os dados compilados são arquivos JavaScript locais, divididos em 24 meses, compatíveis com GitHub Pages e abertura direta por arquivo.

Cada mudança de data remove o conteúdo anterior. Se o mês não existir, falhar ou a data for inválida, o sistema informa a situação e deixa de apresentar os próprios antigos. Um identificador de requisição impede que uma resposta atrasada sobrescreva a data mais recente.

Os próprios participam da busca, da leitura em um ou dois idiomas e da impressão. As respostas R. e os sinais † são apresentados em negrito. Marcações HTML da fonte são lidas em um template inerte e convertidas em texto e elementos criados pela página; scripts, imagens, atributos e controles da fonte não são incorporados.

## Motor e fontes

- Textos e motor: [Divinum Officium](https://github.com/DivinumOfficium/divinum-officium), revisão d6c806624c9dcff6c715ef2d4abc3c9dee25d412.
- Parâmetros de geração: Rubrics 1960 - 1960; latim; português; latim como idioma de reserva; Missa não solene; calendário geral.
- Calendário de consulta: [Ambo Liturgical Calendars](https://github.com/igorlaguiar/ambo-liturgical-calendars), revisão af4a22a4014e9a46cadafc4c2ede4aa784f5a6f2.
- Licenças: arquivos em licenses/ e vendor/.

O gerador usa a precedência e a composição da fonte. Não escolhe uma leitura somente pelo nome da festa: resolve referências aos comuns, conclusões das orações, comemorações, prefácios e variantes. Os nomes do papa e do bispo são mantidos como N. nos trechos gerados que os pedem.

O adaptador de saída fica em scripts/render-mass.pl. Os arquivos originais do motor permanecem sem alterações em vendor/divinum-officium/. A adaptação da saída ocorre em memória. O motor executa com caminhos relativos ao seu próprio diretório, evitando que a substituição interna de missa por horas altere o nome da pasta deste projeto.

## Ritos especiais e variantes

O ordinário de leitura é preservado nas Missas usuais. As conclusões e respostas já presentes nos próprios substituem suas duplicatas no roteiro. O diálogo do prefácio precede o prefácio próprio. As omissões do Glória, Credo e Salmo inicial são obtidas do motor; a omissão do Último Evangelho segue sua regra correspondente, inclusive na terceira Missa de Natal.

Variantes do Communicantes e Hanc igitur são inseridas quando fornecidas pela fonte. O prefácio ilustrativo da Trindade é ocultado após carregar um prefácio para a data, evitando apresentar dois prefácios como parte da mesma Missa.

Semana Santa, celebrações com preâmbulos ou leituras múltiplas e as Missas de Fiéis Defuntos recebem a sequência completa do motor, em lugar de forçar seus textos nos dez campos usuais. O índice acompanha essa sequência. Natal e Fiéis Defuntos oferecem os três formulários presentes na fonte.

A implementação não decide sobre Missas votivas, funerais particulares, solenidades externas ou adaptações locais. A configuração é a indicada acima; uma celebração solene com procissões ou um calendário particular pode exigir outra configuração.

## Traduções e limites

São preservados os textos portugueses disponíveis na fonte. Quando a tradução de uma rubrica ou passagem não existe, o motor pode conservar o latim. Não foram produzidas traduções improvisadas para preencher essas lacunas. A revisão técnica confirma a resolução das referências; não constitui uma revisão independente de todas as traduções ou rubricas.

Os perfis nacionais da base de calendário Ambo não fornecem um próprio nacional tradicional: para 1962, ela declara que usa o calendário geral e altera somente o campo de preceito/penitência. Por isso a página permanece explicitamente no calendário romano geral. Não importa as normas atuais de preceito ou penitência dessa base.

A cor do Domingo de Pentecostes foi corrigida para vermelho, conforme a errata declarada pela fonte de calendário. No Domingo de Ramos, as referências da bênção dos ramos e da Paixão são distinguidas.

Fora dos dois anos incluídos, a página não calcula outra festa nem reutiliza uma data. Novos anos e calendários locais exigem geração e conferência apropriadas.

## Manutenção

1. npm run generate:propers executa o motor local e gera os 24 arquivos mensais e content/propers-manifest.json. A geração falha quando encontra referência não resolvida ou campo necessário ausente.
2. npm run build atualiza index.html, os dados de calendário e o manifesto usado pelo navegador.
3. npm run check verifica o ordinário, o calendário e os próprios.

A geração requer Node.js e Perl com suas bibliotecas indicadas no README. Para ler ou hospedar a página pronta, ambos são dispensáveis. A revisão do motor e a lista de dados estão em vendor/upstream.json; um cache descartável fica em .preview/engine/.

## Verificação

Foram verificados os 730 dias, os 24 arquivos e seus hashes, a cobertura dos dez próprios nas Missas usuais e a ausência de marcadores de referência não resolvida. Casos específicos incluem os comuns de Santa Gertrudes, Septuagésima, Ramos e Tríduo, Pentecostes, Anunciação transferida em 2027, Natal e Fiéis Defuntos com três formulários.

No navegador, foram testadas a inserção dos próprios, a busca pelo conteúdo inserido, a troca de data sem texto residual, a mudança de formulário, o rito completo de Ramos, as opções de leitura e a impressão. As larguras de 320, 390, 768 e 1440 pixels foram verificadas, com inspeção visual no computador e no celular.

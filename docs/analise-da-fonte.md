# Análise da referência

## Endereços e alcance da conferência

- Referência solicitada: `https://web.archive.org/web/20260420122206/https://rumoasantidade.com.br/ordinario-da-missa-na-forma-extraordinaria/`.
- Fonte acessível: `https://rumoasantidade.com.br/ordinario-da-missa-na-forma-extraordinaria/`.
- Data desta implementação: 16 de novembro de 2026.

A consulta ao Wayback não retornou uma versão recuperável. Foi possível consultar o conteúdo textual da página atual. Não foi possível comprovar sua identidade com a captura solicitada, nem recuperar seu HTML original e a ilustração para uma reprodução visual fiel.

O objetivo da implementação é oferecer um ordinário digital de leitura que cubra a sequência temática da referência. Não se trata de um espelho do portal: categorias, navegação institucional, últimas publicações e a ilustração do artigo são remetidas à fonte. Os textos explicativos foram adaptados; as traduções dos cânticos foram redigidas para esta edição.

## Estrutura encontrada

O artigo contém preparação, Missa dos Catecúmenos, Ofertório, Cânon, Comunhão, despedida, Último Evangelho, preces finais e cânticos. Há textos em português e latim apresentados em paralelo, orientações de postura, rubricas, explicações e dez remissões ao próprio da celebração.

Essas remissões não são leituras completas nem uma integração com calendário. A referência tampouco oferece, nesse artigo, um conjunto de próprios para o ano. A implementação conserva dez campos de consulta ao missal:

| Número | Texto variável |
| --- | --- |
| 1 | Intróito |
| 2 | Coleta |
| 3 | Epístola |
| 4 | Gradual, Aleluia ou Tracto |
| 5 | Evangelho |
| 6 | Antífona do Ofertório |
| 7 | Secreta |
| 8 | Prefácio |
| 9 | Antífona da Comunhão |
| 10 | Pós-Comunhão |

O prefácio da Santíssima Trindade também é transcrito, pois está presente como exemplo completo na referência.

## Mapa da adaptação

| Grupo | Etapas e conteúdo |
| --- | --- |
| Preparação | Orações ao pé do altar e Salmo 42; Confiteor; preces de misericórdia e absolvição; versículos, subida, beijo e incensação inicial do altar. |
| Ante-Missa | Intróito; nove invocações do Kyrie; Glória; Coleta; Epístola; Gradual, Aleluia e Tracto; Munda cor meum, anúncio e conclusão do Evangelho; homilia; Credo. |
| Ofertório | Saudação e antífona; oferecimento do pão; bênção da água e mistura ao vinho; oferecimento do cálice; entrega dos fiéis; invocação ao Espírito Santo; incensação; Salmo do Lavabo; oração à Trindade; Orate fratres e resposta; Secreta. |
| Cânon | Diálogo do prefácio; prefácio da Trindade; Sanctus; Te igitur; Memento dos vivos; Communicantes; Hanc igitur; Quam oblationem; consagração do pão e do vinho; Unde et memores; Supra quae; Supplices; Memento dos defuntos; Nobis quoque; doxologia e Amém. |
| Comunhão | Pai-Nosso; Libera nos; fração e mistura; Agnus Dei e variante de Requiem; oração pela paz; duas orações preparatórias; comunhão do sacerdote e dos fiéis; abluções e ação de graças. |
| Conclusão | Antífona da Comunhão; Pós-Comunhão; Ite, Missa est; Placeat tibi; bênção; prólogo de São João e resposta final. |
| Preces e cânticos | Três Ave-Marias; Salve-Rainha, versículos e oração; São Miguel; três invocações ao Sagrado Coração; Adoro te devote; Pange lingua com Tantum ergo; Jesu dulcis memoria; Ave Regina caelorum; Regina caeli; Ave verum Corpus. |

O conteúdo foi organizado em 49 etapas. Os 157 pares de texto incluem diálogos curtos e orações longas; essa contagem não significa 157 orações distintas. Todos os pares têm uma única etapa de destino, verificada por `scripts/check.mjs`.

## Decisões editoriais e pontos de revisão

- As notas foram reescritas para conservar a função de cada trecho e reduzir a extensão entre as orações. Portanto, não há promessa de identidade palavra por palavra com a prosa do portal.
- As traduções portuguesas dos cânticos são traduções de leitura desta edição, sem pretensão de adaptação musical ou de edição oficial.
- As instruções de postura são as do roteiro consultado. Não foram acrescentadas regras externas para preencher suas lacunas.
- O segundo Confiteor, antes da Comunhão dos fiéis, permanece por estar na fonte. Essa preservação documental não constitui uma decisão sobre qual rubrica aplicar em determinada celebração.
- A nota sobre Leão XIII, Pio XI, a Rússia e a antiga contagem de indulgências está identificada como histórica. Não é apresentada como concessão atual.
- Não foram acrescentados nomes atuais de papa ou bispo. Os espaços indicados pelo roteiro são mantidos.
- O texto tradicional conserva possíveis problemas da transcrição de origem. Exemplos: a abertura portuguesa termina em “Espírito”, sem “Santo”; aparecem grafias latinas como “exuadi”, “sede t”, “Viginis” e “quotibianum”; a incensação contém repetição de uma expressão latina; uma fórmula de distribuição menciona “Corpo e Sangue” em português, enquanto o latim traz apenas “Corpus”. Esses pontos exigem cotejo com uma edição do missal antes de correção editorial.
- Espaços ausentes depois de sinais de pontuação foram normalizados na apresentação. Palavras não foram corrigidas silenciosamente por esse processo.
- A seção diária acrescentada posteriormente fornece calendário e textos completos dos próprios para 2026 e 2027, inseridos automaticamente pelo resultado do motor do Divinum Officium. Gravações de canto e a imagem do artigo não estão incorporadas. A imagem e os elementos gerais do portal podem ser vistos no endereço da fonte. Consulte [o alcance da integração diária](liturgia-diaria.md).

## Solução técnica

A hospedagem é inteiramente estática. O HTML final contém o texto, e CSS/JavaScript locais oferecem os recursos de leitura. Não há chamadas à fonte em tempo de execução, nem dependência do Wayback. Os endereços relativos permitem publicar em uma subpasta do GitHub Pages.

O gerador em Node.js serve à manutenção do conteúdo e não é necessário para hospedar a página pronta. Para o usuário, basta abrir o arquivo ou acessar a publicação. Preferências e marcador são locais ao navegador, com funcionamento na sessão mesmo quando a gravação é indisponível.

## Validação realizada

- Cobertura das 49 etapas, dos 157 pares e das dez remissões.
- Unicidade de IDs, resolução dos links internos e presença dos recursos locais.
- Sintaxe do JavaScript e geração do HTML.
- Navegador Chromium: seleção de idioma, busca sem acentos e busca vazia, tamanho da letra, ocultação de notas, persistência e remoção do marcador, abertura e fechamento do índice móvel e estilos de impressão.
- Ausência de rolagem horizontal nas larguras de 320, 390, 768 e 1440 pixels; inspeção visual das capturas de computador e celular.

A validação técnica não substitui o cotejo litúrgico e linguístico descrito acima. A publicação no GitHub não foi executada, pois nenhum repositório de destino foi indicado.

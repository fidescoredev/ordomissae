# Ordo Missæ

Página estática do Ordinário da Missa na Forma Extraordinária, em português e latim, preparada para GitHub Pages.

Abra **[index.html](index.html)** no navegador para ler a página. Não é necessário instalar dependências, executar um build ou ter um servidor para usar a versão pronta.

## Conteúdo e recursos

- 49 etapas: preparação, Ante-Missa, Ofertório, Cânon, Comunhão, conclusão, preces e cânticos.
- 157 pares de texto em português e latim, incluindo os diálogos e orações longas.
- Índice lateral no computador e índice em janela no celular.
- Busca por palavras, inclusive sem acentos; várias palavras são combinadas na mesma etapa.
- Leitura bilíngue, português ou latim; ajuste de letra e exibição de notas.
- Uma etapa marcada para retomar, com preferências salvas no navegador quando o armazenamento local está disponível.
- Estilo de impressão. A impressão inclui todas as etapas, mesmo com uma busca ativa, no idioma selecionado.
- Ordinário fixo legível sem JavaScript; a inserção dos próprios usa JavaScript e arquivos locais.
- Consulta diária de 2026 e 2027 pelo calendário romano geral de 1962, com data, celebração, classe, cor e referências das leituras.
- Textos completos dos próprios inseridos automaticamente no ordinário, em português e latim, com formulários de Natal e Defuntos e ritos especiais.
- Sem fontes tipográficas externas, anúncios, rastreamento, banco de dados ou chamadas externas durante a leitura.

## Publicar no GitHub Pages

Repositório de destino: [fidescoredev/ordomissae](https://github.com/fidescoredev/ordomissae).

1. Envie o projeto para o branch `main`, incluindo `.github/workflows/pages.yml` e os arquivos gerados de `assets/propers/`. As pastas `.preview/`, `source/` e `dist/` ficam fora do Git.
2. No repositório, abra [Settings → Pages](https://github.com/fidescoredev/ordomissae/settings/pages) e selecione **GitHub Actions** como fonte de publicação. Essa configuração inicial precisa de uma conta com acesso de administração ao repositório.
3. Em **Actions**, acompanhe o workflow **Publicar GitHub Pages**. Ele gera o HTML, executa as verificações, prepara a pasta `dist/` e publica somente seus arquivos públicos.
4. Após o workflow terminar com sucesso, abra a URL exibida na etapa de publicação. O endereço esperado, sem domínio próprio, é `https://fidescoredev.github.io/ordomissae/`.

Cada novo push em `main` executa a publicação. Também é possível executar o workflow manualmente por **Run workflow**.

Para verificar o pacote local antes do envio:

```sh
npm run build:pages
```

O pacote contém `index.html`, `.nojekyll`, `assets/` e `licenses/`. Os caminhos relativos funcionam na subpasta `/ordomissae/`. Os dados dos próprios já estão gerados: o workflow não precisa de Perl nem de acesso ao Divinum Officium.

O resultado de cada publicação pode ser acompanhado em [Actions](https://github.com/fidescoredev/ordomissae/actions). Referência: [documentação oficial de GitHub Pages com Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Editar

Requer Node.js 18 ou superior apenas para regenerar ou verificar a página. Nenhum `npm install` é necessário.

```sh
npm run build
npm run check
npm start
```

A prévia abre em `http://127.0.0.1:4173/`. Encerre o servidor com `Ctrl+C`.

| Arquivo | Finalidade |
| --- | --- |
| `content/prayers.json` | Pares de orações; `line` e `end` identificam o trecho na extração da fonte consultada. |
| `content/sections.json` | Índice, títulos, notas, posturas e distribuição das orações. |
| `scripts/build.mjs` | Gera o HTML e o pacote local de dados do calendário. |
| `content/calendar-1962.json` | Calendário romano geral de 1962, para os anos 2026 e 2027. |
| `assets/daily.js` e `assets/daily.css` | Consulta diária e escolha de data. |
| `assets/propers.js`, `assets/propers.css` e `assets/propers/` | Inserção e leitura dos próprios gerados, divididos em 24 arquivos mensais. |
| `scripts/generate-propers.mjs` e `scripts/render-mass.pl` | Geração estática dos próprios a partir do motor e dos textos em `vendor/`. |
| `assets/style.css` | Aparência, leitura no celular e impressão. |
| `assets/app.js` | Busca, preferências, índice móvel e marcador. |
| `docs/analise-da-fonte.md` | Escopo, mapa do conteúdo e limites da conferência. |

Depois de alterar os arquivos de conteúdo ou o gerador, execute `npm run build` e envie também o `index.html` atualizado ao GitHub. Mudanças diretas em `index.html` serão substituídas na próxima geração.

## Conferência

`npm run check` verifica a cobertura das 49 etapas e dos 157 pares, as dez remissões ao próprio, os links internos, os arquivos locais e a sintaxe do JavaScript.

O roteiro opcional de teste em Chromium verifica as interações e as larguras de 320, 390, 768 e 1440 pixels. Com a prévia em execução:

```sh
node scripts/browser-check.mjs CAMINHO_DO_CHROMIUM
```

Esse teste usa um perfil temporário isolado em `.preview/` e produz capturas para inspeção. A pasta está excluída do Git. O navegador executa sem sandbox interno para compatibilidade com o ambiente de teste; use esse roteiro apenas com a página local controlada.

## Fonte e tratamento editorial

Fonte consultada: [Rumo à Santidade — Ordinário da Missa na Forma Extraordinária](https://rumoasantidade.com.br/ordinario-da-missa-na-forma-extraordinaria/).

O pedido original apontava para a [captura de 20/04/2026 no Wayback Machine](https://web.archive.org/web/20260420122206/https://rumoasantidade.com.br/ordinario-da-missa-na-forma-extraordinaria/). Como não foi possível recuperar essa captura, esta implementação usa a versão atual acessível. **Não é uma reprodução comprovadamente idêntica à captura arquivada.**

As explicações são uma adaptação editorial. Os cânticos têm tradução de leitura preparada para esta edição. A sequência das orações e as variantes do roteiro de origem foram conservadas; possíveis erros tipográficos e divergências entre os idiomas precisam de revisão litúrgica e linguística antes de uma edição de referência.

Os dez próprios da Missa do dia não são fornecidos pela página de origem. Esta edição os preenche com os textos resolvidos pelo motor do Divinum Officium para a data selecionada. A ilustração, as categorias e os menus gerais do portal não foram incorporados; permanecem acessíveis pelo link da fonte.

A atribuição não constitui licença sobre material de terceiros. Nenhuma licença geral foi aplicada aos textos provenientes da fonte. Não há vínculo institucional com o portal original.

## Liturgia diária de 1962

A seção **Liturgia do dia** usa o calendário romano geral de 1962, sob as rubricas de 1960, para **2026 e 2027**. Ao escolher uma data, os textos completos dos próprios são inseridos nos dez pontos correspondentes do ordinário. A leitura funciona sem conexão e também ao abrir `index.html` diretamente.

Os arquivos são carregados por mês, a partir da própria pasta da página. A troca de data limpa os textos anteriores; datas fora da cobertura mostram uma mensagem, sem aproveitar a festa de outro dia. A busca, as opções de idioma, os destaques das respostas e dos sinais da cruz e a impressão abrangem o conteúdo inserido.

O gerador resolve os comuns, conclusões, comemorações e prefácios pelo motor do Divinum Officium. Quando a celebração pede outra sequência — Semana Santa, leituras múltiplas ou Requiem — a página apresenta seu rito completo. Natal e Fiéis Defuntos têm seletor de formulário. As omissões do Glória, do Credo, do Salmo inicial e do Último Evangelho acompanham os dados resolvidos para a Missa.

As traduções são as disponíveis na fonte. Algumas rubricas ou passagens sem tradução portuguesa podem permanecer em latim. O calendário geral não incorpora festas próprias do Brasil, de dioceses ou de comunidades. O link externo continua disponível para conferência, mas não é necessário para ler os textos incluídos.

Fontes:
- Calendário: [Ambo Liturgical Calendars](https://github.com/igorlaguiar/ambo-liturgical-calendars), derivado do Divinum Officium, com [licença MIT](licenses/ambo-liturgical-calendars.txt).
- Textos e resolução dos próprios: [Divinum Officium](https://github.com/DivinumOfficium/divinum-officium), revisão `d6c806624c9dcff6c715ef2d4abc3c9dee25d412`, com [licença conservada](licenses/divinum-officium.txt).

Para publicar, mantenha **todos os arquivos de `assets/propers/`**, além dos demais recursos de `assets/` e de `licenses/`. A hospedagem continua inteiramente estática no GitHub Pages.

Para regenerar os textos, é necessário Node.js 18+ e Perl com `JSON::PP`, `HTML::Entities` e `URI`. Os módulos CGI necessários estão incluídos em `vendor/perl/`. No Windows, o gerador detecta o Perl distribuído com Git; em outro ambiente, use `ORDO_PERL` para indicar o executável, se necessário.

```sh
npm run generate:propers
npm run build
npm run check
```

O comando de geração usa os arquivos locais de `vendor/` e não requer internet. O cache de geração em `.preview/engine/` é descartável e não deve ser enviado ao GitHub. Para repetir apenas a importação do calendário, `npm run sync:calendar` exige conexão. Nenhum desses comandos é necessário para hospedar os arquivos prontos.

Detalhes e limites: [integração da liturgia diária](docs/liturgia-diaria.md).

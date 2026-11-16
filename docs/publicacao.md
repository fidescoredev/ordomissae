# Publicação no GitHub Pages

Destino: https://github.com/fidescoredev/ordomissae

Branch de publicação: main. Fonte do Pages: GitHub Actions.

## Fluxo preparado

O workflow .github/workflows/pages.yml executa npm run build:pages. Esse comando gera o HTML, verifica o ordinário, os 730 dias do calendário e os próprios, e prepara os arquivos públicos em dist/.

Depois das verificações, as ações oficiais do GitHub enviam o artefato e publicam no ambiente github-pages. O workflow informa a URL efetivamente publicada. O endereço padrão esperado é https://fidescoredev.github.io/ordomissae/.

O artefato inclui somente index.html, .nojekyll, assets/ e licenses/. Os geradores, arquivos-fonte e bibliotecas de manutenção permanecem no repositório, fora do artefato hospedado. A pasta assets/propers/ contém todos os 24 meses necessários à leitura diária.

## Configuração inicial

A conta usada para o envio precisa poder escrever no repositório e adicionar o workflow. A ativação inicial do Pages requer acesso de administração: Settings → Pages → Build and deployment → Source → GitHub Actions.

O token padrão do workflow publica os artefatos depois dessa ativação. Ele não substitui a autorização inicial da conta proprietária para habilitar o serviço. Nenhum token pessoal foi incluído no código ou na configuração.

## Validação e acompanhamento

1. Executar npm run build:pages localmente.
2. Enviar o projeto para main.
3. Conferir o workflow Publicar GitHub Pages no repositório.
4. Confirmar seu resultado e a URL de saída.
5. Verificar a página publicada e o carregamento de um arquivo mensal em /ordomissae/assets/propers/.

O código foi preparado para caminhos relativos, sem exigir domínio próprio. Falhas de autenticação, de ativação do Pages ou de execução do workflow não devem ser apresentadas como publicação concluída.

Referência: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

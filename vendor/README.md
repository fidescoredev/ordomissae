# Fontes do gerador

O subconjunto de `divinum-officium` necessário ao Missal romano, aos anos 2026–2027 e às línguas latina e portuguesa está em `divinum-officium/`. A revisão exata está em `upstream.json`; a licença original acompanha o código. Os arquivos do projeto de origem não foram alterados.

`perl/` contém os módulos CGI.pm necessários à execução local, da revisão `8dbb2ec0a7736b7d92d03ed0036d29e56ad80f6f` do repositório `leejo/CGI.pm`, com sua licença. Não são executados no navegador.

O gerador local `scripts/render-mass.pl` adapta apenas a saída do motor em memória, exportando os blocos já resolvidos para o aplicativo. Usa o diretório do motor como diretório de trabalho para que os caminhos de seus comuns permaneçam relativos.

A hospedagem da página pronta requer somente arquivos estáticos; Perl é necessário apenas para regenerar os próprios.

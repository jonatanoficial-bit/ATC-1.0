# Simulador ATC (Estágio 2)

Este projeto é um protótipo de um simulador de controle de tráfego aéreo (ATC) construído com **HTML**, **CSS** e **JavaScript**.  Ele implementa a primeira etapa de desenvolvimento de um jogo de navegador no qual o jogador atua como controlador.  O design e os recursos foram inspirados em simuladores profissionais e nas diretrizes de telas de radar【807708321175031†L41-L69】 e procedimentos de reconhecimento de voz【802175147168733†L272-L317】.

## Funcionalidades

* **Tela de Radar** — Um canvas escuro com anéis concêntricos e linhas de referência.  Aeronaves aleatórias surgem pelas bordas e atravessam o setor.
* **Tipos de Aeronaves** — Aeronaves pesadas (H), médias (M) e leves (L) aparecem com tamanhos e cores diferentes e são rotuladas com o callsign e altitude/velocidade atuais【807708321175031†L41-L55】.
* **Pistas Numeradas** — Cada aeroporto tem orientação magnética própria e os números de pista são calculados automaticamente a partir desse rumo.  Os números são desenhados nas extremidades da pista de acordo com o método utilizado pelo DECEA【85487694131555†L123-L138】.
* **Sistema de Comandos** — Digite comandos ou use voz:
  - `TL` / `TR` – virar à esquerda/direita para um novo rumo e, opcionalmente, ajustar a velocidade.
  - `CL` / `DS` – subir ou descer para uma altitude alvo.
  - `SPD` – alterar a velocidade da aeronave.
  - Botões rápidos para ações frequentes: APP (aproximação), ALT± (subir/descer 1&nbsp;000 pés), SPD± (alterar velocidade), TL/TR90 (virar 90°), Taxi (clearance de táxi) e Decolar (clearance de decolagem). Basta selecionar a aeronave clicando no radar e pressionar o botão desejado.
* **Interface Bilingue** — A interface do jogo (botões, log e instruções) está em português, enquanto as falas do piloto e do controlador são sintetizadas em inglês seguindo a fraseologia padrão.
* **Lobby Inicial Cinematográfico** — Ao abrir o site, o jogador vê um lobby com fundo cinematográfico e instruções básicas.  Clicar em **Iniciar** revela o radar e inicia o jogo.
* **Seleção pelo Radar e Jogabilidade Melhorada** — Agora é possível clicar diretamente na aeronave no radar para selecioná‑la.  O callsign é automaticamente preenchido no campo de comando, e comandos rápidos ficam disponíveis para envio imediato.  Isso melhora a jogabilidade, oferecendo maior fluidez e aproximando‑se das operações de torre reais.
* **Registro de Transmissões com Efeito de Máquina de Escrever** — As comunicações aparecem letra por letra para simular transmissões de rádio.  O áudio é reproduzido em inglês para treinar a audição do controlador.
* **Pontuação e Níveis** — Ganhe pontos por pousos seguros e uso correto de comandos; perca pontos por colisões ou aeronaves que deixam o setor sem autorização.  O nível avança conforme a pontuação acumulada.
* **Estrutura Extensível** — O código é modular e comentado para permitir melhorias futuras, como física mais realista, comandos adicionais, meteorologia e modo carreira.

* **PWA Instalável no Android** — Um botão de instalação aparece quando o navegador detecta que o aplicativo pode ser instalado.  O serviço de worker e o manifesto permitem adicionar o simulador à tela inicial em dispositivos Android.

## Executando Localmente

1. Abra `index.html` em um navegador de desktop moderno (preferencialmente Chrome ou Edge).  O reconhecimento de voz requer suporte à API Web Speech.
2. Na tela de lobby, leia as instruções e clique em **Iniciar**.  Isso exibe o radar e começa o jogo.
3. Observe as aeronaves entrando no setor.  Clique no campo de comando e digite instruções como `H332 TL 180 250` ou `M101 CL 12000`.  Pressione **Enviar** ou `Enter` para transmiti-las.
4. Clique no botão de microfone para falar um comando.  Fale claramente em inglês seguindo o formato; o sistema preencherá automaticamente o campo de texto.

## Próximos Passos

This is just the first step towards a professional ATC simulation.  Future iterations could include:

* Dinâmica de voo realista e separação mínima de aeronaves.
* Múltiplos setores, pistas paralelas e táxi.
* Meteorologia e áreas restritas.
* Modo carreira com vozes de piloto/controlador em vários idiomas.
* Preferências de usuário e armazenamento de progresso.

Contributions and suggestions are welcome!  Feel free to fork this project on GitHub and expand its capabilities.
# Simulador ATC (Estágio 4)

Este projeto é um protótipo de um simulador de controle de tráfego aéreo (ATC) construído com **HTML**, **CSS** e **JavaScript**.  Ele evolui para a terceira etapa de desenvolvimento de um jogo de navegador no qual o jogador atua como controlador.  O design e os recursos foram inspirados em simuladores profissionais e nas diretrizes de telas de radar【807708321175031†L41-L69】 e procedimentos de reconhecimento de voz【802175147168733†L272-L317】.

## Funcionalidades Gerais

* **Tela de Radar** — Um canvas escuro com anéis concêntricos e linhas de referência.  Aeronaves aleatórias surgem pelas bordas e atravessam o setor.  Aeronaves no solo agora aparecem na região do terminal e iniciam um ciclo completo de operação.
* **Tipos de Aeronaves** — Aeronaves pesadas (H), médias (M) e leves (L) aparecem com tamanhos e cores diferentes e são rotuladas com o callsign e altitude/velocidade atuais【807708321175031†L41-L55】.
* **Aeronaves e Companhias Reais** — Em vez de identificadores genéricos, cada aeronave agora possui um **modelo real** (por exemplo, B747, B737, A320, A350, Citation) e um **indicativo baseado em companhias de aviação** (LATAM, Gol, Azul, Emirates, Lufthansa, American, Delta, United, etc.) ou um prefixo de matrícula para jatos executivos (como PR‑ABC).  Isso diversifica o tráfego e aproxima o ambiente do mundo real.
* **Pistas Numeradas** — Cada aeroporto tem orientação magnética própria e os números de pista são calculados automaticamente a partir desse rumo.  Os números são desenhados nas extremidades da pista de acordo com o método utilizado pelo DECEA【85487694131555†L123-L138】.
* **Sistema de Comandos** — Digite comandos ou use voz:
  - `TL` / `TR` – virar à esquerda/direita para um novo rumo e, opcionalmente, ajustar a velocidade.
  - `CL` / `DS` – subir ou descer para uma altitude alvo.
  - `SPD` – alterar a velocidade da aeronave.
  - **Botões rápidos**: APP (aproximação), ALT± (subir/descer 1&nbsp;000&nbsp;ft), SPD± (alterar velocidade), TL/TR90 (virar 90°), **Start** (acionar motores), **Push** (pushback e táxi até a pista), **LUW** (alinhar e aguardar na pista), **Final** (autorizar final), Taxi (clearance de táxi) e Decolar (clearance de decolagem).  Basta selecionar a aeronave clicando no radar e pressionar o botão desejado.
* **Interface Bilingue** — A interface do jogo (botões, log e instruções) está em português, enquanto as falas do piloto e do controlador são sintetizadas em inglês seguindo a fraseologia padrão.
* **Vozes Diferenciadas** — O sintetizador usa vozes distintas para piloto e controlador, melhorando a imersão auditiva e destacando cada interlocutor.
* **Lobby Inicial Cinematográfico** — Ao abrir o site, o jogador vê um lobby com fundo cinematográfico e instruções básicas.  Clicar em **Iniciar** revela o radar e inicia o jogo.
* **Seleção pelo Radar e Jogabilidade Melhorada** — É possível clicar diretamente na aeronave no radar para selecioná‑la.  O callsign é automaticamente preenchido no campo de comando, e comandos rápidos ficam disponíveis para envio imediato.  Isso melhora a jogabilidade, oferecendo maior fluidez e aproximando‑se das operações de torre reais.
* **Painel da Aeronave Selecionada** — Um painel lateral mostra detalhes da aeronave em foco (callsign, modelo, altitude, velocidade e estado), permitindo ao controlador acompanhar cada voo como em um strip board.
* **Registro de Transmissões com Efeito de Máquina de Escrever** — As comunicações aparecem letra por letra para simular transmissões de rádio.  O áudio é reproduzido em inglês para treinar a audição do controlador.
* **Trilhas e Linhas Radiais** — Cada aeronave deixa um rastro visível da sua trajetória recente e o radar agora exibe linhas radiais a cada 45°, aproximando a visualização de sistemas profissionais.
* **Pontuação e Níveis** — Ganhe pontos por pousos seguros, taxi até o gate e uso correto de comandos; perca pontos por colisões ou aeronaves que deixam o setor sem autorização.  O nível avança conforme a pontuação acumulada.
* **Estrutura Extensível** — O código é modular e comentado para permitir melhorias futuras, como física mais realista, comandos adicionais, meteorologia e modo carreira.

* **Informações de Versão** — O rodapé exibe a versão e data/hora da build (por exemplo, `Build v6 – 21/03/2026 16:19`), facilitando o acompanhamento das atualizações.

## Novidades do Estágio 4

Esta quarta fase eleva o nível visual e operacional do protótipo com várias inovações:

* **Modelos e Companhias Reais** — Implementação de um catálogo de aeronaves reais com modelos e companhias conhecidas.  Os callsigns passam a refletir os prefixos ICAO das companhias (TAM123, GLO456, AZU789, etc.), enquanto jatos executivos utilizam matrículas brasileiras ou norte‑americanas (PR‑ABC, N123).
* **Radar Profissional** — Adição de linhas radiais a cada 45° e rastro suavizado atrás de cada aeronave, aproximando a aparência do radar de sistemas reais usados em torres e centros de controle.
* **Novos Comandos de Solo** — Inclusão de botões rápidos para **Start**, **Push**, **LUW** e **Final**, possibilitando o ciclo de startup, pushback, alinhamento e aproximação final sem depender apenas de comandos de texto.
* **Duas Vozes** — O sintetizador utiliza vozes distintas para piloto e controlador, oferecendo uma experiência auditiva mais rica.
* **Painel de Voo** — Criação de um painel de informações da aeronave selecionada com callsign, modelo, altitude, velocidade e estado operacional.
* **Informação de Build** — Exibição da versão e data/hora da build no rodapé para rastrear facilmente as atualizações.

Essas novidades se somam às melhorias trazidas no Estágio 3 (ciclo completo gate‑decolagem‑pouso‑gate) e preparam o simulador para futuras fases com separação mínima, meteorologia, SID/STAR e modo carreira.

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
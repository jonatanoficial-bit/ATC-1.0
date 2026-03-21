# Changelog

Todas as versões são identificadas pela data e hora no nome do arquivo ZIP (ex.: `atc_sim_2026-03-18_22-42_v2.zip`).  Este arquivo resume as principais alterações entre as versões.

## v1 – 18/03/2026 (Fase 1)

* Primeira versão jogável com radar, aeronaves geradas aleatoriamente e comandos básicos (virar, subir/descer, alterar velocidade).
* Implementação de lobby cinematográfico e instalação PWA no Android.
* Interface bilíngue (texto em português, áudio em inglês) com registro de transmissões em forma de máquina de escrever.
* Sistema de pontuação inicial.

## v2 – 18/03/2026 (Fase 2)

* Refatoração inicial para uma arquitetura mais modular (divisão de responsabilidades e organização do código).
* Introdução de aeronaves no solo solicitando táxi e decolagem.
* Novos botões de comando rápido (APP, ALT±, SPD±, TL/TR90, Taxi, Decolar).
* Seleção de aeronave clicando no radar e preenchimento automático do callsign.
* Ajuste de velocidade das aeronaves e melhoria da jogabilidade.

## v3 – 21/03/2026 (Fase 3)

* Introdução de ciclo de vida mais completo das aeronaves.  Aviões no solo nascem nos gates e taxiavam para a pista; após o pouso eles taxiavam de volta ao gate.
* Novo estado `taxi_in` para aeronaves que pousaram; elas continuam visíveis até estacionar no gate, onde são removidas.
* Pontuação ao pousar e pontuação adicional ao chegar ao gate.
* Ajustes de spawn: aeronaves no solo surgem perto do terminal, não mais no centro da pista.
* Ajustes visuais e de texto no README para refletir as novidades.

## v4 – 21/03/2026 (Fase 4)

* **Modelos e companhias reais**: cada aeronave possui agora um modelo (B747, B737, A320, A350, Citation, etc.) e pertence a uma companhia aérea real (LATAM, Gol, Azul, Emirates, Lufthansa, American, Delta, United, etc.) ou, no caso dos aviões leves, recebe um prefixo de matrícula.  Os callsigns deixam de ser genéricos (`H123`/`M123`) e passam a utilizar o prefixo ICAO de cada empresa (TAM123, GLO456, AZU789...).
* **Radar profissional**: adição de linhas radiais a cada 45° e rastro suavizado atrás de cada aeronave, aproximando o visual de radares reais.
* **Novos comandos rápidos**: inclusão de botões **Start** (ligar motores), **Push** (pushback e táxi até a pista), **LUW** (alinhar e aguardar na pista) e **Final** (autorizar final).  Esses complementam o ciclo de saída e chegada.
* **Vozes diferenciadas**: o sintetizador de fala usa vozes distintas para piloto e controlador, melhorando a imersão.
* **Painel da aeronave selecionada**: um novo painel exibe callsign, modelo, altitude, velocidade e estado operacional da aeronave destacada.
* **Informação de versão**: o rodapé do jogo agora mostra a versão e data/hora da build (por exemplo, `Build v6 – 21/03/2026 16:19`).
* **Atualização do README**: documentação revisada para refletir todas as novas funcionalidades e preparar o terreno para fases futuras.

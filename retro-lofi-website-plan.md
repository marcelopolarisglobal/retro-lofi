# Plano — Retro Lo-fi (inspirado em loficities.com)

## Contexto
O usuário quer um projeto semelhante ao [Lofi Cities](https://loficities.com/): música lo-fi **gerada ao vivo no navegador** + cenas em pixel art retrô. Prioridade agora: o **motor de música**. Cenários pixel art vêm depois. Publicação no GitHub Pages, como já é feito em `pokedex`, `btc_dashboard` e `website` (repos em `github.com/marcelopolarisglobal`).

Pasta do projeto: `/Users/jarvis/Projects/retro-lofi` · Repositório: https://github.com/marcelopolarisglobal/retro-lofi · Site: https://marcelopolarisglobal.github.io/retro-lofi/

## O que o Lofi Cities faz (estudo)
- **Música 100% sintetizada** via Web Audio API — sem samples/gravações. Gera progressão de acordes, bateria com swing (68–88 BPM), baixo e melodia, com "tape wobble" (oscilação de fita) e chiado de vinil. Músicas infinitas e sempre novas.
- **Vibe**: Chill (60–72 BPM, mais escuro) / Balanced / Upbeat (80–94 BPM). Formação: banda completa, sem bateria, só teclado.
- **11 cidades** em pixel art 480×270, loop de 4 min, clima próprio (chuva, neve, neblina) e sons ambientes com mixer individual.
- **Controles por teclado**: Espaço play/pause, N próxima faixa, ←/→ trocar cidade, M mudo, F tela cheia, H esconder UI, S salvar PNG, T timer Pomodoro/sono, P mini player, ? ajuda.
- **Extras**: PWA offline, modo OBS (`?obs`), UI que some com inatividade, sem cookies, sem autoplay (exige clique — regra dos navegadores).

## Decisões técnicas (seguindo o padrão dos seus projetos)
- **HTML + CSS + JS puro, sem build**, site estático → GitHub Pages direto da branch `main`.
- **Áudio: Web Audio API nativa** (sem biblioteca), como o Lofi Cities. Motivo: zero dependências, controle total e é a melhor forma de entender "como o som nasce" (osciladores → filtros → volume → alto-falante). Tone.js via CDN fica como plano B se o agendamento de notas ficar complexo demais.
- **Pixel art (fase 3+)**: `<canvas>` 480×270 escalado com `image-rendering: pixelated`.
- Separação de responsabilidades em módulos ES (`<script type="module">`), igual à regra `api/ui/app` do pokedex.

## Estrutura de pastas
```
retro-lofi/
├── index.html
├── CLAUDE.md              # contexto permanente do projeto
├── retro-lofi-website-plan.md  # este roteiro
├── css/style.css
└── js/
    ├── app.js             # estado, eventos, teclado
    ├── ui.js              # desenha controles na tela
    └── audio/
        ├── engine.js      # AudioContext, cadeia master, reverb, wobble, vinil
        ├── scheduler.js   # relógio "olhar à frente" que agenda notas no tempo certo
        ├── clock.worker.js # tique de 25 ms num Worker (não desacelera em aba de fundo)
        ├── theory.js      # escalas, acordes jazz (7ª, 9ª), progressões
        ├── composer.js    # gera faixa: tonalidade, BPM, progressão, melodia
        └── instruments.js # piano elétrico, baixo, kick, snare, hi-hat sintetizados
```

## Fases

### Fase 1 — MVP do motor de música ✅ concluída
1. `git init`, `index.html` com botão Play (necessário: navegador só libera áudio após clique).
2. `engine.js`: `AudioContext` e cadeia master (o passa-baixa master original foi removido na Etapa A por deixar o som abafado).
3. `scheduler.js`: padrão "lookahead" — um tique a cada 25 ms (rodando num Web Worker) agenda notas dos próximos 120 ms usando `audioContext.currentTime` (relógio preciso do áudio; o `setTimeout` sozinho atrasa e deixa o ritmo torto).
4. `instruments.js` (versão inicial; timbres refeitos na Etapa A):
   - Keys (Rhodes): 2 osciladores levemente desafinados + envelope ADSR.
   - Baixo: senoide/triangular grave.
   - Bateria: kick (senoide com queda rápida de frequência), snare e hi-hat (ruído branco filtrado).
5. `theory.js` + `composer.js`: escolhe tonalidade, progressão (ex.: ii–V–I, I–vi–ii–V com 7ª/9ª), BPM 68–88, swing nas colcheias, melodia simples na escala pentatônica com pausas aleatórias.
6. Efeitos de textura: chiado de vinil (ruído + estalos aleatórios) e wobble (LFO lento no pitch).
7. Controles: Play/Pause, Próxima faixa, volume. Faixa dura ~2–3 min e troca sozinha.
8. Publicar: repo `retro-lofi` no GitHub + GitHub Pages ativo.
9. Correção iPhone/iPad: `navigator.audioSession.type = 'playback'` (sem isso a chave de silencioso emudece a Web Audio) e `ctx.resume()` ao criar o motor.

### Etapa A — Qualidade sonora ✅ concluída
Retorno do usuário: som **abafado** e **com ruído**. Continua 100% sintetizado (sem amostras).

**Diagnóstico**
- Abafado: passa-baixas empilhados (master 3800 Hz + teclado 2200 Hz + melodia 1800 Hz); timbres quase só senoidais (sem harmônicos); baixo de 65–123 Hz inaudível em alto-falante de celular; som seco e mono.
- Ruído: chiado de vinil constante e mais alto que a música nos trechos calmos.

**Ajustes no estúdio (`engine.js`)**
- Cadeia nova: instrumentos → wobble de fita → passa-alta 30 Hz → high-shelf −3 dB em 7 kHz → compressor (threshold −14, ratio 2.5, attack 10 ms, release 200 ms) → master.
- Reverb por envio: `ConvolverNode` com resposta de impulso gerada em código (ruído estéreo decaindo em 2,2 s), com o retorno filtrado em 5 kHz.
- Vinil discreto: chiado 5× mais baixo e filtrado (passa-banda 2 kHz), estalos raros e pequenos; nível medido ~85× abaixo da intro.

**Ajustes nos instrumentos (`instruments.js`)**
- Toda nota tem posição no estéreo (pan), envio de reverb e força (velocity).
- Rhodes por síntese FM: portadora + moduladora 1:1, índice de modulação alto no ataque decaindo em ~0,25 s, dois pares desafinados ±5 cents (coro) e um "sino" curto em 14× a frequência. Filtro abre com a força da nota (3–6 kHz). Envio de reverb 25%.
- Baixo: senoide + triangular → saturação suave (curva tanh) → passa-baixa 1200 Hz. Os harmônicos da saturação tornam o grave audível em celulares.
- Melodia: triangular + senoide oitava acima, filtro 3500 Hz, pan levemente à esquerda, reverb 35%.
- Bumbo: queda de 150→45 Hz em 0,5 s + "clique" de ataque (ruído de 12 ms acima de 3 kHz).
- Caixa: ruído em 2 kHz com cauda de 250 ms + dois tons de corpo (185 e 330 Hz), reverb 30%.
- Chimbal: ruído passa-banda em 9 kHz, pan levemente à direita.

**Ajustes no compositor (`composer.js`)**
- Humanização: ±6 ms de variação no tempo e força entre 80–100% em cada nota.
- Notas do acorde abertas no estéreo, da esquerda para a direita.

**Medição (30 s renderizados com `OfflineAudioContext`)**: pico 0,675 (sem distorção), volume médio intro 0,026 → groove 0,121, estéreo ativo, sem erros.

### Etapa B — Amostras gravadas (opcional, futura)
- Trocar piano e/ou bateria por amostras gravadas com licença livre (CC0), caso os sintetizadores ainda soem "de computador". Custo: alguns MB de download e perda do conceito 100% gerado.

### Fase 2 — Controle e polimento musical ✅ concluída
- Seletor de Vibe (Chill/Balanced/Upbeat) mudando BPM, brilho do filtro e densidade.
- Formação (completa / sem bateria / só teclado); mixer por instrumento.
- "Up Next": mostrar próximas faixas (nome gerado + tonalidade + BPM).
- Atalhos de teclado (Espaço, N, M, V, ?).
- Timer Pomodoro (25/5, 50/10) e timer de sono.

**Como foi feito**
- Vibes: Calmo (60–72 BPM, melodia esparsa, bateria simples, agudos −8 dB), Equilibrado (68–84 BPM, −3 dB), Animado (80–94 BPM, melodia densa, bateria com mais batidas, 0 dB). Trocar a vibe recompõe a fila e troca a faixa atual.
- Formação: Completa / Sem bateria / Só teclado (acordes + melodia). Vale na hora, sem recompor.
- Mixer: teclado, melodia, baixo, bateria e vinil (0–150%). Cada instrumento tem seu canal no `engine.js`.
- Fila "Próximas": 3 faixas já compostas; clicar numa delas a toca em seguida.
- Atalhos: Espaço, N, M, V, A, Q, T, ?, Esc. Teclas com Cmd/Ctrl/Alt são ignoradas.
- Timer (`js/timer.js`): Pomodoro com sino sintetizado ao fim de cada fase (descendente = pausa, ascendente = foco); sono com fade de 8 s e pausa.
- Verificado no Chrome: fila, vibes (BPM dentro da faixa), escolha na fila, mudo, pausa por teclado, ciclos do Pomodoro e fade do sono.

### Fase 3 — Primeira cena em pixel art ✅ concluída
- `js/scene/`: canvas 480×270, loop com `requestAnimationFrame`, escala inteira pixelada.
- Uma cena (ex.: janela com chuva à noite): fundo estático + camadas animadas (chuva, luzes piscando, nuvens).
- Sons ambientes da cena (chuva sintetizada) com slider próprio.
- UI que se esconde após inatividade (H para alternar), tela cheia (F).

**Como foi feito**
- Cena "Janela chuvosa" (`js/scene/rainy-window.js`), 100% desenhada em código: céu em faixas pontilhadas, lua, nuvens em movimento, cidade gerada com semente (sempre igual), janelas que piscam, antena, chuva lá fora, gotas escorrendo no vidro, varal de luzinhas, gato com rabo animado, planta, caneca com vapor, luminária e estante.
- Camadas estáticas pré-desenhadas; loop de 24 quadros/s (`js/scene/renderer.js`), pausa sozinho com a aba escondida.
- Chuva sintetizada (`js/audio/ambience.js`): chiado com rajadas, ronco grave e gotas; slider "Chuva" no mixer.
- Interface esconde após 4 s parada (se a música toca e nenhum painel está aberto); H ou toque na cena alternam. Tela cheia (F) quando o navegador permite (não existe no iPhone).
- Atalho do mixer mudou de A para X.

**Adaptação para celular**
- Cena cobre a tela e corta as laterais; o essencial fica no centro. Foco vertical 35% em telas largas.
- Celular em pé: cena sobe 10% para o gato e o parapeito ficarem acima do cartão; cartão compacto (261 px no iPhone de 390×844), sem título e sem letras de atalho, cada grupo numa linha.
- Celular deitado: cartão na lateral esquerda, rolando por dentro.
- Áreas seguras do iPhone (`env(safe-area-inset-*)`), `100dvh`, botões ≥ 40 px em telas de toque.
- Verificado em molduras de 390×844 e 844×390 no Chrome; teste real no iPhone fica com o usuário.

**Ajustes pós-Fase 3 (arte e áudio)**
- Áudio: chuva com volume máximo pela metade; estalos do vinil 2× mais fortes; ambos começam em 5% no mixer.
- Arte refeita com referência na prévia de Paris do loficities.com: paredes em tábuas de madeira com veios, viga, lambri, piso, vinheta, luz quente da luminária e luz fria da janela; moldura creme com 4 vidraças; varal de luzinhas âmbar; planta pendurada.
- Gato 50% maior, preto e branco, de frente, com contorno, olhos verdes que piscam e rabo animado. Vaso e caneca 30% maiores, aproximados do centro para aparecerem no celular em pé.
- Mesa sob a estante com vitrola em perspectiva (disco gira só com a música tocando), capa de álbum e caixote de discos.
- Celulares estreitos (≤ 380 px): rótulo "Volume" oculto visualmente e abas mais justas para caber em uma linha.
- Canto da vitrola: discos do caixote com o dobro da altura, capa de álbum removida, vitrola, estante e caixote centralizados na mesa.
- Parapeito: vaso mais à esquerda e caneca mais à direita (limite: continuar visível no celular em pé).
- Painel de controle com a paleta do quarto (madeira translúcida, âmbar, creme) e desfoque do fundo (efeito vidro fosco).

### Fase 4 — Múltiplos ambientes
- Formato de dados por cena (paleta, camadas, clima, sons ambientes) para adicionar cenas sem mexer no motor.
- Troca de cena com ←/→ e swipe no celular; rotação automática.
- Salvar frame em PNG (S).

### Fase 5 — Extras opcionais
- PWA (manifest + service worker) para funcionar offline e instalar.
- Modo OBS (`?obs`), mini player (Picture-in-Picture).

## Verificação (por fase)
- Rodar local: `python3 -m http.server 8000` na pasta e abrir `http://localhost:8000` (módulos ES não funcionam abrindo o arquivo direto).
- Fase 1: clicar Play → ouvir bateria, baixo, acordes e melodia em sincronia por vários minutos sem "atrasar"; Próxima gera faixa diferente; console sem erros; testar Chrome, Safari e celular.
- Após cada fase: commit + push; conferir a URL do GitHub Pages funcionando.

## Próximo passo
Fase 4 — múltiplos ambientes.

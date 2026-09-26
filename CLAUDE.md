# CLAUDE.md — Retro Lo-fi

Instruções e contexto permanentes deste projeto. Leia antes de qualquer alteração.

## Visão Geral
Música lo-fi **composta e sintetizada ao vivo no navegador**, inspirada em loficities.com.
Nada de samples ou gravações: todo som nasce da Web Audio API. Cenários em pixel art vêm
em fases posteriores. O roteiro completo está em `retro-lofi-website-plan.md`.

## Stack
- **HTML + CSS + JavaScript puro (módulos ES)**. Sem framework, sem build, sem dependências.
- Site estático publicado no **GitHub Pages** (branch `main`, raiz).
- Única dependência externa: fonte **Press Start 2P** (Google Fonts).
- Rodar localmente exige servidor (módulos ES não abrem via `file://`):
  `python3 -m http.server 8000` → http://localhost:8000

## Estrutura
```
index.html
css/style.css
js/app.js                  # estado (vibe, formação, mudo), fila, atalhos, troca de faixas (o "maestro")
js/ui.js                   # só atualiza a tela (painéis, fila, opções, timer)
js/timer.js                # Pomodoro e timer de sono (só conta o tempo e avisa)
js/autohide.js             # esconde a interface por ociosidade (4 s) ou por pedido (H / toque na cena)
js/scene/renderer.js       # loop de animação a 24 quadros/s na resolução nativa da cena
js/scene/rainy-window.js   # cena "Janela chuvosa" (480×270) desenhada em código; setPlaying gira a vitrola
js/audio/engine.js         # AudioContext, cadeia master, wobble de fita, chiado de vinil
js/audio/scheduler.js      # relógio lookahead: agenda semicolcheias 120 ms à frente
js/audio/clock.worker.js   # tick de 25 ms num Worker (não desacelera em aba de fundo)
js/audio/theory.js         # notas, acordes, progressões, voicings
js/audio/composer.js       # compõe a faixa (composeTrack) e a executa passo a passo (playStep)
js/audio/instruments.js    # teclado, baixo, melodia, bumbo, caixa, chimbal e sino sintetizados
js/audio/ambience.js       # sons ambientes da cena (chuva), fora da cadeia da música
```

## Regras
- Todo som deve ser agendado com `ctx.currentTime` (tempo do áudio), nunca disparado por `setTimeout`.
- Cadeia de áudio: instrumentos → `engine.music` → wobble → passa-alta 30 Hz → high-shelf −3 dB
  (7 kHz) → compressor → master. Sem passa-baixa master (deixava o som abafado).
- Reverb por envio: cada som sai por `createOutput(engine, canal, pan, reverbSend)` em `instruments.js`,
  que manda o sinal direto para o canal (`dry` → música) e uma parte para o reverb (`wet` → sala gerada em código).
  O vinil entra direto no master, bem baixo.
- Cada instrumento tem um canal no mixer (`engine.channels`: keys, bass, drums, melody, fx); o
  volume direto e o envio ao reverb andam juntos. `engine.setLevel(nome, valor)` inclui 'vinyl'.
- Vibes (`VIBES` em `composer.js`) valem na composição (BPM, swing, densidade, bateria) e no brilho
  do master. Formações (`BANDS`) só filtram o que soa em `playStep`, por isso valem na hora.
- Toda nota recebe `velocity` (força) e o compositor humaniza tempo (±6 ms) e força (80–100%).
- Trocas de faixa só no início de um tempo (`step % 4 === 0`) para manter o swing alinhado.
- iOS: `navigator.audioSession.type = 'playback'` antes de criar o `AudioContext`, senão a chave
  de silencioso do iPhone emudece o site.
- Pausa = `ctx.suspend()`; o agendador para sozinho porque o relógio do áudio congela.
- Cena: canvas em resolução nativa ampliado por CSS (`object-fit: cover` + `image-rendering: pixelated`).
  Camadas estáticas são pré-desenhadas uma vez; só o que se mexe é redesenhado a cada quadro.
  Elementos importantes ficam no centro (visível no celular em pé); `focusX`/`focusY` da cena
  definem o ponto de corte. No celular em pé a cena sobe 10% para o gato ficar acima do cartão.
- Celular: `100dvh`, `env(safe-area-inset-*)`, alvos ≥ 40 px em `pointer: coarse`, cartão compacto
  (sem título nem letras de atalho) e cada grupo de controles numa linha só.
- Arte (referência: prévia de Paris do loficities.com): interior em madeira quente com veios
  (`woodRect`), luz em faixas semitransparentes (`glow`), vinheta nos cantos, contraste com o azul
  frio da janela. Objetos com três tons (base, luz, sombra); o gato tem contorno escuro.
- No celular em pé só ~110–125 px centrais da cena aparecem: vaso (x 190), gato (x 228) e caneca
  (x 268) ficam nessa faixa de propósito.
- Mixer: vinil e chuva começam em 5% (`value="5"` no `index.html`).
- Atalhos: Espaço, N, M, V, X (mixer), Q, T, H, F, ?, Esc.
- Interface em português; textos inseridos com `textContent` (nunca `innerHTML`).

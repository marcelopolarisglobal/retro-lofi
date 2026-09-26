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
js/app.js                  # estado, eventos, troca de faixas (o "maestro")
js/ui.js                   # só atualiza a tela
js/audio/engine.js         # AudioContext, cadeia master, wobble de fita, chiado de vinil
js/audio/scheduler.js      # relógio lookahead: agenda semicolcheias 120 ms à frente
js/audio/clock.worker.js   # tick de 25 ms num Worker (não desacelera em aba de fundo)
js/audio/theory.js         # notas, acordes, progressões, voicings
js/audio/composer.js       # compõe a faixa (composeTrack) e a executa passo a passo (playStep)
js/audio/instruments.js    # teclado, baixo, melodia, bumbo, caixa, chimbal sintetizados
```

## Regras
- Todo som deve ser agendado com `ctx.currentTime` (tempo do áudio), nunca disparado por `setTimeout`.
- Cadeia de áudio: instrumentos → `engine.music` → wobble → passa-alta 30 Hz → high-shelf −3 dB
  (7 kHz) → compressor → master. Sem passa-baixa master (deixava o som abafado).
- Reverb por envio: cada som sai por `createOutput(engine, pan, reverbSend)` em `instruments.js`,
  que manda o sinal direto para `engine.music` e uma parte para `engine.reverb` (sala gerada em código).
  O vinil entra direto no master, bem baixo.
- Toda nota recebe `velocity` (força) e o compositor humaniza tempo (±6 ms) e força (80–100%).
- Trocas de faixa só no início de um tempo (`step % 4 === 0`) para manter o swing alinhado.
- iOS: `navigator.audioSession.type = 'playback'` antes de criar o `AudioContext`, senão a chave
  de silencioso do iPhone emudece o site.
- Pausa = `ctx.suspend()`; o agendador para sozinho porque o relógio do áudio congela.
- Interface em português; textos inseridos com `textContent` (nunca `innerHTML`).

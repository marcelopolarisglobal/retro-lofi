# Plano — Retro Lo-fi (inspirado em loficities.com)

## Contexto
O usuário quer um projeto semelhante ao [Lofi Cities](https://loficities.com/): música lo-fi **gerada ao vivo no navegador** + cenas em pixel art retrô. Prioridade agora: o **motor de música**. Cenários pixel art vêm depois. Publicação no GitHub Pages, como já é feito em `pokedex`, `btc_dashboard` e `website` (repos em `github.com/marcelopolarisglobal`).

Pasta do projeto: `/Users/jarvis/Projects/retro-lofi` (vazia, ainda sem git).

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

## Estrutura de pastas (alvo)
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
        ├── engine.js      # AudioContext, mixer master, efeitos (vinil, wobble, filtro)
        ├── scheduler.js   # relógio "olhar à frente" que agenda notas no tempo certo
        ├── theory.js      # escalas, acordes jazz (7ª, 9ª), progressões
        ├── composer.js    # gera faixa: tonalidade, BPM, progressão, melodia
        └── instruments.js # piano elétrico, baixo, kick, snare, hi-hat sintetizados
```

## Fases

### Fase 1 — MVP do motor de música (foco principal)
1. `git init`, `index.html` com botão Play (necessário: navegador só libera áudio após clique).
2. `engine.js`: `AudioContext`, cadeia master = compressor → filtro passa-baixa (som "abafado" lo-fi) → saída.
3. `scheduler.js`: padrão "lookahead" — um `setInterval` a cada ~25 ms agenda notas dos próximos ~100 ms usando `audioContext.currentTime` (relógio preciso do áudio; o `setTimeout` sozinho atrasa e deixa o ritmo torto).
4. `instruments.js`: 
   - Keys (Rhodes): 2 osciladores levemente desafinados + envelope ADSR.
   - Baixo: senoide/triangular grave.
   - Bateria: kick (senoide com queda rápida de frequência), snare e hi-hat (ruído branco filtrado).
5. `theory.js` + `composer.js`: escolhe tonalidade, progressão (ex.: ii–V–I, I–vi–ii–V com 7ª/9ª), BPM 68–88, swing nas colcheias, melodia simples na escala pentatônica com pausas aleatórias.
6. Efeitos de textura: chiado de vinil (ruído + estalos aleatórios) e wobble (LFO lento no pitch).
7. Controles: Play/Pause, Próxima faixa, volume. Faixa dura ~2–3 min e troca sozinha.
8. Publicar: repo `retro-lofi` no GitHub + GitHub Pages ativo.

### Fase 2 — Controle e polimento musical
- Seletor de Vibe (Chill/Balanced/Upbeat) mudando BPM, brilho do filtro e densidade.
- Formação (completa / sem bateria / só teclado); mixer por instrumento.
- "Up Next": mostrar próximas faixas (nome gerado + tonalidade + BPM).
- Atalhos de teclado (Espaço, N, M, V, ?).
- Timer Pomodoro (25/5, 50/10) e timer de sono.

### Fase 3 — Primeira cena em pixel art
- `js/scene/`: canvas 480×270, loop com `requestAnimationFrame`, escala inteira pixelada.
- Uma cena (ex.: janela com chuva à noite): fundo estático + camadas animadas (chuva, luzes piscando, nuvens).
- Sons ambientes da cena (chuva sintetizada) com slider próprio.
- UI que se esconde após inatividade (H para alternar), tela cheia (F).

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

## Status
- **Fase 1 — concluída** e publicada em https://marcelopolarisglobal.github.io/retro-lofi/
  (inclui correção para iPhone/iPad: `navigator.audioSession.type = 'playback'`).
- **Etapa A — qualidade sonora — concluída.** Diagnóstico: som abafado (filtros passa-baixa
  empilhados, timbres senoidais, baixo inaudível em celular, som seco e mono) e ruído (vinil alto).
  Mudanças: sem passa-baixa master (passa-alta 30 Hz + high-shelf suave), reverb por envio,
  estéreo, Rhodes por síntese FM, baixo com saturação, bumbo/caixa/chimbal reforçados,
  vinil ~85× abaixo da música e humanização de tempo e força.
- **Etapa B (opcional, futura):** trocar piano/bateria por amostras gravadas CC0.

## Próximo passo
Fase 2 — controle e polimento musical.
